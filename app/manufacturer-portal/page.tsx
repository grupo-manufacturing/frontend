'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../lib/apiService';

type TabType = 'analytics' | 'requirements' | 'profile';
type AnalyticsTabType = 'revenue-trends' | 'product-performance' | 'order-distribution';

export default function ManufacturerPortal() {
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
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTabType>('revenue-trends');
  
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      console.log('Sending OTP to:', phoneNumber);
      const response = await apiService.sendOTP(phoneNumber, 'manufacturer');
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
    
    try {
      console.log('Verifying OTP:', otp);
      const response = await apiService.verifyOTP(phoneNumber, otp, 'manufacturer');
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
    }
  };

  const handleLogout = async () => {
    // Clear localStorage and reset to phone step
    apiService.logout();
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

        {/* Header */}
        <header className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3 animate-fade-in-down">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-white rounded-xl p-2">
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
                  <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Grupo
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Manufacturing Partner Portal
                  </span>
                </div>
              </div>

              {/* Right Side - Phone Number */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-fade-in-down animation-delay-200">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-white hidden sm:inline">
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
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/50 scale-110' 
                        : 'bg-slate-800/50 border-2 border-white/10'
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
                      currentStep >= s.id ? 'text-orange-400' : 'text-gray-500'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-2 sm:mx-4 rounded-full overflow-hidden bg-slate-800/50">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out"
                        style={{ width: currentStep > s.id ? '100%' : '0%' }}
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-white/10 p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {currentStep === 1 && "Business Information"}
                  {currentStep === 2 && "Product Capabilities"}
                  {currentStep === 3 && "Manufacturing Capacity"}
                  {currentStep === 4 && "Documentation"}
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Manufacturing Unit Name <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <input
                          type="text"
                          value={formData.unitName}
                          onChange={(e) => handleInputChange('unitName', e.target.value)}
                          placeholder="Enter your manufacturing unit name"
                          className="relative w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Business Type <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="relative w-full px-4 py-3.5 pr-10 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white appearance-none cursor-pointer"
                          required
                        >
                          <option value="" className="bg-slate-800">Select your business type</option>
                          <option value="sole-proprietorship" className="bg-slate-800">Sole Proprietorship</option>
                          <option value="partnership" className="bg-slate-800">Partnership</option>
                          <option value="private-limited" className="bg-slate-800">Private Limited</option>
                          <option value="public-limited" className="bg-slate-800">Public Limited</option>
                          <option value="llp" className="bg-slate-800">Limited Liability Partnership (LLP)</option>
                          <option value="other" className="bg-slate-800">Other</option>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        GST Number <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                          placeholder="Enter GST number"
                          className="relative w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                          required
                        />
                      </div>
                    </div>

                    {/* PAN & COI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          PAN Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.panNumber}
                            onChange={(e) => handleInputChange('panNumber', e.target.value)}
                            placeholder="Enter PAN number"
                            className="relative w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          COI Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.coiNumber}
                            onChange={(e) => handleInputChange('coiNumber', e.target.value)}
                            placeholder="Enter COI number"
                            className="relative w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Manufacturing Unit Location
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Enter complete address"
                          className="relative w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Products */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-4">
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
                            className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              formData.productTypes.includes(product)
                                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500 shadow-lg shadow-orange-500/20'
                                : 'bg-slate-800/30 border-white/10 hover:border-orange-500/50 hover:bg-slate-800/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.productTypes.includes(product)}
                              onChange={() => handleProductTypeChange(product)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              formData.productTypes.includes(product)
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500'
                                : 'border-white/20'
                            }`}>
                              {formData.productTypes.includes(product) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-medium text-white">{product}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                          />
                          <span className="absolute right-4 text-gray-400 text-sm">units/day</span>
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
                          <span className="text-sm font-medium text-gray-400">Small Scale</span>
                        </div>
                        <p className="text-xs text-gray-500">100-500 units/day</p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-400">Medium Scale</span>
                        </div>
                        <p className="text-xs text-gray-500">500-2000 units/day</p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-400">Large Scale</span>
                        </div>
                        <p className="text-xs text-gray-500">2000+ units/day</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* MSME Certificate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        MSME Certificate <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-white/10 rounded-xl bg-slate-800/30 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all">
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300 font-medium mb-1">Click to upload MSME certificate</span>
                          <span className="text-xs text-gray-500">PDF, JPG or PNG (Max 5MB)</span>
                          {formData.msmeFile && (
                            <div className="mt-3 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                              <span className="text-xs text-orange-400 font-medium">{formData.msmeFile.name}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Other Certificates <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-white/10 rounded-xl bg-slate-800/30 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all">
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300 font-medium mb-1">Upload additional certificates</span>
                          <span className="text-xs text-gray-500">ISO, Quality certificates, etc.</span>
                          {formData.otherCertificates && (
                            <div className="mt-3 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                              <span className="text-xs text-orange-400 font-medium">{formData.otherCertificates.name}</span>
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
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-300 mb-1">Verification Process</p>
                          <p className="text-xs text-gray-400">
                            Your documents will be reviewed within 24-48 hours. You'll receive an email once verification is complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/10 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-white rounded-xl transition-all"
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
                      className="relative group overflow-hidden rounded-xl ml-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-transform group-hover:scale-105"></div>
                      <div className="relative px-6 py-3 font-semibold text-white flex items-center gap-2">
                        <span>Next Step</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="relative group overflow-hidden rounded-xl ml-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-transform group-hover:scale-105"></div>
                      <div className="relative px-8 py-3 font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Complete Registration</span>
                      </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        {/* Header */}
        <header className="relative z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3 animate-fade-in-down">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-white rounded-xl p-2">
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
                  <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Grupo
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Manufacturing Partner Portal
                  </span>
                </div>
              </div>

              {/* Right Side - Phone, Profile, Logout */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Phone Number with Online Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:inline">
                    {phoneNumber}
                  </span>
                </div>

                {/* Profile Button */}
                <button
                  onClick={() => {
                    setShowProfile(true);
                    loadProfileData();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-white/5 rounded-lg transition-all border border-white/10 hover:border-orange-500/50"
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
                  className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-white/10 hover:border-red-500/50"
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
        <nav className="relative z-40 bg-slate-900/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {/* Analytics Tab */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'analytics' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-t-lg border-b-2 border-orange-500"></div>
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

              {/* Requirements Tab */}
              <button
                onClick={() => setActiveTab('requirements')}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === 'requirements'
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'requirements' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-t-lg border-b-2 border-orange-500"></div>
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
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                {/* Total Revenue Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-green-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/50">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="text-xs font-medium text-green-400">+0%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Total Revenue</p>
                      <p className="text-3xl font-bold text-white mb-1">$0</p>
                      <p className="text-xs text-gray-500">From 0 accepted orders</p>
                    </div>
                  </div>
                </div>

                {/* Potential Revenue Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-orange-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/50">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <span className="text-xs font-medium text-orange-400">Pending</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Potential Revenue</p>
                      <p className="text-3xl font-bold text-white mb-1">$0</p>
                      <p className="text-xs text-gray-500">From 0 pending orders</p>
                    </div>
                  </div>
                </div>

                {/* Avg Order Value Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/50">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <span className="text-xs font-medium text-blue-400">Avg</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Avg Order Value</p>
                      <p className="text-3xl font-bold text-white mb-1">$0</p>
                      <p className="text-xs text-gray-500">Per accepted order</p>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/50">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                      <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <span className="text-xs font-medium text-purple-400">Rate</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Conversion Rate</p>
                      <p className="text-3xl font-bold text-white mb-1">0.0%</p>
                      <p className="text-xs text-gray-500">Quote acceptance rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Overview */}
              <div className="relative overflow-hidden animate-fade-in-up animation-delay-200">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-500/30">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Order Status Overview</h3>
                      <p className="text-sm text-gray-400">Distribution of your orders by status</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Accepted Orders */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-green-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <span className="font-medium text-white">Accepted</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-green-400">0 (0%)</span>
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500" style={{width: '0%'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-orange-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <span className="font-medium text-white">Pending</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-orange-400">0 (0%)</span>
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" style={{width: '0%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Tabs */}
              <div className="relative overflow-hidden animate-fade-in-up animation-delay-300">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/10">
                  {/* Tab Navigation */}
                  <div className="border-b border-white/10">
                    <nav className="flex space-x-2 px-6 overflow-x-auto">
                      <button
                        onClick={() => setActiveAnalyticsTab('revenue-trends')}
                        className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all ${
                          activeAnalyticsTab === 'revenue-trends'
                            ? 'text-orange-400'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {activeAnalyticsTab === 'revenue-trends' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Revenue Trends
                      </button>
                      <button
                        onClick={() => setActiveAnalyticsTab('product-performance')}
                        className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all ${
                          activeAnalyticsTab === 'product-performance'
                            ? 'text-orange-400'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {activeAnalyticsTab === 'product-performance' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        Product Performance
                      </button>
                      <button
                        onClick={() => setActiveAnalyticsTab('order-distribution')}
                        className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all ${
                          activeAnalyticsTab === 'order-distribution'
                            ? 'text-orange-400'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {activeAnalyticsTab === 'order-distribution' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"></div>
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
                          <h3 className="text-lg font-semibold text-white mb-2">Revenue by Month</h3>
                          <p className="text-sm text-gray-400">Track your monthly earnings over time</p>
                        </div>
                        <div className="flex items-center justify-center py-16">
                          <div className="text-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-50"></div>
                              <div className="relative bg-slate-900/50 rounded-2xl p-8 mb-4 border border-white/5">
                                <svg className="w-16 h-16 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-300 mb-2">No revenue data yet</p>
                            <p className="text-sm text-gray-500">Accept orders to start tracking revenue</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAnalyticsTab === 'product-performance' && (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Product Performance</h3>
                          <p className="text-sm text-gray-400">Analyze performance of your manufactured products</p>
                        </div>
                        <div className="flex items-center justify-center py-16">
                          <div className="text-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl blur opacity-50"></div>
                              <div className="relative bg-slate-900/50 rounded-2xl p-8 mb-4 border border-white/5">
                                <svg className="w-16 h-16 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-300 mb-2">No product data yet</p>
                            <p className="text-sm text-gray-500">Complete orders to start tracking product performance</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAnalyticsTab === 'order-distribution' && (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Order Distribution</h3>
                          <p className="text-sm text-gray-400">View distribution of orders across different categories</p>
                        </div>
                        <div className="flex items-center justify-center py-16">
                          <div className="text-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-50"></div>
                              <div className="relative bg-slate-900/50 rounded-2xl p-8 mb-4 border border-white/5">
                                <svg className="w-16 h-16 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-300 mb-2">No order data yet</p>
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
          {activeTab === 'requirements' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center animate-fade-in-up">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-full p-8 border border-white/10">
                      <svg className="w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Heading */}
                <h1 className="text-2xl font-bold text-white mb-3">No Requirements Available</h1>
                
                {/* Subtitle */}
                <p className="text-gray-400 mb-6">Check back later for new buyer requirements.</p>
                
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-white/10">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-sm text-gray-300 font-medium">View Quotes</p>
                    <p className="text-xs text-gray-500 mt-1">Accept or decline</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-white/10">
                    <div className="text-3xl mb-2">⚡</div>
                    <p className="text-sm text-gray-300 font-medium">Fast Response</p>
                    <p className="text-xs text-gray-500 mt-1">Get notified instantly</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-white/10">
                    <div className="text-3xl mb-2">💼</div>
                    <p className="text-sm text-gray-300 font-medium">Track Orders</p>
                    <p className="text-xs text-gray-500 mt-1">Manage all in one place</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm">
            <div className="relative group max-w-4xl w-full my-8 animate-fade-in-up">
              {/* Glowing border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur opacity-30"></div>
              
              <div className="relative bg-slate-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden border border-white/10">
                {/* Modal Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-500/30">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                  </div>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Manufacturing Unit Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Manufacturing Unit Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.unitName}
                        onChange={(e) => handleInputChange('unitName', e.target.value)}
                        placeholder="Enter unit name"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                        required
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Business Type <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="w-full px-4 py-3 pr-10 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white appearance-none cursor-pointer transition-all"
                          required
                        >
                          <option value="" className="bg-slate-800">Select your business type</option>
                          <option value="sole-proprietorship" className="bg-slate-800">Sole Proprietorship</option>
                          <option value="partnership" className="bg-slate-800">Partnership</option>
                          <option value="private-limited" className="bg-slate-800">Private Limited</option>
                          <option value="public-limited" className="bg-slate-800">Public Limited</option>
                          <option value="llp" className="bg-slate-800">Limited Liability Partnership (LLP)</option>
                          <option value="other" className="bg-slate-800">Other</option>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        GST Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                        placeholder="Enter GST number"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                        required
                      />
                    </div>

                    {/* Product Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
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
                                ? 'bg-orange-500/10 border-orange-500/50'
                                : 'bg-slate-800/30 border-white/10 hover:border-orange-500/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.productTypes.includes(product)}
                              onChange={() => handleProductTypeChange(product)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              formData.productTypes.includes(product)
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-white/20'
                            }`}>
                              {formData.productTypes.includes(product) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-white">{product}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Manufacturing Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Manufacturing Capacity Per Day
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                        placeholder="Enter capacity (units per day)"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location of Unit
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Enter complete address of manufacturing unit"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    {/* PAN Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange('panNumber', e.target.value)}
                        placeholder="Enter PAN number"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    {/* COI Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Certificate of Incorporation (COI) Number
                      </label>
                      <input
                        type="text"
                        value={formData.coiNumber}
                        onChange={(e) => handleInputChange('coiNumber', e.target.value)}
                        placeholder="Enter COI number"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    {/* MSME Certificate Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        MSME Certificate <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-white/10 rounded-xl bg-slate-800/30 hover:border-orange-500/50 transition-all">
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer group">
                          <div className="p-3 bg-orange-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300 font-medium">Click to upload MSME certificate</span>
                          <span className="text-xs text-gray-500 mt-1">PDF, JPG or PNG</span>
                          {formData.msmeFile && (
                            <div className="mt-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                              <span className="text-xs text-orange-400 font-medium">{formData.msmeFile.name}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Other Certificates (Optional)
                      </label>
                      <div className="border-2 border-dashed border-white/10 rounded-xl bg-slate-800/30 hover:border-orange-500/50 transition-all">
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer group">
                          <div className="p-3 bg-orange-500/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300 font-medium">Click to upload other certificates</span>
                          <span className="text-xs text-gray-500 mt-1">ISO, Quality certificates, etc.</span>
                          {formData.otherCertificates && (
                            <div className="mt-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                              <span className="text-xs text-orange-400 font-medium">{formData.otherCertificates.name}</span>
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
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white font-semibold rounded-xl transition-all border border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="relative flex-1 group overflow-hidden rounded-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-transform group-hover:scale-105"></div>
                        <div className="relative px-4 py-3 font-semibold text-white flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Changes</span>
                        </div>
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative">
          {/* Glassmorphism card */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          
          <div className="relative z-10">
            {/* Logo with animation */}
            <div className="flex items-center gap-4 mb-16 animate-fade-in-down">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative bg-white rounded-2xl p-3 shadow-2xl">
                  <Image
                    src="/groupo-logo.png"
                    alt="Groupo Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Grupo
                </h1>
                <p className="text-sm text-gray-400">Manufacturing Partner Portal</p>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-8 animate-fade-in-up animation-delay-200">
              <div>
                <h2 className="text-5xl font-bold text-white leading-tight mb-4">
                  Power Your<br />
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    Manufacturing Empire
                  </span>
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                  Join 1000+ verified manufacturers on Grupo. Access premium buyers, 
                  streamline operations, and scale your business globally.
                </p>
              </div>

              {/* Feature cards */}
              <div className="space-y-4">
                {[
                  { icon: "🏭", title: "More Orders", desc: "Access premium buyers worldwide", delay: "300" },
                  { icon: "📈", title: "Business Growth", desc: "Scale operations with ease", delay: "400" },
                  { icon: "💰", title: "Secure Payments", desc: "Transparent transactions guaranteed", delay: "500" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className={`group flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 animate-fade-in-right animation-delay-${feature.delay}`}
                  >
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats footer */}
          <div className="relative z-10 grid grid-cols-3 gap-6 animate-fade-in-up animation-delay-600">
            {[
              { value: "1K+", label: "Manufacturers" },
              { value: "10K+", label: "Orders" },
              { value: "95%", label: "Success Rate" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8 animate-fade-in-down">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-75 animate-pulse"></div>
                <div className="relative bg-white rounded-2xl p-2.5">
                  <Image
                    src="/groupo-logo.png"
                    alt="Groupo Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Grupo
                </h1>
                <p className="text-xs text-gray-400">Manufacturing Partner Portal</p>
              </div>
            </div>

            {/* Login Card */}
            <div className="relative group animate-fade-in-up animation-delay-200">
              {/* Glowing border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              
              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                {/* Icon with animation */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4">
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
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome Manufacturer
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {step === 'phone' ? 'Enter your phone number to continue' : 'Verify your identity'}
                  </p>
                </div>

                {step === 'phone' ? (
                  <>
                    {/* Phone Form */}
                    <form onSubmit={handleSendOTP} className="space-y-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                          <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 555 000 0000"
                            className="relative w-full px-4 py-3.5 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingOtp}
                        className="relative w-full group overflow-hidden rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-transform group-hover:scale-105"></div>
                        <div className="relative px-6 py-3.5 font-semibold text-white flex items-center justify-center gap-2">
                          {isLoadingOtp ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span>Send OTP</span>
                              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                        </div>
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-slate-900/90 text-gray-400">OR CONTINUE AS</span>
                      </div>
                    </div>

                    {/* Other Portal Links */}
                    <div className="space-y-3">
                      <Link
                        href="/buyer-portal"
                        className="block w-full text-center py-3 rounded-xl border border-white/10 hover:border-orange-500/50 hover:bg-white/5 text-gray-300 font-medium transition-all group"
                      >
                        <span className="group-hover:text-orange-400 transition-colors">Buyer Portal</span>
                      </Link>
                      <Link
                        href="/admin"
                        className="block w-full text-center py-3 rounded-xl border border-white/10 hover:border-orange-500/50 hover:bg-white/5 text-gray-300 font-medium transition-all group"
                      >
                        <span className="group-hover:text-orange-400 transition-colors">Admin Portal</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OTP Form */}
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                          Verification Code
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
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
                            className="relative w-full px-4 py-4 bg-slate-800/50 border-2 border-orange-500/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-center text-2xl tracking-[0.5em] text-white placeholder:text-gray-600 font-mono"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Enter the 6-digit code sent to your phone
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="relative w-full group overflow-hidden rounded-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-transform group-hover:scale-105"></div>
                        <div className="relative px-6 py-3.5 font-semibold text-white flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verify & Continue</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleChangePhoneNumber}
                        className="w-full text-gray-400 hover:text-orange-400 font-medium py-2 text-sm transition-colors"
                      >
                        ← Change Phone Number
                      </button>
                    </form>
                  </>
                )}

                {/* Trust badges */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
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
