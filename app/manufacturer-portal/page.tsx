'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../lib/apiService';
import RequirementsTab from './components/RequirementsTab';
import AIRequirements from './components/AIRequirements';
import AnalyticsTab from './components/AnalyticsTab';
import ChatsTab from './components/ChatsTab';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import { useToast } from '../components/Toast';

type TabType = 'chats' | 'requirements' | 'ai-requirements' | 'analytics' | 'profile';

export default function ManufacturerPortal() {
  const toast = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'onboarding' | 'dashboard'>('phone');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // On initial load, if a token exists, persist state across refresh
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        if (apiService.isAuthenticated()) {
          try {
            // Verify token is still valid by attempting to get profile
            const response = await apiService.getManufacturerProfile();
            if (response && response.success) {
              setStep('dashboard');
              
              // Restore active tab from localStorage
                const storedTab = localStorage.getItem('manufacturer_active_tab');
                if (storedTab && ['chats', 'requirements', 'ai-requirements', 'analytics', 'profile'].includes(storedTab)) {
                  // Restore the saved tab (this will override the initializer if needed)
                  setActiveTab(storedTab as TabType);
                }
                // Note: We don't check chat state here anymore to avoid overriding the saved tab
                // The chat state restoration is handled by the ChatsTab component itself
            }
          } catch (error: any) {
            // If token expired or unauthorized, redirect to login
            if (error.message?.includes('expired') || error.message?.includes('session')) {
              setStep('phone');
              apiService.removeToken('manufacturer');
              // Clear chat state on logout (ChatsTab will handle its own cleanup)
              localStorage.removeItem('manufacturer_chat_state');
            }
          }
        }
        setIsCheckingAuth(false);
      } else {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Restore active tab from localStorage on mount
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem('manufacturer_active_tab');
      if (storedTab && ['chats', 'requirements', 'ai-requirements', 'analytics', 'profile'].includes(storedTab)) {
        return storedTab as TabType;
      }
    }
    return 'chats';
  });
  
  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (step === 'dashboard') {
      localStorage.setItem('manufacturer_active_tab', activeTab);
    }
  }, [activeTab, step]);

  const [displayName, setDisplayName] = useState('');
  const [unseenRequirementsCount, setUnseenRequirementsCount] = useState(0);
  const [unseenAIRequirementsCount, setUnseenAIRequirementsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef<TabType>(activeTab);
  
  // Get WS URL for socket connection
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || getApiBaseOrigin(), []);
  const wsPath = useMemo(() => process.env.NEXT_PUBLIC_WS_PATH || '/socket.io', []);

  // Keep activeTabRef in sync with activeTab state
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Clear unseen requirements count when Requirements tab is viewed
  useEffect(() => {
    if (activeTab === 'requirements') {
      setUnseenRequirementsCount(0);
    }
  }, [activeTab]);

  // Clear unseen AI requirements count when AI Requirements tab is viewed
  useEffect(() => {
    if (activeTab === 'ai-requirements') {
      setUnseenAIRequirementsCount(0);
    }
    if (activeTab === 'chats') {
      setUnreadMessagesCount(0);
    }
  }, [activeTab]);

  // Socket connection for real-time notifications (runs regardless of active tab)
  useEffect(() => {
    // Only connect when on dashboard
    if (step !== 'dashboard' || !wsUrl) return;

    // Get token fresh each time (not memoized to ensure we have the latest)
    const token = apiService.getToken();
    if (!token) return;

    const socket = io(wsUrl, { path: wsPath, auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Socket connected for notifications
    });

    // Listen for new requirements - increment counter if not on requirements tab
    socket.on('requirement:new', (data: any) => {
      const requirement = data.requirement || data;
      if (!requirement || !requirement.id) return;

      // Only increment if not currently viewing the Requirements tab
      if (activeTabRef.current !== 'requirements') {
        setUnseenRequirementsCount((prev) => prev + 1);
      }
    });

    // Listen for new AI designs - increment counter if not on AI requirements tab
    socket.on('ai-design:new', (data: any) => {
      const aiDesign = data.aiDesign || data;
      if (!aiDesign || !aiDesign.id) return;

      // Only increment if not currently viewing the AI Requirements tab
      if (activeTabRef.current !== 'ai-requirements') {
        setUnseenAIRequirementsCount((prev) => prev + 1);
      }
    });

    // Listen for new messages - increment counter if not on chats tab
    socket.on('message:new', (data: any) => {
      const message = data.message || data;
      if (!message || !message.conversation_id) return;

      const conversationId = message.conversation_id;

      // Only increment if not currently viewing the Chats tab
      const isOnChatsTab = activeTabRef.current === 'chats';
      
      if (!isOnChatsTab) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
      
      // Always track unread count per conversation (for ChatList badges)
      setConversationUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    });

    // Listen for message:read events to clear unread counts for a conversation
    // Only clear if the current user is the one who read the messages
    socket.on('message:read', (data: any) => {
      const conversationId = data.conversationId || data.conversation_id;
      const readerUserId = data.readerUserId;
      
      // Get current user's ID from localStorage
      const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('manufacturerId') : null;
      
      // Only clear unread count if the current user is the one who read the messages
      if (conversationId && readerUserId && currentUserId && readerUserId === currentUserId) {
        setConversationUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [step, wsUrl, wsPath]);

  const handleLogout = async () => {
    // Show loading immediately
    setIsLoggingOut(true);
    
    // Show logout toast
    toast.info('Logging out...');
    
    // Clear all localStorage (apiService.logout will handle this)
    // Reset state before redirect
    setPhoneNumber('');
    setStep('phone');
    
    // Small delay to ensure loading state is shown before redirect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Logout will clear localStorage and redirect to login
    await apiService.logout('/manufacturer-portal');
    
    // Show success toast after logout
    setTimeout(() => {
      toast.success('Logged out successfully. See you soon!');
    }, 200);
  };

  const handleLoginSuccess = (nextStep: 'onboarding' | 'dashboard') => {
    setStep(nextStep);
  };

  // Load phone number from localStorage on component mount
  useEffect(() => {
    if ((step === 'dashboard' || step === 'onboarding') && apiService.isAuthenticated()) {
      const storedPhone = localStorage.getItem('manufacturerPhoneNumber');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
      }
      
      // Load display name when on dashboard
      if (step === 'dashboard') {
      loadDisplayName();
      }
    }
  }, [step]);

  // Load display name from profile
  const loadDisplayName = async () => {
    try {
      const response = await apiService.getManufacturerProfile();
      if (response.success && response.data.profile) {
        const profile = response.data.profile;
        const resolvedName = (profile.contact_person_name || profile.unit_name || profile.business_name || '').trim();
        if (resolvedName) {
          setDisplayName(resolvedName);
        }
      }
    } catch (error) {
      console.error('Failed to load display name:', error);
    }
  };

  const handleOnboardingComplete = () => {
        setStep('dashboard');
  };

  // Onboarding View
  if (step === 'onboarding') {
    return <Onboarding phoneNumber={phoneNumber} onComplete={handleOnboardingComplete} toast={toast} />;
  }

  // Show loading while checking authentication or logging out
  if (isCheckingAuth || isLoggingOut) {
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

  // Dashboard View
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
                  <span className="text-xs text-gray-500 hidden sm:block">
                    Your Manufacturing Partner
                  </span>
                </div>
              </div>

              {/* Right Side - Profile Info & Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Contact Name with Online Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {displayName || phoneNumber}
                  </span>
                </div>

                {/* Profile Button */}
                <Link
                  href="/manufacturer-portal/profile"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
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
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
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
                  <span className="font-medium hidden lg:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="relative z-40 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {/* Chats Tab */}
              <button
                onClick={() => setActiveTab('chats')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'chats'
                    ? 'text-[#22a2f2]'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeTab === 'chats' && (
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-t-lg border-b-2 border-[#22a2f2]"></div>
                )}
                <svg
                  className="relative z-10 w-5 h-5"
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
                <span className="relative z-10">Chats</span>
                {activeTab !== 'chats' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#22a2f2] text-white text-[10px] font-semibold px-1">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </button>

              {/* Requirements Tab */}
              <button
                onClick={() => setActiveTab('requirements')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'requirements'
                    ? 'text-[#22a2f2]'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeTab === 'requirements' && (
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-t-lg border-b-2 border-[#22a2f2]"></div>
                )}
                <svg
                  className="relative z-10 w-5 h-5"
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
                <span className="relative z-10">Requirements</span>
                {activeTab !== 'requirements' && unseenRequirementsCount > 0 && (
                  <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#22a2f2] text-white text-[10px] font-semibold px-1">
                    {unseenRequirementsCount > 99 ? '99+' : unseenRequirementsCount}
                  </span>
                )}
              </button>

              {/* AI Requirements Tab */}
              <button
                onClick={() => setActiveTab('ai-requirements')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'ai-requirements'
                    ? 'text-[#22a2f2]'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeTab === 'ai-requirements' && (
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-t-lg border-b-2 border-[#22a2f2]"></div>
                )}
                <svg
                  className="relative z-10 w-5 h-5"
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
                <span className="relative z-10">AI Requirements</span>
                {activeTab !== 'ai-requirements' && unseenAIRequirementsCount > 0 && (
                  <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#22a2f2] text-white text-[10px] font-semibold px-1">
                    {unseenAIRequirementsCount > 99 ? '99+' : unseenAIRequirementsCount}
                  </span>
                )}
              </button>

              {/* Analytics Tab */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'text-[#22a2f2]'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeTab === 'analytics' && (
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-t-lg border-b-2 border-[#22a2f2]"></div>
                )}
                <svg
                  className="relative z-10 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="relative z-10">Analytics</span>
              </button>

            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Content */}
          {activeTab === 'chats' && (
            <ChatsTab 
              activeTab={activeTab}
              onActiveTabChange={(tab) => setActiveTab(tab)}
              conversationUnreadCounts={conversationUnreadCounts}
              onClearConversationUnread={(conversationId) => {
                setConversationUnreadCounts((prev) => {
                  const updated = { ...prev };
                  delete updated[conversationId];
                  return updated;
                });
              }}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'requirements' && <RequirementsTab />}
          {activeTab === 'ai-requirements' && <AIRequirements />}
        </main>
      </div>
    );
  }

  // Show login page when step is 'phone' or 'otp'
  if (step === 'phone' || step === 'otp') {
    return <Login onLoginSuccess={handleLoginSuccess} isCheckingAuth={isCheckingAuth} isLoggingOut={isLoggingOut} />;
  }
}
