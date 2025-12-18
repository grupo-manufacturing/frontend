'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import apiService from '../lib/apiService';
import CustomQuote from './components/CustomQuote';
import MyOrders from './components/MyOrders';
import ChatsTab, { ChatsTabRef } from './components/ChatsTab';
import MyRequirements from './components/MyRequirements';
import GenerateDesigns from './components/GenerateDesigns';
import AIDesignsTab from './components/AIDesignsTab';
import Login from './components/Login';
import { useToast } from '../components/Toast';

type TabType = 'custom-quote' | 'my-orders' | 'chats' | 'requirements' | 'generate-designs' | 'ai-designs';

export default function BuyerPortal() {
  const toast = useToast();
  const [step, setStep] = useState<'phone' | 'otp' | 'dashboard'>('phone');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // On initial load, if a token exists, persist dashboard state across refresh
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (typeof window !== 'undefined') {
        const hasToken = apiService.isAuthenticated();
        if (hasToken) {
          setStep('dashboard');
          // Check profile completion before showing dashboard
          setIsCheckingProfile(true);
          
          // Set phone number from localStorage
          const storedPhone = localStorage.getItem('buyerPhoneNumber');
          if (storedPhone) {
            setUserPhoneNumber(storedPhone);
          }
          
          try {
            const response = await apiService.getBuyerProfile();
            if (response && response.success && response.data && response.data.profile) {
              const profile = response.data.profile;
              
              // Store buyerId in localStorage for chat functionality
              if (profile.id && typeof window !== 'undefined') {
                localStorage.setItem('buyerId', String(profile.id));
              }
              
              // Check if all required fields are filled
              const requiredFields = [
                profile.full_name,
                profile.email,
                profile.business_address,
                profile.about_business
              ];
              const allFieldsFilled = requiredFields.every(field => field && field.trim().length > 0);
              setProfileCompletion(allFieldsFilled ? 100 : 0);
              
              const resolvedName = (profile.full_name || '').trim();
              if (resolvedName) {
                setDisplayName(resolvedName);
              }
              
              // Chat state restoration is now handled by ChatsTab component
            }
          } catch (error: any) {
            // If token expired or unauthorized, redirect to login
            if (error.message?.includes('expired') || error.message?.includes('session')) {
              setStep('phone');
              apiService.removeToken('buyer');
              // Clear chat state on logout
              localStorage.removeItem('buyer_chat_state');
            }
            setProfileCompletion(0);
          } finally {
            setIsCheckingProfile(false);
          }
        }
        setIsCheckingAuth(false);
      } else {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthAndProfile();
  }, []);
  // Restore active tab from localStorage on mount
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem('buyer_active_tab');
      if (storedTab && ['custom-quote', 'my-orders', 'chats', 'requirements', 'generate-designs', 'ai-designs'].includes(storedTab)) {
        return storedTab as TabType;
      }
    }
    return 'generate-designs';
  });
  
  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (step === 'dashboard') {
      localStorage.setItem('buyer_active_tab', activeTab);
    }
  }, [activeTab, step]);
  
  // Requirements States
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  
  
  // Chats States
  const [totalUnreadChats, setTotalUnreadChats] = useState<number>(0);
  const chatsTabRef = useRef<ChatsTabRef>(null);
  
  // Profile display states
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Show loading immediately
    setIsLoggingOut(true);
    
    // Show logout toast
    toast.info('Logging out...');
    
    // Small delay to ensure loading state is shown before redirect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Logout will clear localStorage and redirect to login
    await apiService.logout('/buyer-portal');
    setStep('phone');
    
    // Show success toast after logout
    setTimeout(() => {
      toast.success('Logged out successfully. See you soon!');
    }, 200);
  };

  // Handle login success from Login component
  const handleLoginSuccess = (phoneNumber: string) => {
    setUserPhoneNumber(phoneNumber);
    setStep('dashboard');
  };

  // Handle profile update from Login component
  const handleProfileUpdate = (profile: { displayName: string; profileCompletion: number }) => {
    setDisplayName(profile.displayName);
    setProfileCompletion(profile.profileCompletion);
    setIsCheckingProfile(false);
  };



  // Helper function to determine requirement status based on responses
  const getRequirementStatus = (requirement: any): 'accepted' | 'pending' | 'negotiation' => {
    const responses = requirement.responses || [];
    
    if (responses.length === 0) {
      return 'pending';
    }
    
    // Check if any response is accepted
    const hasAccepted = responses.some((r: any) => r.status === 'accepted');
    if (hasAccepted) {
      return 'accepted';
    }
    
    // Check if any response is negotiating
    const hasNegotiating = responses.some((r: any) => r.status === 'negotiating');
    if (hasNegotiating) {
      return 'negotiation';
    }
    
    // Has responses but none are accepted or negotiating = pending review
    return 'pending';
  };

  // Fetch Requirements
  const fetchRequirements = async () => {
    setIsLoadingRequirements(true);
    
    try {
      const response = await apiService.getRequirements();
      
      if (response.success && response.data) {
        const requirementsWithResponses = await Promise.all(
          response.data.map(async (requirement: any) => {
            try {
              const responsesResult = await apiService.getRequirementResponses(requirement.id);
              const responses = responsesResult.success && responsesResult.data
                ? responsesResult.data
                : [];
              
              return {
                ...requirement,
                responses,
                manufacturer_count: responses.length
              };
            } catch (responsesError) {
              console.error(`Failed to fetch responses for requirement ${requirement.id}:`, responsesError);
              return {
                ...requirement,
                responses: requirement.responses || [],
                manufacturer_count: requirement.responses ? requirement.responses.length : (requirement.manufacturer_count || 0)
              };
            }
          })
        );

        setRequirements(requirementsWithResponses);
      } else {
        console.error('Failed to fetch requirements');
        setRequirements([]);
      }
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
      setRequirements([]);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  // Fetch requirements when tab changes to requirements
  useEffect(() => {
    if (activeTab === 'requirements' && step === 'dashboard') {
      fetchRequirements();
    }
  }, [activeTab, step]);


  // Refresh profile completion when returning to dashboard (e.g., from profile page)
  useEffect(() => {
    if (step === 'dashboard' && apiService.isAuthenticated()) {
      const refreshProfile = async () => {
        try {
          const response = await apiService.getBuyerProfile();
          if (response && response.success && response.data && response.data.profile) {
            const profile = response.data.profile;
            // Check if all required fields are filled
            const requiredFields = [
              profile.full_name,
              profile.email,
              profile.business_address,
              profile.about_business
            ];
            const allFieldsFilled = requiredFields.every(field => field && field.trim().length > 0);
            setProfileCompletion(allFieldsFilled ? 100 : 0);
            
            const resolvedName = (profile.full_name || '').trim();
            if (resolvedName) {
              setDisplayName(resolvedName);
            }
          }
        } catch (error) {
          console.error('Failed to refresh profile completion:', error);
        }
      };
      
      // Refresh on mount and when window regains focus (user returns from profile page)
      refreshProfile();
      window.addEventListener('focus', refreshProfile);
      return () => window.removeEventListener('focus', refreshProfile);
    }
  }, [step]);

  const handleNegotiateResponse = async (requirement: any, response: any) => {
    // Refresh requirements to show updated status (the component will handle status update)
    try {
      await apiService.updateRequirementResponseStatus(response.id, 'negotiating');
      fetchRequirements();
    } catch (statusError: any) {
      console.error('Failed to update response status:', statusError);
    }

    // Switch to chats tab first to ensure ChatsTab is mounted
    setActiveTab('chats');
    
    // Wait a moment for the tab to switch and component to mount
    setTimeout(async () => {
      if (chatsTabRef.current) {
        // openChatFromNegotiation will set up the chat state
        await chatsTabRef.current.openChatFromNegotiation(requirement, response);
      }
    }, 50);
  };

  const handleAcceptAIDesignResponse = async (aiDesign: any, response: any) => {
    // Switch to chats tab first to ensure ChatsTab is mounted
    setActiveTab('chats');
    
    // Wait a moment for the tab to switch and component to mount
    setTimeout(async () => {
      if (chatsTabRef.current) {
        // openChatFromAIDesignAccept will set up the chat state
        await chatsTabRef.current.openChatFromAIDesignAccept(aiDesign, response);
      }
    }, 50);
  };

  // Form handlers

  // Load phone number from localStorage on component mount
  useEffect(() => {
    if (step !== 'dashboard' || !apiService.isAuthenticated()) {
      return;
    }

    const storedPhone = localStorage.getItem('buyerPhoneNumber');
    if (storedPhone) {
      setUserPhoneNumber(storedPhone);
    }

    let cancelled = false;
    const fetchProfileSummary = async () => {
      try {
        const response = await apiService.getBuyerProfile();
        if (!cancelled && response && response.success && response.data && response.data.profile) {
          const profile = response.data.profile;
          const resolvedName = (profile.full_name || '').trim();
          if (resolvedName) {
            setDisplayName(resolvedName);
          }
          
          // Check if all required fields are filled (phone_number is always present, so we check the other 4)
          // Required fields: full_name, email, business_address, about_business
          const requiredFields = [
            profile.full_name,
            profile.email,
            profile.business_address,
            profile.about_business
          ];
          const allFieldsFilled = requiredFields.every(field => field && field.trim().length > 0);
          // Set to 100 if all fields filled, 0 otherwise (to show/hide the notice)
          setProfileCompletion(allFieldsFilled ? 100 : 0);
        } else {
          console.warn('Profile response structure unexpected:', response);
        }
      } catch (error) {
        console.error('Failed to fetch buyer profile summary:', error);
        // Set default completion if fetch fails (assume incomplete)
        setProfileCompletion(0);
      }
    };

    fetchProfileSummary();

    return () => {
      cancelled = true;
    };
  }, [step]);


  // Dashboard View
  // Show loading while checking authentication, profile completion, or logging out
  if (isCheckingAuth || isCheckingProfile || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-[#22a2f2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="relative z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3 animate-fade-in-down">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300 bg-black"></div>
                  <div className="relative bg-white rounded-xl p-2 border border-gray-200 shadow-sm">
                    <Image
                      src="/groupo-logo.png"
                      alt="Grupo Logo"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-black">
                    Grupo
                  </span>
                  <span className="text-xs text-gray-600 hidden sm:block">
                    Your Manufacturing Partner
                  </span>
                </div>
              </div>

              {/* Right Side - Profile Info & Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* User Name with Online Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-medium text-black hidden sm:inline">
                    {displayName || userPhoneNumber}
                  </span>
                </div>

                {/* Profile Button */}
                <Link
                  href="/buyer-portal/profile"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all border border-gray-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium hidden lg:inline">Profile</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-medium hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Completion Notice */}
        {profileCompletion < 100 && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">Please Complete Your Profile</span>
                </div>
                <Link
                  href="/buyer-portal/profile"
                  className="flex-shrink-0 px-4 py-2 bg-[#22a2f2] hover:bg-[#1b8bd0] text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow"
                >
                  Go to Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="relative z-40 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
              {/* Generate Designs Tab */}
              <button
                onClick={() => setActiveTab('generate-designs')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'generate-designs'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'generate-designs' && (
                  <div className="absolute inset-0 bg-gray-100 rounded-t-lg border-b-2 border-black"></div>
                )}
                <svg
                  className="relative z-10 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Generate Designs</span>
              </button>

              {/* AI Designs Tab */}
              <button
                onClick={() => setActiveTab('ai-designs')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'ai-designs'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'ai-designs' && (
                  <div className="absolute inset-0 bg-gray-100 rounded-t-lg border-b-2 border-black"></div>
                )}
                <svg
                  className="relative z-10 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">AI Designs</span>
              </button>

              {/* Get Manufacturers Tab */}
              <button
                onClick={() => setActiveTab('custom-quote')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'custom-quote'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'custom-quote' && (
                  <div className="absolute inset-0 bg-gray-100 rounded-t-lg border-b-2 border-black"></div>
                )}
                <svg
                  className="relative z-10 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Get Manufacturers</span>
              </button>

              {/* My Orders Tab */}
              <button
                onClick={() => setActiveTab('my-orders')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'my-orders'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'my-orders' && (
                  <div className="absolute inset-0 bg-gray-100 rounded-t-lg border-b-2 border-black"></div>
                )}
                <svg
                  className="relative z-10 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">My Orders</span>
              </button>

              {/* Chats Tab */}
              <button
                onClick={() => setActiveTab('chats')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'chats'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'chats' && (
                  <div className="absolute inset-0 bg-gray-100 rounded-t-lg border-b-2 border-black"></div>
                )}
                <svg
                  className="relative z-10 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Chats</span>
              {totalUnreadChats > 0 && (
                <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#22a2f2] text-white text-[10px] font-semibold px-1">
                  {totalUnreadChats > 99 ? '99+' : totalUnreadChats}
                </span>
              )}
              </button>

              {/* Requirements Tab */}
              <button
                onClick={() => setActiveTab('requirements')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'requirements'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'requirements' && (
                  <div className="absolute inset-0 bg-gray-100 rounded-t-lg border-b-2 border-black"></div>
                )}
                <svg
                  className="relative z-10 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Requirements</span>
              </button>

            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Content */}
          {activeTab === 'custom-quote' && (
            <CustomQuote
              onRequirementSubmitted={() => {
                // Refresh requirements when requirement is submitted
                fetchRequirements();
              }}
              onSwitchToRequirements={() => {
                setActiveTab('requirements');
              }}
            />
          )}
          {activeTab === 'my-orders' && (
            <MyOrders
              requirements={requirements}
              isLoadingRequirements={isLoadingRequirements}
              fetchRequirements={fetchRequirements}
            />
          )}
          {activeTab === 'chats' && (
            <ChatsTab
              ref={chatsTabRef}
              onUnreadCountChange={setTotalUnreadChats}
              onTabChange={() => setActiveTab('chats')}
            />
          )}
          {activeTab === 'requirements' && (
            <MyRequirements
              requirements={requirements}
              isLoadingRequirements={isLoadingRequirements}
              fetchRequirements={fetchRequirements}
              onNegotiateResponse={handleNegotiateResponse}
              onSwitchToCustomQuote={() => setActiveTab('custom-quote')}
            />
          )}
          {activeTab === 'generate-designs' && (
            <GenerateDesigns
              onDesignPublished={() => {
                // Design published callback - handled by AIDesignsTab component
              }}
            />
          )}
          {activeTab === 'ai-designs' && (
            <AIDesignsTab
              onSwitchToGenerateDesigns={() => setActiveTab('generate-designs')}
              onAcceptAIDesignResponse={handleAcceptAIDesignResponse}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onProfileUpdate={handleProfileUpdate}
      isCheckingAuth={isCheckingAuth || isLoggingOut}
    />
  );
}

