'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import apiService from '../../lib/apiService';

export default function GenerateDesignsPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Publish modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishData, setPublishData] = useState({
    quantity: '',
    pricePerUnit: ''
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // Form state - Simplified for beginners
  const [formData, setFormData] = useState({
    apparel_type: '',
    design_description: '',
    preferred_colors: '',
    print_placement: ''
  });

  // Dropdown states
  const [isApparelTypeDropdownOpen, setIsApparelTypeDropdownOpen] = useState(false);
  const [isPrintPlacementDropdownOpen, setIsPrintPlacementDropdownOpen] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedPhone = localStorage.getItem('buyerPhoneNumber');
          if (storedPhone) {
            setUserPhoneNumber(storedPhone);
          }
        }
        const response = await apiService.getBuyerProfile();
        if (response && response.success && response.data && response.data.profile) {
          const profile = response.data.profile;
          const resolvedName = (profile.full_name || profile.business_name || '').trim();
          if (resolvedName) {
            setDisplayName(resolvedName);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = async () => {
    // Validate required fields - only 2 essential fields now
    if (!formData.apparel_type?.trim()) {
      setError('Please select what product you want to design');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    if (!formData.design_description?.trim()) {
      setError('Please describe your design idea');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Transform simplified form data to match API expectations
      const apiPayload = {
        apparel_type: formData.apparel_type,
        design_description: formData.design_description,
        theme_concept: formData.design_description, // Use description as theme
        design_style: 'custom', // Default style
        target_audience: 'general', // Default audience
        print_placement: formData.print_placement || 'Front Center',
        main_elements: formData.design_description, // Extract from description
        preferred_colors: formData.preferred_colors || '',
        colors_to_avoid: '',
        text_style: '',
        text_content: ''
      };

      // Call the API endpoint to generate design using Nano Banana Pro
      const response = await fetch('/api/generate-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate design');
      }

      if (data.success && data.image) {
        setGeneratedDesign(data.image);
        setSuccess('Design generated successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate design. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedDesign) {
      setError('No design to publish. Please generate a design first.');
      return;
    }

    // Validate publish data
    if (!publishData.quantity || !publishData.pricePerUnit) {
      setError('Please fill in both quantity and price per unit');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const quantity = parseInt(publishData.quantity);
    const pricePerUnit = parseFloat(publishData.pricePerUnit);

    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      setError('Please enter a valid price per unit');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setIsPublishing(true);
    setError('');
    setSuccess('');

    try {
      // Get the auth token
      const token = apiService.getToken();
      if (!token) {
        throw new Error('You must be logged in to publish designs');
      }

      const response = await fetch('/api/publish-ai-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_url: generatedDesign,
          apparel_type: formData.apparel_type,
          design_description: formData.design_description,
          quantity: quantity,
          price_per_unit: pricePerUnit,
          preferred_colors: formData.preferred_colors || null,
          print_placement: formData.print_placement || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish design');
      }

      if (data.success) {
        setSuccess('Design published successfully! It will be visible to all manufacturers.');
        setIsPublishModalOpen(false);
        setPublishData({ quantity: '', pricePerUnit: '' });
        // Optionally clear the generated design or keep it
      } else {
        throw new Error('Failed to publish design');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish design. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLogout = async () => {
    await apiService.logout('/buyer-portal');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Side - Logo and Back Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/buyer-portal')}
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
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
                  <span className="text-lg font-bold text-black">Grupo</span>
                  <span className="text-xs text-gray-600 hidden sm:block">Your Design Marketplace</span>
                </div>
              </div>
            </div>

            {/* Right Side - Profile Info & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-black hidden sm:inline">
                  {displayName || userPhoneNumber}
                </span>
              </div>

              <Link
                href="/buyer-portal/profile"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium hidden lg:inline">Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium hidden lg:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>AI-Powered Design Generation</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Generate Designs</h1>
          <p className="text-gray-600">Simply describe your idea and let AI create your design. It's that easy!</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
              <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-6">
                {/* Simplified Form - Only Essential Fields */}
                <div className="space-y-6">
                  {/* Step 1: What Product? */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#22a2f2] text-white text-sm font-bold mr-2">1</span>
                      What product do you want to design?
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsApparelTypeDropdownOpen(!isApparelTypeDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsApparelTypeDropdownOpen(false), 200)}
                        className={`appearance-none w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between text-base ${
                          !formData.apparel_type ? 'text-gray-500' : 'text-black'
                        }`}
                      >
                        <span>
                          {formData.apparel_type || 'Choose a product type...'}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${isApparelTypeDropdownOpen ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>
                      
                      {isApparelTypeDropdownOpen && (
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
                                  handleInputChange('apparel_type', option);
                                  setIsApparelTypeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                  formData.apparel_type === option ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Select the type of clothing you want to create a design for</p>
                  </div>

                  {/* Step 2: Describe Your Design */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#22a2f2] text-white text-sm font-bold mr-2">2</span>
                      Describe your design idea
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={formData.design_description}
                      onChange={(e) => handleInputChange('design_description', e.target.value)}
                      placeholder="Tell us what you want! For example: A minimalist design with geometric shapes in blue and white. Include the text 'Stay Creative' in bold letters. Nature theme with mountains."
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400 resize-none text-base"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500 mb-3">
                      Describe your design in simple words. Include style, colors, text, images, or any ideas you have!
                    </p>
                    
                    {/* Example Prompts */}
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-[#22a2f2] hover:text-[#1b8bd0] font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Need inspiration? See example prompts
                      </summary>
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                        <p className="text-xs font-medium text-gray-700 mb-2">Try these examples:</p>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="p-2 bg-white rounded border border-gray-200">
                            <span className="font-medium">Example 1:</span> "A vintage retro design with faded colors, featuring a mountain landscape and the text 'Adventure Awaits' in bold script font"
                          </div>
                          <div className="p-2 bg-white rounded border border-gray-200">
                            <span className="font-medium">Example 2:</span> "Modern minimalist style with geometric shapes in black and white. Include a small logo on the left chest"
                          </div>
                          <div className="p-2 bg-white rounded border border-gray-200">
                            <span className="font-medium">Example 3:</span> "Bold and colorful design with abstract patterns in blue, red, and yellow. Sports theme with motivational text"
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* Optional Fields - Collapsed by Default */}
                  <div className="pt-4 border-t border-gray-200">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Optional: Add more details (colors, placement)
                      </summary>
                      
                      <div className="mt-4 space-y-4 pl-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Colors <span className="text-gray-400 text-xs">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.preferred_colors}
                            onChange={(e) => handleInputChange('preferred_colors', e.target.value)}
                            placeholder="e.g., blue, red, white, black"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                          />
                          <p className="mt-1 text-xs text-gray-500">Leave blank if you want AI to choose colors</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Where should the design be printed? <span className="text-gray-400 text-xs">(optional)</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsPrintPlacementDropdownOpen(!isPrintPlacementDropdownOpen)}
                              onBlur={() => setTimeout(() => setIsPrintPlacementDropdownOpen(false), 200)}
                              className={`appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between ${
                                !formData.print_placement ? 'text-gray-500' : 'text-black'
                              }`}
                            >
                              <span>
                                {formData.print_placement || 'Choose placement (default: Front Center)'}
                              </span>
                              <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform ${isPrintPlacementDropdownOpen ? 'transform rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                              </svg>
                            </button>
                            
                            {isPrintPlacementDropdownOpen && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                <div className="max-h-[180px] overflow-y-auto">
                                  {[
                                    'Front Center',
                                    'Back Center',
                                    'Front & Back',
                                    'Left Chest',
                                    'Sleeve',
                                    'Full Print'
                                  ].map((option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => {
                                        handleInputChange('print_placement', option);
                                        setIsPrintPlacementDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                        formData.print_placement === option ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full px-6 py-3 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Design...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Design
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Design Preview</h2>
              
              {generatedDesign ? (
                <div className="space-y-4">
                  <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={generatedDesign}
                      alt="Generated Design"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    disabled={isGenerating}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Publish Design
                  </button>
                </div>
              ) : (
                <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Generated design will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Publish Design</h2>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isPublishing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Add details about your design to publish it to all manufacturers in the network.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={publishData.quantity}
                  onChange={(e) => setPublishData({ ...publishData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black"
                  disabled={isPublishing}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Per Unit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={publishData.pricePerUnit}
                    onChange={(e) => setPublishData({ ...publishData, pricePerUnit: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black"
                    disabled={isPublishing}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                disabled={isPublishing}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

