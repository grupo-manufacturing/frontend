'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../lib/apiService';

type TabType = 'buyers' | 'manufacturers' | 'analytics' | 'settings';

interface Manufacturer {
  id: number;
  phone_number: string;
  unit_name?: string;
  business_name?: string;
  business_type?: string;
  contact_person_name?: string;
  verified: boolean;
  verification_status?: string;
  onboarding_completed: boolean;
  created_at: string;
}

interface Buyer {
  id: number;
  phone_number: string;
  full_name?: string;
  business_name?: string;
  verified: boolean;
  verification_status?: string;
  onboarding_completed: boolean;
  created_at: string;
}

export default function AdminPortal() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'dashboard'>('phone');
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('buyers');
  const router = useRouter();
  
  // Data states
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo credentials bypass
    if (phoneNumber === '9999999999') {
      console.log('Admin demo credentials detected - bypassing OTP');
      setIsLoadingOtp(true);
      setTimeout(() => {
        setIsLoadingOtp(false);
        setStep('otp');
      }, 1000);
      return;
    }
    
    setIsLoadingOtp(true);
    try {
      console.log('Sending OTP to admin:', phoneNumber);
      const response = await apiService.sendOTP(phoneNumber, 'admin');
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
    if (phoneNumber === '9999999999' && otp === '999999') {
      console.log('Admin demo credentials verified - bypassing API call');
      
      // Store admin token
      localStorage.setItem('adminToken', 'demo_admin_token_' + Date.now());
      localStorage.setItem('adminPhoneNumber', phoneNumber);
      
      setStep('dashboard');
      return;
    }
    
      console.log('Verifying admin OTP:', otp);
      const response = await apiService.verifyOTP(phoneNumber, otp, 'admin');
      console.log('OTP verified successfully:', response);
      
      // Store admin token
      if (response.data && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminPhoneNumber', phoneNumber);
      }
      
      setStep('dashboard');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminPhoneNumber');
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
  };

  // Fetch data when tab changes or dashboard loads
  useEffect(() => {
    if (step === 'dashboard') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, activeTab]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      if (activeTab === 'manufacturers') {
        const response = await apiService.getAllManufacturers({
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
        setManufacturers(response.data?.manufacturers || []);
      } else if (activeTab === 'buyers') {
        const response = await apiService.getAllBuyers({
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
        setBuyers(response.data?.buyers || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Filter data based on search query
  const filteredManufacturers = manufacturers.filter((m) =>
    m.unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone_number.includes(searchQuery) ||
    m.contact_person_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBuyers = buyers.filter((b) =>
    b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone_number.includes(searchQuery)
  );

  // Dashboard View
  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        
        {/* Header */}
        <header className="relative z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Logo and Branding */}
              <div className="flex items-center gap-3 animate-fade-in-down">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
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
                  <span className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Grupo Admin
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Admin Management Portal
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
                  <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 font-semibold">
                    ADMIN
                  </span>
                </div>

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
              {/* Buyers Tab */}
              <button
                onClick={() => setActiveTab('buyers')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'buyers'
                    ? 'text-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'buyers' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/50"></div>
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Buyers</span>
              </button>

              {/* Manufacturers Tab */}
              <button
                onClick={() => setActiveTab('manufacturers')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'manufacturers'
                    ? 'text-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'manufacturers' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/50"></div>
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Manufacturers</span>
              </button>

              {/* Analytics Tab */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'analytics'
                    ? 'text-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'analytics' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/50"></div>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Analytics</span>
              </button>

              {/* Settings Tab */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-3 font-medium text-sm whitespace-nowrap transition-all rounded-lg ${
                  activeTab === 'settings'
                    ? 'text-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === 'settings' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/50"></div>
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="relative z-10 hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Buyers Tab Content */}
          {activeTab === 'buyers' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header with Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Buyers Management</h1>
                  <p className="text-gray-400">Manage and monitor all registered buyers</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg">
                    <div className="text-sm text-gray-400">Total Buyers</div>
                    <div className="text-2xl font-bold text-white">{buyers.length}</div>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                    <div className="text-sm text-gray-400">Verified</div>
                    <div className="text-2xl font-bold text-white">{buyers.filter(b => b.verified).length}</div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, business, or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Buyers List */}
              {isLoadingData ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-400">Loading buyers...</p>
                  </div>
                </div>
              ) : filteredBuyers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No buyers found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search query' : 'No buyers have registered yet'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBuyers.map((buyer) => (
                    <div key={buyer.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-red-500/50 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {buyer.full_name ? buyer.full_name.charAt(0).toUpperCase() : buyer.phone_number.charAt(0)}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-white truncate">
                                  {buyer.full_name || 'Unnamed Buyer'}
                                </h3>
                                {buyer.verified && (
                                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                {buyer.business_name && (
                                  <p className="text-sm text-gray-400">
                                    <span className="text-gray-500">Business:</span> {buyer.business_name}
                                  </p>
                                )}
                                <p className="text-sm text-gray-400">
                                  <span className="text-gray-500">Phone:</span> {buyer.phone_number}
                                </p>
                                <p className="text-sm text-gray-400">
                                  <span className="text-gray-500">Joined:</span> {new Date(buyer.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Status Badges */}
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  buyer.verified 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {buyer.verified ? 'Verified' : 'Unverified'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  buyer.onboarding_completed
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {buyer.onboarding_completed ? 'Onboarded' : 'Pending Onboarding'}
                                </span>
                                {buyer.verification_status && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    {buyer.verification_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button className="flex-shrink-0 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manufacturers Tab Content */}
          {activeTab === 'manufacturers' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header with Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Manufacturers Management</h1>
                  <p className="text-gray-400">Manage and monitor all registered manufacturers</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg">
                    <div className="text-sm text-gray-400">Total Manufacturers</div>
                    <div className="text-2xl font-bold text-white">{manufacturers.length}</div>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                    <div className="text-sm text-gray-400">Verified</div>
                    <div className="text-2xl font-bold text-white">{manufacturers.filter(m => m.verified).length}</div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by unit name, contact person, or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Manufacturers List */}
              {isLoadingData ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-400">Loading manufacturers...</p>
                  </div>
                </div>
              ) : filteredManufacturers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No manufacturers found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search query' : 'No manufacturers have registered yet'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredManufacturers.map((manufacturer) => (
                    <div key={manufacturer.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-red-500/50 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {(manufacturer.unit_name || manufacturer.business_name || manufacturer.phone_number).charAt(0).toUpperCase()
                              }
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-white truncate">
                                  {manufacturer.unit_name || manufacturer.business_name || 'Unnamed Manufacturer'}
                                </h3>
                                {manufacturer.verified && (
                                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                {manufacturer.contact_person_name && (
                                  <p className="text-sm text-gray-400">
                                    <span className="text-gray-500">Contact:</span> {manufacturer.contact_person_name}
                                  </p>
                                )}
                                {manufacturer.business_type && (
                                  <p className="text-sm text-gray-400">
                                    <span className="text-gray-500">Type:</span> {manufacturer.business_type}
                                  </p>
                                )}
                                <p className="text-sm text-gray-400">
                                  <span className="text-gray-500">Phone:</span> {manufacturer.phone_number}
                                </p>
                                <p className="text-sm text-gray-400">
                                  <span className="text-gray-500">Joined:</span> {new Date(manufacturer.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Status Badges */}
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  manufacturer.verified 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {manufacturer.verified ? 'Verified' : 'Unverified'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  manufacturer.onboarding_completed
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {manufacturer.onboarding_completed ? 'Onboarded' : 'Pending Onboarding'}
                                </span>
                                {manufacturer.verification_status && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    {manufacturer.verification_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button className="flex-shrink-0 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
                  <p className="text-gray-400">Platform insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-300 hover:border-red-500/50 transition-all text-sm">
                    Last 7 Days
                  </button>
                  <button className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-300 hover:border-red-500/50 transition-all text-sm">
                    Export
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Total Users</p>
                        <h3 className="text-3xl font-bold text-white mb-2">{buyers.length + manufacturers.length}</h3>
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>+12%</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Buyers */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-green-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Total Buyers</p>
                        <h3 className="text-3xl font-bold text-white mb-2">{buyers.length}</h3>
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>+8%</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Manufacturers */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-orange-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Total Manufacturers</p>
                        <h3 className="text-3xl font-bold text-white mb-2">{manufacturers.length}</h3>
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>+15%</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Rate */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Verification Rate</p>
                        <h3 className="text-3xl font-bold text-white mb-2">
                          {buyers.length + manufacturers.length > 0 
                            ? Math.round(((buyers.filter(b => b.verified).length + manufacturers.filter(m => m.verified).length) / (buyers.length + manufacturers.length)) * 100)
                            : 0}%
                        </h3>
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>+5%</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">User Growth Trend</h3>
                    <div className="space-y-4">
                      {/* Bar Chart */}
                      <div className="flex items-end justify-between h-48 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                          const height = Math.random() * 80 + 20;
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full relative group/bar">
                                <div 
                                  className="w-full bg-gradient-to-t from-red-500 to-orange-500 rounded-t-lg transition-all duration-300 group-hover/bar:from-red-400 group-hover/bar:to-orange-400"
                                  style={{ height: `${height}%` }}
                                >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                                    {Math.round(height)}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Distribution Chart */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
                    <div className="flex items-center justify-center h-48">
                      {/* Donut Chart */}
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="20"
                          />
                          {/* Buyers segment */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#buyersGradient)"
                            strokeWidth="20"
                            strokeDasharray={`${(buyers.length / (buyers.length + manufacturers.length)) * 251.2} 251.2`}
                            className="transition-all duration-500"
                          />
                          {/* Manufacturers segment */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#manufacturersGradient)"
                            strokeWidth="20"
                            strokeDasharray={`${(manufacturers.length / (buyers.length + manufacturers.length)) * 251.2} 251.2`}
                            strokeDashoffset={`-${(buyers.length / (buyers.length + manufacturers.length)) * 251.2}`}
                            className="transition-all duration-500"
                          />
                          <defs>
                            <linearGradient id="buyersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                            <linearGradient id="manufacturersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">{buyers.length + manufacturers.length}</p>
                            <p className="text-xs text-gray-400">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                        <span className="text-sm text-gray-400">Buyers ({buyers.length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                        <span className="text-sm text-gray-400">Manufacturers ({manufacturers.length})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Verification Status */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Verification Status</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Verified</span>
                          <span className="text-white font-semibold">{buyers.filter(b => b.verified).length + manufacturers.filter(m => m.verified).length}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${((buyers.filter(b => b.verified).length + manufacturers.filter(m => m.verified).length) / (buyers.length + manufacturers.length)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Unverified</span>
                          <span className="text-white font-semibold">{buyers.filter(b => !b.verified).length + manufacturers.filter(m => !m.verified).length}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${((buyers.filter(b => !b.verified).length + manufacturers.filter(m => !m.verified).length) / (buyers.length + manufacturers.length)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding Status */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Onboarding Status</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Completed</span>
                          <span className="text-white font-semibold">{buyers.filter(b => b.onboarding_completed).length + manufacturers.filter(m => m.onboarding_completed).length}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                            style={{ width: `${((buyers.filter(b => b.onboarding_completed).length + manufacturers.filter(m => m.onboarding_completed).length) / (buyers.length + manufacturers.length)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Pending</span>
                          <span className="text-white font-semibold">{buyers.filter(b => !b.onboarding_completed).length + manufacturers.filter(m => !m.onboarding_completed).length}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-gray-500 to-gray-400 transition-all duration-500"
                            style={{ width: `${((buyers.filter(b => !b.onboarding_completed).length + manufacturers.filter(m => !m.onboarding_completed).length) / (buyers.length + manufacturers.length)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">New buyer registered</p>
                          <p className="text-xs text-gray-400">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Manufacturer verified</p>
                          <p className="text-xs text-gray-400">15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Profile updated</p>
                          <p className="text-xs text-gray-400">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Verified Manufacturers</h3>
                  <div className="space-y-3">
                    {manufacturers.filter(m => m.verified).slice(0, 5).map((manufacturer, index) => (
                      <div key={manufacturer.id} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {manufacturer.unit_name || manufacturer.business_name || 'Unnamed'}
                          </p>
                          <p className="text-xs text-gray-400">{manufacturer.business_type || 'Manufacturing'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    {manufacturers.filter(m => m.verified).length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No verified manufacturers yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                  <p className="text-gray-400">Manage your admin portal preferences</p>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-white font-semibold hover:from-red-600 hover:to-orange-600 transition-all text-sm">
                  Save Changes
                </button>
              </div>

              {/* Settings Sections */}
              <div className="space-y-6">
                {/* Platform Settings */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Platform Settings
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Auto-verification */}
                      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Auto-Verification</h4>
                          <p className="text-sm text-gray-400">Automatically verify new users after registration</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-orange-500"></div>
                        </label>
                      </div>

                      {/* Email Notifications */}
                      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Email Notifications</h4>
                          <p className="text-sm text-gray-400">Send email notifications for important events</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-orange-500"></div>
                        </label>
                      </div>

                      {/* SMS Notifications */}
                      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">SMS Notifications</h4>
                          <p className="text-sm text-gray-400">Send SMS notifications to users</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-orange-500"></div>
                        </label>
                      </div>

                      {/* Maintenance Mode */}
                      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                            Maintenance Mode
                            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">Warning</span>
                          </h4>
                          <p className="text-sm text-gray-400">Enable maintenance mode for platform updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Security Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Two-Factor Authentication */}
                      <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium">
                          Enable
                        </button>
                      </div>

                      {/* Session Timeout */}
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Session Timeout</h4>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="15" 
                            max="240" 
                            defaultValue="60"
                            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                          />
                          <span className="text-white font-semibold min-w-[80px] text-right">60 mins</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Auto logout after inactivity</p>
                      </div>

                      {/* Password Requirements */}
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Password Requirements</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-red-500" defaultChecked />
                            Minimum 8 characters
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-red-500" defaultChecked />
                            Require uppercase and lowercase
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-red-500" defaultChecked />
                            Require numbers
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-red-500" />
                            Require special characters
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notification Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Email Alerts</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" defaultChecked />
                            New user registrations
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" defaultChecked />
                            Verification requests
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" />
                            Weekly reports
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" />
                            System updates
                          </label>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Push Notifications</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" defaultChecked />
                            Critical alerts
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" />
                            User activity
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" />
                            Daily summaries
                          </label>
                          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-green-500" />
                            Marketing updates
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API & Integration Settings */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      API & Integrations
                    </h3>
                    
                    <div className="space-y-4">
                      {/* API Key */}
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">API Key</h4>
                          <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                            Regenerate
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-slate-800 rounded text-sm text-gray-400 font-mono">
                            gp_••••••••••••••••••••••••••1234
                          </code>
                          <button className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Webhook URL */}
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Webhook URL</h4>
                        <input 
                          type="text" 
                          placeholder="https://your-domain.com/webhook"
                          className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-2">Receive real-time updates about platform events</p>
                      </div>

                      {/* Rate Limiting */}
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-3">API Rate Limiting</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Requests per minute</label>
                            <input 
                              type="number" 
                              defaultValue="100"
                              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Burst limit</label>
                            <input 
                              type="number" 
                              defaultValue="200"
                              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data & Privacy */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Data & Privacy
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Data Retention</h4>
                        <select className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all outline-none">
                          <option>30 days</option>
                          <option>90 days</option>
                          <option selected>180 days</option>
                          <option>1 year</option>
                          <option>Indefinite</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-2">How long to retain user activity logs</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all text-left group/btn">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">Export Data</h4>
                            <svg className="w-5 h-5 text-yellow-400 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-400">Download all platform data</p>
                        </button>

                        <button className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-left group/btn">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-red-400 font-medium">Clear Cache</h4>
                            <svg className="w-5 h-5 text-red-400 group-hover/btn:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                          <p className="text-xs text-red-400/70">Clear all cached data</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      System Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Platform Version</p>
                        <p className="text-white font-semibold">v1.2.5</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                        <p className="text-white font-semibold">Nov 1, 2025</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Database Status</p>
                        <p className="text-green-400 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Connected
                        </p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">API Status</p>
                        <p className="text-green-400 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Operational
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Login View
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
                <h1 className="text-3xl font-bold text-white">Grupo Admin</h1>
                <p className="text-gray-400">Management Portal</p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Manage Users</h3>
                  <p className="text-gray-400">Complete control over buyers and manufacturers on the platform</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
                  <p className="text-gray-400">Monitor platform performance and user activity in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Secure Access</h3>
                  <p className="text-gray-400">Protected admin portal with role-based access control</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div className="relative z-10">
            <p className="text-gray-400 text-sm">
              © 2024 Grupo. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="relative bg-black rounded-xl p-2">
                  <Image
                    src="/groupo-logo.png"
                    alt="Groupo Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
              <span className="text-2xl font-bold text-black">Grupo Admin</span>
            </div>

            {/* Login Card */}
            <div className="relative">
              <div className="relative bg-white border-2 border-black rounded-2xl p-8 shadow-xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-black mb-2">
                    Admin Login
                  </h2>
                  <p className="text-gray-600">
                    {step === 'phone' ? 'Enter your admin credentials to continue' : 'Verify your identity'}
                  </p>
                </div>

                {step === 'phone' ? (
                  <>
                    {/* Phone Form */}
                    <form onSubmit={handleSendOTP} className="space-y-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                          Admin Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="9999999999"
                            className="relative w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:border-black transition-all outline-none text-black placeholder:text-gray-400"
                            required
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Demo: Use 9999999999 for testing
                        </p>
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
                          Enter OTP
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            className="relative w-full px-4 py-3.5 bg-white border-2 border-black rounded-xl focus:border-black transition-all outline-none text-black placeholder:text-gray-400 text-center text-2xl tracking-widest"
                            required
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          Demo: Use 999999 for testing
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
                          <span>Verify & Login</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                            </>
                          )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setOtp('');
                        }}
                        className="w-full text-center text-sm text-gray-600 hover:text-black transition-colors"
                      >
                        ← Back to phone number
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Security notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                🔒 Secure admin access. All actions are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

