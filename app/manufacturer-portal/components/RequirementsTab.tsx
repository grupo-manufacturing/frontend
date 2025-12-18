'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

export default function RequirementsTab() {
  const toast = useToast();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [responseForm, setResponseForm] = useState({
    pricePerUnit: '',
    deliveryTime: '',
    notes: ''
  });
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Fetch Requirements
  const fetchRequirements = async () => {
    setIsLoadingRequirements(true);
    
    try {
      const response = await apiService.getRequirements();
      
      if (response.success && response.data) {
        // Fetch manufacturer's own responses to check which requirements they've already responded to
        const myResponsesResult = await apiService.getMyRequirementResponses();
        const myResponses = myResponsesResult.success ? myResponsesResult.data : [];
        
        // Create a map of requirement IDs to response status
        const responseMap = new Map();
        myResponses.forEach((resp: any) => {
          responseMap.set(resp.requirement_id, resp);
        });
        
        // Add hasResponse flag to each requirement
        const enrichedRequirements = response.data.map((req: any) => ({
          ...req,
          hasResponse: responseMap.has(req.id),
          myResponse: responseMap.get(req.id)
        }));
        
        setRequirements(enrichedRequirements);
      } else {
        setRequirements([]);
      }
    } catch (error) {
      setRequirements([]);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  // Fetch requirements on mount
  useEffect(() => {
    fetchRequirements();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showResponseModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showResponseModal]);

  // Handle respond to requirement
  const handleRespondToRequirement = (requirement: any) => {
    // Check if manufacturer has already responded to this requirement
    if (requirement.hasResponse) {
      toast.warning('You have already submitted a quote for this requirement.');
      return;
    }
    
    setSelectedRequirement(requirement);
    setResponseForm({
      pricePerUnit: '',
      deliveryTime: '',
      notes: ''
    });
    setShowPriceBreakdown(false);
    setShowResponseModal(true);
  };

  /**
   * Calculate platform fee - fixed 10% of base price
   * @param basePrice - Base price before GST and platform fee
   * @param gst - GST amount (not used but kept for consistency)
   * @returns Object with platformFee amount and feePercentage for display
   */
  const calculatePlatformFee = (basePrice: number, gst: number): { platformFee: number; feePercentage: number } => {
    const platformFeeRate = 0.10; // Fixed 10%
    const platformFee = basePrice * platformFeeRate;
    
    return { platformFee, feePercentage: platformFeeRate };
  };

  // Handle submit response
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequirement) return;

    // Validate required fields
    if (!responseForm.pricePerUnit || !responseForm.deliveryTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingResponse(true);
    
    try {
      const quantity = selectedRequirement.quantity || 1;
      const pricePerUnit = parseFloat(responseForm.pricePerUnit);
      const basePrice = pricePerUnit * quantity;
      const gst = basePrice * 0.05; // 5% GST
      const { platformFee } = calculatePlatformFee(basePrice, gst);
      const totalQuotedPrice = basePrice + gst + platformFee;

      const responseData = {
        quoted_price: totalQuotedPrice,
        price_per_unit: pricePerUnit,
        delivery_time: responseForm.deliveryTime,
        notes: responseForm.notes || null
      };

      const response = await apiService.createRequirementResponse(selectedRequirement.id, responseData);

      if (response.success) {
        toast.success('Quote submitted successfully!');
        setShowResponseModal(false);
        setSelectedRequirement(null);
        // Refresh requirements list
        fetchRequirements();
      } else {
        toast.error(response.message || 'Failed to submit response. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Format requirement text - capitalize first letter, fix common typos
  const formatText = (text: string) => {
    if (!text) return '';
    return text.trim()
      .replace(/\bneeed\b/gi, 'need')
      .replace(/\bi\b/g, 'I')
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Format brand and product type
  const formatBrand = (brand: string) => {
    if (!brand) return '';
    return brand.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Determine status tag - check rejected first, then accepted, then negotiating
  const getStatusTag = (req: any) => {
    if (req.hasResponse && req.myResponse) {
      // Get status from myResponse, handling different possible field names
      const status = (req.myResponse.status || req.myResponse.response_status || '').toLowerCase().trim();
      
      // Check rejected first (highest priority) - this should override negotiating
      if (status === 'rejected') {
        return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
      }
      // Then check accepted
      if (status === 'accepted') {
        return { label: 'Accepted', color: 'bg-green-100 text-green-700' };
      }
      // Finally negotiating (only if not rejected or accepted)
      if (status === 'negotiating') {
        return { label: 'Negotiating', color: 'bg-blue-100 text-blue-700' };
      }
      // If status exists but doesn't match known values, show it anyway
      if (status) {
        return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-100 text-gray-700' };
      }
    }
    return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Buyer requirements</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-black">Requirements</h1>
          <div className="h-8 w-0.5 bg-[#22a2f2]/30"></div>
        </div>
        <p className="text-sm font-medium text-gray-500">View and respond to buyer requirements</p>
      </div>

      {/* Loading State */}
      {isLoadingRequirements && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading requirements...</p>
          </div>
        </div>
      )}

      {/* Requirements Grid */}
      {!isLoadingRequirements && requirements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requirements.map((req: any) => {
            const statusTag = getStatusTag(req);
            const formattedRequirement = formatText(req.requirement_text);
            const formattedType = req.product_type ? formatBrand(req.product_type) : '';

            return (
              <div 
                key={req.id} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 p-5 aspect-square flex flex-col cursor-pointer group"
                onClick={() => !req.hasResponse && handleRespondToRequirement(req)}
              >
                {/* Date badge - smaller and positioned better */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {req.requirement_no && (
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                        {req.requirement_no}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusTag.color}`}>
                      {statusTag.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium">
                    {new Date(req.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                {/* Requirement title - larger and bolder */}
                <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug line-clamp-2 group-hover:text-[#22a2f2] transition-colors">
                  {formattedRequirement}
                </h3>
                
                {/* Details - reduced label emphasis, increased value emphasis */}
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-normal">Buyer</span>
                    <span className="text-gray-900 font-semibold text-right truncate ml-2">{req.buyer?.full_name || 'N/A'}</span>
                  </div>
                  {req.quantity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 font-normal">Quantity</span>
                      <span className="text-gray-900 font-semibold">{req.quantity.toLocaleString()}</span>
                    </div>
                  )}
                  {formattedType && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 font-normal">Type</span>
                      <span className="text-gray-900 font-semibold text-right truncate ml-2 capitalize">{formattedType}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-3"></div>

                {/* Action button - smaller and better styled */}
                <div className="mt-auto">
                  {req.hasResponse ? (
                    (() => {
                      return (
                        <div className="w-full bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Quote Submitted</span>
                        </div>
                      );
                    })()
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRespondToRequirement(req);
                      }}
                      className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      title="View details & submit quote"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Submit Quote</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingRequirements && requirements.length === 0 && (
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-black mb-2">No Requirements Yet</h3>
            <p className="text-gray-400 max-w-md">
              No buyer requirements are available at the moment. Check back later for new opportunities.
            </p>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequirement && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={() => setShowResponseModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10 shrink-0">
              <h3 className="text-xl font-bold text-black">Submit Quote</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-2">Requirement:</p>
                <p className="text-gray-800">{selectedRequirement.requirement_text}</p>
                {selectedRequirement.quantity && (
                  <p className="text-sm text-gray-600 mt-2">Quantity: {selectedRequirement.quantity.toLocaleString()}</p>
                )}
              </div>

              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Per Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={responseForm.pricePerUnit}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow integers (no decimals)
                      if (value === '' || /^\d+$/.test(value)) {
                        setResponseForm({...responseForm, pricePerUnit: value});
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent decimal point and other non-numeric characters
                      if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the price per unit (whole numbers only, before taxes and fees)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={responseForm.deliveryTime}
                    onChange={(e) => setResponseForm({...responseForm, deliveryTime: e.target.value})}
                    placeholder="e.g., 20-25 days"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={responseForm.notes}
                    onChange={(e) => setResponseForm({...responseForm, notes: e.target.value})}
                    placeholder="Any additional details or terms..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 resize-none"
                  />
                </div>

                {/* Total Quote Price Section */}
                {responseForm.pricePerUnit && selectedRequirement?.quantity && (
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
                              const quantity = selectedRequirement.quantity || 1;
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
                            <span className="text-gray-600">Base Price ({selectedRequirement.quantity.toLocaleString()} × ₹{parseFloat(responseForm.pricePerUnit || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })})</span>
                            <span className="font-semibold text-gray-900">
                              ₹{(() => {
                                const quantity = selectedRequirement.quantity || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                return (pricePerUnit * quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GST (5%)</span>
                            <span className="font-semibold text-gray-900">
                              ₹{(() => {
                                const quantity = selectedRequirement.quantity || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                return (basePrice * 0.05).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Platform Fee ({(() => {
                              const quantity = selectedRequirement.quantity || 1;
                              const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                              const basePrice = pricePerUnit * quantity;
                              const gst = basePrice * 0.05;
                              const { feePercentage } = calculatePlatformFee(basePrice, gst);
                              return `${(feePercentage * 100).toFixed(0)}%`;
                            })()})</span>
                            <span className="font-semibold text-gray-900">
                              ₹{(() => {
                                const quantity = selectedRequirement.quantity || 1;
                                const pricePerUnit = parseFloat(responseForm.pricePerUnit) || 0;
                                const basePrice = pricePerUnit * quantity;
                                const gst = basePrice * 0.05;
                                const { platformFee } = calculatePlatformFee(basePrice, gst);
                                return platformFee.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="font-bold text-lg text-gray-900">
                              ₹{(() => {
                                const quantity = selectedRequirement.quantity || 1;
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

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 border border-gray-300 text-black font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResponse}
                    className={`flex-1 px-4 py-3 ${isSubmittingResponse ? 'bg-gray-400' : 'bg-[#22a2f2] hover:bg-[#1b8bd0]'} text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2`}
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
                        <span>Submit Quote</span>
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

