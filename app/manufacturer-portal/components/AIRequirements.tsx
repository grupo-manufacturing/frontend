'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiService from '../../lib/apiService';

export default function AIRequirements() {
  const [aiDesigns, setAiDesigns] = useState<any[]>([]);
  const [isLoadingAiDesigns, setIsLoadingAiDesigns] = useState(false);
  const [selectedAiDesign, setSelectedAiDesign] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    pricePerUnit: '',
    quantity: ''
  });
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  /**
   * Calculate platform fee based on tiered structure
   * Fee percentage is determined by the total quote price (base + GST + platform fee)
   * Uses iterative approach to handle circular dependency
   * @param basePrice - Base price before GST and platform fee
   * @param gst - GST amount
   * @returns Object with platformFee amount and feePercentage for display
   */
  const calculatePlatformFee = (basePrice: number, gst: number): { platformFee: number; feePercentage: number } => {
    // Start with an estimate based on base + GST to determine bracket
    let platformFeeRate = 0.15; // Default
    let platformFee = basePrice * platformFeeRate;
    
    // Iterate a few times to converge on the correct fee
    // The fee percentage depends on the final total, so we need to approximate
    for (let i = 0; i < 5; i++) {
      const total = basePrice + gst + platformFee;
      
      // Determine fee percentage based on total quote price
      // Tiered structure:
      // 0 to 1 Lakh (0-100000) → 20%
      // 1 Lakh to 2 Lakh (100001-200000) → 15%
      // 2 Lakh to 5 Lakh (200001-500000) → 8%
      // Above 5 Lakh (500001+) → 5%
      if (total <= 100000) {
        platformFeeRate = 0.20; // 20%
      } else if (total <= 200000) {
        platformFeeRate = 0.15; // 15%
      } else if (total <= 500000) {
        platformFeeRate = 0.08; // 8%
      } else {
        platformFeeRate = 0.05; // 5%
      }
      
      // Recalculate platform fee based on new rate
      const newPlatformFee = basePrice * platformFeeRate;
      
      // Check if we've converged (change is less than 0.01)
      if (Math.abs(newPlatformFee - platformFee) < 0.01) {
        break;
      }
      
      platformFee = newPlatformFee;
    }
    
    return { platformFee, feePercentage: platformFeeRate };
  };
  const [manufacturerId, setManufacturerId] = useState<string | null>(null);
  const [respondedDesignIds, setRespondedDesignIds] = useState<Set<string>>(new Set());

  // Fetch manufacturer profile to get ID
  useEffect(() => {
    const fetchManufacturerProfile = async () => {
      try {
        const response = await apiService.getManufacturerProfile();
        if (response.success && response.data?.profile?.id) {
          setManufacturerId(response.data.profile.id);
        }
      } catch (error) {
        console.error('Failed to fetch manufacturer profile:', error);
      }
    };
    fetchManufacturerProfile();
  }, []);

  // Fetch AI Designs with response status
  const fetchAiDesigns = async () => {
    setIsLoadingAiDesigns(true);
    try {
      // Use include_responses to optimize N+1 queries - responses are fetched in batch
      const response = await apiService.getAIDesigns({ include_responses: true });
      if (response.success && response.data) {
        const designs = response.data || [];
        
        // Process designs with responses (already included in response)
        const designsWithResponseStatus = designs.map((design: any) => {
          const responses = design.responses || [];
          // Check if current manufacturer has responded and get their response status
          const manufacturerResponse = manufacturerId ? responses.find(
            (resp: any) => resp.manufacturer_id === manufacturerId
          ) : null;
          return {
            ...design,
            hasResponded: !!manufacturerResponse,
            responseStatus: manufacturerResponse?.status || null
          };
        });
        
        setAiDesigns(designsWithResponseStatus);
        
        // Update responded design IDs set
        const respondedIds = new Set<string>();
        designsWithResponseStatus.forEach((design: any) => {
          if (design.hasResponded) {
            respondedIds.add(design.id);
          }
        });
        setRespondedDesignIds(respondedIds);
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

  // Fetch AI designs on mount and when manufacturer ID is available
  useEffect(() => {
    if (manufacturerId) {
      fetchAiDesigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturerId]);

  // Handle submit response
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAiDesign) return;

    // Validate form
    if (!responseForm.pricePerUnit || parseFloat(responseForm.pricePerUnit) <= 0) {
      alert('Please enter a valid price per unit');
      return;
    }

    if (!responseForm.quantity || parseInt(responseForm.quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setIsSubmittingResponse(true);

    try {
      const response = await apiService.createAIDesignResponse({
        ai_design_id: selectedAiDesign.id,
        price_per_unit: parseFloat(responseForm.pricePerUnit),
        quantity: parseInt(responseForm.quantity)
      });

      if (response.success) {
        // Reset form and close modal
        setResponseForm({ pricePerUnit: '', quantity: '' });
        setShowResponseModal(false);
        setSelectedAiDesign(null);
        
        // Refresh AI designs list
        await fetchAiDesigns();
        
        alert('Response submitted successfully!');
      } else {
        // Handle specific error messages
        const errorMessage = response.message || 'Failed to submit response';
        if (errorMessage.includes('already responded') || errorMessage.includes('already responded')) {
          alert('You have already responded to this AI design. You can only respond once per design.');
          setShowResponseModal(false);
          setSelectedAiDesign(null);
        } else {
          alert(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Error submitting response:', error);
      const errorMessage = error.message || 'Failed to submit response. Please try again.';
      // Check for 409 status (conflict) or duplicate response message
      if (errorMessage.includes('already responded') || 
          errorMessage.includes('409') || 
          (error.response && error.response.status === 409)) {
        alert('You have already responded to this AI design. You can only respond once per design.');
        setShowResponseModal(false);
        setSelectedAiDesign(null);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSubmittingResponse(false);
    }
  };

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
                {/* Status Badge */}
                {aiDesign.responseStatus ? (
                  <div className={`absolute top-2 right-2 px-2 py-1 text-white text-xs font-semibold rounded-lg ${
                    aiDesign.responseStatus === 'accepted'
                      ? 'bg-green-600'
                      : aiDesign.responseStatus === 'rejected'
                      ? 'bg-red-600'
                      : 'bg-gray-600'
                  }`}>
                    {aiDesign.responseStatus === 'accepted' ? 'Accepted' : 
                     aiDesign.responseStatus === 'rejected' ? 'Rejected' : 
                     'Submitted'}
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-[#22a2f2] text-white text-xs font-semibold rounded-lg">
                    AI
                  </div>
                )}
              </div>
              
              {/* Design Title */}
              <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug line-clamp-2 group-hover:text-[#22a2f2] transition-colors">
                {aiDesign.apparel_type}
              </h3>
              
              {/* Details */}
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-normal">Quantity</span>
                  <span className="text-gray-900 font-semibold">{aiDesign.quantity?.toLocaleString() || 'N/A'}</span>
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

              {/* Respond Button */}
              <button
                className={`w-full px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm ${
                  aiDesign.hasResponded
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-[#22a2f2] hover:bg-[#1b8bd0] text-white hover:shadow-md'
                }`}
                onClick={() => {
                  if (!aiDesign.hasResponded) {
                    setSelectedAiDesign(aiDesign);
                    setShowResponseModal(true);
                  }
                }}
                disabled={aiDesign.hasResponded}
              >
                {aiDesign.hasResponded ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Already Responded</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Respond</span>
                  </>
                )}
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

      {/* Response Modal */}
      {showResponseModal && selectedAiDesign && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={() => !isSubmittingResponse && setShowResponseModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10 shrink-0">
              <h3 className="text-xl font-bold text-black">Respond to AI Design</h3>
              <button
                onClick={() => !isSubmittingResponse && setShowResponseModal(false)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                disabled={isSubmittingResponse}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {/* AI Design Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-200 rounded-lg">
                    <img
                      src={selectedAiDesign.image_url}
                      alt={selectedAiDesign.apparel_type || 'AI Design'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 mb-1">{selectedAiDesign.apparel_type}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>Buyer Qty: {selectedAiDesign.quantity?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Per Unit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={responseForm.pricePerUnit}
                      onChange={(e) => setResponseForm({...responseForm, pricePerUnit: e.target.value})}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black"
                      required
                      disabled={isSubmittingResponse}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={responseForm.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow integers (no decimals)
                      if (value === '' || /^\d+$/.test(value)) {
                        setResponseForm({...responseForm, quantity: value});
                      }
                    }}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black"
                    required
                    disabled={isSubmittingResponse}
                  />
                </div>

                {/* Total Quote Price Section */}
                {responseForm.pricePerUnit && responseForm.quantity && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <button
                        type="button"
                        onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Total Quote Price</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ₹{(() => {
                              const quantity = parseInt(responseForm.quantity) || 1;
                              const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                              const basePrice = pricePerUnit * quantity;
                              const gst = basePrice * 0.05;
                              const { platformFee } = calculatePlatformFee(basePrice, gst);
                              return (basePrice + gst + platformFee).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                            })()}
                          </p>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${showPriceBreakdown ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showPriceBreakdown && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price ({parseInt(responseForm.quantity || '0').toLocaleString()} × ₹{parseFloat(responseForm.pricePerUnit || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })})</span>
                            <span className="font-semibold text-gray-900">
                              ₹{(() => {
                                const quantity = parseInt(responseForm.quantity) || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                return (pricePerUnit * quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GST (5%)</span>
                            <span className="font-semibold text-gray-900">
                              ₹{(() => {
                                const quantity = parseInt(responseForm.quantity) || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                return (basePrice * 0.05).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Platform Fee ({(() => {
                                const quantity = parseInt(responseForm.quantity) || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                const gst = basePrice * 0.05;
                                const { feePercentage } = calculatePlatformFee(basePrice, gst);
                                return `${(feePercentage * 100).toFixed(0)}%`;
                              })()})
                            </span>
                            <span className="font-semibold text-gray-900">
                              ₹{(() => {
                                const quantity = parseInt(responseForm.quantity) || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                const gst = basePrice * 0.05;
                                const { platformFee } = calculatePlatformFee(basePrice, gst);
                                return platformFee.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="font-bold text-gray-900">
                              ₹{(() => {
                                const quantity = parseInt(responseForm.quantity) || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                const gst = basePrice * 0.05;
                                const { platformFee } = calculatePlatformFee(basePrice, gst);
                                return (basePrice + gst + platformFee).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => !isSubmittingResponse && setShowResponseModal(false)}
                    disabled={isSubmittingResponse}
                    className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 border border-gray-300 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResponse}
                    className={`flex-1 px-4 py-3 ${isSubmittingResponse ? 'bg-gray-400' : 'bg-[#22a2f2] hover:bg-[#1b8bd0]'} text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
                  >
                    {isSubmittingResponse ? (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Submit Response</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

