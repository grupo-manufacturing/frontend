'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AIChatbot from '../components/AIChatbot';
import apiService from '../lib/apiService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

type TabType = 'designs' | 'custom-quote' | 'my-orders' | 'chats' | 'requirements';

export default function BuyerPortal() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
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
            setPhoneNumber(storedPhone);
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
              
              // Restore chat state from localStorage
              const storedChatState = localStorage.getItem('buyer_chat_state');
              if (storedChatState) {
                try {
                  const chatState = JSON.parse(storedChatState);
                  if (chatState.conversationId && chatState.buyerId && chatState.manufacturerId) {
                    setActiveConversationId(chatState.conversationId);
                    setActiveBuyerId(chatState.buyerId);
                    setActiveManufacturerId(chatState.manufacturerId);
                    setActiveTitle(chatState.title || undefined);
                    if (chatState.activeTab) {
                      setActiveTab(chatState.activeTab);
                    } else if (chatState.conversationId) {
                      setActiveTab('chats');
                    }
                    // Restore requirement if available
                    if (chatState.requirement) {
                      setActiveRequirement(chatState.requirement);
                    }
                  }
                } catch (e) {
                  console.error('Failed to restore chat state:', e);
                }
              }
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
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // Timer in seconds
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('designs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  
  // Custom Quote Form States
  const [requirement, setRequirement] = useState('');
  const [customQuantity, setCustomQuantity] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [customProductType, setCustomProductType] = useState('');
  const [isProductTypeDropdownOpen, setIsProductTypeDropdownOpen] = useState(false);
  const [productLink, setProductLink] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);
  
  // Requirements States
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [negotiatingResponseId, setNegotiatingResponseId] = useState<string | null>(null);
  
  // My Orders States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [isOrderFilterDropdownOpen, setIsOrderFilterDropdownOpen] = useState(false);
  const [requirementStats, setRequirementStats] = useState({
    total: 0,
    accepted: 0,
    pending_review: 0,
    in_negotiation: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // My Orders Sub-tabs
  const [myOrdersSubTab, setMyOrdersSubTab] = useState<'requirements' | 'orders'>('requirements');
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [isLoadingBuyerOrders, setIsLoadingBuyerOrders] = useState(false);
  
  // Chats States
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeManufacturerId, setActiveManufacturerId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>(undefined);
  const [activeRequirement, setActiveRequirement] = useState<any | null>(null); // Track active requirement for chat
  const [totalUnreadChats, setTotalUnreadChats] = useState<number>(0);
  const [chatUnreadClearSignal, setChatUnreadClearSignal] = useState<{ conversationId: string; at: number } | null>(null);

  // Persist chat state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeConversationId && activeBuyerId && activeManufacturerId) {
        const chatState = {
          conversationId: activeConversationId,
          buyerId: activeBuyerId,
          manufacturerId: activeManufacturerId,
          title: activeTitle,
          activeTab: activeTab,
          requirement: activeRequirement
        };
        localStorage.setItem('buyer_chat_state', JSON.stringify(chatState));
      } else {
        localStorage.removeItem('buyer_chat_state');
      }
    }
  }, [activeConversationId, activeBuyerId, activeManufacturerId, activeTitle, activeTab, activeRequirement]);

  // Listen for chat open events from components like ManufacturerCard
  useEffect(() => {
    function onOpenChat(e: any) {
      if (!e?.detail) return;
      const { conversationId, buyerId, manufacturerId } = e.detail;
      setActiveTab('chats');
      setActiveConversationId(conversationId);
      setActiveBuyerId(buyerId);
      setActiveManufacturerId(manufacturerId);
      setActiveTitle(undefined);
      setChatUnreadClearSignal({ conversationId, at: Date.now() });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('open-chat', onOpenChat as any);
      return () => window.removeEventListener('open-chat', onOpenChat as any);
    }
  }, []);

  // Helper to get buyerId from localStorage or profile (fallback)
  const getBuyerId = async () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('buyerId');
      if (stored) return stored;
    }
    try {
      const prof = await apiService.getBuyerProfile();
      const id = prof?.data?.profile?.id;
      if (id && typeof window !== 'undefined') localStorage.setItem('buyerId', id);
      return id || null;
    } catch {
      return null;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return '—';
    return `INR ${numericValue.toLocaleString('en-IN')}`;
  };

  // Open chat from a quote card (instant quotes section)
  async function openChatFromQuote(quote: any) {
    try {
      const buyerId = await getBuyerId();
      const manufacturerId = String(quote.id);
      if (!buyerId || !manufacturerId) {
        setActiveTab('chats');
        return;
      }
      const res = await apiService.ensureConversation(buyerId, manufacturerId);
      const conversationId = res?.data?.conversation?.id;
      setActiveTab('chats');
      if (conversationId) {
        setActiveConversationId(conversationId);
        setActiveBuyerId(buyerId);
        setActiveManufacturerId(manufacturerId);
        setChatUnreadClearSignal({ conversationId, at: Date.now() });
      }
    } catch (e) {
      console.error('Failed to open chat from quote', e);
      setActiveTab('chats');
    }
  }
  
  // Profile display states
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullPhoneNumber = countryCode + phoneNumber;
    
    // Clear previous messages
    setOtpErrorMessage('');
    setOtpSuccessMessage('');
    
    // Demo credentials bypass
    if (phoneNumber === '1234567890') {
      console.log('Demo credentials detected - bypassing OTP');
      setIsLoadingOtp(true);
      setTimeout(() => {
        setIsLoadingOtp(false);
        setStep('otp');
        setOtpTimer(120); // 2 minutes for demo
      }, 1000);
      return;
    }
    
    setIsLoadingOtp(true);
    try {
      console.log('Sending OTP to:', fullPhoneNumber);
      const response = await apiService.sendOTP(fullPhoneNumber, 'buyer');
      console.log('OTP sent successfully:', response);
      setStep('otp');
      setOtpTimer(120); // 2 minutes (120 seconds)
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      setOtpErrorMessage(error.message || 'Failed to send OTP. Please try again.');
      if (!error.message?.includes('maximum')) {
        setTimeout(() => setOtpErrorMessage(''), 5000);
      }
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleResendOTP = async () => {
    const fullPhoneNumber = countryCode + phoneNumber;
    
    // Clear previous messages
    setOtpErrorMessage('');
    setOtpSuccessMessage('');
    setOtp(''); // Clear OTP input
    
    setIsResendingOtp(true);
    try {
      const response = await apiService.sendOTP(fullPhoneNumber, 'buyer');
      setOtpTimer(120); // Reset timer to 2 minutes
      setOtpSuccessMessage('OTP resent successfully! Please check your phone.');
      setTimeout(() => setOtpSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Failed to resend OTP:', error);
      setOtpErrorMessage(error.message || 'Failed to resend OTP. Please try again.');
      if (!error.message?.includes('maximum')) {
        setTimeout(() => setOtpErrorMessage(''), 5000);
      }
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [otpTimer]);

  // Reset timer when step changes away from OTP
  useEffect(() => {
    if (step !== 'otp') {
      setOtpTimer(0);
      setOtpErrorMessage('');
      setOtpSuccessMessage('');
    }
  }, [step]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    
    try {
      // Demo credentials bypass
      if (phoneNumber === '1234567890' && otp === '123456') {
        console.log('Demo credentials verified - bypassing API call');
        
        // Create mock response for demo
        const mockResponse = {
          data: {
            token: 'demo_token_' + Date.now(),
            user: {
              phoneNumber: phoneNumber,
              role: 'buyer'
            }
          }
        };
        
        // Store token and user data
        apiService.setToken(mockResponse.data.token, 'buyer');
        localStorage.setItem('buyerPhoneNumber', phoneNumber);
        localStorage.setItem('user_role', 'buyer');
        
        // Check profile completion before showing dashboard
        setIsCheckingProfile(true);
        try {
          const response = await apiService.getBuyerProfile();
          if (response && response.success && response.data && response.data.profile) {
            const profile = response.data.profile;
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
          console.error('Failed to fetch buyer profile:', error);
          setProfileCompletion(0);
        } finally {
          setIsCheckingProfile(false);
        }
        
        // Set phone number for display
        setUserPhoneNumber(phoneNumber);
        
        // Go directly to dashboard after profile check
        setStep('dashboard');
        return;
      }
      
      const fullPhoneNumber = countryCode + phoneNumber;
      console.log('Verifying OTP:', otp);
      const response = await apiService.verifyOTP(fullPhoneNumber, otp, 'buyer');
      console.log('OTP verified successfully:', response);
      
      // Store token and user data
      apiService.setToken(response.data.token, 'buyer');
      localStorage.setItem('buyerPhoneNumber', phoneNumber);
      localStorage.setItem('user_role', 'buyer');
      
      // Check profile completion before showing dashboard
      setIsCheckingProfile(true);
      try {
        const profileResponse = await apiService.getBuyerProfile();
        if (profileResponse && profileResponse.success && profileResponse.data && profileResponse.data.profile) {
          const profile = profileResponse.data.profile;
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
        console.error('Failed to fetch buyer profile:', error);
        setProfileCompletion(0);
      } finally {
        setIsCheckingProfile(false);
      }
      
      // Set phone number for display
      setUserPhoneNumber(phoneNumber);
      
      // Go directly to dashboard after profile check
      setStep('dashboard');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = async () => {
    // Show loading immediately
    setIsLoggingOut(true);
    
    // Clear all localStorage (apiService.logout will handle this)
    // Reset state before redirect
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    
    // Small delay to ensure loading state is shown before redirect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Logout will clear localStorage and redirect to login
    await apiService.logout('/buyer-portal');
  };

  const handleChangePhoneNumber = () => {
    setStep('phone');
    setOtp('');
  };

  
  // Handle Custom Quote Submission
  const handleSubmitRequirement = async () => {
    // Validate required field
    if (!requirement || requirement.trim().length === 0) {
      alert('Please enter your requirement details');
      return;
    }

    setIsSubmittingRequirement(true);
    
    try {
      // TODO: Handle image upload if uploadedImage exists
      let imageUrl = null;
      if (uploadedImage) {
        // For now, we'll skip image upload - can be implemented later with cloudinary
        console.log('Image upload not yet implemented:', uploadedImage.name);
      }

      // Create requirement data
      const requirementData = {
        requirement_text: requirement.trim(),
        quantity: customQuantity ? parseInt(customQuantity) : null,
        brand_name: customBrandName.trim() || null,
        product_type: customProductType || null,
        product_link: productLink.trim() || null,
        image_url: imageUrl
      };

      // Submit to backend
      const response = await apiService.createRequirement(requirementData);

      if (response.success) {
        alert('Requirement submitted successfully! Manufacturers will review and respond shortly.');
        
        // Clear form
        setRequirement('');
        setCustomQuantity('');
        setCustomBrandName('');
        setCustomProductType('');
        setProductLink('');
        setUploadedImage(null);
        
        // Refresh statistics if on my-orders tab
        if (activeTab === 'my-orders') {
          fetchRequirementStatistics();
        }
        
        // Switch to requirements tab to show the newly created requirement
        setActiveTab('requirements');
      } else {
        alert('Failed to submit requirement. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit requirement:', error);
      alert('Failed to submit requirement. Please try again.');
    } finally {
      setIsSubmittingRequirement(false);
    }
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

  // Fetch designs when designs tab is active
  useEffect(() => {
    if (activeTab === 'designs' && step === 'dashboard') {
      fetchDesigns();
    }
  }, [activeTab, step, selectedCategory, searchQuery]);

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

  // Fetch requirement statistics
  const fetchRequirementStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiService.getBuyerRequirementStatistics();
      if (response && response.success && response.data) {
        setRequirementStats(response.data);
      } else {
        console.error('Failed to fetch requirement statistics');
      }
    } catch (error) {
      console.error('Failed to fetch requirement statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch buyer orders
  const fetchBuyerOrders = async () => {
    setIsLoadingBuyerOrders(true);
    try {
      const filters: any = {};
      if (orderFilter !== 'all') {
        filters.status = orderFilter;
      }
      const response = await apiService.getBuyerOrders(filters);
      if (response.success && response.data) {
        setBuyerOrders(response.data || []);
      } else {
        console.error('Failed to fetch buyer orders');
        setBuyerOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch buyer orders:', error);
      setBuyerOrders([]);
    } finally {
      setIsLoadingBuyerOrders(false);
    }
  };

  // Fetch statistics and requirements when my-orders tab is active
  useEffect(() => {
    if (activeTab === 'my-orders' && step === 'dashboard') {
      if (myOrdersSubTab === 'requirements') {
        fetchRequirementStatistics();
        fetchRequirements();
      } else if (myOrdersSubTab === 'orders') {
        fetchBuyerOrders();
      }
    }
  }, [activeTab, step, myOrdersSubTab, orderFilter]);

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

  // Handle Accept/Reject Response
  const handleUpdateResponseStatus = async (responseId: string, status: 'accepted' | 'rejected', manufacturerName: string) => {
    const confirmMessage = status === 'accepted' 
      ? `Are you sure you want to accept the quote from ${manufacturerName}?`
      : `Are you sure you want to reject the quote from ${manufacturerName}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await apiService.updateRequirementResponseStatus(responseId, status);
      
      if (response.success) {
        alert(`Quote ${status} successfully!`);
        // Refresh requirements to show updated status
        fetchRequirements();
        // Refresh statistics if on my-orders tab
        if (activeTab === 'my-orders') {
          fetchRequirementStatistics();
        }
      } else {
        alert(response.message || `Failed to ${status} quote. Please try again.`);
      }
    } catch (error: any) {
      console.error(`Failed to ${status} response:`, error);
      alert(error.message || `Failed to ${status} quote. Please try again.`);
    }
  };

  const handleNegotiateResponse = async (requirement: any, response: any) => {
    const manufacturerIdRaw = response?.manufacturer_id || response?.manufacturer?.id;
    const manufacturerId = manufacturerIdRaw ? String(manufacturerIdRaw) : null;

    if (!manufacturerId) {
      alert('Unable to determine the manufacturer for this response. Please try again later.');
      return;
    }

    try {
      setNegotiatingResponseId(response.id);
      
      // Update response status to 'negotiating' first
      try {
        await apiService.updateRequirementResponseStatus(response.id, 'negotiating');
        // Refresh requirements to show updated status
        fetchRequirements();
        // Refresh statistics if on my-orders tab
        if (activeTab === 'my-orders') {
          fetchRequirementStatistics();
        }
      } catch (statusError: any) {
        console.error('Failed to update response status:', statusError);
        // Continue with chat opening even if status update fails
      }

      const buyerId = await getBuyerId();

      if (!buyerId) {
        setActiveTab('chats');
        alert('We could not load your buyer profile. Please refresh and try again.');
        return;
      }

      setActiveTab('chats');

      const ensureRes = await apiService.ensureConversation(buyerId, manufacturerId);
      const conversationId = ensureRes?.data?.conversation?.id;

      if (conversationId) {
        setActiveConversationId(conversationId);
        setActiveBuyerId(buyerId);
        setActiveManufacturerId(manufacturerId);

        const manufacturerName = response?.manufacturer?.unit_name;
        const requirementSummary = requirement?.requirement_text;
        const fallbackTitle = requirementSummary
          ? requirementSummary.slice(0, 60) + (requirementSummary.length > 60 ? '...' : '')
          : undefined;

        setActiveTitle(manufacturerName || fallbackTitle);
        setActiveRequirement(requirement); // Set the requirement for ChatWindow
        setChatUnreadClearSignal({ conversationId, at: Date.now() });
      } else {
        alert('Unable to open the chat for this response. Please try again from the Chats tab.');
      }
    } catch (error: any) {
      console.error('Failed to open negotiation chat:', error);
      alert(error?.message || 'Failed to open chat. Please try again.');
    } finally {
      setNegotiatingResponseId(null);
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
      setPhoneNumber(storedPhone);
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
                    {displayName || userPhoneNumber || phoneNumber}
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

              {/* Custom Quote Tab */}
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
                <span className="relative z-10 hidden sm:inline">Custom Quote</span>
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
                  <span>Curated designs</span>
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">Design Marketplace</h1>
                <p className="text-gray-600">Browse our curated collection of ready-to-manufacture designs</p>
              </div>

              {/* Search and Filter Bar */}
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
            </div>
          )}
          {activeTab === 'custom-quote' && (
            <div className="flex flex-col items-center">
              {/* Header Section */}
            <div className="mb-8 text-center max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Custom quote</span>
              </div>
                <h1 className="text-3xl font-bold text-black mb-2">Request for Quotation</h1>
              <p className="text-[#22a2f2]">Fill in the details below and connect with verified manufacturers</p>
              </div>

              {/* Custom Quote Form */}
            <div className="w-full max-w-3xl bg-white rounded-2xl border border-[#22a2f2]/30 p-8 shadow-lg">
                <form className="space-y-6">
                  {/* Requirement */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Requirement
                    </label>
                    <textarea
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      placeholder="Please describe your requirements in detail..."
                      rows={5}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 resize-none transition-all"
                    />
                  </div>

                  {/* Quantity and Brand Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        placeholder="Enter quantity"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={customBrandName}
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        placeholder="Enter brand name"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Type
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsProductTypeDropdownOpen(!isProductTypeDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsProductTypeDropdownOpen(false), 200)}
                        className="appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                      >
                        <span className={customProductType ? 'text-black' : 'text-gray-500'}>
                          {customProductType || 'Select product type'}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${isProductTypeDropdownOpen ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>
                      
                      {isProductTypeDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                          <div className="max-h-[180px] overflow-y-auto">
                            {[
                              'Tshirts Plain',
                              'Tshirts Printed',
                              'Acid Wash Plain',
                              'Cargos',
                              'Polos',
                              'Mesh',
                              'Denim Jeans',
                              'Twill Jacket',
                              'Wind Cheaters',
                              'Vests',
                              'Cotton Shirts',
                              'Silk Shirts',
                              'Carduroy Shirts',
                              'Varsity Jackets',
                              'Sweatshirts',
                              'Hoodies Plain',
                              'Hoodies Printed',
                              'Tops',
                              'Women Dresss',
                              'Leather Products',
                              'Caps',
                              'Bags'
                            ].map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setCustomProductType(option);
                                  setIsProductTypeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                  customProductType === option ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Link (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Link (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={productLink}
                        onChange={(e) => setProductLink(e.target.value)}
                        placeholder="https://example.com/product"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Upload Image (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Image (Optional)
                    </label>
                  <div className="border-2 border-dashed border-[#22a2f2]/30 rounded-xl bg-[#22a2f2]/5 hover:bg-[#22a2f2]/10 hover:border-[#22a2f2]/60 transition-all">
                      <label className="flex flex-col items-center justify-center py-12 cursor-pointer group">
                      <div className="p-3 bg-[#22a2f2]/15 rounded-xl mb-3 group-hover:scale-110 transition-transform text-[#22a2f2]">
                          <svg
                          className="w-10 h-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 font-medium mb-1">Click to upload image</span>
                        <span className="text-xs text-gray-500">PNG, JPG or GIF (Max 5MB)</span>
                        {uploadedImage && (
                          <div className="mt-3 px-4 py-2 bg-[#22a2f2]/15 border border-[#22a2f2]/40 rounded-lg">
                            <span className="text-xs text-[#22a2f2] font-medium">
                              {uploadedImage.name}
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setUploadedImage(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSubmitRequirement}
                    disabled={isSubmittingRequirement}
                    className="relative w-full group overflow-hidden rounded-xl"
                  >
                  <div className={`${isSubmittingRequirement ? 'bg-gray-400' : 'bg-[#22a2f2] hover:bg-[#1b8bd0]'} text-white px-6 py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}>
                      {isSubmittingRequirement ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          <span>Request for Quotation</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>

              {/* Info Box */}
            <div className="w-full max-w-3xl mt-6 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                  className="w-5 h-5 text-[#22a2f2] mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                  <p className="text-sm text-[#22a2f2] font-medium mb-1">
                      How it works
                    </p>
                    <p className="text-sm text-gray-600">
                      Submit your custom requirements and our verified manufacturers will review them. 
                      You&apos;ll receive personalized quotes within 24-48 hours. The more details you provide, 
                      the more accurate the quotes will be.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'my-orders' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-9 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Order timeline</span>
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">My Orders</h1>
                <p className="text-gray-500">Track and manage all your orders in one place</p>
              </div>

              {/* Sub-tabs Navigation */}
              <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-1">
                  <button
                    onClick={() => setMyOrdersSubTab('requirements')}
                    className={`px-6 py-3 font-medium text-sm transition-all relative ${
                      myOrdersSubTab === 'requirements'
                        ? 'text-[#22a2f2]'
                        : 'text-gray-500 hover:text-[#22a2f2]'
                    }`}
                  >
                    Requirements
                    {myOrdersSubTab === 'requirements' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22a2f2]"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setMyOrdersSubTab('orders')}
                    className={`px-6 py-3 font-medium text-sm transition-all relative ${
                      myOrdersSubTab === 'orders'
                        ? 'text-[#22a2f2]'
                        : 'text-gray-500 hover:text-[#22a2f2]'
                    }`}
                  >
                    Orders
                    {myOrdersSubTab === 'orders' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22a2f2]"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Requirements Sub-tab Content */}
              {myOrdersSubTab === 'requirements' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Requirements Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#22a2f2] font-semibold mb-1">Total Requirements</p>
                        <p className="text-3xl font-bold text-black">{isLoadingStats ? '...' : requirementStats.total}</p>
                      </div>
                      <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accepted Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Accepted</p>
                        <p className="text-3xl font-bold text-[#22a2f2]">{isLoadingStats ? '...' : requirementStats.accepted}</p>
                      </div>
                      <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Pending</p>
                        <p className="text-3xl font-bold text-[#22a2f2]">{isLoadingStats ? '...' : requirementStats.pending_review}</p>
                      </div>
                      <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Negotiating Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Negotiating</p>
                        <p className="text-3xl font-bold text-[#22a2f2]">{isLoadingStats ? '...' : requirementStats.in_negotiation}</p>
                      </div>
                      <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                        <svg
                          className="w-8 h-8"
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400 group-focus-within:text-[#22a2f2] transition-colors"
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
                      placeholder="Search orders by product, brand, or order ID..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOrderFilterDropdownOpen(!isOrderFilterDropdownOpen)}
                      onBlur={() => setTimeout(() => setIsOrderFilterDropdownOpen(false), 200)}
                      className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                    >
                      <span className={orderFilter !== 'all' ? 'text-black' : 'text-gray-500'}>
                        {orderFilter === 'all' 
                          ? 'All Orders' 
                          : orderFilter === 'accepted' 
                          ? 'Accepted' 
                          : orderFilter === 'pending'
                          ? 'Pending'
                          : orderFilter === 'negotiation'
                          ? 'Negotiating'
                          : 'All Orders'}
                      </span>
                      <svg 
                        className={`h-5 w-5 text-gray-400 transition-transform ${isOrderFilterDropdownOpen ? 'transform rotate-180' : ''}`}
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
                    
                    {isOrderFilterDropdownOpen && (
                      <div className="absolute z-50 w-full md:w-48 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="max-h-[180px] overflow-y-auto">
                          {[
                            { value: 'all', label: 'All Orders' },
                            { value: 'accepted', label: 'Accepted' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'negotiation', label: 'Negotiating' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setOrderFilter(option.value);
                                setIsOrderFilterDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                orderFilter === option.value ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
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

              {/* Requirements List */}
              {isLoadingRequirements ? (
                <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22a2f2] mb-4"></div>
                    <p className="text-gray-500">Loading requirements...</p>
                  </div>
                </div>
              ) : (() => {
                // Filter requirements based on search query and filter
                const filteredRequirements = requirements.filter((req: any) => {
                  // Search filter
                  const searchLower = orderSearchQuery.toLowerCase();
                  const matchesSearch = !orderSearchQuery || 
                    req.requirement_text?.toLowerCase().includes(searchLower) ||
                    req.brand_name?.toLowerCase().includes(searchLower) ||
                    req.product_type?.toLowerCase().includes(searchLower) ||
                    req.id?.toLowerCase().includes(searchLower);
                  
                  if (!matchesSearch) return false;
                  
                  // Status filter
                  if (orderFilter === 'all') return true;
                  
                  const status = getRequirementStatus(req);
                  return status === orderFilter;
                });
                
                return filteredRequirements.length > 0 ? (
                  <div className="bg-white rounded-xl border border-[#22a2f2]/30 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                      <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <div className="col-span-4">Requirement</div>
                        <div className="col-span-2">Brand</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-1">Quantity</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Delivery</div>
                      </div>
                    </div>
                    
                    {/* Table Body */}
                    <div className="divide-y divide-gray-200">
                      {filteredRequirements.map((req: any) => {
                        const status = getRequirementStatus(req);
                        const statusColors = {
                          accepted: 'bg-green-100 text-green-700',
                          pending: 'bg-yellow-100 text-yellow-700',
                          negotiation: 'bg-orange-100 text-orange-700'
                        };
                      const statusLabels = {
                        accepted: 'Accepted',
                        pending: 'Pending',
                        negotiation: 'Negotiating'
                      };
                        
                        // Get best quote
                        const acceptedResponse = req.responses?.find((r: any) => r.status === 'accepted');
                        const negotiatingResponse = req.responses?.find((r: any) => r.status === 'negotiating');
                        const bestResponse = acceptedResponse || negotiatingResponse || req.responses?.[0];
                        
                        return (
                          <div key={req.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Requirement */}
                              <div className="col-span-4">
                                <p className="text-sm font-medium text-black line-clamp-2">
                                  {req.requirement_text || 'Requirement'}
                                </p>
                                {req.image_url && (
                                  <img 
                                    src={req.image_url} 
                                    alt="Requirement" 
                                    className="w-12 h-12 object-cover rounded mt-2 border border-gray-200"
                                  />
                                )}
                              </div>
                              
                              {/* Brand */}
                              <div className="col-span-2">
                                <p className="text-sm text-gray-600">
                                  {req.brand_name || '—'}
                                </p>
                              </div>
                              
                              {/* Type */}
                              <div className="col-span-2">
                                <p className="text-sm text-gray-600">
                                  {req.product_type || '—'}
                                </p>
                              </div>
                              
                              {/* Quantity */}
                              <div className="col-span-1">
                                <p className="text-sm text-gray-600">
                                  {req.quantity || '—'}
                                </p>
                              </div>
                              
                              {/* Status */}
                              <div className="col-span-2">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
                                  {statusLabels[status]}
                                </span>
                              </div>
                              
                              {/* Delivery */}
                              <div className="col-span-1">
                                {bestResponse?.delivery_time ? (
                                  <p className="text-sm text-gray-600">
                                    {bestResponse.delivery_time}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400">—</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-[#22a2f2]/30 rounded-full blur-xl opacity-40"></div>
                        <div className="relative bg-[#22a2f2]/10 rounded-full p-6 border border-[#22a2f2]/30">
                          <svg
                            className="w-16 h-16 text-[#22a2f2]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-black mb-2">
                        {orderSearchQuery || orderFilter !== 'all' ? 'No requirements found' : 'No requirements yet'}
                      </h3>
                      <p className="text-gray-400 max-w-md">
                        {orderSearchQuery || orderFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : 'Your requirements will appear here once you submit them'}
                      </p>
                    </div>
                  </div>
                );
              })()}
                </>
              )}

              {/* Orders Sub-tab Content */}
              {myOrdersSubTab === 'orders' && (
                <>
                  {/* Search and Filter Bar for Orders */}
                  <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Search Input */}
                      <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400 group-focus-within:text-[#22a2f2] transition-colors"
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
                          placeholder="Search orders by product name or order ID..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                        />
                      </div>

                      {/* Filter Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsOrderFilterDropdownOpen(!isOrderFilterDropdownOpen)}
                          onBlur={() => setTimeout(() => setIsOrderFilterDropdownOpen(false), 200)}
                          className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                        >
                          <span className={orderFilter !== 'all' ? 'text-black' : 'text-gray-500'}>
                            {orderFilter === 'all' 
                              ? 'All Status' 
                              : orderFilter === 'pending' 
                              ? 'Pending' 
                              : orderFilter === 'confirmed'
                              ? 'Confirmed'
                              : orderFilter === 'shipped'
                              ? 'Shipped'
                              : orderFilter === 'delivered'
                              ? 'Delivered'
                              : orderFilter === 'cancelled'
                              ? 'Cancelled'
                              : 'All Status'}
                          </span>
                          <svg 
                            className={`h-5 w-5 text-gray-400 transition-transform ${isOrderFilterDropdownOpen ? 'transform rotate-180' : ''}`}
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
                        
                        {isOrderFilterDropdownOpen && (
                          <div className="absolute z-50 w-full md:w-48 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            <div className="max-h-[180px] overflow-y-auto">
                              {[
                                { value: 'all', label: 'All Status' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'shipped', label: 'Shipped' },
                                { value: 'delivered', label: 'Delivered' },
                                { value: 'cancelled', label: 'Cancelled' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setOrderFilter(option.value);
                                    setIsOrderFilterDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                    orderFilter === option.value ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
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

                  {/* Orders List */}
                  {isLoadingBuyerOrders ? (
                    <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22a2f2] mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                      </div>
                    </div>
                  ) : (() => {
                    // Filter orders based on search query
                    const filteredOrders = buyerOrders.filter((order: any) => {
                      const searchLower = orderSearchQuery.toLowerCase();
                      return !orderSearchQuery || 
                        order.design?.product_name?.toLowerCase().includes(searchLower) ||
                        order.id?.toLowerCase().includes(searchLower) ||
                        order.manufacturer?.unit_name?.toLowerCase().includes(searchLower);
                    });

                    return filteredOrders.length > 0 ? (
                      <div className="space-y-4">
                        {filteredOrders.map((order: any) => (
                          <div
                            key={order.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                          >
                            <div className="p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                {/* Order Info */}
                                <div className="flex-1">
                                  <div className="flex items-start gap-4">
                                    {/* Product Image */}
                                    {order.design?.image_url && (
                                      <img
                                        src={order.design.image_url}
                                        alt={order.design.product_name || 'Product'}
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {order.design?.product_name || 'Product'}
                                      </h3>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Manufacturer: {order.manufacturer?.unit_name || 'Unknown'}
                                      </p>
                                      <div className="flex flex-wrap gap-4 text-sm">
                                        <span className="text-gray-600">
                                          Quantity: <span className="font-medium text-gray-900">{order.quantity}</span>
                                        </span>
                                        <span className="text-gray-600">
                                          Price/Unit: <span className="font-medium text-gray-900">₹{order.price_per_unit}</span>
                                        </span>
                                        <span className="text-gray-600">
                                          Total: <span className="font-medium text-gray-900">₹{order.total_price}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Status and Date */}
                                <div className="flex flex-col items-end gap-3">
                                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
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
                                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                              </svg>
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {orderSearchQuery || orderFilter !== 'all' ? 'No orders found' : 'No orders yet'}
                          </h3>
                          <p className="text-gray-500">
                            {orderSearchQuery || orderFilter !== 'all' 
                              ? 'Try adjusting your search or filter criteria'
                              : 'Orders from designs will appear here once you create them.'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
          {activeTab === 'chats' && (
            <div className="h-full flex flex-col">
              {/* Chat Layout */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
                {/* Conversations Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 h-[300px] lg:h-[calc(100vh-280px)] min-h-[400px] bg-white border border-[#22a2f2]/30 rounded-xl shadow-sm">
                  <ChatList 
                    selectedConversationId={activeConversationId}
                    onUnreadCountChange={setTotalUnreadChats}
                    selfRole="buyer"
                    clearUnreadSignal={chatUnreadClearSignal}
                    onOpenConversation={(cid, bid, mid, title) => {
                      setActiveConversationId(cid);
                      setActiveBuyerId(bid);
                      setActiveManufacturerId(mid);
                      setActiveTitle(title);
                      setActiveRequirement(null); // Clear requirement - show all messages with all tabs
                      setChatUnreadClearSignal({ conversationId: cid, at: Date.now() });
                    }} 
                  />
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-8 xl:col-span-9 h-[500px] lg:h-[calc(100vh-280px)] min-h-[400px]">
                  {activeConversationId && activeBuyerId && activeManufacturerId ? (
                    <ChatWindow
                      conversationId={activeConversationId}
                      buyerId={activeBuyerId}
                      manufacturerId={activeManufacturerId}
                      title={activeTitle}
                      inline
                      selfRole={'buyer'}
                      onConversationRead={(cid) => setChatUnreadClearSignal({ conversationId: cid, at: Date.now() })}
                      requirement={activeRequirement}
                      onClose={() => {
                        setActiveConversationId(null);
                        setActiveBuyerId(null);
                        setActiveManufacturerId(null);
                        setActiveTitle(undefined);
                        setActiveRequirement(null);
                        // Clear localStorage when closing chat
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('buyer_chat_state');
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full bg-white rounded-xl border border-[#22a2f2]/30 flex items-center justify-center p-6 shadow-sm">
                      <div className="text-center max-w-sm">
                        <div className="relative mx-auto mb-6 w-20 h-20">
                          <div className="absolute inset-0 bg-[#22a2f2]/25 rounded-full blur-xl opacity-60"></div>
                          <div className="relative bg-[#22a2f2]/10 rounded-full flex items-center justify-center w-full h-full border border-[#22a2f2]/30">
                            <svg className="w-10 h-10 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-black mb-2">Select a conversation</h3>
                        <p className="text-sm text-gray-500">Choose a manufacturer from the list to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'requirements' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 0a2 2 0 012-2h2a2 2 0 012 2m-4 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Requirement tracker</span>
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">My Requirements</h1>
                <p className="text-gray-500">Track all your submitted requirements</p>
              </div>

              {/* Loading State */}
              {isLoadingRequirements && (
                <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Loading requirements...</p>
                  </div>
                </div>
              )}

              {/* Requirements List */}
              {!isLoadingRequirements && requirements.length > 0 && (
                <div className="space-y-4">
                  {requirements.map((req: any) => (
                    <div key={req.id} className="bg-white rounded-xl border border-[#22a2f2]/30 p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-gray-500">
                              {new Date(req.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            {/* Pending Badge - Show when there are no responses */}
                            {(!req.responses || req.responses.length === 0 || req.manufacturer_count === 0) && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 mb-3 leading-relaxed">{req.requirement_text}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                        {req.quantity && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Quantity</p>
                            <p className="text-sm font-semibold text-black">{req.quantity.toLocaleString()}</p>
                          </div>
                        )}
                        {req.brand_name && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Brand</p>
                            <p className="text-sm font-semibold text-black">{req.brand_name}</p>
                          </div>
                        )}
                        {req.product_type && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Product Type</p>
                            <p className="text-sm font-semibold text-black capitalize">{req.product_type}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Responses</p>
                          <p className="text-sm font-semibold text-[#22a2f2]">{req.manufacturer_count || 0} manufacturer{req.manufacturer_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {req.product_link && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <a 
                            href={req.product_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-[#22a2f2] hover:underline flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            View Reference Product
                          </a>
                        </div>
                      )}

                      <div className="mt-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <p className="text-sm font-semibold text-black">Manufacturer Responses</p>
                          <p className="text-xs text-gray-500">
                            {req.responses && req.responses.length > 0
                              ? `${req.responses.length} response${req.responses.length === 1 ? '' : 's'} received`
                              : 'Awaiting responses'}
                          </p>
                        </div>

                        {req.responses && req.responses.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            {req.responses.map((response: any) => (
                              <div
                                key={response.id}
                                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-semibold text-black">
                                        {response.manufacturer?.unit_name || 'Manufacturer'}
                                      </p>
                                      {response.status && response.status !== 'submitted' && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                          response.status === 'accepted' 
                                            ? 'bg-green-100 text-green-700' 
                                            : response.status === 'rejected'
                                            ? 'bg-red-100 text-red-700'
                                            : response.status === 'negotiating'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                                        </span>
                                      )}
                                    </div>
                                    {(response.manufacturer?.location || response.manufacturer?.business_type) && (
                                      <p className="text-xs text-gray-500">
                                        {[response.manufacturer?.location, response.manufacturer?.business_type]
                                          .filter(Boolean)
                                          .join(' | ')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-sm text-right">
                                    <p className="font-semibold text-[#22a2f2]">
                                      {formatCurrency(response.quoted_price)}
                                    </p>
                                    <p className="text-xs text-gray-500">Total quote</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price / unit</p>
                                    <p className="text-sm font-medium text-black">
                                      {formatCurrency(response.price_per_unit)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery time</p>
                                    <p className="text-sm font-medium text-black">
                                      {response.delivery_time || '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                                    <p className="text-sm font-medium text-black">
                                      {response.created_at
                                        ? new Date(response.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })
                                        : '—'}
                                    </p>
                                  </div>
                                </div>

                                {response.notes && (
                                  <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{response.notes}</p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                {(!response.status || response.status === 'submitted' || response.status === 'negotiating') && (
                                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                    {/* Negotiate Button - only show when status is null, 'submitted', or empty */}
                                    {(!response.status || response.status === 'submitted') && (
                                      <button
                                        onClick={() => handleNegotiateResponse(req, response)}
                                        disabled={negotiatingResponseId === response.id}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all ${
                                          negotiatingResponseId === response.id
                                            ? 'bg-[#22a2f2]/60 text-white cursor-not-allowed'
                                            : 'bg-[#22a2f2] hover:bg-[#1b8bd0] text-white'
                                        }`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v7a2 2 0 01-2 2h-6l-4 4v-4H7a2 2 0 01-2-2v-5a2 2 0 012-2h2" />
                                        </svg>
                                        {negotiatingResponseId === response.id ? 'Opening Chat...' : 'Negotiate'}
                                      </button>
                                    )}
                                    {/* Accept and Reject buttons - show when status is null, 'submitted', or 'negotiating' */}
                                    <button
                                      onClick={() => handleUpdateResponseStatus(response.id, 'accepted', response.manufacturer?.unit_name || 'this manufacturer')}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Accept Quote
                                    </button>
                                    <button
                                      onClick={() => handleUpdateResponseStatus(response.id, 'rejected', response.manufacturer?.unit_name || 'this manufacturer')}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Reject Quote
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500 bg-gray-50">
                            No manufacturer responses yet. We'll notify you once someone responds.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoadingRequirements && requirements.length === 0 && (
                <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    {/* Package Icon */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-[#22a2f2]/30 rounded-full blur-xl opacity-40"></div>
                      <div className="relative bg-[#22a2f2]/10 rounded-full p-6 border border-[#22a2f2]/30">
                        <svg
                          className="w-16 h-16 text-[#22a2f2]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-black mb-2">No Requirements Yet</h3>
                    <p className="text-gray-400 max-w-md">
                      Submit your first requirement to get started and connect with manufacturers
                    </p>
                    
                    {/* CTA Button */}
                    <button
                      onClick={() => setActiveTab('custom-quote')}
                      className="mt-6 relative group overflow-hidden rounded-xl"
                    >
                      <div className="absolute inset-0 bg-[#22a2f2] transition-transform group-hover:scale-105 rounded-xl"></div>
                      <div className="relative px-6 py-3 font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Submit Requirement</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-white p-12 flex-col justify-between relative">
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-16">
              <div className="relative bg-white rounded-2xl p-3 shadow-sm">
                  <Image
                    src="/groupo-logo.png"
                    alt="Groupo Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Grupo
                </h1>
                <p className="text-sm text-gray-600">AI Manufacturing Platform</p>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-black leading-tight mb-4">
                  Manufacture<br />
                  <span className="text-black">
                    Anything, Anywhere
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                  Connect with 1000+ verified manufacturers worldwide. Get instant quotes, 
                  AI-powered matching, and real-time order tracking.
                </p>
              </div>

              {/* Feature cards */}
              <div className="space-y-4">
                {[
                  { icon: "⚡", title: "Instant Quotes", desc: "AI-powered matching in seconds" },
                  { icon: "🌍", title: "Global Network", desc: "10+ countries, 100+ manufacturers, 1000+ brands" },
                  { icon: "🔒", title: "Secure & Verified", desc: "All manufacturers QC certified" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
                  >
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-black">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="relative bg-white rounded-2xl p-2.5 shadow-sm">
                  <Image
                    src="/groupo-logo.png"
                    alt="Groupo Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Grupo
                </h1>
                <p className="text-xs text-gray-600">AI Manufacturing Platform</p>
              </div>
            </div>

            {/* Login Card */}
                  <div className="relative">
              <div className="relative bg-white rounded-3xl p-8 border-2 border-[#22a2f2] shadow-xl">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative bg-[#22a2f2] rounded-2xl p-4">
                      <svg
                        className="w-8 h-8 text-white"
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
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-black mb-2">
                    Welcome to Buyer Portal
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {step === 'phone' ? 'Enter your phone number to continue' : 'Verify your identity'}
                  </p>
                </div>

                {(isCheckingAuth || isLoggingOut) ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <svg className="animate-spin h-8 w-8 text-[#22a2f2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                ) : step === 'phone' ? (
                  <>
                    {/* Phone Form */}
                    <form onSubmit={handleSendOTP} className="space-y-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                          Phone Number
                        </label>
                        <div className="relative flex flex-col sm:flex-row gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full sm:w-32 px-3 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:border-[#22a2f2] transition-all outline-none text-black font-medium"
                          >
                            <option value="+91">🇮🇳 +91</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+971">🇦🇪 +971</option>
                          </select>
                          <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="1234567890"
                            className="flex-1 w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:border-[#22a2f2] transition-all outline-none text-black placeholder:text-gray-400"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingOtp}
                        className="w-full bg-[#22a2f2] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                          {isLoadingOtp ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span>Send OTP</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    {/* OTP Form */}
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-black mb-2">
                          Verification Code
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 6) {
                                setOtp(value);
                                setOtpErrorMessage(''); // Clear error on input
                              }
                            }}
                            placeholder="000000"
                            maxLength={6}
                            className="relative w-full px-4 py-4 bg-white border-2 border-[#22a2f2] rounded-xl focus:border-[#22a2f2] transition-all outline-none text-center text-2xl tracking-[0.5em] text-black placeholder:text-gray-400 font-mono"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Enter the 6-digit code sent to your phone
                        </p>
                        
                        {/* Timer Display */}
                        {otpTimer > 0 && (
                          <div className="text-center mt-3">
                            <p className="text-base text-gray-600">
                              Resend OTP in{' '}
                              <span className="font-bold text-[#22a2f2] text-lg">
                                {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Success Message */}
                        {otpSuccessMessage && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 text-center">{otpSuccessMessage}</p>
                          </div>
                        )}

                        {/* Error Message */}
                        {otpErrorMessage && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 text-center">{otpErrorMessage}</p>
                          </div>
                        )}

                        {/* Resend Button */}
                        {otpTimer === 0 && step === 'otp' && (
                          <div className="mt-4 text-center">
                            <button
                              type="button"
                              onClick={handleResendOTP}
                              disabled={isResendingOtp}
                              className="text-sm font-semibold text-[#22a2f2] hover:text-[#1b8bd0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                            >
                              {isResendingOtp ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Resending...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Resend OTP</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="w-full bg-[#22a2f2] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        aria-busy={isVerifyingOtp}
                      >
                          {isVerifyingOtp ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Verify OTP</span>
                            </>
                          )}
                      </button>

                      <button
                        type="button"
                        onClick={handleChangePhoneNumber}
                        className="w-full text-gray-600 hover:text-black font-medium py-2 text-sm transition-colors"
                      >
                        ← Change Phone Number
                      </button>
                    </form>
                  </>
                )}

                <div className="mt-6 text-center">
                  <Link
                    href="/manufacturer-portal"
                    className="text-sm font-semibold text-[#22a2f2] hover:text-[#1b8bd0] transition-colors"
                  >
                    Sign in with Manufacturer
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Trusted by 1000+ brands in 50+ countries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

