'use client';

import { useState } from 'react';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

interface MyRequirementsProps {
  requirements: any[];
  isLoadingRequirements: boolean;
  fetchRequirements: () => Promise<void>;
  onNegotiateResponse?: (requirement: any, response: any) => Promise<void>;
  onSwitchToCustomQuote?: () => void;
}

export default function MyRequirements({
  requirements,
  isLoadingRequirements,
  fetchRequirements,
  onNegotiateResponse,
  onSwitchToCustomQuote
}: MyRequirementsProps) {
  const toast = useToast();
  const [negotiatingResponseId, setNegotiatingResponseId] = useState<string | null>(null);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return '—';
    return `INR ${numericValue.toLocaleString('en-IN')}`;
  };

  // Handle Accept/Reject Response
  const handleUpdateResponseStatus = async (responseId: string, status: 'accepted' | 'rejected', manufacturerName: string) => {
    try {
      const response = await apiService.updateRequirementResponseStatus(responseId, status);
      
      if (response.success) {
        toast.success(`Quote ${status} successfully!`);
        // Refresh requirements to show updated status
        fetchRequirements();
      } else {
        toast.error(response.message || `Failed to ${status} quote. Please try again.`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${status} quote. Please try again.`);
    }
  };

  const handleNegotiate = async (requirement: any, response: any) => {
    setNegotiatingResponseId(response.id);
    if (onNegotiateResponse) {
      await onNegotiateResponse(requirement, response);
    }
    setNegotiatingResponseId(null);
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 0a2 2 0 012-2h2a2 2 0 012 2m-4 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Requirement tracker</span>
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">My Requirements</h1>
        <p className="text-gray-500">Track all your submitted requirements</p>
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

      {/* Requirements List */}
      {!isLoadingRequirements && requirements.length > 0 && (
        <div className="space-y-4">
          {requirements.map((req: any) => (
            <div key={req.id} className="bg-white rounded-xl border border-[#22a2f2]/30 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      {/* Pending Badge - Show when there are no responses */}
                      {(!req.responses || req.responses.length === 0 || req.manufacturer_count === 0) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      )}
                    </div>
                    {req.requirement_no && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                        {req.requirement_no}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 mb-3 leading-relaxed">{req.requirement_text}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                {req.quantity && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quantity</p>
                    <p className="text-sm font-semibold text-black">{req.quantity.toLocaleString()}</p>
                  </div>
                )}
                {req.product_type && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Product Type</p>
                    <p className="text-sm font-semibold text-black capitalize">{req.product_type}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Responses</p>
                  <p className="text-sm font-semibold text-[#22a2f2]">{req.manufacturer_count || 0} manufacturer{req.manufacturer_count !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {req.product_link && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a 
                    href={req.product_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-[#22a2f2] hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    View Reference Product
                  </a>
                </div>
              )}

              <div className="mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <p className="text-sm font-semibold text-black">Manufacturer Responses</p>
                  <p className="text-xs text-gray-500">
                    {req.responses && req.responses.length > 0
                      ? `${req.responses.length} response${req.responses.length === 1 ? '' : 's'} received`
                      : 'Awaiting responses'}
                  </p>
                </div>

                {req.responses && req.responses.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {req.responses.map((response: any) => (
                      <div
                        key={response.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-black">
                                {response.manufacturer?.unit_name || 'Manufacturer'}
                              </p>
                              {response.status && response.status !== 'submitted' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  response.status === 'accepted' 
                                    ? 'bg-green-100 text-green-700' 
                                    : response.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : response.status === 'negotiating'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                                </span>
                              )}
                            </div>
                            {(response.manufacturer?.location || response.manufacturer?.business_type) && (
                              <p className="text-xs text-gray-500">
                                {[response.manufacturer?.location, response.manufacturer?.business_type]
                                  .filter(Boolean)
                                  .join(' | ')}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-right">
                            <p className="font-semibold text-[#22a2f2]">
                              {formatCurrency(response.quoted_price)}
                            </p>
                            <p className="text-xs text-gray-500">Total quote</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price / unit</p>
                            <p className="text-sm font-medium text-black">
                              {formatCurrency(response.price_per_unit)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery time</p>
                            <p className="text-sm font-medium text-black">
                              {response.delivery_time || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                            <p className="text-sm font-medium text-black">
                              {response.created_at
                                ? new Date(response.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : '—'}
                            </p>
                          </div>
                        </div>

                        {response.notes && (
                          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{response.notes}</p>
                          </div>
                        )}

                        {(!response.status || response.status === 'submitted' || response.status === 'negotiating') && (
                          <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            {/* Negotiate Button - only show when status is null, 'submitted', or empty */}
                            {(!response.status || response.status === 'submitted') && (
                              <button
                                onClick={() => handleNegotiate(req, response)}
                                disabled={negotiatingResponseId === response.id}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all ${
                                  negotiatingResponseId === response.id
                                    ? 'bg-[#22a2f2]/60 text-white cursor-not-allowed'
                                    : 'bg-[#22a2f2] hover:bg-[#1b8bd0] text-white'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v7a2 2 0 01-2 2h-6l-4 4v-4H7a2 2 0 01-2-2v-5a2 2 0 012-2h2" />
                                </svg>
                                {negotiatingResponseId === response.id ? 'Opening Chat...' : 'Negotiate'}
                              </button>
                            )}
                            {/* Accept and Reject buttons - show when status is null, 'submitted', or 'negotiating' */}
                            <button
                              onClick={() => handleUpdateResponseStatus(response.id, 'accepted', response.manufacturer?.unit_name || 'this manufacturer')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Accept Quote
                            </button>
                            <button
                              onClick={() => handleUpdateResponseStatus(response.id, 'rejected', response.manufacturer?.unit_name || 'this manufacturer')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject Quote
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500 bg-gray-50">
                    No manufacturer responses yet. We'll notify you once someone responds.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingRequirements && requirements.length === 0 && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Package Icon */}
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
              Submit your first requirement to get started and connect with manufacturers
            </p>
            
            {/* CTA Button */}
            <button
              onClick={onSwitchToCustomQuote}
              className="mt-6 relative group overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-[#22a2f2] transition-transform group-hover:scale-105 rounded-xl"></div>
              <div className="relative px-6 py-3 font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Submit Requirement</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

