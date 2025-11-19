'use client';

import { useState } from 'react';
import apiService from '../lib/apiService';

interface InstantQuoteProps {
  onOpenChat: (quote: any) => void;
}

interface Manufacturer {
  id: string | number;
  unit_name?: string;
  verification_status?: string;
  msme_number?: string;
  product_types?: string[];
  daily_capacity?: number;
  is_verified?: boolean;
  location?: string;
  business_type?: string;
}

export default function InstantQuote({ onOpenChat }: InstantQuoteProps) {
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
  const [hasFetchedQuotes, setHasFetchedQuotes] = useState(false);

  const handleGenerateQuotes = async () => {
    // Validate required fields
    if (!brandName || !productType || !quantity) {
      alert('Please fill in Brand Name, Product Type, and Quantity');
      return;
    }

    setIsLoadingQuotes(true);
    setHasFetchedQuotes(false);
    setQuotes([]);
    
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
            badge: manufacturer.is_verified ? 'Verified' : 'Standard',
            rating: 4.5 + (Math.random() * 0.5), // Random rating between 4.5-5.0
            totalPrice,
            pricePerUnit,
            delivery: `${deliveryDays} days`,
            features: features.slice(0, 4), // Limit to 4 features
            bestValue: index === 0 // First one is best value
          };
        });

        setQuotes(mappedQuotes);
        setHasFetchedQuotes(true);
      } else {
        // Fallback if no manufacturers found
        alert('No manufacturers found. Please try again later.');
        setQuotes([]);
        setHasFetchedQuotes(false);
      }
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      alert('Failed to fetch manufacturers. Please try again.');
      setQuotes([]);
      setHasFetchedQuotes(false);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-1">
      {/* Order Requirements Form */}
      <div className="mb-3">
        <form className="space-y-2.5">
            {/* Brand Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Brand Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Urban Threads"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-sm text-black placeholder:text-gray-500"
              />
            </div>

            {/* Product Type and Fabric Type Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] outline-none text-sm text-black"
                >
                  <option value="">Select</option>
                  <option value="t-shirt">T-Shirt</option>
                  <option value="hoodie">Hoodie</option>
                  <option value="pants">Pants</option>
                  <option value="jacket">Jacket</option>
                  <option value="dress">Dress</option>
                  <option value="shirt">Shirt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fabric Type
                </label>
                <select
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] outline-none text-sm text-black"
                >
                  <option value="">Select</option>
                  <option value="cotton">Cotton</option>
                  <option value="polyester">Polyester</option>
                  <option value="blend">Blend</option>
                  <option value="silk">Silk</option>
                  <option value="wool">Wool</option>
                  <option value="linen">Linen</option>
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] outline-none text-sm text-black placeholder:text-gray-500"
              />
            </div>

            {/* Colors and Sizes Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Colors
                </label>
                <input
                  type="text"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  placeholder="Black, White"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] outline-none text-sm text-black placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sizes
                </label>
                <input
                  type="text"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                  placeholder="S, M, L, XL"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] outline-none text-sm text-black placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Details
              </label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Special requirements..."
                rows={2}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[#22a2f2] outline-none text-sm resize-none text-black placeholder:text-gray-500"
              />
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateQuotes}
              disabled={isLoadingQuotes}
              className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {isLoadingQuotes ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Get Quotes
                </>
              )}
            </button>
          </form>
      </div>

      {/* Quotes Display Section */}
      {hasFetchedQuotes && quotes.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-bold text-black mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Available Quotes ({quotes.length})
          </h3>
          <div className="space-y-2.5">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:border-[#22a2f2] hover:shadow-md transition-all relative">
                {/* Best Value Badge */}
                {quote.bestValue && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Best
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-2">
                  <div className="flex items-start justify-between mb-1.5">
                    <h4 className="font-bold text-sm text-black pr-2">{quote.manufacturer}</h4>
                    <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[11px] font-semibold text-gray-700">{quote.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    quote.badge === 'Premium' 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'bg-[#22a2f2]/10 text-[#22a2f2]'
                  }`}>
                    {quote.badge}
                  </span>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2 mb-2 pb-2 border-b border-gray-200">
                  <div className="bg-gray-50 rounded p-1.5">
                    <p className="text-[10px] text-gray-600 mb-0.5">Total</p>
                    <p className="text-base font-bold text-black">₹{quote.totalPrice.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-1.5">
                    <p className="text-[10px] text-gray-600 mb-0.5">Per Unit</p>
                    <p className="text-base font-bold text-black">₹{quote.pricePerUnit.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-1.5 mb-2 text-xs bg-blue-50 rounded p-1.5">
                  <svg className="w-3 h-3 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[11px] text-gray-700">Delivery: <strong>{quote.delivery}</strong></span>
                </div>

                {/* Features - Compact */}
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {quote.features.slice(0, 3).map((feature: string, index: number) => (
                      <span key={index} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => onOpenChat(quote)}
                  className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white py-1.5 font-medium rounded transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

