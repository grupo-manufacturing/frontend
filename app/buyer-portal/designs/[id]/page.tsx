'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import apiService from '../../../lib/apiService';

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const designId = params?.id as string;

  const [design, setDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuantityRange, setSelectedQuantityRange] = useState<'1-50' | '51-100' | '101-200' | null>(null);
  const [sizeQuantities, setSizeQuantities] = useState({
    XS: '' as number | '',
    S: '' as number | '',
    M: '' as number | '',
    L: '' as number | '',
    XL: '' as number | '',
    XXL: '' as number | '',
    '3XL': '' as number | ''
  });
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;

  useEffect(() => {
    if (designId) {
      fetchDesign();
    }
    fetchUserProfile();
  }, [designId]);

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
        const resolvedName = (profile.full_name || '').trim();
        if (resolvedName) {
          setDisplayName(resolvedName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleLogout = async () => {
    await apiService.logout('/buyer-portal');
  };

  useEffect(() => {
    // Calculate total quantity from size quantities
    const total = Object.values(sizeQuantities).reduce((sum, qty) => {
      const numQty = typeof qty === 'number' ? qty : 0;
      return sum + numQty;
    }, 0);
    setTotalQuantity(total);

    // Auto-select quantity range based on total
    if (total > 0) {
      if (total <= 50) {
        setSelectedQuantityRange('1-50');
      } else if (total <= 100) {
        setSelectedQuantityRange('51-100');
      } else if (total <= 200) {
        setSelectedQuantityRange('101-200');
      }
    }
  }, [sizeQuantities]);

  const fetchDesign = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getDesign(designId);
      if (response.success && response.data) {
        setDesign(response.data.design);
        // Auto-select first available quantity range
        const designData = response.data.design;
        if (designData.price_1_50) {
          setSelectedQuantityRange('1-50');
        } else if (designData.price_51_100) {
          setSelectedQuantityRange('51-100');
        } else if (designData.price_101_200) {
          setSelectedQuantityRange('101-200');
        }
      } else {
        console.error('Failed to fetch design');
        router.push('/buyer-portal');
      }
    } catch (error) {
      console.error('Failed to fetch design:', error);
      router.push('/buyer-portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityRangeSelect = (range: '1-50' | '51-100' | '101-200') => {
    setSelectedQuantityRange(range);
    
    // Reset size quantities when range changes
    setSizeQuantities({
      XS: '',
      S: '',
      M: '',
      L: '',
      XL: '',
      XXL: '',
      '3XL': ''
    });
  };

  const handleSizeQuantityChange = (size: typeof sizes[number], value: string) => {
    // Remove any non-numeric characters (except empty string)
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // If empty, set to empty string
    if (numericValue === '') {
      setSizeQuantities(prev => ({
        ...prev,
        [size]: ''
      }));
      return;
    }
    
    // Convert to number and validate
    const numValue = parseInt(numericValue, 10);
    if (isNaN(numValue)) {
      return;
    }
    
    const maxQty = selectedQuantityRange === '1-50' ? 50 : selectedQuantityRange === '51-100' ? 100 : 200;
    const currentTotal = Object.values(sizeQuantities).reduce((sum, qty) => {
      const numQty = typeof qty === 'number' ? qty : 0;
      return sum + numQty;
    }, 0);
    const currentSizeQty = typeof sizeQuantities[size] === 'number' ? sizeQuantities[size] : 0;
    const newValue = Math.max(0, Math.min(numValue, maxQty - (currentTotal - currentSizeQty)));
    
    setSizeQuantities(prev => ({
      ...prev,
      [size]: newValue
    }));
  };

  const getPriceForRange = () => {
    if (!design || !selectedQuantityRange) return null;
    if (selectedQuantityRange === '1-50') return design.price_1_50;
    if (selectedQuantityRange === '51-100') return design.price_51_100;
    if (selectedQuantityRange === '101-200') return design.price_101_200;
    return null;
  };

  const getMaxQuantity = () => {
    if (selectedQuantityRange === '1-50') return 50;
    if (selectedQuantityRange === '51-100') return 100;
    if (selectedQuantityRange === '101-200') return 200;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-12 h-12 text-[#22a2f2]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <button
            onClick={() => router.push('/buyer-portal')}
            className="px-4 py-2 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-colors"
          >
            Back to Designs
          </button>
        </div>
      </div>
    );
  }

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
                  <span className="text-lg font-bold text-black">
                    Grupo
                  </span>
                  <span className="text-xs text-gray-600 hidden sm:block">
                    Your Manufacturing Partner
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Profile Info & Actions */}
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

              {/* Profile Button */}
              <Link
                href="/buyer-portal/profile"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium hidden lg:inline">Profile</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
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
                <span className="font-medium hidden lg:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left Side - Product Image */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                {design.image_url ? (
                  <img
                    src={design.image_url}
                    alt={design.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Product Name */}
              <div>
                <h1 className="text-3xl font-bold text-black mb-3">{design.product_name}</h1>
                {design.manufacturer_profiles && design.manufacturer_profiles.unit_name && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#22a2f2]/10 text-[#22a2f2] rounded-lg text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{design.manufacturer_profiles.unit_name}</span>
                  </div>
                )}
              </div>

              {/* Quantity Range Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-5">Select Quantity Range</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {design.price_1_50 && (
                    <button
                      onClick={() => handleQuantityRangeSelect('1-50')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedQuantityRange === '1-50'
                          ? 'border-[#22a2f2] bg-[#22a2f2]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">1-50 pieces</div>
                      <div className="text-lg font-bold text-[#22a2f2]">₹{design.price_1_50}</div>
                    </button>
                  )}
                  {design.price_51_100 && (
                    <button
                      onClick={() => handleQuantityRangeSelect('51-100')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedQuantityRange === '51-100'
                          ? 'border-[#22a2f2] bg-[#22a2f2]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">51-100 pieces</div>
                      <div className="text-lg font-bold text-[#22a2f2]">₹{design.price_51_100}</div>
                    </button>
                  )}
                  {design.price_101_200 && (
                    <button
                      onClick={() => handleQuantityRangeSelect('101-200')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedQuantityRange === '101-200'
                          ? 'border-[#22a2f2] bg-[#22a2f2]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">101-200 pieces</div>
                      <div className="text-lg font-bold text-[#22a2f2]">₹{design.price_101_200}</div>
                    </button>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              {selectedQuantityRange && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-semibold text-gray-900">Select Sizes & Quantities</h2>
                    <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                      Total: {totalQuantity} pieces / {getMaxQuantity()} max
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sizes.map((size) => (
                      <div key={size} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 text-center">
                          {size}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          value={sizeQuantities[size] === '' ? '' : sizeQuantities[size]}
                          onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                          onKeyDown={(e) => {
                            // Prevent decimal point, minus, plus, and 'e' key
                            if (e.key === '.' || e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 text-center border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-400"
                          disabled={!selectedQuantityRange}
                        />
                      </div>
                    ))}
                  </div>
                  {totalQuantity > getMaxQuantity() && (
                    <p className="mt-2 text-sm text-red-600">
                      Total quantity cannot exceed {getMaxQuantity()} pieces for this range
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  className="flex-1 px-6 py-3 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedQuantityRange || totalQuantity === 0 || totalQuantity !== getMaxQuantity()}
                >
                  Add to Cart
                </button>
                <button
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 transition-colors"
                >
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

