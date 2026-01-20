'use client';

import Image from 'next/image';
import { useState } from 'react';
import apiService from '../../lib/apiService';

interface ToastInterface {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

interface OnboardingProps {
  phoneNumber: string;
  onComplete: () => void;
  toast: ToastInterface;
}

export default function Onboarding({ phoneNumber, onComplete, toast }: OnboardingProps) {
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
    manufacturingUnitImage: null as File | null,
    msmeFile: null as File | null,
    otherCertificates: null as File | null
  });
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
    
    // Only allow submission on the final step
    if (currentStep !== totalSteps) {
      // If not on final step, go to next step instead
      nextStep();
      return;
    }
    
    // Validate required fields for all steps
    if (!formData.unitName || !formData.businessType || !formData.gstNumber) {
      toast.error('Please complete all required fields in Business Info section.');
      setCurrentStep(1);
      return;
    }
    
    if (!formData.productTypes || formData.productTypes.length === 0) {
      toast.error('Please select at least one product type.');
      setCurrentStep(2);
      return;
    }
    
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      // Validation failed - stay on step 3, user needs to enter capacity
      // Don't show alert as it interrupts the flow
      return;
    }
    
    try {
      // Upload manufacturing unit image if provided
      let manufacturingUnitImageUrl = null;
      if (formData.manufacturingUnitImage) {
        setIsUploadingImage(true);
        try {
          // Use chat file upload endpoint (it accepts any file)
          const uploadResponse = await apiService.uploadChatFile(formData.manufacturingUnitImage, 'onboarding');
          if (uploadResponse && uploadResponse.success && uploadResponse.data && uploadResponse.data.url) {
            manufacturingUnitImageUrl = uploadResponse.data.url;
          } else {
            throw new Error('Failed to upload image');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload manufacturing unit image. Please try again.');
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
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
        manufacturing_unit_image_url: manufacturingUnitImageUrl,
        // For now, skip file uploads until we implement proper file handling
        // msme_file: formData.msmeFile,
        // other_certificates: formData.otherCertificates
      };
      
      // Submit onboarding data to backend
      const response = await apiService.submitManufacturerOnboarding(onboardingData);
      
      if (response.success) {
        console.log('Onboarding submitted successfully:', response.data);
        
        // Show success toast
        toast.success('Registration submitted successfully! Welcome to Grupo!');
        
        // Notify parent component
        onComplete();
      } else {
        throw new Error(response.message || 'Failed to submit onboarding');
      }
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
      toast.error('Failed to submit registration. Please try again.');
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
    { id: 3, name: 'Capacity', icon: '⚙️' }
  ];

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
                  Your Manufacturing Partner
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
          <div className="flex items-center justify-center max-w-3xl mx-auto">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-shrink-0">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all duration-500 ${
                    currentStep >= s.id 
                      ? 'bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] shadow-lg shadow-[#22a2f2]/50 scale-110 text-white' 
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
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] animate-ping opacity-50"></div>
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
                  <div className="w-16 sm:w-24 h-1 mx-2 sm:mx-4 rounded-full overflow-hidden bg-gray-200">
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
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {currentStep === 1 && "Tell us about your manufacturing business"}
                {currentStep === 2 && "Select the products you manufacture"}
                {currentStep === 3 && "Share your production capabilities"}
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
                      Manufacturing Unit Name <span className="text-[#22a2f2]">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                      Business Type <span className="text-[#22a2f2]">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                      GST Number <span className="text-[#22a2f2]">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                        <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                      <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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
                      <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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

                  {/* Manufacturing Unit Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Unit Image
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
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

                  {/* Capacity Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#22a2f2]/10 to-[#1b8bd0]/10 border border-[#22a2f2]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] flex items-center justify-center text-white">
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
                    disabled={isUploadingImage}
                    className="ml-auto px-8 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUploadingImage ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Complete Registration</span>
                      </>
                    )}
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

