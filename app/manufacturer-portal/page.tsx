'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import apiService from '../lib/apiService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

type TabType = 'chats' | 'requirements' | 'analytics' | 'my-designs' | 'profile';
type AnalyticsTabType = 'revenue-trends' | 'product-performance' | 'order-distribution';

export default function ManufacturerPortal() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
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
              const onboardingComplete = localStorage.getItem('manufacturerOnboardingComplete');
              setStep(onboardingComplete === 'true' ? 'dashboard' : 'onboarding');
              
              // Restore chat state from localStorage
              const storedChatState = localStorage.getItem('manufacturer_chat_state');
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
                  }
                } catch (e) {
                  console.error('Failed to restore chat state:', e);
                }
              }
            }
          } catch (error: any) {
            // If token expired or unauthorized, redirect to login
            if (error.message?.includes('expired') || error.message?.includes('session')) {
              setStep('phone');
              apiService.clearAllAuthData();
              // Clear chat state on logout
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
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // Timer in seconds
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTabType>('revenue-trends');
  // Chat state (chats inbox)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeManufacturerId, setActiveManufacturerId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>(undefined);
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
          activeTab: activeTab
        };
        localStorage.setItem('manufacturer_chat_state', JSON.stringify(chatState));
      } else {
        localStorage.removeItem('manufacturer_chat_state');
      }
    }
  }, [activeConversationId, activeBuyerId, activeManufacturerId, activeTitle, activeTab]);
  
  // Requirements states
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [responseForm, setResponseForm] = useState({
    pricePerUnit: '',
    deliveryTime: '',
    notes: ''
  });
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  
  // Designs states
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any | null>(null);
  const [designForm, setDesignForm] = useState({
    product_name: '',
    product_category: '',
    image_url: '',
    price_1_50: '',
    price_51_100: '',
    price_101_200: '',
    tags: [] as string[]
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmittingDesign, setIsSubmittingDesign] = useState(false);
  
  // Onboarding form states
  const [formData, setFormData] = useState({
    unitName: '',
    businessType: '',
    gstNumber: '',
    productTypes: [] as string[],
    capacity: '',
    location: '',
    panNumber: '',
    coiNumber: '',
    msmeFile: null as File | null,
    otherCertificates: null as File | null
  });

  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
      const response = await apiService.sendOTP(fullPhoneNumber, 'manufacturer');
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
      const response = await apiService.sendOTP(fullPhoneNumber, 'manufacturer');
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
              role: 'manufacturer'
            }
          }
        };
        
        // Check if onboarding is complete, if not show onboarding form
        const onboardingComplete = localStorage.getItem('manufacturerOnboardingComplete');
        if (onboardingComplete === 'true') {
          setStep('dashboard');
        } else {
          setStep('onboarding');
        }
        return;
      }
      
      const fullPhoneNumber = countryCode + phoneNumber;
      console.log('Verifying OTP:', otp);
      const response = await apiService.verifyOTP(fullPhoneNumber, otp, 'manufacturer');
      console.log('OTP verified successfully:', response);
      
      // Store token and user data
      apiService.setToken(response.data.token);
      localStorage.setItem('manufacturerPhoneNumber', phoneNumber);
      localStorage.setItem('user_role', 'manufacturer');
      
      // Check onboarding status from backend
      try {
        const profileResponse = await apiService.getManufacturerProfile();
        if (profileResponse.success && profileResponse.data.profile) {
          const profile = profileResponse.data.profile;
          if (profile.onboarding_completed) {
            localStorage.setItem('manufacturerOnboardingComplete', 'true');
            setStep('dashboard');
          } else {
            localStorage.removeItem('manufacturerOnboardingComplete');
            setStep('onboarding');
          }
        } else {
          // No profile found, show onboarding
          localStorage.removeItem('manufacturerOnboardingComplete');
          setStep('onboarding');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // On error, default to onboarding
        localStorage.removeItem('manufacturerOnboardingComplete');
        setStep('onboarding');
      }
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
    await apiService.logout('/manufacturer-portal');
  };

  const handleChangePhoneNumber = () => {
    setStep('phone');
    setOtp('');
  };

  // Load phone number from localStorage on component mount
  useEffect(() => {
    if (step === 'dashboard' && apiService.isAuthenticated()) {
      const storedPhone = localStorage.getItem('manufacturerPhoneNumber');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
      }
      
      // Check onboarding status from backend
      checkOnboardingStatus();
    }
  }, [step]);

  // Check onboarding status from backend
  const checkOnboardingStatus = async () => {
    try {
      const response = await apiService.getManufacturerProfile();
      if (response.success && response.data.profile) {
        const profile = response.data.profile;
        const resolvedName = (profile.contact_person_name || profile.unit_name || profile.business_name || '').trim();
        if (resolvedName) {
          setDisplayName(resolvedName);
        }
        if (profile.onboarding_completed) {
          setIsOnboardingComplete(true);
          localStorage.setItem('manufacturerOnboardingComplete', 'true');
        } else {
          setIsOnboardingComplete(false);
          localStorage.removeItem('manufacturerOnboardingComplete');
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductTypeChange = (productType: string) => {
    setFormData(prev => ({
      ...prev,
      productTypes: prev.productTypes.includes(productType)
        ? prev.productTypes.filter(type => type !== productType)
        : [...prev.productTypes, productType]
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission on the final step
    if (currentStep !== totalSteps) {
      // If not on final step, go to next step instead
      nextStep();
      return;
    }
    
    // Validate required fields for all steps
    if (!formData.unitName || !formData.businessType || !formData.gstNumber) {
      alert('Please complete all required fields in Business Info section.');
      setCurrentStep(1);
      return;
    }
    
    if (!formData.productTypes || formData.productTypes.length === 0) {
      alert('Please select at least one product type.');
      setCurrentStep(2);
      return;
    }
    
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      // Validation failed - stay on step 3, user needs to enter capacity
      // Don't show alert as it interrupts the flow
      return;
    }
    
    try {
      // Convert form data to backend format
      const onboardingData = {
        unit_name: formData.unitName,
        business_type: formData.businessType,
        gst_number: formData.gstNumber,
        product_types: formData.productTypes,
        capacity: parseInt(formData.capacity) || 0,
        location: formData.location,
        pan_number: formData.panNumber,
        coi_number: formData.coiNumber,
        // For now, skip file uploads until we implement proper file handling
        // msme_file: formData.msmeFile,
        // other_certificates: formData.otherCertificates
      };
      
      // Submit onboarding data to backend
      const response = await apiService.submitManufacturerOnboarding(onboardingData);
      
      if (response.success) {
        console.log('Onboarding submitted successfully:', response.data);
        
        // Mark onboarding as complete
        localStorage.setItem('manufacturerOnboardingComplete', 'true');
        setIsOnboardingComplete(true);
        
        // Proceed to dashboard
        setStep('dashboard');
        alert('Registration submitted successfully! Welcome to Grupo!');
      } else {
        throw new Error(response.message || 'Failed to submit onboarding');
      }
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
      alert('Failed to submit registration. Please try again.');
    }
  };

  // Fetch Requirements
  const fetchRequirements = async () => {
    setIsLoadingRequirements(true);
    
    try {
      const response = await apiService.getRequirements();
      
      if (response.success && response.data) {
        // Fetch manufacturer's own responses to check which requirements they've already responded to
        const myResponsesResult = await apiService.getMyRequirementResponses();
        const myResponses = myResponsesResult.success ? myResponsesResult.data : [];
        
        // Create a map of requirement IDs to response status
        const responseMap = new Map();
        myResponses.forEach((resp: any) => {
          responseMap.set(resp.requirement_id, resp);
        });
        
        // Add hasResponse flag to each requirement
        const enrichedRequirements = response.data.map((req: any) => ({
          ...req,
          hasResponse: responseMap.has(req.id),
          myResponse: responseMap.get(req.id)
        }));
        
        setRequirements(enrichedRequirements);
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

  // Fetch designs
  const fetchDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const response = await apiService.getDesigns();
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

  // Handle design image upload
  const handleDesignImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const response = await apiService.uploadDesignImage(file);
      if (response.success && response.data) {
        setDesignForm({ ...designForm, image_url: response.data.url });
        return response.data.url;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error: any) {
      console.error('Failed to upload design image:', error);
      alert(error.message || 'Failed to upload image');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle create/update design
  const handleSubmitDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDesign(true);
    try {
      const designData = {
        product_name: designForm.product_name,
        product_category: designForm.product_category,
        image_url: designForm.image_url,
        price_1_50: designForm.price_1_50 ? parseFloat(designForm.price_1_50) : undefined,
        price_51_100: designForm.price_51_100 ? parseFloat(designForm.price_51_100) : undefined,
        price_101_200: designForm.price_101_200 ? parseFloat(designForm.price_101_200) : undefined,
        tags: designForm.tags
      };

      if (editingDesign) {
        await apiService.updateDesign(editingDesign.id, designData);
      } else {
        await apiService.createDesign(designData);
      }

      // Reset form and close modal
      setDesignForm({
        product_name: '',
        product_category: '',
        image_url: '',
        price_1_50: '',
        price_51_100: '',
        price_101_200: '',
        tags: []
      });
      setEditingDesign(null);
      setShowDesignModal(false);
      
      // Refresh designs
      await fetchDesigns();
    } catch (error: any) {
      console.error('Failed to save design:', error);
      alert(error.message || 'Failed to save design');
    } finally {
      setIsSubmittingDesign(false);
    }
  };

  // Handle edit design
  const handleEditDesign = (design: any) => {
    setEditingDesign(design);
    setDesignForm({
      product_name: design.product_name,
      product_category: design.product_category,
      image_url: design.image_url,
      price_1_50: design.price_1_50 ? design.price_1_50.toString() : '',
      price_51_100: design.price_51_100 ? design.price_51_100.toString() : '',
      price_101_200: design.price_101_200 ? design.price_101_200.toString() : '',
      tags: design.tags || []
    });
    setShowDesignModal(true);
  };

  // Handle delete design
  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    try {
      await apiService.deleteDesign(designId);
      await fetchDesigns();
    } catch (error: any) {
      console.error('Failed to delete design:', error);
      alert(error.message || 'Failed to delete design');
    }
  };

  // Fetch requirements when requirements tab is active
  useEffect(() => {
    if (activeTab === 'requirements' && step === 'dashboard') {
      fetchRequirements();
    }
    if (activeTab === 'my-designs' && step === 'dashboard') {
      fetchDesigns();
    }
  }, [activeTab, step]);

  // Handle respond to requirement
  const handleRespondToRequirement = (requirement: any) => {
    // Check if manufacturer has already responded to this requirement
    if (requirement.hasResponse) {
      alert('You have already submitted a quote for this requirement.');
      return;
    }
    
    setSelectedRequirement(requirement);
    setResponseForm({
      pricePerUnit: '',
      deliveryTime: '',
      notes: ''
    });
    setShowPriceBreakdown(false);
    setShowResponseModal(true);
  };

  /**
   * Calculate platform fee based on tiered structure
   * Fee percentage is determined by the total quote price (base + GST + platform fee)
   * Uses iterative approach to handle circular dependency
   * @param basePrice - Base price before GST and platform fee
   * @param gst - GST amount
   * @returns Object with platformFee amount and feePercentage for display
   */
  const calculatePlatformFee = (basePrice: number, gst: number): { platformFee: number; feePercentage: number } => {
    // Start with an estimate based on base + GST to determine bracket
    let platformFeeRate = 0.15; // Default
    let platformFee = basePrice * platformFeeRate;
    
    // Iterate a few times to converge on the correct fee
    // The fee percentage depends on the final total, so we need to approximate
    for (let i = 0; i < 5; i++) {
      const total = basePrice + gst + platformFee;
      
      // Determine fee percentage based on total quote price
      // Tiered structure:
      // 0 to 1 Lakh (0-100000) → 20%
      // 1 Lakh to 2 Lakh (100001-200000) → 15%
      // 2 Lakh to 5 Lakh (200001-500000) → 8%
      // Above 5 Lakh (500001+) → 5%
      if (total <= 100000) {
        platformFeeRate = 0.20; // 20%
      } else if (total <= 200000) {
        platformFeeRate = 0.15; // 15%
      } else if (total <= 500000) {
        platformFeeRate = 0.08; // 8%
      } else {
        platformFeeRate = 0.05; // 5%
      }
      
      // Recalculate platform fee based on new rate
      const newPlatformFee = basePrice * platformFeeRate;
      
      // Check if we've converged (change is less than 0.01)
      if (Math.abs(newPlatformFee - platformFee) < 0.01) {
        break;
      }
      
      platformFee = newPlatformFee;
    }
    
    return { platformFee, feePercentage: platformFeeRate };
  };

  // Handle submit response
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequirement) return;

    // Validate required fields
    if (!responseForm.pricePerUnit || !responseForm.deliveryTime) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmittingResponse(true);
    
    try {
      const quantity = selectedRequirement.quantity || 1;
      const pricePerUnit = parseFloat(responseForm.pricePerUnit);
      const basePrice = pricePerUnit * quantity;
      const gst = basePrice * 0.05; // 5% GST
      const { platformFee } = calculatePlatformFee(basePrice, gst);
      const totalQuotedPrice = basePrice + gst + platformFee;

      const responseData = {
        quoted_price: totalQuotedPrice,
        price_per_unit: pricePerUnit,
        delivery_time: responseForm.deliveryTime,
        notes: responseForm.notes || null
      };

      const response = await apiService.createRequirementResponse(selectedRequirement.id, responseData);

      if (response.success) {
        alert('Response submitted successfully!');
        setShowResponseModal(false);
        setSelectedRequirement(null);
        // Refresh requirements list
        fetchRequirements();
      } else {
        alert(response.message || 'Failed to submit response. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      alert(error.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const steps = [
    { id: 1, name: 'Business Info', icon: '🏢' },
    { id: 2, name: 'Products', icon: '📦' },
    { id: 3, name: 'Capacity', icon: '⚙️' }
  ];

  // Onboarding View
  if (step === 'onboarding') {

    return (
      <div className="min-h-screen relative overflow-hidden bg-white">
        {/* Header */}
        <header className="relative z-10 bg-white/95 backdrop-blur border-b border-gray-200">
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

              {/* Right Side - Phone Number */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 animate-fade-in-down animation-delay-200">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {phoneNumber}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Progress Steps */}
          <div className="mb-8 sm:mb-12 animate-fade-in-up">
            <div className="flex items-center justify-center max-w-3xl mx-auto">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-shrink-0">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all duration-500 ${
                      currentStep >= s.id 
                        ? 'bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] shadow-lg shadow-[#22a2f2]/50 scale-110 text-white' 
                        : 'bg-gray-100 border border-gray-300 text-gray-500'
                    }`}>
                      {currentStep > s.id ? (
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{s.icon}</span>
                      )}
                      {currentStep === s.id && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] animate-ping opacity-50"></div>
                      )}
                    </div>
                    <span className={`mt-2 text-xs sm:text-sm font-medium transition-colors hidden sm:block ${
                      currentStep >= s.id ? 'text-black' : 'text-gray-500'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  {idx < steps.length - 1 && (
                    <div className="w-16 sm:w-24 h-1 mx-2 sm:mx-4 rounded-full overflow-hidden bg-gray-200">
                      <div 
                        className="h-full bg-black transition-all duration-500 ease-out"
                        style={{ width: currentStep > s.id ? '100%' : currentStep === s.id ? '50%' : '0%' }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="relative group animate-fade-in-up animation-delay-200">
            {/* Glowing border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-black to-gray-600 rounded-3xl blur opacity-10 group-hover:opacity-15 transition duration-500"></div>
            
            <div className="relative bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              {/* Form Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
                  {currentStep === 1 && "Business Information"}
                  {currentStep === 2 && "Product Capabilities"}
                  {currentStep === 3 && "Manufacturing Capacity"}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {currentStep === 1 && "Tell us about your manufacturing business"}
                  {currentStep === 2 && "Select the products you manufacture"}
                  {currentStep === 3 && "Share your production capabilities"}
                </p>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                {/* Step 1: Business Info */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* Manufacturing Unit Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturing Unit Name <span className="text-[#22a2f2]">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <input
                          type="text"
                          value={formData.unitName}
                          onChange={(e) => handleInputChange('unitName', e.target.value)}
                          placeholder="Enter your manufacturing unit name"
                          className="relative w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type <span className="text-[#22a2f2]">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="relative w-full px-4 py-3.5 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black appearance-none cursor-pointer"
                          required
                        >
                          <option value="" className="bg-white text-black">Select your business type</option>
                          <option value="sole-proprietorship" className="bg-white text-black">Sole Proprietorship</option>
                          <option value="partnership" className="bg-white text-black">Partnership</option>
                          <option value="private-limited" className="bg-white text-black">Private Limited</option>
                          <option value="public-limited" className="bg-white text-black">Public Limited</option>
                          <option value="llp" className="bg-white text-black">Limited Liability Partnership (LLP)</option>
                          <option value="other" className="bg-white text-black">Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* GST Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number <span className="text-[#22a2f2]">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                          placeholder="Enter GST number"
                          className="relative w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* PAN & COI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PAN Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.panNumber}
                            onChange={(e) => handleInputChange('panNumber', e.target.value)}
                            placeholder="Enter PAN number"
                            className="relative w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          COI Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.coiNumber}
                            onChange={(e) => handleInputChange('coiNumber', e.target.value)}
                            placeholder="Enter COI number"
                            className="relative w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturing Unit Location
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Enter complete address"
                          className="relative w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Products */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Select Products You Manufacture
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'T-Shirt', 'Shirt', 'Jeans',
                          'Trousers', 'Jacket', 'Hoodie',
                          'Sweater', 'Shorts', 'Skirt',
                          'Dress', 'Activewear', 'Accessories',
                          'Other'
                        ].map((product) => (
                          <label 
                            key={product} 
                            className={`group relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                              formData.productTypes.includes(product)
                                ? 'bg-black border-black text-white shadow-lg shadow-black/20'
                                : 'bg-white border-gray-200 hover:border-black hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.productTypes.includes(product)}
                              onChange={() => handleProductTypeChange(product)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              formData.productTypes.includes(product)
                                ? 'bg-white text-black border-white'
                                : 'border-gray-300 text-transparent'
                            }`}>
                              {formData.productTypes.includes(product) && (
                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-medium ${formData.productTypes.includes(product) ? 'text-white' : 'text-gray-700'}`}>{product}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Capacity */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Manufacturing Capacity
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => handleInputChange('capacity', e.target.value)}
                            placeholder="Enter daily capacity"
                            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 transition-all outline-none text-black placeholder:text-gray-400"
                          />
                          <span className="absolute right-4 text-gray-500 text-sm">units/day</span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-[#22a2f2]/10 to-[#1b8bd0]/10 border border-[#22a2f2]/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Small Scale</span>
                        </div>
                        <p className="text-xs text-gray-600">100-500 units/day</p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Medium Scale</span>
                        </div>
                        <p className="text-xs text-gray-600">500-2000 units/day</p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Large Scale</span>
                        </div>
                        <p className="text-xs text-gray-600">2000+ units/day</p>
                      </div>
                    </div>
                  </div>
                )}


                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="font-medium">Previous</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="ml-auto px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                      <span>Next Step</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="ml-auto px-8 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Complete Registration</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
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
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#22a2f2] text-white text-[10px] font-semibold px-1">
                    {totalUnreadChats > 99 ? '99+' : totalUnreadChats}
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

              {/* My Designs Tab */}
              <button
                onClick={() => setActiveTab('my-designs')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'my-designs'
                    ? 'text-[#22a2f2]'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeTab === 'my-designs' && (
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="relative z-10">My Designs</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm6 0V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m6 0a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
                    </svg>
                    <span>Analytics overview</span>
                  </div>
                  <h1 className="text-3xl font-bold text-black">Performance Dashboard</h1>
                  <p className="text-sm text-gray-500 mt-1">Monitor revenue, conversion, and order health at a glance.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#22a2f2]/10 border border-[#22a2f2]/20 text-[#22a2f2] rounded-xl text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                  </svg>
                  Live metrics update as orders progress
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                {/* Total Revenue Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                        +0%
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
                      <p className="text-3xl font-bold text-black mb-1">₹0</p>
                      <p className="text-xs text-gray-500">From 0 accepted orders</p>
                    </div>
                  </div>
                </div>

                {/* Potential Revenue Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                        Pending
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Potential Revenue</p>
                      <p className="text-3xl font-bold text-black mb-1">₹0</p>
                      <p className="text-xs text-gray-500">From 0 pending orders</p>
                    </div>
                  </div>
                </div>

                {/* Avg Order Value Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                        Avg
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Avg Order Value</p>
                      <p className="text-3xl font-bold text-black mb-1">₹0</p>
                      <p className="text-xs text-gray-500">Per accepted order</p>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                        Rate
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</p>
                      <p className="text-3xl font-bold text-black mb-1">0.0%</p>
                      <p className="text-xs text-gray-500">Quote acceptance rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Overview */}
              <div className="relative overflow-hidden animate-fade-in-up animation-delay-200">
                <div className="absolute inset-0 rounded-2xl opacity-0"></div>
                <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black">Order Status Overview</h3>
                      <p className="text-sm text-gray-600">Distribution of your orders by status</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Accepted Orders */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#22a2f2]/5 border border-[#22a2f2]/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-[#22a2f2]/30 text-[#22a2f2]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <span className="font-medium text-black">Accepted</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#22a2f2]">0 (0%)</span>
                        <div className="w-24 h-2 bg-white border border-[#22a2f2]/30 rounded-full overflow-hidden">
                          <div className="h-full bg-[#22a2f2] rounded-full transition-all duration-500" style={{width: '0%'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#22a2f2]/5 border border-[#22a2f2]/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-[#22a2f2]/30 text-[#22a2f2]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <span className="font-medium text-black">Pending</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#1b8bd0]">0 (0%)</span>
                        <div className="w-24 h-2 bg-white border border-[#22a2f2]/30 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1b8bd0] rounded-full transition-all duration-500" style={{width: '0%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Tabs */}
              <div className="relative overflow-hidden animate-fade-in-up animation-delay-300">
                <div className="absolute inset-0 rounded-2xl opacity-0"></div>
                <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 shadow-sm">
                  {/* Tab Navigation */}
                  <div className="border-b border-[#22a2f2]/20">
                    <nav className="flex space-x-2 px-6 overflow-x-auto">
                      <button
                        onClick={() => setActiveAnalyticsTab('revenue-trends')}
                        className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all rounded-xl ${
                          activeAnalyticsTab === 'revenue-trends'
                            ? 'text-[#22a2f2] bg-[#22a2f2]/10'
                            : 'text-gray-500 hover:text-[#22a2f2]'
                        }`}
                      >
                        {activeAnalyticsTab === 'revenue-trends' && (
                          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#22a2f2] rounded-full"></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Revenue Trends
                      </button>
                      <button
                        onClick={() => setActiveAnalyticsTab('product-performance')}
                        className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all rounded-xl ${
                          activeAnalyticsTab === 'product-performance'
                            ? 'text-[#22a2f2] bg-[#22a2f2]/10'
                            : 'text-gray-500 hover:text-[#22a2f2]'
                        }`}
                      >
                        {activeAnalyticsTab === 'product-performance' && (
                          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#22a2f2] rounded-full"></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        Product Performance
                      </button>
                      <button
                        onClick={() => setActiveAnalyticsTab('order-distribution')}
                        className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all rounded-xl ${
                          activeAnalyticsTab === 'order-distribution'
                            ? 'text-[#22a2f2] bg-[#22a2f2]/10'
                            : 'text-gray-500 hover:text-[#22a2f2]'
                        }`}
                      >
                        {activeAnalyticsTab === 'order-distribution' && (
                          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#22a2f2] rounded-full"></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Order Distribution
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeAnalyticsTab === 'revenue-trends' && (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-black mb-2">Revenue by Month</h3>
                          <p className="text-sm text-gray-600">Track your monthly earnings over time</p>
                        </div>
                        <div className="flex items-center justify-center py-16">
                          <div className="text-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
                              <div className="relative bg-white rounded-2xl p-8 mb-4 border border-[#22a2f2]/30">
                                <svg className="w-16 h-16 text-[#22a2f2] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-600 mb-2">No revenue data yet</p>
                            <p className="text-sm text-gray-500">Accept orders to start tracking revenue</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAnalyticsTab === 'product-performance' && (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-black mb-2">Product Performance</h3>
                          <p className="text-sm text-gray-600">Analyze performance of your manufactured products</p>
                        </div>
                        <div className="flex items-center justify-center py-16">
                          <div className="text-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
                              <div className="relative bg-white rounded-2xl p-8 mb-4 border border-[#22a2f2]/30">
                                <svg className="w-16 h-16 text-[#22a2f2] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-600 mb-2">No product data yet</p>
                            <p className="text-sm text-gray-500">Complete orders to start tracking product performance</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAnalyticsTab === 'order-distribution' && (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-black mb-2">Order Distribution</h3>
                          <p className="text-sm text-gray-600">View distribution of orders across different categories</p>
                        </div>
                        <div className="flex items-center justify-center py-16">
                          <div className="text-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
                              <div className="relative bg-white rounded-2xl p-8 mb-4 border border-[#22a2f2]/30">
                                <svg className="w-16 h-16 text-[#22a2f2] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-600 mb-2">No order data yet</p>
                            <p className="text-sm text-gray-500">Receive orders to start tracking distribution</p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
          )}
          {activeTab === 'chats' && (
            <div className="animate-fade-in-up h-full flex flex-col">
              {/* Chat Layout */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
                {/* Conversations Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 h-[300px] lg:h-[calc(100vh-280px)] min-h-[400px] bg-white border border-[#22a2f2]/30 rounded-xl shadow-sm">
                  <ChatList 
                    selectedConversationId={activeConversationId}
                    onUnreadCountChange={setTotalUnreadChats}
                    selfRole="manufacturer"
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
                      selfRole={'manufacturer'}
                      onConversationRead={(cid) => setChatUnreadClearSignal({ conversationId: cid, at: Date.now() })}
                      onClose={() => {
                        setActiveConversationId(null);
                        setActiveBuyerId(null);
                        setActiveManufacturerId(null);
                        setActiveTitle(undefined);
                        // Clear localStorage when closing chat
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('manufacturer_chat_state');
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-black mb-2">Select a requirement</h3>
                        <p className="text-sm text-gray-500">Choose a conversation from the list to view and respond</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'my-designs' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>My Designs</span>
                    </div>
                    <h1 className="text-3xl font-bold text-black mb-2">Design Portfolio</h1>
                    <p className="text-gray-600">Manage and showcase your design collection</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDesign(null);
                      setDesignForm({
                        product_name: '',
                        product_category: '',
                        image_url: '',
                        price_1_50: '',
                        price_51_100: '',
                        price_101_200: '',
                        tags: []
                      });
                      setShowDesignModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Design</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingDesigns && (
                <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Loading designs...</p>
                  </div>
                </div>
              )}

              {/* Designs Grid */}
              {!isLoadingDesigns && designs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map((design: any) => (
                    <div
                      key={design.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 overflow-hidden group"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={design.image_url}
                          alt={design.product_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Product Type Badge - Top Left */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 bg-[#22a2f2]/90 backdrop-blur-sm text-white text-xs font-semibold rounded-md">
                            {design.product_category}
                          </span>
                        </div>
                        {/* Edit/Delete Buttons - Top Right */}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => handleEditDesign(design)}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteDesign(design.id)}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-5">
                        <div className="mb-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{design.product_name}</h3>
                        </div>
                        {design.tags && design.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {design.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
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
                    <p className="text-lg font-semibold text-[#22a2f2] mb-2">No designs yet</p>
                    <p className="text-sm text-gray-500 mb-6">
                      Start building your design portfolio by adding your first design
                    </p>
                    <button
                      onClick={() => {
                        setEditingDesign(null);
                        setDesignForm({
                          product_name: '',
                          product_category: '',
                          image_url: '',
                          price_1_50: '',
                          price_51_100: '',
                          price_101_200: '',
                          tags: []
                        });
                        setShowDesignModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Your First Design</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'requirements' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Buyer requirements</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-black">Requirements</h1>
                  <div className="h-8 w-0.5 bg-[#22a2f2]/30"></div>
                </div>
                <p className="text-sm font-medium text-gray-500">View and respond to buyer requirements</p>
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

              {/* Requirements Grid */}
              {!isLoadingRequirements && requirements.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requirements.map((req: any) => {
                    // Format requirement text - capitalize first letter, fix common typos
                    const formatText = (text: string) => {
                      if (!text) return '';
                      return text.trim()
                        .replace(/\bneeed\b/gi, 'need')
                        .replace(/\bi\b/g, 'I')
                        .replace(/^\w/, (c) => c.toUpperCase());
                    };

                    // Format brand and product type
                    const formatBrand = (brand: string) => {
                      if (!brand) return '';
                      return brand.trim()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    };

                    // Determine status tag - check rejected first, then accepted, then negotiating
                    const getStatusTag = () => {
                      if (req.hasResponse && req.myResponse) {
                        // Get status from myResponse, handling different possible field names
                        const status = (req.myResponse.status || req.myResponse.response_status || '').toLowerCase().trim();
                        
                        // Check rejected first (highest priority) - this should override negotiating
                        if (status === 'rejected') {
                          return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
                        }
                        // Then check accepted
                        if (status === 'accepted') {
                          return { label: 'Accepted', color: 'bg-green-100 text-green-700' };
                        }
                        // Finally negotiating (only if not rejected or accepted)
                        if (status === 'negotiating') {
                          return { label: 'Negotiating', color: 'bg-blue-100 text-blue-700' };
                        }
                        // If status exists but doesn't match known values, show it anyway
                        if (status) {
                          return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-100 text-gray-700' };
                        }
                      }
                      return { label: 'New', color: 'bg-orange-100 text-orange-700' };
                    };

                    const statusTag = getStatusTag();
                    const formattedRequirement = formatText(req.requirement_text);
                    const formattedBrand = req.brand_name ? formatBrand(req.brand_name) : '';
                    const formattedType = req.product_type ? formatBrand(req.product_type) : '';

                    return (
                      <div 
                        key={req.id} 
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 p-5 aspect-square flex flex-col cursor-pointer group"
                        onClick={() => !req.hasResponse && handleRespondToRequirement(req)}
                      >
                        {/* Date badge - smaller and positioned better */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusTag.color}`}>
                              {statusTag.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium">
                            {new Date(req.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        {/* Requirement title - larger and bolder */}
                        <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug line-clamp-2 group-hover:text-[#22a2f2] transition-colors">
                          {formattedRequirement}
                        </h3>
                        
                        {/* Details - reduced label emphasis, increased value emphasis */}
                        <div className="space-y-2 mb-4 flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 font-normal">Buyer</span>
                            <span className="text-gray-900 font-semibold text-right truncate ml-2">{req.buyer?.full_name || 'N/A'}</span>
                          </div>
                          {req.quantity && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400 font-normal">Quantity</span>
                              <span className="text-gray-900 font-semibold">{req.quantity.toLocaleString()}</span>
                            </div>
                          )}
                          {formattedBrand && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400 font-normal">Brand</span>
                              <span className="text-gray-900 font-semibold text-right truncate ml-2">{formattedBrand}</span>
                            </div>
                          )}
                          {formattedType && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400 font-normal">Type</span>
                              <span className="text-gray-900 font-semibold text-right truncate ml-2 capitalize">{formattedType}</span>
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-3"></div>

                        {/* Action button - smaller and better styled */}
                        <div className="mt-auto">
                          {req.hasResponse ? (
                            <div className="w-full bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Quote Submitted</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespondToRequirement(req);
                              }}
                              className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                              title="View details & submit quote"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Submit Quote</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {!isLoadingRequirements && requirements.length === 0 && (
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
                    
                    <h3 className="text-xl font-semibold text-black mb-2">No Requirements Yet</h3>
                    <p className="text-gray-400 max-w-md">
                      No buyer requirements are available at the moment. Check back later for new opportunities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Response Modal */}
        {showResponseModal && selectedRequirement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-black">Submit Quote</h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Requirement:</p>
                  <p className="text-gray-800">{selectedRequirement.requirement_text}</p>
                  {selectedRequirement.quantity && (
                    <p className="text-sm text-gray-600 mt-2">Quantity: {selectedRequirement.quantity.toLocaleString()}</p>
                  )}
                </div>

                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price Per Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={responseForm.pricePerUnit}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow integers (no decimals)
                        if (value === '' || /^\d+$/.test(value)) {
                          setResponseForm({...responseForm, pricePerUnit: value});
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent decimal point and other non-numeric characters
                        if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="e.g., 100"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the price per unit (whole numbers only, before taxes and fees)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={responseForm.deliveryTime}
                      onChange={(e) => setResponseForm({...responseForm, deliveryTime: e.target.value})}
                      placeholder="e.g., 20-25 days"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={responseForm.notes}
                      onChange={(e) => setResponseForm({...responseForm, notes: e.target.value})}
                      placeholder="Any additional details or terms..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 resize-none"
                    />
                  </div>

                  {/* Total Quote Price Section */}
                  {responseForm.pricePerUnit && selectedRequirement?.quantity && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <button
                          type="button"
                          onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Quote Price</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₹{(() => {
                                const quantity = selectedRequirement.quantity || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                const gst = basePrice * 0.05;
                                const { platformFee } = calculatePlatformFee(basePrice, gst);
                                return (basePrice + gst + platformFee).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${showPriceBreakdown ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showPriceBreakdown && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Base Price ({selectedRequirement.quantity.toLocaleString()} × ₹{parseFloat(responseForm.pricePerUnit || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })})</span>
                              <span className="font-semibold text-gray-900">
                                ₹{(() => {
                                  const quantity = selectedRequirement.quantity || 1;
                                  const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                  return (pricePerUnit * quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">GST (5%)</span>
                              <span className="font-semibold text-gray-900">
                                ₹{(() => {
                                  const quantity = selectedRequirement.quantity || 1;
                                  const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                  const basePrice = pricePerUnit * quantity;
                                  return (basePrice * 0.05).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Platform Fee ({(() => {
                                const quantity = selectedRequirement.quantity || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                const gst = basePrice * 0.05;
                                const { feePercentage } = calculatePlatformFee(basePrice, gst);
                                return `${(feePercentage * 100).toFixed(0)}%`;
                              })()})</span>
                              <span className="font-semibold text-gray-900">
                                ₹{(() => {
                                  const quantity = selectedRequirement.quantity || 1;
                                  const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                  const basePrice = pricePerUnit * quantity;
                                  const gst = basePrice * 0.05;
                                  const { platformFee } = calculatePlatformFee(basePrice, gst);
                                  return platformFee.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                              <span className="font-semibold text-gray-900">Total</span>
                              <span className="font-bold text-lg text-gray-900">
                                ₹{(() => {
                                  const quantity = selectedRequirement.quantity || 1;
                                  const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                  const basePrice = pricePerUnit * quantity;
                                  const gst = basePrice * 0.05;
                                  const { platformFee } = calculatePlatformFee(basePrice, gst);
                                  return (basePrice + gst + platformFee).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowResponseModal(false)}
                      className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 border border-gray-300 text-black font-semibold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingResponse}
                      className={`flex-1 px-4 py-3 ${isSubmittingResponse ? 'bg-gray-400' : 'bg-[#22a2f2] hover:bg-[#1b8bd0]'} text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2`}
                    >
                      {isSubmittingResponse ? (
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Submit Quote</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Design Modal */}
        {showDesignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-black">{editingDesign ? 'Edit Design' : 'Add New Design'}</h3>
                <button
                  onClick={() => {
                    setShowDesignModal(false);
                    setEditingDesign(null);
                    setDesignForm({
                      product_name: '',
                      product_category: '',
                      image_url: '',
                      price_1_50: '',
                      price_51_100: '',
                      price_101_200: '',
                      tags: []
                    });
                  }}
                  className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitDesign} className="p-6 space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={designForm.product_name}
                    onChange={(e) => setDesignForm({ ...designForm, product_name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                    required
                  />
                </div>

                {/* Product Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={designForm.product_category}
                    onChange={(e) => setDesignForm({ ...designForm, product_category: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="t-shirts">T-Shirts</option>
                    <option value="shirts">Shirts</option>
                    <option value="hoodies">Hoodies</option>
                    <option value="sweatshirts">Sweatshirts</option>
                    <option value="cargos">Cargos</option>
                    <option value="trackpants">Trackpants</option>
                  </select>
                </div>

                {/* Product Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Image <span className="text-red-500">*</span>
                  </label>
                  {designForm.image_url ? (
                    <div className="relative">
                      <img src={designForm.image_url} alt="Design preview" className="w-full h-64 object-cover rounded-xl border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setDesignForm({ ...designForm, image_url: '' })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              await handleDesignImageUpload(file);
                            } catch (error) {
                              console.error('Upload failed:', error);
                            }
                          }
                        }}
                        className="hidden"
                        id="design-image-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="design-image-upload"
                        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                          uploadingImage
                            ? 'border-gray-300 bg-gray-50'
                            : 'border-gray-300 hover:border-[#22a2f2] hover:bg-[#22a2f2]/5'
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <svg className="animate-spin w-8 h-8 text-[#22a2f2] mb-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm text-gray-500">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-600">Click to upload image</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Pricing Tiers */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Pricing (₹ per unit)
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          1-50 pieces
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={designForm.price_1_50}
                          onChange={(e) => setDesignForm({ ...designForm, price_1_50: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          51-100 pieces
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={designForm.price_51_100}
                          onChange={(e) => setDesignForm({ ...designForm, price_51_100: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          101-200 pieces
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={designForm.price_101_200}
                          onChange={(e) => setDesignForm({ ...designForm, price_101_200: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDesignModal(false);
                      setEditingDesign(null);
                      setDesignForm({
                        product_name: '',
                        product_category: '',
                        image_url: '',
                        price_1_50: '',
                        price_51_100: '',
                        price_101_200: '',
                        tags: []
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDesign || !designForm.image_url}
                    className="flex-1 px-4 py-3 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingDesign ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingDesign ? 'Update Design' : 'Create Design'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
                <p className="text-sm text-gray-600">Your Manufacturing Partner</p>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-black leading-tight mb-4">
                  Power Your<br />
                  <span className="text-black">
                    Manufacturing Empire
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                  Join 1000+ verified manufacturers on Grupo. Access premium buyers, 
                  streamline operations, and scale your business globally.
                </p>
              </div>

              {/* Feature cards */}
              <div className="space-y-4">
                {[
                  { icon: "🏭", title: "More Orders", desc: "Access premium buyers worldwide" },
                  { icon: "📈", title: "Business Growth", desc: "Scale operations with ease" },
                  { icon: "💰", title: "Secure Payments", desc: "Transparent transactions guaranteed" }
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
                <p className="text-xs text-gray-600">Your Manufacturing Partner</p>
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
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-black mb-2">
                    Welcome Manufacturer
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
                            <span>Verify & Continue</span>
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
                    href="/buyer-portal"
                    className="text-sm font-semibold text-[#22a2f2] hover:text-[#1b8bd0] transition-colors"
                  >
                    Sign in with Buyer
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Join 1000+ verified manufacturers worldwide</span>
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
