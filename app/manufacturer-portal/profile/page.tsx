'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

export default function ManufacturerProfile() {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState({
    unitName: '',
    businessType: '',
    gstNumber: '',
    productTypes: [] as string[],
    capacity: '',
    location: '',
    panNumber: '',
    coiNumber: '',
    manufacturingUnitImage: null as File | null,
    msmeFile: null as File | null,
    otherCertificates: null as File | null
  });
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Check authentication on mount
  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      router.push('/manufacturer-portal');
      return;
    }
    
    loadProfileData();
  }, [router]);

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const storedPhone = localStorage.getItem('manufacturerPhoneNumber');
      if (storedPhone) {
        setPhoneNumber(storedPhone);
      }

      const response = await apiService.getManufacturerProfile();
      if (response.data && response.data.profile) {
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
          manufacturingUnitImage: null,
          msmeFile: null,
          otherCertificates: null
        });
        
        setExistingImageUrl(profile.manufacturing_unit_image_url || null);
        setDisplayName(profile.unit_name || storedPhone || '');
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

  const handleProductTypeChange = (product: string) => {
    setFormData(prev => {
      const newTypes = prev.productTypes.includes(product)
        ? prev.productTypes.filter(p => p !== product)
        : [...prev.productTypes, product];
      return { ...prev, productTypes: newTypes };
    });
  };

  const handleFileChange = (field: 'manufacturingUnitImage' | 'msmeFile' | 'otherCertificates', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    // Clear existing image URL when a new file is selected
    if (field === 'manufacturingUnitImage' && file) {
      setExistingImageUrl(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Upload manufacturing unit image if a new file is provided
      let manufacturingUnitImageUrl = existingImageUrl;
      if (formData.manufacturingUnitImage) {
        setIsUploadingImage(true);
        try {
          // Use chat file upload endpoint (it accepts any file)
          const uploadResponse = await apiService.uploadChatFile(formData.manufacturingUnitImage, 'profile');
          if (uploadResponse && uploadResponse.success && uploadResponse.data && uploadResponse.data.url) {
            manufacturingUnitImageUrl = uploadResponse.data.url;
            setExistingImageUrl(uploadResponse.data.url);
          } else {
            throw new Error('Failed to upload image');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload manufacturing unit image. Please try again.');
          setIsUploadingImage(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      // Prepare profile data
      const profileData: any = {
        unit_name: formData.unitName,
        business_type: formData.businessType,
        gst_number: formData.gstNumber,
        product_types: formData.productTypes,
        daily_capacity: parseInt(formData.capacity) || 0,
        location: formData.location,
        pan_number: formData.panNumber,
        coi_number: formData.coiNumber,
        manufacturing_unit_image_url: manufacturingUnitImageUrl
      };

      await apiService.updateManufacturerProfile(profileData);
      setDisplayName(formData.unitName);
      
      // Clear the file input after successful update
      setFormData(prev => ({ ...prev, manufacturingUnitImage: null }));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
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
            <Link href="/manufacturer-portal" className="flex items-center gap-3 animate-fade-in-down">
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
                  {displayName || phoneNumber}
                </span>
              </div>

              {/* Back to Dashboard Button */}
              <Link
                href="/manufacturer-portal"
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Your Profile</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Edit Profile</h1>
          <p className="text-gray-600">Manage your manufacturing unit information</p>
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
              {/* Manufacturing Unit Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Unit Name <span className="text-[#22a2f2]">*</span>
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
                  Business Type <span className="text-[#22a2f2]">*</span>
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
                  GST Number <span className="text-[#22a2f2]">*</span>
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

              {/* Manufacturing Unit Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Unit Image
                </label>
                <div className="relative group">
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#22a2f2] transition-all">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      {formData.manufacturingUnitImage ? (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700 font-medium">
                              {formData.manufacturingUnitImage.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormData(prev => ({ ...prev, manufacturingUnitImage: null }));
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          {formData.manufacturingUnitImage.type.startsWith('image/') && (
                            <img
                              src={URL.createObjectURL(formData.manufacturingUnitImage)}
                              alt="Manufacturing unit preview"
                              className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            />
                          )}
                        </div>
                      ) : existingImageUrl ? (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700 font-medium">
                              Current Image
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setExistingImageUrl(null);
                                setFormData(prev => ({ ...prev, manufacturingUnitImage: null }));
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <img
                            src={existingImageUrl}
                            alt="Manufacturing unit"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-[#22a2f2]/10 rounded-xl mb-3">
                            <svg
                              className="w-8 h-8 text-[#22a2f2]"
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
                          </div>
                          <span className="text-sm text-gray-700 font-medium mb-1">
                            Click to upload image
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG or GIF (Max 10MB)
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange('manufacturingUnitImage', e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* MSME Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MSME Certificate
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange('msmeFile', e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#22a2f2]/10 file:text-[#22a2f2] hover:file:bg-[#22a2f2]/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Upload PDF, JPG, or PNG (Max 5MB)</p>
              </div>

              {/* Other Certificates Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Certificates
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange('otherCertificates', e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2]/60 outline-none text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#22a2f2]/10 file:text-[#22a2f2] hover:file:bg-[#22a2f2]/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Upload PDF, JPG, or PNG (Max 5MB)</p>
              </div>

              {/* Phone Number Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                  {phoneNumber || 'Not available'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/manufacturer-portal"
                  className="flex-1 px-4 py-3 bg-white hover:bg-[#22a2f2]/10 border border-[#22a2f2]/30 text-black font-semibold rounded-xl transition-all text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="relative flex-1 group overflow-hidden rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-[#22a2f2] transition-transform group-hover:scale-105"></div>
                  <div className="relative px-4 py-3 font-semibold text-white flex items-center justify-center gap-2">
                    {isSaving || isUploadingImage ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{isUploadingImage ? 'Uploading...' : 'Saving...'}</span>
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

