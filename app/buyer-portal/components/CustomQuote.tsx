'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

interface CustomQuoteProps {
  onRequirementSubmitted?: () => void;
  onSwitchToRequirements?: () => void;
}

export default function CustomQuote({ onRequirementSubmitted, onSwitchToRequirements }: CustomQuoteProps) {
  const toast = useToast();
  // Custom Quote Form States
  const [requirement, setRequirement] = useState('');
  const [customQuantity, setCustomQuantity] = useState('');
  const [customProductType, setCustomProductType] = useState('');
  const [isProductTypeDropdownOpen, setIsProductTypeDropdownOpen] = useState(false);
  const [productLink, setProductLink] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);
  // Validation errors
  const [errors, setErrors] = useState<{ productType?: string; quantity?: string }>({});

  // Audio ref for notification sound
  const notifySoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    notifySoundRef.current = new Audio('/notify.mp3');
    notifySoundRef.current.volume = 0.5; // Set volume to 50%

    // Cleanup on unmount
    return () => {
      if (notifySoundRef.current) {
        notifySoundRef.current.pause();
        notifySoundRef.current = null;
      }
    };
  }, []);

  // Helper function to play notification sound
  const playNotifySound = () => {
    if (notifySoundRef.current) {
      notifySoundRef.current.currentTime = 0; // Reset to start
      notifySoundRef.current.play().catch((err) => {
        // Silently handle autoplay restrictions
        console.log('Could not play sound:', err);
      });
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: { productType?: string; quantity?: string } = {};

    // Validate Product Type (required)
    if (!customProductType || customProductType.trim().length === 0) {
      newErrors.productType = 'Product type is required';
    }

    // Validate Quantity (required)
    if (!customQuantity || customQuantity.trim().length === 0) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const quantityNum = parseInt(customQuantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Custom Quote Submission
  const handleSubmitRequirement = async () => {
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmittingRequirement(true);
    
    try {
      // TODO: Handle image upload if uploadedImage exists
      let imageUrl = null;
      if (uploadedImage) {
        // For now, we'll skip image upload - can be implemented later with cloudinary
        // Image upload not yet implemented
      }

      // Create requirement data
      // At this point, validation has ensured product_type and quantity are present
      const requirementData = {
        product_type: customProductType.trim(), // Required - validated
        quantity: parseInt(customQuantity), // Required - validated
        requirement_text: requirement && requirement.trim().length > 0 ? requirement.trim() : null,
        product_link: productLink.trim().length > 0 ? productLink.trim() : null,
        image_url: imageUrl
      };

      // Submit to backend
      const response = await apiService.createRequirement(requirementData);

      if (response.success) {
        toast.success('Requirement submitted successfully! Manufacturers will review and respond shortly.');
        
        // Play notification sound when requirement is submitted
        playNotifySound();
        
        // Clear form
        setRequirement('');
        setCustomQuantity('');
        setCustomProductType('');
        setProductLink('');
        setUploadedImage(null);
        setErrors({});
        
        // Call parent callbacks if provided
        if (onRequirementSubmitted) {
          onRequirementSubmitted();
        }
        // Switch to requirements tab after successful submission
        if (onSwitchToRequirements) {
          onSwitchToRequirements();
        }
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map((err: any) => err.msg || err.message).join(', ');
          toast.error(errorMessages || response.message || 'Validation failed. Please check your input.');
        } else {
          toast.error(response.message || 'Failed to submit requirement. Please try again.');
        }
      }
    } catch (error: any) {
      // Handle network errors or other exceptions
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit requirement. Please try again.';
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg || err.message).join(', ');
        toast.error(errorMessages || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmittingRequirement(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Header Section */}
      <div className="mb-8 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>Custom quote</span>
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">Request for Quotation</h1>
        <p className="text-[#22a2f2]">Fill in the details below and connect with verified manufacturers</p>
      </div>

      {/* Custom Quote Form */}
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-[#22a2f2]/30 p-8 shadow-lg">
        <form className="space-y-6">
          {/* Product Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProductTypeDropdownOpen(!isProductTypeDropdownOpen);
                  // Clear error when user interacts
                  if (errors.productType) {
                    setErrors(prev => ({ ...prev, productType: undefined }));
                  }
                }}
                onBlur={() => setTimeout(() => setIsProductTypeDropdownOpen(false), 200)}
                className={`appearance-none w-full px-4 py-3 pr-10 bg-white border rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between ${
                  errors.productType ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <span className={customProductType ? 'text-black' : 'text-gray-500'}>
                  {customProductType || 'Select product type'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isProductTypeDropdownOpen ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              
              {isProductTypeDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="max-h-[180px] overflow-y-auto">
                    {[
                      'Tshirts Plain',
                      'Tshirts Printed',
                      'Acid Wash Plain',
                      'Cargos',
                      'Polos',
                      'Mesh',
                      'Denim Jeans',
                      'Twill Jacket',
                      'Wind Cheaters',
                      'Vests',
                      'Cotton Shirts',
                      'Silk Shirts',
                      'Carduroy Shirts',
                      'Varsity Jackets',
                      'Sweatshirts',
                      'Hoodies Plain',
                      'Hoodies Printed',
                      'Tops',
                      'Women Dresss',
                      'Leather Products',
                      'Caps',
                      'Bags'
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setCustomProductType(option);
                          setIsProductTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                          customProductType === option ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.productType && (
              <p className="mt-1 text-sm text-red-500">{errors.productType}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={customQuantity}
              onChange={(e) => {
                setCustomQuantity(e.target.value);
                // Clear error when user starts typing
                if (errors.quantity) {
                  setErrors(prev => ({ ...prev, quantity: undefined }));
                }
              }}
              placeholder="Enter quantity"
              min="1"
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all ${
                errors.quantity ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Tech Packs Link (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tech Packs <span className="text-gray-400 text-xs font-normal">(Optional)</span>
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
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="Add any additional notes or details..."
              rows={5}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 resize-none transition-all"
            />
          </div>

          {/* Upload Image (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Image (Optional)
            </label>
            <div className="border-2 border-dashed border-[#22a2f2]/30 rounded-xl bg-[#22a2f2]/5 hover:bg-[#22a2f2]/10 hover:border-[#22a2f2]/60 transition-all">
              <label className="flex flex-col items-center justify-center py-12 cursor-pointer group">
                <div className="p-3 bg-[#22a2f2]/15 rounded-xl mb-3 group-hover:scale-110 transition-transform text-[#22a2f2]">
                  <svg
                    className="w-10 h-10"
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
                <span className="text-sm text-gray-700 font-medium mb-1">Click to upload image</span>
                <span className="text-xs text-gray-500">PNG, JPG or GIF (Max 5MB)</span>
                {uploadedImage && (
                  <div className="mt-3 px-4 py-2 bg-[#22a2f2]/15 border border-[#22a2f2]/40 rounded-lg">
                    <span className="text-xs text-[#22a2f2] font-medium">
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
            onClick={handleSubmitRequirement}
            disabled={isSubmittingRequirement}
            className="relative w-full group overflow-hidden rounded-xl"
          >
            <div className={`${isSubmittingRequirement ? 'bg-gray-400' : 'bg-[#22a2f2] hover:bg-[#1b8bd0]'} text-white px-6 py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}>
              {isSubmittingRequirement ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Request for Quotation</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}

