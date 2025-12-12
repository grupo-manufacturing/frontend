'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AIChatbot from '../components/AIChatbot';
import apiService from '../lib/apiService';
import CustomQuote from './components/CustomQuote';
import MyOrders from './components/MyOrders';
import ChatsTab, { ChatsTabRef } from './components/ChatsTab';
import MyRequirements from './components/MyRequirements';
import GenerateDesigns from './components/GenerateDesigns';
import Login from './components/Login';

type TabType = 'designs' | 'custom-quote' | 'my-orders' | 'chats' | 'requirements' | 'generate-designs';

export default function BuyerPortal() {
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
            console.error('Failed to fetch buyer profile:', error);
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
  const [activeTab, setActiveTab] = useState<TabType>('designs');
  const [designsSubTab, setDesignsSubTab] = useState<'all-designs' | 'my-ai-designs'>('all-designs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  
  // AI Designs States
  const [aiDesigns, setAiDesigns] = useState<any[]>([]);
  const [isLoadingAiDesigns, setIsLoadingAiDesigns] = useState(false);
  const [selectedDesignForResponses, setSelectedDesignForResponses] = useState<any | null>(null);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [pushingDesignId, setPushingDesignId] = useState<string | null>(null);
  const [updatingResponseId, setUpdatingResponseId] = useState<string | null>(null);
  const [updatingResponseAction, setUpdatingResponseAction] = useState<'accept' | 'reject' | null>(null);
  
  
  // Requirements States
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  
  
  // Chats States
  const [totalUnreadChats, setTotalUnreadChats] = useState<number>(0);
  const chatsTabRef = useRef<ChatsTabRef>(null);


  // Open chat from a quote card (instant quotes section)
  async function openChatFromQuote(quote: any) {
    if (chatsTabRef.current) {
      await chatsTabRef.current.openChatFromQuote(quote);
      setActiveTab('chats');
    }
  }
  
  // Profile display states
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Show loading immediately
    setIsLoggingOut(true);
    
    // Small delay to ensure loading state is shown before redirect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Logout will clear localStorage and redirect to login
    await apiService.logout('/buyer-portal');
    setStep('phone');
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


  // Fetch designs
  const fetchDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const filters: any = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      const response = await apiService.getDesigns(filters);
      if (response.success && response.data) {
        setDesigns(response.data.designs || []);
      } else {
        console.error('Failed to fetch designs');
        setDesigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      setDesigns([]);
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  // Fetch AI designs
  const fetchAiDesigns = async () => {
    setIsLoadingAiDesigns(true);
    try {
      const response = await apiService.getAIDesigns();
      if (response.success && response.data) {
        const designs = response.data || [];
        
        // Fetch responses for each AI design
        const designsWithResponses = await Promise.all(
          designs.map(async (design: any) => {
            try {
              const responsesResponse = await apiService.getAIDesignResponses(design.id);
              if (responsesResponse.success && responsesResponse.data) {
                return {
                  ...design,
                  responses: responsesResponse.data || []
                };
              } else {
                console.warn(`Failed to fetch responses for AI design ${design.id}:`, responsesResponse.message);
                return {
                  ...design,
                  responses: []
                };
              }
            } catch (error: any) {
              console.error(`Error fetching responses for AI design ${design.id}:`, error);
              return {
                ...design,
                responses: []
              };
            }
          })
        );
        
        setAiDesigns(designsWithResponses);
      } else {
        console.error('Failed to fetch AI designs');
        setAiDesigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch AI designs:', error);
      setAiDesigns([]);
    } finally {
      setIsLoadingAiDesigns(false);
    }
  };

  // Fetch designs when designs tab is active
  useEffect(() => {
    if (activeTab === 'designs' && step === 'dashboard') {
      if (designsSubTab === 'all-designs') {
        fetchDesigns();
      } else if (designsSubTab === 'my-ai-designs') {
        fetchAiDesigns();
      }
    }
  }, [activeTab, step, selectedCategory, searchQuery, designsSubTab]);

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

    if (chatsTabRef.current) {
      await chatsTabRef.current.openChatFromNegotiation(requirement, response);
      setActiveTab('chats');
    }
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
        {/* AI Chatbot */}
        <AIChatbot onQuoteChat={openChatFromQuote} />
        
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

              {/* Designs Tab */}
              <button
                onClick={() => setActiveTab('designs')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'designs'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'designs' && (
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Designs</span>
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
          {activeTab === 'designs' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{designsSubTab === 'all-designs' ? 'Curated designs' : 'AI Generated Designs'}</span>
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">Design Marketplace</h1>
                <p className="text-gray-600">
                  {designsSubTab === 'all-designs' 
                    ? 'Browse our curated collection of ready-to-manufacture designs'
                    : 'View your AI-generated designs that are published to manufacturers'}
                </p>
              </div>

              {/* Sub-tabs for Designs */}
              <div className="mb-6 flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setDesignsSubTab('all-designs')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    designsSubTab === 'all-designs'
                      ? 'border-[#22a2f2] text-[#22a2f2]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Designs
                </button>
                <button
                  onClick={() => setDesignsSubTab('my-ai-designs')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    designsSubTab === 'my-ai-designs'
                      ? 'border-[#22a2f2] text-[#22a2f2]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My AI Designs
                </button>
              </div>

              {/* Search and Filter Bar - Only for All Designs */}
              {designsSubTab === 'all-designs' && (
                <div className="mb-8">
                  <div className="bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Search Input */}
                      <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search designs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400 transition-all"
                        />
                      </div>

                      {/* Category Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                          className="appearance-none w-full md:w-64 px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                        >
                          <span className={selectedCategory !== 'all' ? 'text-black' : 'text-gray-500'}>
                            {selectedCategory === 'all' 
                              ? 'All Categories' 
                              : selectedCategory === 't-shirts' 
                              ? 'T-Shirts' 
                              : selectedCategory === 'shirts'
                              ? 'Shirts'
                              : selectedCategory === 'hoodies'
                              ? 'Hoodies'
                              : selectedCategory === 'sweatshirts'
                              ? 'Sweatshirts'
                              : selectedCategory === 'cargos'
                              ? 'Cargos'
                              : selectedCategory === 'trackpants'
                              ? 'Trackpants'
                              : 'All Categories'}
                          </span>
                          <svg 
                            className={`h-5 w-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'transform rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        
                        {isCategoryDropdownOpen && (
                          <div className="absolute z-50 w-full md:w-64 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            <div className="max-h-[180px] overflow-y-auto">
                              {[
                                { value: 'all', label: 'All Categories' },
                                { value: 't-shirts', label: 'T-Shirts' },
                                { value: 'shirts', label: 'Shirts' },
                                { value: 'hoodies', label: 'Hoodies' },
                                { value: 'sweatshirts', label: 'Sweatshirts' },
                                { value: 'cargos', label: 'Cargos' },
                                { value: 'trackpants', label: 'Trackpants' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(option.value);
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                    selectedCategory === option.value ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Designs Content */}
              {designsSubTab === 'all-designs' && (
                <>
                  {/* Loading State */}
                  {isLoadingDesigns && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500">Loading designs...</p>
                    </div>
                  )}

                  {/* Designs Grid */}
                  {!isLoadingDesigns && designs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {designs.map((design: any) => (
                        <div
                          key={design.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 overflow-hidden group cursor-pointer"
                          onClick={() => {
                            window.location.href = `/buyer-portal/designs/${design.id}`;
                          }}
                        >
                          {/* Product Image */}
                          <div className="relative aspect-square overflow-hidden bg-gray-100">
                            <img
                              src={design.image_url}
                              alt={design.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#22a2f2] transition-colors flex-1">{design.product_name}</h3>
                              <svg 
                                className="w-5 h-5 text-gray-400 group-hover:text-[#22a2f2] transition-colors flex-shrink-0" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingDesigns && designs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="text-center max-w-md">
                        <div className="relative group mb-6">
                          <div className="bg-[#22a2f2]/10 rounded-2xl p-8 border border-[#22a2f2]/30 shadow-sm">
                            <svg
                              className="mx-auto h-20 w-20 text-[#22a2f2]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-[#22a2f2] mb-2">No designs found matching your criteria</p>
                        <p className="text-sm text-gray-500">
                          Try adjusting your search terms or category filter
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* My AI Designs Content */}
              {designsSubTab === 'my-ai-designs' && (
                <>
                  {/* Loading State */}
                  {isLoadingAiDesigns && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500">Loading your AI designs...</p>
                    </div>
                  )}

                  {/* AI Designs Grid */}
                  {!isLoadingAiDesigns && aiDesigns.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {aiDesigns.map((aiDesign: any) => (
                        <div
                          key={aiDesign.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 overflow-hidden group"
                        >
                          {/* Product Image */}
                          <div className="relative aspect-square overflow-hidden bg-gray-100">
                            <img
                              src={aiDesign.image_url}
                              alt={aiDesign.apparel_type || 'AI Design'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Status Badge (Accepted) or AI Badge */}
                            {aiDesign.responses && aiDesign.responses.some((r: any) => r.status === 'accepted') ? (
                              <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                                Accepted
                              </div>
                            ) : (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-[#22a2f2] text-white text-xs font-semibold rounded-lg">
                              AI
                            </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-5">
                            <div className="mb-2">
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#22a2f2] transition-colors">
                                {aiDesign.apparel_type}
                              </h3>
                            </div>
                            
                            {/* Design Details */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Quantity:</span>
                                <span className="font-medium text-gray-900">{aiDesign.quantity}</span>
                              </div>
                            </div>

                            {/* Push To Manufacturer or View Responses Button */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                              {aiDesign.status === 'published' ? (
                                // If published, check if there's an accepted response
                                aiDesign.responses && aiDesign.responses.length > 0 ? (
                                  // Check if any response is accepted
                                  aiDesign.responses.some((r: any) => r.status === 'accepted') ? (
                                    <button
                                      disabled
                                      className="w-full px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>Already Accepted</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedDesignForResponses(aiDesign);
                                        setShowResponsesModal(true);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-semibold text-[#22a2f2] bg-[#22a2f2]/10 hover:bg-[#22a2f2]/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                      <span>View {aiDesign.responses.length} Response{aiDesign.responses.length !== 1 ? 's' : ''}</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  )
                                ) : (
                                  <button
                                    disabled
                                    className="w-full px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Pushed</span>
                                  </button>
                                )
                              ) : (
                                // If draft, show Push To Manufacturer button
                                <button
                                  onClick={async () => {
                                    setPushingDesignId(aiDesign.id);
                                    try {
                                      await apiService.pushAIDesign(aiDesign.id);
                                      // Refresh AI designs to show updated status
                                      await fetchAiDesigns();
                                    } catch (error: any) {
                                      console.error('Failed to push design:', error);
                                      alert(error?.message || 'Failed to push design to manufacturers. Please try again.');
                                    } finally {
                                      setPushingDesignId(null);
                                    }
                                  }}
                                  disabled={pushingDesignId === aiDesign.id}
                                  className="w-full px-3 py-2 text-xs font-semibold text-white bg-[#22a2f2] hover:bg-[#1b8bd0] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                  {pushingDesignId === aiDesign.id ? (
                                    <>
                                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>Pushing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                      </svg>
                                      <span>Push To Manufacturer</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State for AI Designs */}
                  {!isLoadingAiDesigns && aiDesigns.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="text-center max-w-md">
                        <div className="relative group mb-6">
                          <div className="bg-[#22a2f2]/10 rounded-2xl p-8 border border-[#22a2f2]/30 shadow-sm">
                            <svg
                              className="mx-auto h-20 w-20 text-[#22a2f2]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-[#22a2f2] mb-2">No AI designs yet</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Generate and publish your first AI design to see it here
                        </p>
                        <button
                          onClick={() => setActiveTab('generate-designs')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#22a2f2] text-white rounded-lg font-medium hover:bg-[#1b8bd0] transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Design
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
                // Refresh AI designs when a new design is published
                if (designsSubTab === 'my-ai-designs') {
                  fetchAiDesigns();
                }
              }}
            />
          )}
        </main>

        {/* Responses Modal */}
        {showResponsesModal && selectedDesignForResponses && typeof window !== 'undefined' && createPortal(
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowResponsesModal(false)}
          >
            <div 
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-black">Manufacturer Responses</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedDesignForResponses.apparel_type}</p>
                </div>
                <button
                  onClick={() => setShowResponsesModal(false)}
                  className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0">
                {/* Design Preview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-200 rounded-lg">
                      <img
                        src={selectedDesignForResponses.image_url}
                        alt={selectedDesignForResponses.apparel_type || 'AI Design'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 mb-1">{selectedDesignForResponses.apparel_type}</h4>
                      {selectedDesignForResponses.design_description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{selectedDesignForResponses.design_description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Your Qty: {selectedDesignForResponses.quantity?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Responses List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedDesignForResponses.responses?.length || 0} Response{selectedDesignForResponses.responses?.length !== 1 ? 's' : ''}
                    </h4>
                  </div>

                  {selectedDesignForResponses.responses && selectedDesignForResponses.responses.length > 0 ? (
                    selectedDesignForResponses.responses.map((response: any, idx: number) => (
                      <div 
                        key={response.id || idx} 
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:border-[#22a2f2]/50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900">
                                {response.manufacturer?.unit_name || 'Manufacturer'}
                              </h5>
                              {response.manufacturer?.location && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {response.manufacturer.location}
                                </span>
                              )}
                            </div>
                            {response.manufacturer?.business_type && (
                              <p className="text-xs text-gray-500">{response.manufacturer.business_type}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                            {new Date(response.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price Per Unit</p>
                            <p className="text-lg font-bold text-gray-900">₹{response.price_per_unit?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Quantity</p>
                            <p className="text-lg font-bold text-gray-900">{response.quantity?.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Status and Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                          {response.status === 'accepted' ? (
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                                Accepted
                            </span>
                          </div>
                          ) : response.status === 'rejected' ? (
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                                Rejected
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  setUpdatingResponseId(response.id);
                                  setUpdatingResponseAction('accept');
                                  try {
                                    await apiService.updateAIDesignResponseStatus(response.id, 'accepted');
                                    // Refresh AI designs to show updated status
                                    await fetchAiDesigns();
                                    // Update the modal's selected design
                                    const updatedResponses = selectedDesignForResponses.responses.map((r: any) =>
                                      r.id === response.id ? { ...r, status: 'accepted' } : r
                                    );
                                    setSelectedDesignForResponses({
                                      ...selectedDesignForResponses,
                                      responses: updatedResponses
                                    });
                                  } catch (error: any) {
                                    console.error('Failed to accept response:', error);
                                    alert(error?.message || 'Failed to accept response. Please try again.');
                                  } finally {
                                    setUpdatingResponseId(null);
                                    setUpdatingResponseAction(null);
                                  }
                                }}
                                disabled={updatingResponseId !== null}
                                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {updatingResponseId === response.id && updatingResponseAction === 'accept' ? (
                                  <>
                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Accepting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept
                                  </>
                                )}
                              </button>
                              <button
                                onClick={async () => {
                                  setUpdatingResponseId(response.id);
                                  setUpdatingResponseAction('reject');
                                  try {
                                    await apiService.updateAIDesignResponseStatus(response.id, 'rejected');
                                    // Refresh AI designs to show updated status
                                    await fetchAiDesigns();
                                    // Update the modal's selected design
                                    const updatedResponses = selectedDesignForResponses.responses.map((r: any) =>
                                      r.id === response.id ? { ...r, status: 'rejected' } : r
                                    );
                                    setSelectedDesignForResponses({
                                      ...selectedDesignForResponses,
                                      responses: updatedResponses
                                    });
                                  } catch (error: any) {
                                    console.error('Failed to reject response:', error);
                                    alert(error?.message || 'Failed to reject response. Please try again.');
                                  } finally {
                                    setUpdatingResponseId(null);
                                    setUpdatingResponseAction(null);
                                  }
                                }}
                                disabled={updatingResponseId !== null}
                                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {updatingResponseId === response.id && updatingResponseAction === 'reject' ? (
                                  <>
                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500">No responses yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
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

