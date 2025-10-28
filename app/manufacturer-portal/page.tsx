'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useClerk,
} from "@clerk/nextjs";
import apiService from '../lib/apiService';

type TabType = 'analytics' | 'onboarding' | 'requirements' | 'profile';
type AnalyticsTabType = 'revenue-trends' | 'product-performance' | 'order-distribution';

export default function ManufacturerPortal() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'dashboard'>('phone');
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

  // Profile form states
  const [profileData, setProfileData] = useState({
    companyName: 'Premium Textiles Manufacturing Co.',
    businessType: 'Manufacturer',
    phoneNumber: '+1 555 000 0000', // Default value, will be updated from localStorage
    gstNumber: 'GST987654321',
    msmeNumber: 'MSME123456',
    dailyCapacity: '10000',
    factoryAddress: '456 Industrial Park, Mumbai, Maharashtra 400001',
    specialization: 'High-quality cotton and synthetic textile manufacturing',
    certifications: ['ISO 9001:2015', 'OEKO-TEX', 'GOTS Certified']
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState(profileData);

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
      const response = await apiService.sendOTP(phoneNumber);
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
      
      // Store token and user data
      apiService.setToken(mockResponse.data.token);
      localStorage.setItem('manufacturerPhoneNumber', phoneNumber);
      localStorage.setItem('user_role', 'manufacturer');
      
      setStep('dashboard');
      return;
    }
    
    try {
      console.log('Verifying OTP:', otp);
      const response = await apiService.verifyOTP(phoneNumber, otp);
      console.log('OTP verified successfully:', response);
      
      // Store token and user data
      apiService.setToken(response.data.token);
      localStorage.setItem('manufacturerPhoneNumber', phoneNumber);
      localStorage.setItem('user_role', 'manufacturer');
      
      setStep('dashboard');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleLogout = async () => {
    // If user is signed in with Clerk, use Clerk signOut
    if (user) {
      await signOut();
    } else {
      // Clear localStorage and reset to phone step for OTP users
      apiService.logout();
      localStorage.removeItem('manufacturerPhoneNumber');
      setPhoneNumber('');
      setOtp('');
      setStep('phone');
    }
  };

  const handleChangePhoneNumber = () => {
    setStep('phone');
    setOtp('');
  };

  // Load phone number from localStorage on component mount
  useEffect(() => {
    if (step === 'dashboard') {
      const storedPhone = localStorage.getItem('manufacturerPhoneNumber');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
        // Update profile data with the phone number from localStorage
        setProfileData(prev => ({
          ...prev,
          phoneNumber: storedPhone
        }));
      }
    }
  }, [step]);

  // Auto-redirect to dashboard if user is signed in with Clerk
  useEffect(() => {
    if (isLoaded && user && step !== 'dashboard') {
      setStep('dashboard');
    }
  }, [isLoaded, user, step]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Registration submitted successfully!');
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditProfile = () => {
    setOriginalProfileData({ ...profileData });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    // Here you would typically send the data to your backend
    console.log('Profile saved:', profileData);
    setIsEditingProfile(false);
    setOriginalProfileData({ ...profileData });
    alert('Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setProfileData({ ...originalProfileData });
    setIsEditingProfile(false);
  };

  const handleAddCertification = (cert: string) => {
    if (cert.trim() && !profileData.certifications.includes(cert.trim())) {
      setProfileData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert.trim()]
      }));
    }
  };

  const handleRemoveCertification = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

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

              {/* Right Side - Phone, Home, Logout */}
              <div className="flex items-center gap-4">
                {/* Clerk User Button */}
                <SignedIn>
                  <UserButton afterSignOutUrl="/manufacturer-portal" />
                </SignedIn>
                
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

              {/* Onboarding Tab */}
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'onboarding'
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Onboarding
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

              {/* Profile Tab */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'profile'
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
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
          {activeTab === 'onboarding' && (
            <div className="max-w-4xl mx-auto">
              {/* Form Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Manufacturing Unit</h1>
                <p className="text-gray-600">Fill in the details below to register your manufacturing unit</p>
              </div>

              {/* Registration Form */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Manufacturing Unit Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Unit Name
                    </label>
                    <input
                      type="text"
                      value={formData.unitName}
                      onChange={(e) => handleInputChange('unitName', e.target.value)}
                      placeholder="Enter unit name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                      MSME Certificate
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <span className="text-sm text-gray-600">Click to upload MSME certificate</span>
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
                      Submit Registration
                    </button>
                  </div>
                </form>
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
          {activeTab === 'profile' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Profile Header */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Company Logo */}
                    <div className="bg-blue-600 rounded-full p-3 flex-shrink-0 self-start">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                      </svg>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{profileData.companyName}</h1>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Verified
                          </span>
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                            </svg>
                            Manufacturer
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">Manufacturing capacity: {profileData.dailyCapacity} units/day</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        <span>{profileData.phoneNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit/Save/Cancel Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row">
                    {!isEditingProfile ? (
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                          <span className="hidden sm:inline">Save Changes</span>
                          <span className="sm:hidden">Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                          <span className="hidden sm:inline">Cancel</span>
                          <span className="sm:hidden">Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Company Information</h2>
                  <p className="text-sm text-gray-600">Manage your manufacturing unit details</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) => handleProfileInputChange('companyName', e.target.value)}
                      disabled={!isEditingProfile}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                        isEditingProfile 
                          ? 'bg-white border-gray-300 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <input
                      type="text"
                      value={profileData.businessType}
                      onChange={(e) => handleProfileInputChange('businessType', e.target.value)}
                      disabled={!isEditingProfile}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                        isEditingProfile 
                          ? 'bg-white border-gray-300 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={(e) => handleProfileInputChange('phoneNumber', e.target.value)}
                      disabled={!isEditingProfile}
                      placeholder="Enter phone number"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                        isEditingProfile 
                          ? 'bg-white border-gray-300 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={profileData.gstNumber}
                      onChange={(e) => handleProfileInputChange('gstNumber', e.target.value)}
                      disabled={!isEditingProfile}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                        isEditingProfile 
                          ? 'bg-white border-gray-300 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* MSME Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MSME Number</label>
                    <input
                      type="text"
                      value={profileData.msmeNumber}
                      onChange={(e) => handleProfileInputChange('msmeNumber', e.target.value)}
                      disabled={!isEditingProfile}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                        isEditingProfile 
                          ? 'bg-white border-gray-300 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Daily Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Capacity (units)</label>
                    <input
                      type="number"
                      value={profileData.dailyCapacity}
                      onChange={(e) => handleProfileInputChange('dailyCapacity', e.target.value)}
                      disabled={!isEditingProfile}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                        isEditingProfile 
                          ? 'bg-white border-gray-300 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Factory Address */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Factory Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={profileData.factoryAddress}
                        onChange={(e) => handleProfileInputChange('factoryAddress', e.target.value)}
                        disabled={!isEditingProfile}
                        className={`w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-colors ${
                          isEditingProfile 
                            ? 'bg-white border-gray-300 focus:border-blue-500' 
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialization */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialization</h2>
                {isEditingProfile ? (
                  <textarea
                    value={profileData.specialization}
                    onChange={(e) => handleProfileInputChange('specialization', e.target.value)}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 resize-none"
                    placeholder="Describe your manufacturing specialization..."
                  />
                ) : (
                  <p className="text-gray-700">{profileData.specialization}</p>
                )}
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {profileData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium px-3 py-2 rounded-lg">
                      <span>{cert}</span>
                      {isEditingProfile && (
                        <button
                          onClick={() => handleRemoveCertification(index)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditingProfile && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add certification..."
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCertification(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value.trim()) {
                            handleAddCertification(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Quotes Sent */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Quotes Sent</p>
                    <p className="text-3xl sm:text-4xl font-bold text-blue-600">42</p>
                  </div>
                </div>

                {/* Accepted Orders */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Accepted Orders</p>
                    <p className="text-3xl sm:text-4xl font-bold text-green-600">28</p>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Success Rate</p>
                    <p className="text-3xl sm:text-4xl font-bold text-orange-600">67%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
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

                {/* Clerk Authentication Buttons */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-2 text-xs text-gray-500 bg-white">OR</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <SignedOut>
                      <SignInButton mode="modal" fallbackRedirectUrl="/manufacturer-portal">
                        <button className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                          Sign In with Clerk
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal" fallbackRedirectUrl="/manufacturer-portal">
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Sign Up with Clerk
                        </button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center justify-center gap-2">
                        <UserButton afterSignOutUrl="/manufacturer-portal" />
                        <span className="text-sm text-gray-600">Signed in with Clerk</span>
                      </div>
                    </SignedIn>
                  </div>
                </div>
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
