'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

export default function BuyerProfile() {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    businessAddress: '',
    aboutBusiness: ''
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Check authentication on mount
  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      router.push('/buyer-portal');
      return;
    }
    loadProfileData();
  }, [router]);

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const storedPhone = localStorage.getItem('buyerPhoneNumber');
      if (storedPhone) {
        setUserPhoneNumber(storedPhone);
      }

      const response = await apiService.getBuyerProfile();
      if (response.data && response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          fullName: profile.full_name || '',
          email: profile.email || '',
          businessAddress: profile.business_address || '',
          aboutBusiness: profile.about_business || ''
        });
        
        const resolvedName = (profile.full_name || '').trim();
        setDisplayName(resolvedName);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await apiService.updateBuyerProfile({
        full_name: formData.fullName,
        email: formData.email,
        business_address: formData.businessAddress,
        about_business: formData.aboutBusiness
      });

      // Check if update was successful
      if (response && response.success) {
        const resolvedName = (formData.fullName || '').trim();
        setDisplayName(resolvedName);
        
        // Reload profile data to ensure we have the latest
        await loadProfileData();
        
        toast.success('Profile updated successfully!');
        
        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          router.push('/buyer-portal');
        }, 500);
      } else {
        throw new Error(response?.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error?.message || 'Failed to update profile. Please try again.';
      // Replace "Validation failed" with "Please fill up all fields"
      const displayMessage = errorMessage.includes('Validation failed') || errorMessage.includes('Please fill up all fields')
        ? 'Please fill up all fields'
        : errorMessage;
      toast.error(displayMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Side - Logo and Branding */}
            <Link href="/buyer-portal" className="flex items-center gap-3 animate-fade-in-down">
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
            </Link>

            {/* Right Side - User Info & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Name with Online Status */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-black hidden sm:inline">
                  {displayName || userPhoneNumber}
                </span>
              </div>

              {/* Back to Dashboard Button */}
              <Link
                href="/buyer-portal"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="font-medium hidden lg:inline">Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Your Profile</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Edit Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Form Card */}
        <div className="bg-white rounded-3xl border-2 border-[#22a2f2]/30 shadow-xl p-8">
          {isLoadingProfile ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#22a2f2]"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-[#22a2f2] opacity-20"></div>
              </div>
              <p className="mt-4 text-gray-600">Loading your profile...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="relative w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-500 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className="relative w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-500 transition-all"
                  />
                </div>
              </div>

              {/* Business Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <input
                    type="text"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="Enter your business address"
                    className="relative w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-500 transition-all"
                  />
                </div>
              </div>

              {/* About Your Business */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Your Business
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <textarea
                    value={formData.aboutBusiness}
                    onChange={(e) => handleInputChange('aboutBusiness', e.target.value)}
                    placeholder="Tell us about your business"
                    rows={4}
                    className="relative w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black placeholder:text-gray-500 resize-none transition-all"
                  />
                </div>
              </div>

              {/* Phone Number Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                  {userPhoneNumber || 'Not available'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/buyer-portal"
                  className="flex-1 px-4 py-3 bg-white hover:bg-[#22a2f2]/10 border border-[#22a2f2]/30 text-black font-semibold rounded-xl transition-all text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="relative flex-1 group overflow-hidden rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-[#22a2f2] transition-transform group-hover:scale-105"></div>
                  <div className="relative px-4 py-3 font-semibold text-white flex items-center justify-center gap-2">
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

