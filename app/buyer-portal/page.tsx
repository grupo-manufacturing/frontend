'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AIChatbot from '../components/AIChatbot';
import apiService from '../lib/apiService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

type TabType = 'designs' | 'instant-quote' | 'custom-quote' | 'my-orders' | 'chats' | 'requirements' | 'cart';

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
      }
    } catch (e) {
      console.error('Failed to open chat from quote', e);
      setActiveTab('chats');
    }
  }
  
  // Profile form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    gstNumber: '',
    businessAddress: '',
    aboutBusiness: ''
  });
  const [showProfile, setShowProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState('');

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
    apiService.logout();
    localStorage.removeItem('buyerPhoneNumber');
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
  };

  // Chat inbox handlers
  const openConversationFromList = (conversationId: string, buyerId: string, manufacturerId: string, title?: string) => {
    setActiveConversationId(conversationId);
    setActiveBuyerId(buyerId);
    setActiveManufacturerId(manufacturerId);
    setActiveTitle(title);
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
        onboarding_completed: true,
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
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  // Load profile data when profile modal is opened
  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await apiService.getBuyerProfile();
      if (response.success && response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          fullName: profile.full_name || '',
          email: profile.email || '',
          companyName: profile.company_name || '',
          gstNumber: profile.gst_number || '',
          businessAddress: profile.business_address || '',
          aboutBusiness: profile.about_business || ''
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
        full_name: formData.fullName,
        email: formData.email,
        company_name: formData.companyName,
        gst_number: formData.gstNumber,
        business_address: formData.businessAddress,
        about_business: formData.aboutBusiness
      };
      
      // Update profile data
      const response = await apiService.updateBuyerProfile(profileData);
      
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

  // Load phone number from localStorage on component mount
  useEffect(() => {
    if (step === 'dashboard' && apiService.isAuthenticated()) {
      const storedPhone = localStorage.getItem('buyerPhoneNumber');
      if (storedPhone) {
        setUserPhoneNumber(storedPhone);
        setPhoneNumber(storedPhone);
      }
    }
  }, [step]);


  // Dashboard View
  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        {/* AI Chatbot */}
        <AIChatbot />
        
        {/* Header */}
        <header className="relative z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3 animate-fade-in-down">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
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
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Grupo
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    AI Manufacturing Platform
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
                  className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all border border-white/10 hover:border-blue-500/50"
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
                  <span className="font-medium hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="relative z-40 bg-slate-900/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
              {/* Designs Tab */}
              <button
                onClick={() => setActiveTab('designs')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'designs'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'designs' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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

              {/* Instant Quote Tab */}
              <button
                onClick={() => setActiveTab('instant-quote')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'instant-quote'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'instant-quote' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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
                <span className="relative z-10 hidden sm:inline">Instant Quote</span>
              </button>

              {/* Custom Quote Tab */}
              <button
                onClick={() => setActiveTab('custom-quote')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'custom-quote'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'custom-quote' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'my-orders'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'my-orders' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'chats'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'chats' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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
              </button>

              {/* Requirements Tab */}
              <button
                onClick={() => setActiveTab('requirements')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'requirements'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'requirements' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'cart'
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'cart' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/50"></div>
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
            <div className="animate-fade-in-up">
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Design Marketplace</h1>
                <p className="text-gray-400">Browse our curated collection of ready-to-manufacture designs</p>
              </div>

              {/* Search and Filter Bar */}
              <div className="relative group mb-8">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
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
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    {/* Category Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="appearance-none w-full md:w-64 px-4 py-3 pr-10 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white cursor-pointer transition-all"
                      >
                        <option value="all" className="bg-slate-800">All Categories</option>
                        <option value="t-shirts" className="bg-slate-800">T-Shirts</option>
                        <option value="shirts" className="bg-slate-800">Shirts</option>
                        <option value="hoodies" className="bg-slate-800">Hoodies</option>
                        <option value="sweatshirts" className="bg-slate-800">Sweatshirts</option>
                        <option value="cargos" className="bg-slate-800">Cargos</option>
                        <option value="trackpants" className="bg-slate-800">Trackpants</option>
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
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-50"></div>
                    <div className="relative bg-slate-800/30 rounded-2xl p-8 border border-white/10">
                      <svg
                        className="mx-auto h-20 w-20 text-gray-500"
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
                  <p className="text-lg font-medium text-gray-300 mb-2">No designs found matching your criteria</p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search terms or category filter
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'instant-quote' && (
            <div className="animate-fade-in-up">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-3">
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
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-3xl font-bold text-white">Instant Quote Generator</h1>
                      <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-orange-500/50">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        AI Powered
                      </span>
                    </div>
                    <p className="text-gray-400 mt-1">Get instant quotes from multiple manufacturers</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Response Time Card */}
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:border-blue-500/50 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/50">
                            <svg
                              className="w-5 h-5 text-white"
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
                            <p className="text-sm text-gray-400 mb-1">Response Time</p>
                            <p className="text-lg font-bold text-white">Instant</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Card */}
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:border-green-500/50 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/50">
                            <svg
                              className="w-5 h-5 text-white"
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
                            <p className="text-sm text-gray-400 mb-1">Accuracy</p>
                            <p className="text-lg font-bold text-white">98% Accurate</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manufacturers Card */}
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:border-purple-500/50 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/50">
                            <svg
                              className="w-5 h-5 text-white"
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
                            <p className="text-sm text-gray-400 mb-1">Manufacturers</p>
                            <p className="text-lg font-bold text-white">100+ Verified</p>
                          </div>
                        </div>
                      </div>
                    </div>
              </div>

              {/* Order Requirements Form */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                        <svg
                          className="w-5 h-5 text-white"
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
                      <h2 className="text-xl font-bold text-white">Order Requirements</h2>
                    </div>
                    <p className="text-gray-400 mb-6">Fill in your requirements to get instant quotes</p>

                    <form className="space-y-5">
                      {/* Brand Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Brand Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g., Urban Threads"
                          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                        />
                      </div>

                      {/* Product Type and Fabric Type Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Product Type <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={productType}
                              onChange={(e) => setProductType(e.target.value)}
                              className="appearance-none w-full px-4 py-2.5 pr-10 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white cursor-pointer transition-all"
                            >
                              <option value="" className="bg-slate-800">Select type</option>
                              <option value="t-shirt" className="bg-slate-800">T-Shirt</option>
                              <option value="hoodie" className="bg-slate-800">Hoodie</option>
                              <option value="pants" className="bg-slate-800">Pants</option>
                              <option value="jacket" className="bg-slate-800">Jacket</option>
                              <option value="dress" className="bg-slate-800">Dress</option>
                              <option value="shirt" className="bg-slate-800">Shirt</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fabric Type
                          </label>
                          <div className="relative">
                            <select
                              value={fabricType}
                              onChange={(e) => setFabricType(e.target.value)}
                              className="appearance-none w-full px-4 py-2.5 pr-10 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white cursor-pointer transition-all"
                            >
                              <option value="" className="bg-slate-800">Select fabric</option>
                              <option value="cotton" className="bg-slate-800">Cotton</option>
                              <option value="polyester" className="bg-slate-800">Polyester</option>
                              <option value="blend" className="bg-slate-800">Cotton-Polyester Blend</option>
                              <option value="silk" className="bg-slate-800">Silk</option>
                              <option value="wool" className="bg-slate-800">Wool</option>
                              <option value="linen" className="bg-slate-800">Linen</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Quantity (units) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g., 5000"
                          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                        />
                        <p className="text-xs text-blue-600 mt-1">Minimum order: 100 units</p>
                      </div>

                      {/* Colors and Sizes Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Colors
                          </label>
                          <input
                            type="text"
                            value={colors}
                            onChange={(e) => setColors(e.target.value)}
                            placeholder="e.g., Black, White, Navy"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sizes
                          </label>
                          <input
                            type="text"
                            value={sizes}
                            onChange={(e) => setSizes(e.target.value)}
                            placeholder="e.g., S, M, L, XL"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        disabled={isLoadingQuotes}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingQuotes ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading Manufacturers...
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </button>
                  </form>
                </div>
              </div>

              {/* Quotes Display Section */}
              {quotes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Available Quotes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all relative flex flex-col">
                        {/* Best Value Badge */}
                        {quote.bestValue && (
                          <div className="absolute -top-3 -right-3">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Best Value
                            </span>
                          </div>
                        )}

                        {/* Header */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-xl text-white">{quote.manufacturer}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                              quote.badge === 'Premium' 
                                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30' 
                                : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {quote.badge}
                            </span>
                            <div className="flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded-lg">
                              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-semibold text-gray-200">{quote.rating}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
                          <div className="bg-slate-900/50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-1">Total Price</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${quote.totalPrice.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-1">Per Unit</p>
                            <p className="text-2xl font-bold text-white">${quote.pricePerUnit}</p>
                          </div>
                        </div>

                        {/* Delivery */}
                        <div className="flex items-center gap-2 mb-4 text-sm bg-slate-900/30 rounded-lg p-3">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-400">Delivery: <span className="font-semibold text-white">{quote.delivery}</span></span>
                        </div>

                        {/* Features */}
                        <div className="mb-5 flex-grow">
                          <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Features:
                          </p>
                          <ul className="space-y-2">
                            {quote.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Button */}
                        <button 
                          onClick={() => openChatFromQuote(quote)}
                          className="relative w-full group/btn overflow-hidden rounded-xl mt-auto"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-transform group-hover/btn:scale-105"></div>
                          <div className="relative px-6 py-3 font-semibold text-white flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Chat</span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'custom-quote' && (
            <div className="flex flex-col items-center animate-fade-in-up">
              {/* Header Section */}
              <div className="mb-8 text-center max-w-3xl">
                <h1 className="text-3xl font-bold text-white mb-2">Request for Quotation</h1>
                <p className="text-blue-400">Fill in the details below and connect with verified manufacturers</p>
              </div>

              {/* Custom Quote Form */}
              <div className="w-full max-w-3xl bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-lg">
                <form className="space-y-6">
                  {/* Requirement */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Requirement
                    </label>
                    <textarea
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      placeholder="Please describe your requirements in detail..."
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 resize-none transition-all"
                    />
                  </div>

                  {/* Quantity and Brand Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={customBrandName}
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Product Type
                    </label>
                    <div className="relative">
                      <select
                        value={customProductType}
                        onChange={(e) => setCustomProductType(e.target.value)}
                        className="appearance-none w-full px-4 py-3 pr-10 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white cursor-pointer transition-all"
                      >
                        <option value="" className="bg-slate-800">Select product type</option>
                        <option value="t-shirt" className="bg-slate-800">T-Shirt</option>
                        <option value="shirt" className="bg-slate-800">Shirt</option>
                        <option value="jacket" className="bg-slate-800">Jacket</option>
                        <option value="hoodie" className="bg-slate-800">Hoodie</option>
                        <option value="sweater" className="bg-slate-800">Sweater</option>
                        <option value="trouser" className="bg-slate-800">Trouser</option>
                        <option value="shorts" className="bg-slate-800">Shorts</option>
                        <option value="dress" className="bg-slate-800">Dress</option>
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
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
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
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Upload Image (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Upload Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 hover:border-blue-500/50 transition-all">
                      <label className="flex flex-col items-center justify-center py-12 cursor-pointer group">
                        <div className="p-3 bg-blue-500/10 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                          <svg
                            className="w-10 h-10 text-blue-400"
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
                        <span className="text-sm text-gray-300 font-medium mb-1">Click to upload image</span>
                        <span className="text-xs text-gray-500">PNG, JPG or GIF (Max 5MB)</span>
                        {uploadedImage && (
                          <div className="mt-3 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                            <span className="text-xs text-blue-400 font-medium">
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
                    className="relative w-full group overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-transform group-hover:scale-105"></div>
                    <div className="relative px-6 py-3.5 font-semibold text-white flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span>Request for Quotation</span>
                    </div>
                  </button>
                </form>
              </div>

              {/* Info Box */}
              <div className="w-full max-w-3xl mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
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
                    <p className="text-sm text-blue-300 font-medium mb-1">
                      How it works
                    </p>
                    <p className="text-sm text-gray-400">
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
            <div className="animate-fade-in-up">
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
                <p className="text-gray-400">Track and manage all your orders in one place</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Orders Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-600/20 to-gray-600/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-slate-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-white">56</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg shadow-slate-500/50">
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
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accepted Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-green-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Accepted</p>
                        <p className="text-3xl font-bold text-green-400">0</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/50">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Review Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-orange-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Pending Review</p>
                        <p className="text-3xl font-bold text-orange-400">0</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/50">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* In Negotiation Card */}
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">In Negotiation</p>
                        <p className="text-3xl font-bold text-blue-400">0</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/50">
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors"
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
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white cursor-pointer transition-all"
                    >
                      <option value="all" className="bg-slate-800">All Orders</option>
                      <option value="accepted" className="bg-slate-800">Accepted</option>
                      <option value="pending" className="bg-slate-800">Pending Review</option>
                      <option value="negotiation" className="bg-slate-800">In Negotiation</option>
                      <option value="completed" className="bg-slate-800">Completed</option>
                      <option value="cancelled" className="bg-slate-800">Cancelled</option>
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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Package Icon */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full p-6 border border-blue-500/30">
                      <svg
                        className="w-16 h-16 text-blue-400"
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
                  
                  <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
                  <p className="text-gray-400 max-w-md">
                    Your orders will appear here once manufacturers respond to your requirements
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'chats' && (
            <div className="animate-fade-in-up h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Messages</h1>
                    <p className="text-sm text-gray-400">View and manage your conversations with manufacturers</p>
                  </div>
                </div>
              </div>

              {/* Chat Layout */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
                {/* Conversations Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 h-[300px] lg:h-[calc(100vh-280px)] min-h-[400px]">
                  <ChatList 
                    selectedConversationId={activeConversationId}
                    onOpenConversation={(cid, bid, mid, title) => {
                      setActiveConversationId(cid);
                      setActiveBuyerId(bid);
                      setActiveManufacturerId(mid);
                      setActiveTitle(title);
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
                      onClose={() => {
                        setActiveConversationId(null);
                        setActiveBuyerId(null);
                        setActiveManufacturerId(null);
                        setActiveTitle(undefined);
                      }}
                    />
                  ) : (
                    <div className="h-full bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center p-6">
                      <div className="text-center max-w-sm">
                        <div className="relative mx-auto mb-6 w-20 h-20">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                          <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center w-full h-full border border-blue-500/20">
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
                        <p className="text-sm text-gray-400">Choose a manufacturer from the list to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'requirements' && (
            <div className="animate-fade-in-up">
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">My Requirements</h1>
                <p className="text-gray-400">Track all your submitted requirements and their status</p>
              </div>

              {/* Empty State */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Package Icon */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full p-6 border border-purple-500/30">
                      <svg
                        className="w-16 h-16 text-purple-400"
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
                  
                  <h3 className="text-xl font-semibold text-white mb-2">No Requirements Yet</h3>
                  <p className="text-gray-400 max-w-md">
                    Submit your first requirement to get started and connect with manufacturers
                  </p>
                  
                  {/* CTA Button */}
                  <button
                    onClick={() => setActiveTab('custom-quote')}
                    className="mt-6 relative group overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-transform group-hover:scale-105"></div>
                    <div className="relative px-6 py-3 font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Submit Requirement</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'cart' && (
            <div className="animate-fade-in-up">
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Shopping Cart</h1>
                <p className="text-gray-400">Review your selected designs before checkout</p>
              </div>

              {/* Empty State */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Shopping Bag Icon */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full p-6 border border-green-500/30">
                      <svg
                        className="w-16 h-16 text-green-400"
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
                  
                  <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 max-w-md">
                    Browse our design marketplace to discover and add products to your cart
                  </p>
                  
                  {/* CTA Button */}
                  <button
                    onClick={() => setActiveTab('designs')}
                    className="mt-6 relative group overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-transform group-hover:scale-105"></div>
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
        
        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowProfile(false)}
            ></div>

            {/* Modal Container */}
            <div className="relative max-w-2xl w-full my-8 animate-fade-in-up">
              {/* Glowing border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-30"></div>
              
              <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                  </div>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto">
                  {isLoadingProfile ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-blue-500 opacity-20"></div>
                      </div>
                      <p className="mt-4 text-gray-400">Loading your profile...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Full Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="Enter your full name (optional)"
                            className="relative w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email address (optional)"
                            className="relative w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Company Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="Enter your company name (optional)"
                            className="relative w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* GST Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          GST Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.gstNumber}
                            onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                            placeholder="Enter GST number (optional)"
                            className="relative w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Business Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Address
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <input
                            type="text"
                            value={formData.businessAddress}
                            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                            placeholder="Enter your business address"
                            className="relative w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* About Your Business */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          About Your Business
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                          <textarea
                            value={formData.aboutBusiness}
                            onChange={(e) => handleInputChange('aboutBusiness', e.target.value)}
                            placeholder="Tell us about your business (optional)"
                            rows={4}
                            className="relative w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder:text-gray-500 resize-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowProfile(false)}
                          className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-white font-semibold rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="relative flex-1 group overflow-hidden rounded-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-transform group-hover:scale-105"></div>
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
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-black p-12 flex-col justify-between relative">
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-16">
              <div className="relative bg-white rounded-2xl p-3">
                  <Image
                    src="/groupo-logo.png"
                    alt="Groupo Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Grupo
                </h1>
                <p className="text-sm text-gray-400">AI Manufacturing Platform</p>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-white leading-tight mb-4">
                  Manufacture<br />
                  <span className="text-white">
                    Anything, Anywhere
                  </span>
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                  Connect with 1000+ verified manufacturers worldwide. Get instant quotes, 
                  AI-powered matching, and real-time order tracking.
                </p>
              </div>

              {/* Feature cards */}
              <div className="space-y-4">
                {[
                  { icon: "⚡", title: "Instant Quotes", desc: "AI-powered matching in seconds" },
                  { icon: "🌍", title: "Global Network", desc: "50+ countries, 1000+ manufacturers" },
                  { icon: "🔒", title: "Secure & Verified", desc: "All manufacturers QC certified" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300"
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
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="relative bg-black rounded-2xl p-2.5">
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
              <div className="relative bg-white rounded-3xl p-8 border-2 border-black shadow-xl">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative bg-black rounded-2xl p-4">
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
                        <div className="relative flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-32 px-3 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:border-black transition-all outline-none text-black font-medium"
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
                            className="flex-1 px-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:border-black transition-all outline-none text-black placeholder:text-gray-400"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingOtp}
                        className="w-full bg-black text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
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
                            className="relative w-full px-4 py-4 bg-white border-2 border-black rounded-xl focus:border-black transition-all outline-none text-center text-2xl tracking-[0.5em] text-black placeholder:text-gray-400 font-mono"
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
                        className="w-full bg-black text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        aria-busy={isVerifyingOtp}
                      >
                          {isVerifyingOtp ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

