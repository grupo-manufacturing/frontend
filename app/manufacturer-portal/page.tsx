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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo credentials bypass
    if (phoneNumber === '1234567890') {
      console.log('Demo credentials detected - bypassing OTP');
      setStep('otp');
      return;
    }
    
    try {
      console.log('Sending OTP to:', phoneNumber);
      const response = await apiService.sendOTP(phoneNumber, 'manufacturer');
      console.log('OTP sent successfully:', response);
      setStep('otp');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      alert('Failed to send OTP. Please try again.');
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


  // Onboarding View
  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3">
                <Image
                  src="/groupo-logo.png"
                  alt="Grupo Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-blue-600">Grupo</span>
                  <span className="text-xs text-gray-500 hidden sm:block">
                    Manufacturing Partner Portal
                  </span>
                </div>
              </div>

              {/* Right Side - Phone Number */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {phoneNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Registration</h1>
              <p className="text-gray-600">Fill in the details below to complete your manufacturing unit registration</p>
            </div>

            {/* Registration Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Manufacturing Unit Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturing Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unitName}
                    onChange={(e) => handleInputChange('unitName', e.target.value)}
                    placeholder="Enter unit name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-white appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select your business type</option>
                      <option value="sole-proprietorship">Sole Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="private-limited">Private Limited</option>
                      <option value="public-limited">Public Limited</option>
                      <option value="llp">Limited Liability Partnership (LLP)</option>
                      <option value="other">Other</option>
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
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="Enter GST number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Product Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Types
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      'T-Shirt', 'Shirt', 'Jeans',
                      'Trousers', 'Jacket', 'Hoodie',
                      'Sweater', 'Shorts', 'Skirt',
                      'Dress', 'Activewear', 'Accessories',
                      'Other'
                    ].map((product) => (
                      <label key={product} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.productTypes.includes(product)}
                          onChange={() => handleProductTypeChange(product)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{product}</span>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* MSME Certificate Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MSME Certificate <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <span className="text-sm text-gray-600">Click to upload MSME certificate</span>
                      <span className="text-xs text-gray-500 mt-1">(File upload temporarily disabled)</span>
                      {formData.msmeFile && (
                        <span className="text-xs text-blue-600 font-medium mt-1">
                          {formData.msmeFile.name}
                        </span>
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
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <span className="text-sm text-gray-600">Click to upload other certificates</span>
                      <span className="text-xs text-gray-500 mt-1">(File upload temporarily disabled)</span>
                      {formData.otherCertificates && (
                        <span className="text-xs text-blue-600 font-medium mt-1">
                          {formData.otherCertificates.name}
                        </span>
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

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Complete Registration & Access Portal
                  </button>
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3">
                <Image
                  src="/groupo-logo.png"
                  alt="Grupo Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-blue-600">Grupo</span>
                  <span className="text-xs text-gray-500 hidden sm:block">
                    Manufacturing Partner Portal
                  </span>
                </div>
              </div>

              {/* Right Side - Phone, Profile, Home, Logout */}
              <div className="flex items-center gap-4">
                {/* Phone Number with Online Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {phoneNumber}
                  </span>
                </div>

                {/* Profile Button */}
                <button
                  onClick={() => {
                    setShowProfile(true);
                    loadProfileData();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all border border-gray-200"
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
                  <span className="font-medium hidden sm:inline">Profile</span>
                </button>

                {/* Home Button */}
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all border border-gray-200"
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span className="font-medium hidden sm:inline">Home</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200"
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

        {/* Tab Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {/* Analytics Tab */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analytics
              </button>


              {/* Requirements Tab */}
              <button
                onClick={() => setActiveTab('requirements')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'requirements'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Requirements
              </button>

            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <div>
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Revenue Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-50 rounded-full p-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600 mb-1">$0</p>
                    <p className="text-xs text-gray-500">From 0 accepted orders</p>
                  </div>
                </div>

                {/* Potential Revenue Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-orange-50 rounded-lg p-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Potential Revenue</p>
                    <p className="text-3xl font-bold text-orange-600 mb-1">$0</p>
                    <p className="text-xs text-gray-500">From 0 pending orders</p>
                  </div>
                </div>

                {/* Avg Order Value Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-50 rounded-full p-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</p>
                    <p className="text-3xl font-bold text-blue-600 mb-1">$0</p>
                    <p className="text-xs text-gray-500">Per accepted order</p>
                  </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
                    <p className="text-3xl font-bold text-purple-600 mb-1">0.0%</p>
                    <p className="text-xs text-gray-500">Quote acceptance rate</p>
                  </div>
                </div>
              </div>

              {/* Order Status Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order Status Overview</h3>
                    <p className="text-sm text-gray-600">Distribution of your orders by status</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Accepted Orders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="font-medium text-gray-900">Accepted</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-600">0 NaN%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{width: '0%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Orders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span className="font-medium text-gray-900">Pending</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-600">0 NaN%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{width: '0%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Tabs */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveAnalyticsTab('revenue-trends')}
                      className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                        activeAnalyticsTab === 'revenue-trends'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                      Revenue Trends
                    </button>
                    <button
                      onClick={() => setActiveAnalyticsTab('product-performance')}
                      className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                        activeAnalyticsTab === 'product-performance'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      Product Performance
                    </button>
                    <button
                      onClick={() => setActiveAnalyticsTab('order-distribution')}
                      className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                        activeAnalyticsTab === 'order-distribution'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue by Month</h3>
                        <p className="text-sm text-gray-600">Track your monthly earnings over time</p>
                      </div>
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <div className="bg-gray-100 rounded-lg p-8 mb-4">
                            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Performance</h3>
                        <p className="text-sm text-gray-600">Analyze performance of your manufactured products</p>
                      </div>
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <div className="bg-gray-100 rounded-lg p-8 mb-4">
                            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                            </svg>
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Distribution</h3>
                        <p className="text-sm text-gray-600">View distribution of orders across different categories</p>
                      </div>
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <div className="bg-gray-100 rounded-lg p-8 mb-4">
                            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
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
          )}
          {activeTab === 'requirements' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-full p-6">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                </div>
                
                {/* Heading */}
                <h1 className="text-2xl font-bold text-gray-800 mb-3">No Requirements Available</h1>
                
                {/* Subtitle */}
                <p className="text-gray-500">Check back later for new buyer requirements.</p>
              </div>
            </div>
          )}
        </main>
        
        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Manufacturing Unit Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturing Unit Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.unitName}
                        onChange={(e) => handleInputChange('unitName', e.target.value)}
                        placeholder="Enter unit name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-white appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Select your business type</option>
                          <option value="sole-proprietorship">Sole Proprietorship</option>
                          <option value="partnership">Partnership</option>
                          <option value="private-limited">Private Limited</option>
                          <option value="public-limited">Public Limited</option>
                          <option value="llp">Limited Liability Partnership (LLP)</option>
                          <option value="other">Other</option>
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
                        GST Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                        placeholder="Enter GST number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Product Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Product Types
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          'T-Shirt', 'Shirt', 'Jeans',
                          'Trousers', 'Jacket', 'Hoodie',
                          'Sweater', 'Shorts', 'Skirt',
                          'Dress', 'Activewear', 'Accessories',
                          'Other'
                        ].map((product) => (
                          <label key={product} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.productTypes.includes(product)}
                              onChange={() => handleProductTypeChange(product)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{product}</span>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {/* MSME Certificate Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MSME Certificate <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload MSME certificate</span>
                          <span className="text-xs text-gray-500 mt-1">(File upload temporarily disabled)</span>
                          {formData.msmeFile && (
                            <span className="text-xs text-blue-600 font-medium mt-1">
                              {formData.msmeFile.name}
                            </span>
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload other certificates</span>
                          <span className="text-xs text-gray-500 mt-1">(File upload temporarily disabled)</span>
                          {formData.otherCertificates && (
                            <span className="text-xs text-blue-600 font-medium mt-1">
                              {formData.otherCertificates.name}
                            </span>
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
                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowProfile(false)}
                        className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Blue Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 sm:p-8 lg:p-12 flex-col justify-between">
        {/* Logo and Title */}
        <div>
          <div className="flex items-center gap-3 sm:gap-4 mb-8 lg:mb-12">
            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg">
              <Image
                src="/groupo-logo.png"
                alt="Groupo Logo"
                width={60}
                height={60}
                className="w-auto h-auto"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Grupo</h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">Manufacturing Partner Portal</p>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 sm:mb-6 mt-12 lg:mt-20">
            Scale Your Manufacturing Business Globally
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-blue-100 leading-relaxed mb-8 sm:mb-12 max-w-lg">
            Join Grupo's network of verified manufacturers. Access premium buyers worldwide, 
            streamline operations, and grow your business with our comprehensive platform.
          </p>

          {/* Features */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-white/20 rounded-full p-2 sm:p-3 backdrop-blur-sm flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-xl mb-1">More Orders</h3>
                <p className="text-blue-100 text-sm sm:text-base">Access a network of verified buyers actively seeking manufacturers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-white/20 rounded-full p-2 sm:p-3 backdrop-blur-sm flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-xl mb-1">Business Growth</h3>
                <p className="text-blue-100 text-sm sm:text-base">Streamlined processes to scale your operations.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-white/20 rounded-full p-2 sm:p-3 backdrop-blur-sm flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-xl mb-1">Secure Payments</h3>
                <p className="text-blue-100 text-sm sm:text-base">Trust and transparency in every transaction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="lg:hidden flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Image
              src="/groupo-logo.png"
              alt="Groupo Logo"
              width={40}
              height={40}
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Grupo</h1>
              <p className="text-xs text-gray-600">Manufacturing Partner Portal</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            {/* Manufacturing Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-blue-500 rounded-full p-3 sm:p-4">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
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
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-2">
              Manufacturer Portal
            </h2>

            {step === 'phone' ? (
              <>
                <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  Enter your registered phone number.
                </p>

                {/* Phone Form */}
                <form onSubmit={handleSendOTP}>
                  <div className="mb-5 sm:mb-6">
                    <label
                      htmlFor="phone"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg mb-3 sm:mb-4"
                  >
                    Send OTP
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  Enter the OTP sent to your phone
                </p>

                {/* OTP Form */}
                <form onSubmit={handleVerifyOTP}>
                  <div className="mb-5 sm:mb-6">
                    <label
                      htmlFor="otp"
                      className="block text-xs sm:text-sm font-medium text-gray-800 mb-2"
                    >
                      One-Time Password
                    </label>
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
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-center text-base sm:text-lg tracking-widest text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg mb-3 sm:mb-4"
                  >
                    Verify & Login
                  </button>

                  <button
                    type="button"
                    onClick={handleChangePhoneNumber}
                    className="w-full text-gray-700 font-medium py-2 text-sm sm:text-base hover:text-blue-600 transition-colors duration-200"
                  >
                    Change Phone Number
                  </button>
                </form>
              </>
            )}

            {step === 'phone' && (
              <>
                {/* Divider */}
                <div className="relative my-5 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white text-gray-500">OR CONTINUE AS</span>
                  </div>
                </div>

                {/* Switch to Buyer Portal */}
                <Link
                  href="/buyer-portal"
                  className="block w-full text-center py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium transition-all"
                >
                  Switch to Buyer Portal
                </Link>
              </>
            )}

            {/* Trust Message */}
            <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
              Join 1000+ verified manufacturers on Grupo's platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
