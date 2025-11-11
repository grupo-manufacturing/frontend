'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../lib/apiService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

type TabType = 'analytics' | 'chats' | 'requirements' | 'profile';
type AnalyticsTabType = 'revenue-trends' | 'product-performance' | 'order-distribution';

export default function ManufacturerPortal() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'onboarding' | 'dashboard'>('phone');
  // On initial load, if a token exists, persist state across refresh
  useEffect(() => {
    if (typeof window !== 'undefined' && apiService.isAuthenticated()) {
      const onboardingComplete = localStorage.getItem('manufacturerOnboardingComplete');
      setStep(onboardingComplete === 'true' ? 'dashboard' : 'onboarding');
    }
  }, []);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTabType>('revenue-trends');
  // Chat state (chats inbox)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeManufacturerId, setActiveManufacturerId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>(undefined);
  const [totalUnreadChats, setTotalUnreadChats] = useState<number>(0);
  const [chatUnreadClearSignal, setChatUnreadClearSignal] = useState<{ conversationId: string; at: number } | null>(null);
  
  // Requirements states
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    quotedPrice: '',
    pricePerUnit: '',
    deliveryTime: '',
    notes: ''
  });
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  
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
  const [showProfile, setShowProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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
      const response = await apiService.sendOTP(fullPhoneNumber, 'manufacturer');
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
    // Clear localStorage and reset to phone step
    apiService.logout('/manufacturer-portal');
    localStorage.removeItem('manufacturerPhoneNumber');
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
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

  // Load profile data when profile modal is opened
  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await apiService.getManufacturerProfile();
      if (response.success && response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          unitName: profile.unit_name || '',
          businessType: profile.business_type || '',
          gstNumber: profile.gst_number || '',
          productTypes: profile.product_types || [],
          capacity: profile.daily_capacity?.toString() || '',
          location: profile.location || '',
          panNumber: profile.pan_number || '',
          coiNumber: profile.coi_number || '',
          msmeFile: null,
          otherCertificates: null
        });
        const resolvedName = (profile.contact_person_name || profile.unit_name || profile.business_name || '').trim();
        if (resolvedName) {
          setDisplayName(resolvedName);
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      alert('Failed to load profile data. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert form data to backend format
      const profileData = {
        unit_name: formData.unitName,
        business_type: formData.businessType,
        gst_number: formData.gstNumber,
        product_types: formData.productTypes,
        daily_capacity: parseInt(formData.capacity) || 0,
        location: formData.location,
        pan_number: formData.panNumber,
        coi_number: formData.coiNumber
      };
      
      // Update profile data
      const response = await apiService.updateManufacturerProfile(profileData);
      
      if (response.success) {
        console.log('Profile updated successfully:', response.data);
        alert('Profile updated successfully!');
        const resolvedName = (formData.unitName || '').trim();
        if (resolvedName) {
          setDisplayName(resolvedName);
        }
        setShowProfile(false);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
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
        setRequirements(response.data);
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

  // Fetch requirements when requirements tab is active
  useEffect(() => {
    if (activeTab === 'requirements' && step === 'dashboard') {
      fetchRequirements();
    }
  }, [activeTab, step]);

  // Handle respond to requirement
  const handleRespondToRequirement = (requirement: any) => {
    setSelectedRequirement(requirement);
    setResponseForm({
      quotedPrice: '',
      pricePerUnit: '',
      deliveryTime: '',
      notes: ''
    });
    setShowResponseModal(true);
  };

  // Handle submit response
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequirement) return;

    // Validate required fields
    if (!responseForm.quotedPrice || !responseForm.pricePerUnit || !responseForm.deliveryTime) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmittingResponse(true);
    
    try {
      const responseData = {
        quoted_price: parseFloat(responseForm.quotedPrice),
        price_per_unit: parseFloat(responseForm.pricePerUnit),
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
    { id: 3, name: 'Capacity', icon: '⚙️' },
    { id: 4, name: 'Documents', icon: '📄' }
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
                    Manufacturing Partner Portal
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
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all duration-500 ${
                      currentStep >= s.id 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/50 scale-110 text-white' 
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
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-ping opacity-50"></div>
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
                    <div className="flex-1 h-1 mx-2 sm:mx-4 rounded-full overflow-hidden bg-gray-200">
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
                  {currentStep === 4 && "Documentation"}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {currentStep === 1 && "Tell us about your manufacturing business"}
                  {currentStep === 2 && "Select the products you manufacture"}
                  {currentStep === 3 && "Share your production capabilities"}
                  {currentStep === 4 && "Upload your business certificates"}
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
                        Manufacturing Unit Name <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                        Business Type <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                        GST Number <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                      <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white">
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

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* MSME Certificate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MSME Certificate <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-black hover:bg-gray-100 transition-all">
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 font-medium mb-1">Click to upload MSME certificate</span>
                          <span className="text-xs text-gray-500">PDF, JPG or PNG (Max 5MB)</span>
                          {formData.msmeFile && (
                            <div className="mt-3 px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg">
                              <span className="text-xs text-gray-700 font-medium">{formData.msmeFile.name}</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('msmeFile', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Other Certificates */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Certificates <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-black hover:bg-gray-100 transition-all">
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 font-medium mb-1">Upload additional certificates</span>
                          <span className="text-xs text-gray-500">ISO, Quality certificates, etc.</span>
                          {formData.otherCertificates && (
                            <div className="mt-3 px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg">
                              <span className="text-xs text-gray-700 font-medium">{formData.otherCertificates.name}</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('otherCertificates', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Info Note */}
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Verification Process</p>
                          <p className="text-xs text-gray-600">
                            Your documents will be reviewed within 24-48 hours. You'll receive an email once verification is complete.
                          </p>
                        </div>
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
                    Manufacturing Partner Portal
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
                <button
                  onClick={() => {
                    setShowProfile(true);
                    loadProfileData();
                  }}
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
                </button>

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
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 0a2 2 0 012-2h2a2 2 0 012 2m-4 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span>Chats</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">Buyer Conversations</h1>
                    <p className="text-sm text-gray-600">View and respond to buyer inquiries and chat threads</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#22a2f2]/10 border border-[#22a2f2]/20 text-[#22a2f2] rounded-xl text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 8a6 6 0 0111.33-1" />
                    </svg>
                    Stay responsive to convert requests faster
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
                <h1 className="text-3xl font-bold text-black mb-2">Requirements</h1>
                <p className="text-gray-500">View and respond to buyer requirements</p>
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
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              req.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                              req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              req.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
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
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 mb-4">
                        {req.buyer && req.buyer.company_name && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Company</p>
                            <p className="text-sm font-semibold text-black">{req.buyer.company_name}</p>
                          </div>
                        )}
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
                      </div>

                      <button
                        onClick={() => handleRespondToRequirement(req)}
                        className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white px-6 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Submit Quote</span>
                      </button>
                    </div>
                  ))}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Quoted Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={responseForm.quotedPrice}
                        onChange={(e) => setResponseForm({...responseForm, quotedPrice: e.target.value})}
                        placeholder="e.g., 50000"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price Per Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={responseForm.pricePerUnit}
                        onChange={(e) => setResponseForm({...responseForm, pricePerUnit: e.target.value})}
                        placeholder="e.g., 50"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                        required
                      />
                    </div>
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
        
        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="relative group max-w-4xl w-full my-8 animate-fade-in-up">
              {/* Glowing border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#22a2f2] to-transparent rounded-3xl blur opacity-20"></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden border-2 border-[#22a2f2]/50">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 flex items-center justify-between z-10 border-b border-[#22a2f2]/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-black">Edit Profile</h2>
                  </div>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22a2f2]"></div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Manufacturing Unit Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturing Unit Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.unitName}
                        onChange={(e) => handleInputChange('unitName', e.target.value)}
                        placeholder="Enter unit name"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-400 transition-all"
                        required
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black appearance-none cursor-pointer transition-all"
                          required
                        >
                          <option value="" className="bg-white">Select your business type</option>
                          <option value="sole-proprietorship" className="bg-white">Sole Proprietorship</option>
                          <option value="partnership" className="bg-white">Partnership</option>
                          <option value="private-limited" className="bg-white">Private Limited</option>
                          <option value="public-limited" className="bg-white">Public Limited</option>
                          <option value="llp" className="bg-white">Limited Liability Partnership (LLP)</option>
                          <option value="other" className="bg-white">Other</option>
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
                        GST Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                        placeholder="Enter GST number"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-400 transition-all"
                        required
                      />
                    </div>

                    {/* Product Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Product Types
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          'T-Shirt', 'Shirt', 'Jeans',
                          'Trousers', 'Jacket', 'Hoodie',
                          'Sweater', 'Shorts', 'Skirt',
                          'Dress', 'Activewear', 'Accessories',
                          'Other'
                        ].map((product) => (
                          <label 
                            key={product} 
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.productTypes.includes(product)
                                ? 'bg-[#22a2f2] border-[#22a2f2] text-white shadow-lg shadow-[#22a2f2]/20'
                                : 'bg-white border-gray-200 hover:border-[#22a2f2] hover:bg-[#22a2f2]/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.productTypes.includes(product)}
                              onChange={() => handleProductTypeChange(product)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              formData.productTypes.includes(product)
                                ? 'bg-white text-[#22a2f2] border-white'
                                : 'border-gray-300 text-transparent'
                            }`}>
                              {formData.productTypes.includes(product) && (
                                <svg className="w-3 h-3 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm ${formData.productTypes.includes(product) ? 'text-white' : 'text-gray-700'}`}>{product}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Manufacturing Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturing Capacity Per Day
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                        placeholder="Enter capacity (units per day)"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-400 transition-all"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location of Unit
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Enter complete address of manufacturing unit"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-400 transition-all"
                      />
                    </div>

                    {/* PAN Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange('panNumber', e.target.value)}
                        placeholder="Enter PAN number"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-400 transition-all"
                      />
                    </div>

                    {/* COI Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate of Incorporation (COI) Number
                      </label>
                      <input
                        type="text"
                        value={formData.coiNumber}
                        onChange={(e) => handleInputChange('coiNumber', e.target.value)}
                        placeholder="Enter COI number"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-400 transition-all"
                      />
                    </div>

                    {/* MSME Certificate Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MSME Certificate <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-[#22a2f2]/40 rounded-xl bg-[#22a2f2]/5 hover:border-[#22a2f2] hover:bg-[#22a2f2]/10 transition-all">
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer group">
                          <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl mb-2 group-hover:scale-105 transition-transform border border-[#22a2f2]/30">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">Click to upload MSME certificate</span>
                          <span className="text-xs text-gray-500 mt-1">PDF, JPG or PNG</span>
                          {formData.msmeFile && (
                            <div className="mt-2 px-3 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg">
                              <span className="text-xs text-[#22a2f2] font-medium">{formData.msmeFile.name}</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('msmeFile', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Other Certificates Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Certificates (Optional)
                      </label>
                      <div className="border-2 border-dashed border-[#22a2f2]/40 rounded-xl bg-[#22a2f2]/5 hover:border-[#22a2f2] hover:bg-[#22a2f2]/10 transition-all">
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer group">
                          <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl mb-2 group-hover:scale-105 transition-transform border border-[#22a2f2]/30">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">Click to upload other certificates</span>
                          <span className="text-xs text-gray-500 mt-1">ISO, Quality certificates, etc.</span>
                          {formData.otherCertificates && (
                            <div className="mt-2 px-3 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg">
                              <span className="text-xs text-[#22a2f2] font-medium">{formData.otherCertificates.name}</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('otherCertificates', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowProfile(false)}
                        className="flex-1 px-4 py-3 bg-white hover:bg-[#22a2f2]/10 text-[#22a2f2] font-semibold rounded-xl transition-all border border-[#22a2f2]/30"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-[#22a2f2] hover:bg-[#1b8bd0] text-white font-semibold px-4 py-3 flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
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
                <p className="text-sm text-gray-600">Manufacturing Partner Portal</p>
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
                <p className="text-xs text-gray-600">Manufacturing Partner Portal</p>
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
