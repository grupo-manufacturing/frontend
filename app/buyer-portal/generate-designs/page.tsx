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

  // Form state
  const [formData, setFormData] = useState({
    design_style: '',
    apparel_type: '',
    theme_concept: '',
    target_audience: '',
    print_placement: '',
    main_elements: '',
    preferred_colors: '',
    colors_to_avoid: '',
    text_style: '',
    text_content: '',
    mood: '',
    art_style: '',
    complexity_level: '',
    background_type: '',
    fabric_color: ''
  });

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
    // Validate required fields
    const requiredFields = ['design_style', 'apparel_type', 'theme_concept', 'target_audience', 'print_placement'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      // For now, just simulate generation (frontend only)
      // In the future, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate generated design URL (placeholder)
      setGeneratedDesign('/hero1.jpeg'); // Placeholder image
      setSuccess('Design generated successfully! You can now publish it.');
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

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      // For now, just simulate publishing (frontend only)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Design published successfully! Redirecting to designs...');
      setTimeout(() => {
        router.push('/buyer-portal');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish design. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsGenerating(false);
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
          <p className="text-gray-600">Create custom designs using AI and publish them to the marketplace</p>
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
                {/* Basic Information Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Design Style <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.design_style}
                        onChange={(e) => handleInputChange('design_style', e.target.value)}
                        placeholder="e.g., minimalist, vintage, modern, abstract"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apparel Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.apparel_type}
                        onChange={(e) => handleInputChange('apparel_type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black bg-white"
                        required
                      >
                        <option value="">Select apparel type</option>
                        <option value="T-Shirt">T-Shirt</option>
                        <option value="Hoodie">Hoodie</option>
                        <option value="Sweatshirt">Sweatshirt</option>
                        <option value="Tank Top">Tank Top</option>
                        <option value="Polo Shirt">Polo Shirt</option>
                        <option value="Long Sleeve">Long Sleeve</option>
                        <option value="Crop Top">Crop Top</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme Concept <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.theme_concept}
                        onChange={(e) => handleInputChange('theme_concept', e.target.value)}
                        placeholder="e.g., nature, space, music, sports, abstract"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.target_audience}
                        onChange={(e) => handleInputChange('target_audience', e.target.value)}
                        placeholder="e.g., teenagers, young adults, professionals, athletes"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Print Placement <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.print_placement}
                        onChange={(e) => handleInputChange('print_placement', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black bg-white"
                        required
                      >
                        <option value="">Select placement</option>
                        <option value="Front Center">Front Center</option>
                        <option value="Back Center">Back Center</option>
                        <option value="Front & Back">Front & Back</option>
                        <option value="Left Chest">Left Chest</option>
                        <option value="Sleeve">Sleeve</option>
                        <option value="Full Print">Full Print</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Design Preferences Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Design Preferences</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Elements
                      </label>
                      <textarea
                        value={formData.main_elements}
                        onChange={(e) => handleInputChange('main_elements', e.target.value)}
                        placeholder="e.g., geometric shapes, animals, text, logos, illustrations"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Colors to Use
                        </label>
                        <input
                          type="text"
                          value={formData.preferred_colors}
                          onChange={(e) => handleInputChange('preferred_colors', e.target.value)}
                          placeholder="e.g., blue, red, white"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Colors to Avoid
                        </label>
                        <input
                          type="text"
                          value={formData.colors_to_avoid}
                          onChange={(e) => handleInputChange('colors_to_avoid', e.target.value)}
                          placeholder="e.g., yellow, orange"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Typography Style (if text included)
                        </label>
                        <input
                          type="text"
                          value={formData.text_style}
                          onChange={(e) => handleInputChange('text_style', e.target.value)}
                          placeholder="e.g., bold, script, sans-serif, handwritten"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text Content (if any)
                        </label>
                        <input
                          type="text"
                          value={formData.text_content}
                          onChange={(e) => handleInputChange('text_content', e.target.value)}
                          placeholder="Enter text to include in design"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mood/Feel
                        </label>
                        <input
                          type="text"
                          value={formData.mood}
                          onChange={(e) => handleInputChange('mood', e.target.value)}
                          placeholder="e.g., energetic, calm, playful, serious"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Art Style
                        </label>
                        <input
                          type="text"
                          value={formData.art_style}
                          onChange={(e) => handleInputChange('art_style', e.target.value)}
                          placeholder="e.g., realistic, cartoon, abstract, line art"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Complexity Level
                        </label>
                        <select
                          value={formData.complexity_level}
                          onChange={(e) => handleInputChange('complexity_level', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black bg-white"
                        >
                          <option value="">Select complexity</option>
                          <option value="minimal">Minimal</option>
                          <option value="detailed">Detailed</option>
                          <option value="extremely intricate">Extremely Intricate</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Type
                        </label>
                        <select
                          value={formData.background_type}
                          onChange={(e) => handleInputChange('background_type', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black bg-white"
                        >
                          <option value="">Select background</option>
                          <option value="transparent">Transparent</option>
                          <option value="plain">Plain</option>
                          <option value="full art background">Full Art Background</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fabric Color
                      </label>
                      <input
                        type="text"
                        value={formData.fabric_color}
                        onChange={(e) => handleInputChange('fabric_color', e.target.value)}
                        placeholder="e.g., white, black, navy blue, gray"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                      />
                    </div>
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
                    onClick={handlePublish}
                    disabled={isGenerating}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
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
                        Publish Design
                      </>
                    )}
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
    </div>
  );
}

