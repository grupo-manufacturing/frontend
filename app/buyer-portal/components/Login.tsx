'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import apiService from '../../lib/apiService';

interface LoginProps {
  onLoginSuccess: (phoneNumber: string) => void;
  onProfileUpdate: (profile: {
    displayName: string;
    profileCompletion: number;
  }) => void;
  isCheckingAuth?: boolean;
}

export default function Login({ onLoginSuccess, onProfileUpdate, isCheckingAuth = false }: LoginProps) {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // Timer in seconds
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

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
            const profileCompletion = allFieldsFilled ? 100 : 0;
            
            const resolvedName = (profile.full_name || '').trim();
            
            onProfileUpdate({
              displayName: resolvedName,
              profileCompletion
            });
          }
        } catch (error) {
          console.error('Failed to fetch buyer profile:', error);
          onProfileUpdate({
            displayName: '',
            profileCompletion: 0
          });
        }
        
        // Notify parent of successful login
        onLoginSuccess(phoneNumber);
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
          const profileCompletion = allFieldsFilled ? 100 : 0;
          
          const resolvedName = (profile.full_name || '').trim();
          
          onProfileUpdate({
            displayName: resolvedName,
            profileCompletion
          });
        }
      } catch (error) {
        console.error('Failed to fetch buyer profile:', error);
        onProfileUpdate({
          displayName: '',
          profileCompletion: 0
        });
      }
      
      // Notify parent of successful login
      onLoginSuccess(phoneNumber);
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleChangePhoneNumber = () => {
    setStep('phone');
    setOtp('');
  };

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

                {isCheckingAuth ? (
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

