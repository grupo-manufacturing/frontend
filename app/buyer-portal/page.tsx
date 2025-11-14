'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AIChatbot from '../components/AIChatbot';
import apiService from '../lib/apiService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

type TabType = 'designs' | 'custom-quote' | 'my-orders' | 'chats' | 'requirements' | 'cart';

type Manufacturer = {
  id: string | number;
  unit_name?: string;
  verification_status?: string;
  msme_number?: string;
  product_types?: string[];
  daily_capacity?: number;
  is_verified?: boolean;
  location?: string;
  business_type?: string;
};

export default function BuyerPortal() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'dashboard'>('phone');
  // On initial load, if a token exists, persist dashboard state across refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasToken = apiService.isAuthenticated();
      if (hasToken) {
        setStep('dashboard');
      }
    }
  }, []);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('designs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Instant Quote Form States
  const [brandName, setBrandName] = useState('');
  const [productType, setProductType] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  
  // Custom Quote Form States
  const [requirement, setRequirement] = useState('');
  const [customQuantity, setCustomQuantity] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [customProductType, setCustomProductType] = useState('');
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
  
  // Chats States
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isManufacturerTyping, setIsManufacturerTyping] = useState(false);
  // Chat inbox state
  const [showChatInbox, setShowChatInbox] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeManufacturerId, setActiveManufacturerId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>(undefined);
  const [totalUnreadChats, setTotalUnreadChats] = useState<number>(0);
  const [chatUnreadClearSignal, setChatUnreadClearSignal] = useState<{ conversationId: string; at: number } | null>(null);

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullPhoneNumber = countryCode + phoneNumber;
    
    // Demo credentials bypass
    if (phoneNumber === '1234567890') {
      console.log('Demo credentials detected - bypassing OTP');
      setIsLoadingOtp(true);
      setTimeout(() => {
        setIsLoadingOtp(false);
        setStep('otp');
      }, 1000);
      return;
    }
    
    setIsLoadingOtp(true);
    try {
    console.log('Sending OTP to:', fullPhoneNumber);
      const response = await apiService.sendOTP(fullPhoneNumber, 'buyer');
      console.log('OTP sent successfully:', response);
    setStep('otp');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setIsLoadingOtp(false);
    }
  };

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
        apiService.setToken(mockResponse.data.token);
        localStorage.setItem('buyerPhoneNumber', phoneNumber);
        localStorage.setItem('user_role', 'buyer');
        
        // Go directly to dashboard
        setStep('dashboard');
        return;
      }
      
      const fullPhoneNumber = countryCode + phoneNumber;
      console.log('Verifying OTP:', otp);
      const response = await apiService.verifyOTP(fullPhoneNumber, otp, 'buyer');
      console.log('OTP verified successfully:', response);
      
      // Store token and user data
      apiService.setToken(response.data.token);
      localStorage.setItem('buyerPhoneNumber', phoneNumber);
      localStorage.setItem('user_role', 'buyer');
      
      // Go directly to dashboard
      setStep('dashboard');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = async () => {
    // Clear localStorage and reset to phone step
    apiService.logout('/buyer-portal');
    localStorage.removeItem('buyerPhoneNumber');
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
  };

  const handleChangePhoneNumber = () => {
    setStep('phone');
    setOtp('');
  };

  const handleGenerateQuotes = async () => {
    // Validate required fields
    if (!brandName || !productType || !quantity) {
      alert('Please fill in Brand Name, Product Type, and Quantity');
      return;
    }

    setIsLoadingQuotes(true);
    
    try {
      // Fetch real manufacturers from backend
      const response = await apiService.getAllManufacturers({
        limit: 3
      });

      if (response.success && response.data.manufacturers && response.data.manufacturers.length > 0) {
        const manufacturerList: Manufacturer[] = response.data.manufacturers as Manufacturer[];
        
        // Map real manufacturers to quote format with mock pricing
        const mappedQuotes = manufacturerList.map((manufacturer: Manufacturer, index: number) => {
          // Calculate mock pricing based on manufacturer data
          const dailyCapacity = manufacturer.daily_capacity || 1000;
          const basePrice = Math.max(10, 30 - (dailyCapacity / 500)); // Higher capacity = lower price
          const adjustedPrice = basePrice * (1 + (index * 0.15)); // Slight price variation
          const totalPrice = parseFloat(adjustedPrice.toFixed(2)) * parseInt(quantity);
          const pricePerUnit = parseFloat(adjustedPrice.toFixed(2));
          
          // Generate mock features based on manufacturer data
          const features = [];
          if (manufacturer.is_verified) features.push('Verified Manufacturer');
          if (manufacturer.verification_status === 'approved') features.push('Approved by Grupo');
          if (manufacturer.msme_number) features.push('MSME Certified');
          if (manufacturer.product_types && manufacturer.product_types.length > 0) {
            features.push(`Specializes in ${manufacturer.product_types[0]}`);
          }
          if ((manufacturer.daily_capacity ?? 0) > 500) {
            features.push('Large Volume Capacity');
          }
          if (features.length < 3) {
            features.push('Quality Assured', 'On-Time Delivery', 'Competitive Pricing');
          }
          
          // Generate delivery estimate based on capacity
          let deliveryDays = '25-30';
          if (dailyCapacity > 2000) deliveryDays = '20-25';
          else if (dailyCapacity < 500) deliveryDays = '30-35';

          return {
            id: manufacturer.id,
            manufacturer: manufacturer.unit_name || `Manufacturer ${index + 1}`,
            badge: manufacturer.verification_status === 'approved' ? 'Premium' : 'Standard',
            rating: parseFloat((4.2 + (index * 0.2)).toFixed(1)), // Mock ratings from 4.2 to 4.6, rounded to 1 decimal
            totalPrice: Math.round(totalPrice),
            pricePerUnit: pricePerUnit,
            delivery: `${deliveryDays} days`,
            features: features.slice(0, 5), // Limit to 5 features
            bestValue: index === 1, // Middle manufacturer as best value
            location: manufacturer.location || 'Location not specified',
            businessType: manufacturer.business_type || 'Manufacturing',
            capacity: manufacturer.daily_capacity || 0
          };
        });

        setQuotes(mappedQuotes);
      } else {
        // Fallback to mock data if no manufacturers found
        console.warn('No manufacturers found, using mock data');
        const mockQuotes = [
          {
            id: 1,
            manufacturer: 'Premium Manufacturer',
            badge: 'Premium',
            rating: 4.8,
            totalPrice: 5760,
            pricePerUnit: 19.2,
            delivery: '20-25 days',
            features: [
              'GOTS Certified Materials',
              'Premium Quality Control',
              'Custom Packaging Available',
              'Free Sample Before Order',
              'Eco-Friendly Production'
            ],
            bestValue: true
          },
          {
            id: 2,
            manufacturer: 'Standard Manufacturer',
            badge: 'Standard',
            rating: 4.5,
            totalPrice: 4800,
            pricePerUnit: 16,
            delivery: '25-30 days',
            features: [
              'Quality Certified Materials',
              'Standard Quality Control',
              'Bulk Order Discounts',
              'Fast Turnaround',
              'Reliable Shipping'
            ],
            bestValue: false
          },
          {
            id: 3,
            manufacturer: 'Budget Manufacturer',
            badge: 'Standard',
            rating: 4.2,
            totalPrice: 4080,
            pricePerUnit: 13.6,
            delivery: '30-35 days',
            features: [
              'Cost-Effective Solution',
              'Basic Quality Control',
              'Flexible Payment Terms',
              'Large Volume Capacity',
              'Competitive Pricing'
            ],
            bestValue: false
          }
        ];
        setQuotes(mockQuotes);
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error);
      alert('Failed to load manufacturers. Please try again.');
      setQuotes([]);
    } finally {
      setIsLoadingQuotes(false);
    }
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
      const buyerId = await getBuyerId();

      if (!buyerId) {
        setActiveTab('chats');
        alert('We could not load your buyer profile. Please refresh and try again.');
        return;
      }

      setActiveTab('chats');
      setShowChatInbox(false);

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

  // removed legacy mock handleOpenChat

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedManufacturer) return;
    
    const message = {
      id: messages.length + 1,
      sender: 'buyer',
      text: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Update conversation's last message
    setConversations(prev => prev.map(conv => 
      conv.manufacturerId === selectedManufacturer.id 
        ? { ...conv, lastMessage: newMessage, timestamp: new Date().toISOString() }
        : conv
    ));
    
    // Simulate manufacturer response after 2 seconds
    setIsManufacturerTyping(true);
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        sender: 'manufacturer',
        text: 'Thank you for your message. We will get back to you shortly with more details.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, response]);
      setIsManufacturerTyping(false);
    }, 2000);
  };

  // Mock attachment handlers
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: any) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !selectedManufacturer) return;

    const objectUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');

    const attachmentMessage: any = {
      id: messages.length + 1,
      sender: 'buyer',
      timestamp: new Date().toISOString(),
      attachment: {
        type: isImage ? 'image' : 'file',
        url: objectUrl,
        name: file.name,
        size: file.size,
        mime: file.type
      }
    };

    setMessages(prev => [...prev, attachmentMessage]);
    setConversations(prev => prev.map(conv => 
      conv.manufacturerId === selectedManufacturer.id 
        ? { 
            ...conv, 
            lastMessage: isImage ? '📷 Image' : `📎 ${file.name}`, 
            timestamp: new Date().toISOString() 
          }
        : conv
    ));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

              {/* Cart Tab */}
              <button
                onClick={() => setActiveTab('cart')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === 'cart'
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {activeTab === 'cart' && (
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Cart</span>
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
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="appearance-none w-full md:w-64 px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all"
                      >
                        <option value="all" className="bg-white">All Categories</option>
                        <option value="t-shirts" className="bg-white">T-Shirts</option>
                        <option value="shirts" className="bg-white">Shirts</option>
                        <option value="hoodies" className="bg-white">Hoodies</option>
                        <option value="sweatshirts" className="bg-white">Sweatshirts</option>
                        <option value="cargos" className="bg-white">Cargos</option>
                        <option value="trackpants" className="bg-white">Trackpants</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty State */}
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
                      <select
                        value={customProductType}
                        onChange={(e) => setCustomProductType(e.target.value)}
                      className="appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all"
                      >
                        <option value="" className="bg-white">Select product type</option>
                        <option value="t-shirt" className="bg-white">T-Shirt</option>
                        <option value="shirt" className="bg-white">Shirt</option>
                        <option value="jacket" className="bg-white">Jacket</option>
                        <option value="hoodie" className="bg-white">Hoodie</option>
                        <option value="sweater" className="bg-white">Sweater</option>
                        <option value="trouser" className="bg-white">Trouser</option>
                        <option value="shorts" className="bg-white">Shorts</option>
                        <option value="dress" className="bg-white">Dress</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Orders Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#22a2f2] font-semibold mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-black">56</p>
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
                        <p className="text-3xl font-bold text-[#22a2f2]">0</p>
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

                {/* Pending Review Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Pending Review</p>
                        <p className="text-3xl font-bold text-[#22a2f2]">0</p>
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

                {/* In Negotiation Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1b8bd0] font-semibold mb-1">In Negotiation</p>
                        <p className="text-3xl font-bold text-[#22a2f2]">0</p>
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
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all"
                    >
                      <option value="all" className="bg-white">All Orders</option>
                      <option value="accepted" className="bg-white">Accepted</option>
                      <option value="pending" className="bg-white">Pending Review</option>
                      <option value="negotiation" className="bg-white">In Negotiation</option>
                      <option value="completed" className="bg-white">Completed</option>
                      <option value="cancelled" className="bg-white">Cancelled</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders List / Empty State */}
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
                  
                  <h3 className="text-xl font-semibold text-black mb-2">No orders found</h3>
                  <p className="text-gray-400 max-w-md">
                    Your orders will appear here once manufacturers respond to your requirements
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'chats' && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79V12a9 9 0 10-18 0v.79A2 2 0 003.22 14l1.05.7a2 2 0 01.73.76l.38.76a2 2 0 001.79 1.11h9.66a2 2 0 001.79-1.11l.38-.76a2 2 0 01.73-.76l1.05-.7A2 2 0 0021 12.79z" />
                      </svg>
                      <span>Conversations</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">Messages</h1>
                    <p className="text-sm text-gray-500">View and manage your conversations with manufacturers</p>
                  </div>
                </div>
              </div>

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
                      onClose={() => {
                        setActiveConversationId(null);
                        setActiveBuyerId(null);
                        setActiveManufacturerId(null);
                        setActiveTitle(undefined);
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
                        <button
                          onClick={() => setShowChatInbox(true)}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#22a2f2] hover:bg-[#1b8bd0] text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v7a2 2 0 01-2 2h-6l-4 4v-4H7a2 2 0 01-2-2v-1" />
                          </svg>
                          Open Inbox
                        </button>
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
                                          response.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                                {(!response.status || response.status === 'submitted') && (
                                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
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
          {activeTab === 'cart' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Saved selections</span>
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">Shopping Cart</h1>
                <p className="text-gray-500">Review your selected designs before checkout</p>
              </div>

              {/* Empty State */}
              <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Shopping Bag Icon */}
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
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-black mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 max-w-md">
                    Browse our design marketplace to discover and add products to your cart
                  </p>
                  
                  {/* CTA Button */}
                  <button
                    onClick={() => setActiveTab('designs')}
                    className="mt-6 relative group overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-[#22a2f2] transition-transform group-hover:scale-105 rounded-xl"></div>
                    <div className="relative px-6 py-3 font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Browse Designs</span>
                    </div>
                  </button>
                </div>
              </div>
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

                {step === 'phone' ? (
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

