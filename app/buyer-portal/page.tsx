'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AIChatbot from '../components/AIChatbot';

type TabType = 'designs' | 'instant-quote' | 'custom-quote' | 'my-orders' | 'chats' | 'requirements' | 'cart' | 'profile';

export default function BuyerPortal() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'dashboard'>('phone');
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
  
  // Custom Quote Form States
  const [requirement, setRequirement] = useState('');
  const [customQuantity, setCustomQuantity] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [customProductType, setCustomProductType] = useState('');
  const [productLink, setProductLink] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  
  // My Orders States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  
  // Chats States
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  
  // Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    companyName: 'Fashion Brands Inc.',
    gstNumber: 'GST123456789',
    businessAddress: '123 Business Street, New York, NY 10001',
    aboutBusiness: 'Leading fashion retailer specializing in premium textile products.'
  });
  const [userPhoneNumber, setUserPhoneNumber] = useState('');

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: Move to OTP verification step
    console.log('Sending OTP to:', phoneNumber);
    setStep('otp');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: Accept any 6-digit OTP
    if (otp.length === 6) {
      console.log('OTP verified:', otp);
      // Store phone number in localStorage
      localStorage.setItem('buyerPhoneNumber', phoneNumber);
      setStep('dashboard');
    } else {
      alert('Please enter a 6-digit OTP');
    }
  };

  const handleLogout = () => {
    // Clear localStorage and reset to phone step
    localStorage.removeItem('buyerPhoneNumber');
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
  };

  const handleChangePhoneNumber = () => {
    setStep('phone');
    setOtp('');
  };

  const handleGenerateQuotes = () => {
    // Validate required fields
    if (!brandName || !productType || !quantity) {
      alert('Please fill in Brand Name, Product Type, and Quantity');
      return;
    }

    // Mock quotes data
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
  };

  const handleSaveProfile = () => {
    // Save profile changes
    setIsEditingProfile(false);
    // Here you would typically send the data to your backend
    console.log('Profile saved:', profileData);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset to original values if needed
  };

  // Load phone number from localStorage on component mount
  useEffect(() => {
    if (step === 'dashboard') {
      const storedPhone = localStorage.getItem('buyerPhoneNumber');
      if (storedPhone) {
        setUserPhoneNumber(storedPhone);
      }
    }
  }, [step]);

  // Dashboard View
  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* AI Chatbot */}
        <AIChatbot />
        
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
                    One-Stop AI Manufacturing Platform
                  </span>
                </div>
              </div>

              {/* Right Side - Phone, Home, Logout */}
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
              {/* Designs Tab */}
              <button
                onClick={() => setActiveTab('designs')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'designs'
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Designs
              </button>

              {/* Instant Quote Tab */}
              <button
                onClick={() => setActiveTab('instant-quote')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'instant-quote'
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Instant Quote
              </button>

              {/* Custom Quote Tab */}
              <button
                onClick={() => setActiveTab('custom-quote')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'custom-quote'
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Custom Quote
              </button>

              {/* My Orders Tab */}
              <button
                onClick={() => setActiveTab('my-orders')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'my-orders'
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                My Orders
              </button>

              {/* Chats Tab */}
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'chats'
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Chats
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

              {/* Cart Tab */}
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'cart'
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Cart
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
          {activeTab === 'designs' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Design Marketplace</h1>
                <p className="text-gray-600">Browse our curated collection of ready-to-manufacture designs</p>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
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
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none w-full md:w-64 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-white cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="mechanical">Mechanical Parts</option>
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="automotive">Automotive</option>
                      <option value="jewelry">Jewelry</option>
                      <option value="home-decor">Home Decor</option>
                      <option value="toys">Toys & Games</option>
                      <option value="medical">Medical Devices</option>
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

              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-300 mb-6"
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
                  <p className="text-lg text-gray-600 mb-2">No designs found matching your criteria</p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search terms or category filter
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'instant-quote' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <svg
                      className="w-6 h-6 text-white"
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
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold text-gray-800">Instant Quote Generator</h1>
                      <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        AI Powered
                      </span>
                    </div>
                    <p className="text-gray-600">Get instant quotes from multiple manufacturers</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Response Time Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <svg
                            className="w-5 h-5 text-blue-500"
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
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Response Time</p>
                          <p className="text-lg font-bold text-gray-900">Instant</p>
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-50 rounded-lg p-2">
                          <svg
                            className="w-5 h-5 text-green-500"
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
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                          <p className="text-lg font-bold text-gray-900">98% Accurate</p>
                        </div>
                      </div>
                    </div>

                    {/* Manufacturers Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-50 rounded-lg p-2">
                          <svg
                            className="w-5 h-5 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Manufacturers</p>
                          <p className="text-lg font-bold text-gray-900">100+ Verified</p>
                        </div>
                      </div>
                    </div>
              </div>

              {/* Order Requirements Form */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <h2 className="text-xl font-bold text-gray-900">Order Requirements</h2>
                    </div>
                    <p className="text-gray-600 mb-6">Fill in your requirements to get instant quotes</p>

                    <form className="space-y-5">
                      {/* Brand Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g., Urban Threads"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        />
                      </div>

                      {/* Product Type and Fabric Type Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-white"
                          >
                            <option value="">Select type</option>
                            <option value="t-shirt">T-Shirt</option>
                            <option value="hoodie">Hoodie</option>
                            <option value="pants">Pants</option>
                            <option value="jacket">Jacket</option>
                            <option value="dress">Dress</option>
                            <option value="shirt">Shirt</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fabric Type
                          </label>
                          <select
                            value={fabricType}
                            onChange={(e) => setFabricType(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-white"
                          >
                            <option value="">Select fabric</option>
                            <option value="cotton">Cotton</option>
                            <option value="polyester">Polyester</option>
                            <option value="blend">Cotton-Polyester Blend</option>
                            <option value="silk">Silk</option>
                            <option value="wool">Wool</option>
                            <option value="linen">Linen</option>
                          </select>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity (units) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g., 5000"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        />
                        <p className="text-xs text-blue-600 mt-1">Minimum order: 100 units</p>
                      </div>

                      {/* Colors and Sizes Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Colors
                          </label>
                          <input
                            type="text"
                            value={colors}
                            onChange={(e) => setColors(e.target.value)}
                            placeholder="e.g., Black, White, Navy"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sizes
                          </label>
                          <input
                            type="text"
                            value={sizes}
                            onChange={(e) => setSizes(e.target.value)}
                            placeholder="e.g., S, M, L, XL"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Details
                        </label>
                        <textarea
                          value={additionalDetails}
                          onChange={(e) => setAdditionalDetails(e.target.value)}
                          placeholder="Any specific requirements, printing, embroidery, etc."
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                      </div>

                      {/* Generate Button */}
                      <button
                        type="button"
                        onClick={handleGenerateQuotes}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generate Instant Quotes
                      </button>
                  </form>
              </div>

              {/* Quotes Display Section */}
              {quotes.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Quotes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow relative flex flex-col">
                        {/* Best Value Badge */}
                        {quote.bestValue && (
                          <div className="absolute -top-2 -right-2">
                            <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                              ✓ Best Value
                            </span>
                          </div>
                        )}

                        {/* Header */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900">{quote.manufacturer}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              quote.badge === 'Premium' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {quote.badge}
                            </span>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">{quote.rating}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-gray-200">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total Price</p>
                            <p className="text-2xl font-bold text-blue-600">${quote.totalPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Per Unit</p>
                            <p className="text-2xl font-bold text-gray-900">${quote.pricePerUnit}</p>
                          </div>
                        </div>

                        {/* Delivery */}
                        <div className="flex items-center gap-2 mb-4 text-sm">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900">{quote.delivery}</span></span>
                        </div>

                        {/* Features */}
                        <div className="mb-4 flex-grow">
                          <p className="text-xs font-semibold text-gray-900 mb-2">Features:</p>
                          <ul className="space-y-1.5">
                            {quote.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Button */}
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors mt-auto">
                          Select Quote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'custom-quote' && (
            <div className="flex flex-col items-center">
              {/* Header Section */}
              <div className="mb-8 text-center max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Request for Quotation</h1>
                <p className="text-blue-600">Fill in the details below and connect with verified manufacturers</p>
              </div>

              {/* Custom Quote Form */}
              <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <form className="space-y-6">
                  {/* Requirement */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Requirement
                    </label>
                    <textarea
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      placeholder="Please describe your requirements in detail..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 resize-none bg-gray-50"
                    />
                  </div>

                  {/* Quantity and Brand Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={customBrandName}
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Product Type
                    </label>
                    <select
                      value={customProductType}
                      onChange={(e) => setCustomProductType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-gray-50 appearance-none cursor-pointer"
                    >
                      <option value="">Select product type</option>
                      <option value="t-shirt">T-Shirt</option>
                      <option value="shirt">Shirt</option>
                      <option value="jacket">Jacket</option>
                      <option value="hoodie">Hoodie</option>
                      <option value="sweater">Sweater</option>
                      <option value="trouser">Trouser</option>
                      <option value="shorts">Shorts</option>
                      <option value="dress">Dress</option>
                    </select>
                  </div>

                  {/* Product Link (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Upload Image (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Upload Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-3"
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
                        <span className="text-sm text-gray-600 mb-1">Click to upload image</span>
                        {uploadedImage && (
                          <span className="text-xs text-blue-600 font-medium">
                            {uploadedImage.name}
                          </span>
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
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Request for Quotation
                  </button>
                </form>
              </div>

              {/* Info Box */}
              <div className="w-full max-w-3xl mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      How it works
                    </p>
                    <p className="text-sm text-blue-800">
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
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
                <p className="text-gray-600">Track and manage all your orders in one place</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Orders Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">56</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <svg
                        className="w-8 h-8 text-gray-700"
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

                {/* Accepted Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Accepted</p>
                      <p className="text-3xl font-bold text-green-600">0</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3">
                      <svg
                        className="w-8 h-8 text-green-600"
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

                {/* Pending Review Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                      <p className="text-3xl font-bold text-orange-600">0</p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3">
                      <svg
                        className="w-8 h-8 text-orange-600"
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

                {/* In Negotiation Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">In Negotiation</p>
                      <p className="text-3xl font-bold text-blue-600">0</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3">
                      <svg
                        className="w-8 h-8 text-blue-600"
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

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
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
                      placeholder="Search orders by product, brand, or order ID..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-white cursor-pointer"
                    >
                      <option value="all">All Orders</option>
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending Review</option>
                      <option value="negotiation">In Negotiation</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
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
              <div className="bg-white rounded-xl border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Package Icon */}
                  <div className="bg-gray-100 rounded-full p-6 mb-6">
                    <svg
                      className="w-16 h-16 text-gray-400"
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
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600 max-w-md">
                    Your orders will appear here once manufacturers respond to your requirements
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'chats' && (
            <div>
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages</h1>
                <p className="text-gray-600">All your conversations in one place</p>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="relative">
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
                    placeholder="Search conversations..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Conversations List / Empty State */}
              <div className="bg-white rounded-xl border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Chat Icon */}
                  <div className="bg-blue-50 rounded-full p-6 mb-6">
                    <svg
                      className="w-16 h-16 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-600 max-w-md">
                    Start by submitting a quotation request or browsing the design marketplace
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'requirements' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                {/* Package Icon */}
                <div className="flex justify-center mb-6">
                  <svg
                    className="w-16 h-16 text-gray-400"
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
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requirements Yet</h3>
                <p className="text-gray-600">
                  Submit your first requirement to get started
                </p>
              </div>
            </div>
          )}
          {activeTab === 'cart' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                {/* Shopping Bag Icon */}
                <div className="flex justify-center mb-6">
                  <svg
                    className="w-16 h-16 text-gray-400"
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
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600">
                  Browse our design marketplace to add products
                </p>
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <div>
              {/* Profile Header Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                      JD
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{profileData.fullName}</h2>
                      <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">{profileData.companyName}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{profileData.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{userPhoneNumber || phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit/Save/Cancel Buttons */}
                  {!isEditingProfile ? (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span className="font-medium text-sm sm:text-base text-gray-700">Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={handleSaveProfile}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-sm sm:text-base">Save</span>
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="font-medium text-sm sm:text-base text-gray-700">Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Profile Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Manage your account details and preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                      Full Name
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{profileData.fullName}</span>
                      </div>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                      Email Address
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 break-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                      Company Name
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{profileData.companyName}</span>
                      </div>
                    )}
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                      GST Number
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.gstNumber}
                        onChange={(e) => setProfileData({...profileData, gstNumber: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                        <span>{profileData.gstNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Business Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                      Business Address
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.businessAddress}
                        onChange={(e) => setProfileData({...profileData, businessAddress: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                    ) : (
                      <div className="flex items-start gap-2 text-sm sm:text-base text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{profileData.businessAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* About Your Business */}
                <div className="mt-4 sm:mt-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                    About Your Business
                  </label>
                  {isEditingProfile ? (
                    <textarea
                      value={profileData.aboutBusiness}
                      onChange={(e) => setProfileData({...profileData, aboutBusiness: e.target.value})}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {profileData.aboutBusiness}
                    </p>
                  )}
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Total Orders */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Total Orders</p>
                  <p className="text-3xl sm:text-4xl font-bold text-blue-600">24</p>
                </div>

                {/* Active Requirements */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Active Requirements</p>
                  <p className="text-3xl sm:text-4xl font-bold text-orange-600">8</p>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Total Spent</p>
                  <p className="text-3xl sm:text-4xl font-bold text-green-600">$48,250</p>
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
              <p className="text-blue-100 text-xs sm:text-sm mt-1">One-Stop AI Manufacturing Platform</p>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 sm:mb-6 mt-12 lg:mt-20">
            Your Global Manufacturing Partner
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-blue-100 leading-relaxed mb-8 sm:mb-12 max-w-lg">
            Connect with verified manufacturers worldwide. Get competitive
            quotes, track orders in real-time, and streamline your entire
            production process on one platform.
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-xl mb-1">Real-time Quotes</h3>
                <p className="text-blue-100 text-sm sm:text-base">Get instant quotes from verified manufacturers</p>
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-xl mb-1">Order Tracking</h3>
                <p className="text-blue-100 text-sm sm:text-base">Monitor your orders from production to delivery</p>
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
              <p className="text-xs text-gray-600">One-Stop AI Manufacturing Platform</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            {/* Phone Icon */}
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-2">
              Buyer Portal
            </h2>

            {step === 'phone' ? (
              <>
                <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  Enter your phone number to get started
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
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
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

                {/* Other Portal Links */}
                <div className="space-y-2.5 sm:space-y-3">
                  <Link
                    href="/manufacturer-portal"
                    className="block w-full text-center py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium transition-all"
                  >
                    Manufacturer Portal
                  </Link>
                  <Link
                    href="/admin-portal"
                    className="block w-full text-center py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium transition-all"
                  >
                    Admin Portal
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Trust Message */}
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
            Trusted by manufacturers and buyers in 50+ countries
          </p>
        </div>
      </div>
    </div>
  );
}

