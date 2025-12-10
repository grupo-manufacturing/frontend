'use client';

import { useState, useEffect } from 'react';
import apiService from '../../lib/apiService';

export default function AIRequirements() {
  const [aiDesigns, setAiDesigns] = useState<any[]>([]);
  const [isLoadingAiDesigns, setIsLoadingAiDesigns] = useState(false);

  // Fetch AI Designs
  const fetchAiDesigns = async () => {
    setIsLoadingAiDesigns(true);
    try {
      const response = await apiService.getAIDesigns();
      if (response.success && response.data) {
        setAiDesigns(response.data || []);
      } else {
        console.error('Failed to fetch AI designs');
        setAiDesigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch AI designs:', error);
      setAiDesigns([]);
    } finally {
      setIsLoadingAiDesigns(false);
    }
  };

  // Fetch AI designs on mount
  useEffect(() => {
    fetchAiDesigns();
  }, []);

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>AI Generated Designs</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-black">AI Requirements</h1>
          <div className="h-8 w-0.5 bg-[#22a2f2]/30"></div>
        </div>
        <p className="text-sm font-medium text-gray-500">View AI-generated designs published by buyers</p>
      </div>

      {/* Loading State */}
      {isLoadingAiDesigns && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading AI designs...</p>
          </div>
        </div>
      )}

      {/* AI Designs Grid */}
      {!isLoadingAiDesigns && aiDesigns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiDesigns.map((aiDesign: any) => (
            <div 
              key={aiDesign.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 p-5 aspect-square flex flex-col group"
            >
              {/* AI Badge and Date */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2]">
                    AI Generated
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium">
                  {new Date(aiDesign.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              {/* Design Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg mb-4">
                <img
                  src={aiDesign.image_url}
                  alt={aiDesign.apparel_type || 'AI Design'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Design Title */}
              <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug line-clamp-2 group-hover:text-[#22a2f2] transition-colors">
                {aiDesign.apparel_type}
              </h3>
              
              {/* Details */}
              <div className="space-y-2 mb-4 flex-1">
                {aiDesign.design_description && (
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {aiDesign.design_description}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-normal">Quantity</span>
                  <span className="text-gray-900 font-semibold">{aiDesign.quantity?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-normal">Price/Unit</span>
                  <span className="text-gray-900 font-semibold">₹{aiDesign.price_per_unit?.toLocaleString() || 'N/A'}</span>
                </div>
                {aiDesign.buyer && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-normal">Buyer</span>
                    <span className="text-gray-900 font-semibold text-right truncate ml-2">{aiDesign.buyer.full_name || 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-3"></div>

              {/* View Details Button */}
              <button
                className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                onClick={() => {
                  // For now, just show an alert. Later can add a modal or detail page
                  alert(`AI Design Details:\n\nApparel Type: ${aiDesign.apparel_type}\nQuantity: ${aiDesign.quantity}\nPrice Per Unit: ₹${aiDesign.price_per_unit}\n${aiDesign.design_description ? `Description: ${aiDesign.design_description}` : ''}`);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Details</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingAiDesigns && aiDesigns.length === 0 && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#22a2f2]/30 rounded-full blur-xl opacity-40"></div>
              <div className="relative bg-[#22a2f2]/10 rounded-full p-6 border border-[#22a2f2]/30">
                <svg
                  className="w-16 h-16 text-[#22a2f2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-black mb-2">No AI Designs Yet</h3>
            <p className="text-gray-400 max-w-md">
              No AI-generated designs have been published by buyers yet. Check back later for new opportunities.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

