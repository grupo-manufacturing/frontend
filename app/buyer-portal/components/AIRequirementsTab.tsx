'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../../lib/apiService';
import { useToast } from '../../components/Toast';

interface AIRequirementsTabProps {
  onAcceptAIDesignResponse?: (aiDesign: any, response: any) => Promise<void>;
}

export default function AIRequirementsTab({ onAcceptAIDesignResponse }: AIRequirementsTabProps) {
  const toast = useToast();
  
  // AI Requirements states
  const [aiDesigns, setAiDesigns] = useState<any[]>([]);
  const [isLoadingAiDesigns, setIsLoadingAiDesigns] = useState(false);
  const [updatingAiResponseId, setUpdatingAiResponseId] = useState<string | null>(null);
  const [updatingAiResponseAction, setUpdatingAiResponseAction] = useState<'accept' | 'reject' | null>(null);

  // Socket connection setup
  const socketRef = useRef<Socket | null>(null);
  const token = useMemo(() => apiService.getToken(), []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || getApiBaseOrigin(), []);
  const wsPath = useMemo(() => process.env.NEXT_PUBLIC_WS_PATH || '/socket.io', []);

  // Audio ref for click sound
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    clickSoundRef.current = new Audio('/click.mp3');
    clickSoundRef.current.volume = 0.5; // Set volume to 50%

    // Cleanup on unmount
    return () => {
      if (clickSoundRef.current) {
        clickSoundRef.current.pause();
        clickSoundRef.current = null;
      }
    };
  }, []);

  // Helper function to play click sound
  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0; // Reset to start
      clickSoundRef.current.play().catch((err) => {
        // Silently handle autoplay restrictions
        console.log('Could not play sound:', err);
      });
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return '—';
    return `INR ${numericValue.toLocaleString('en-IN')}`;
  };

  // Fetch AI Designs with responses
  const fetchAiDesigns = async () => {
    setIsLoadingAiDesigns(true);
    try {
      const response = await apiService.getAIDesigns({ include_responses: true });
      if (response.success && response.data) {
        const designs = response.data || [];
        
        // Only show published designs with responses
        const designsWithResponses = designs
          .filter((design: any) => design.status === 'published' && design.responses && design.responses.length > 0)
          .map((design: any) => ({
            ...design,
            responses: design.responses || [],
            manufacturer_count: design.responses?.length || 0
          }));
        
        setAiDesigns(designsWithResponses);
      } else {
        setAiDesigns([]);
      }
    } catch (error) {
      setAiDesigns([]);
    } finally {
      setIsLoadingAiDesigns(false);
    }
  };

  // Fetch AI designs when component mounts
  useEffect(() => {
    fetchAiDesigns();
  }, []);

  // Socket connection for real-time response updates
  useEffect(() => {
    if (!token || !wsUrl) return;

    const socket = io(wsUrl, { path: wsPath, auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Socket connected
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });

    socket.on('connect_error', (err) => {
      console.error('[AIRequirementsTab] Socket connection error:', err);
    });

    // Listen for new AI design responses
    socket.on('ai-design:response:new', async (data: any) => {
      const response = data.response || data;
      
      if (!response || !response.ai_design_id || !response.ai_design) return;

      // Check if this AI design belongs to the current buyer
      const buyerId = localStorage.getItem('buyerId');
      if (buyerId && response.ai_design.buyer_id === buyerId) {
        // Refresh AI designs to show the new response
        fetchAiDesigns();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, wsUrl, wsPath]);

  // Handle Accept/Reject AI Design Response
  const handleUpdateAiResponseStatus = async (responseId: string, status: 'accepted' | 'rejected', aiDesign: any, response: any) => {
    // Play click sound when accepting or rejecting
    playClickSound();
    setUpdatingAiResponseId(responseId);
    setUpdatingAiResponseAction(status === 'accepted' ? 'accept' : 'reject');
    try {
      const apiResponse = await apiService.updateAIDesignResponseStatus(responseId, status);
      
      if (apiResponse.success) {
        toast.success(`Response ${status} successfully!`);
        
        // If accepting and handler is provided, open chat
        if (status === 'accepted' && onAcceptAIDesignResponse) {
          await onAcceptAIDesignResponse(aiDesign, response);
        }
        
        // Refresh AI designs to show updated status
        await fetchAiDesigns();
      } else {
        toast.error(apiResponse.message || `Failed to ${status} response. Please try again.`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${status} response. Please try again.`);
    } finally {
      setUpdatingAiResponseId(null);
      setUpdatingAiResponseAction(null);
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
          <span>AI Requirements</span>
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">AI Requirements</h1>
        <p className="text-gray-500">Track all your AI design requirement responses</p>
      </div>

      {/* Loading State */}
      {isLoadingAiDesigns && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading AI requirements...</p>
          </div>
        </div>
      )}

      {/* AI Requirements List */}
      {!isLoadingAiDesigns && aiDesigns.length > 0 && (
        <div className="space-y-4">
          {aiDesigns.map((aiDesign: any) => (
            <div key={aiDesign.id} className="bg-white rounded-xl border border-[#22a2f2]/30 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(aiDesign.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      {/* Pending Badge - Show when there are no responses */}
                      {(!aiDesign.responses || aiDesign.responses.length === 0 || aiDesign.manufacturer_count === 0) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      )}
                    </div>
                    {aiDesign.design_no && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                        {aiDesign.design_no}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Design Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg border border-gray-200">
                      <img
                        src={aiDesign.image_url}
                        alt={aiDesign.apparel_type || 'AI Design'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{aiDesign.apparel_type}</h3>
                      {aiDesign.design_description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{aiDesign.design_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                {aiDesign.quantity && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quantity</p>
                    <p className="text-sm font-semibold text-black">{aiDesign.quantity.toLocaleString()}</p>
                  </div>
                )}
                {aiDesign.apparel_type && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Product Type</p>
                    <p className="text-sm font-semibold text-black capitalize">{aiDesign.apparel_type}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Responses</p>
                  <p className="text-sm font-semibold text-[#22a2f2]">{aiDesign.manufacturer_count || 0} manufacturer{aiDesign.manufacturer_count !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <p className="text-sm font-semibold text-black">Manufacturer Responses</p>
                  <p className="text-xs text-gray-500">
                    {aiDesign.responses && aiDesign.responses.length > 0
                      ? `${aiDesign.responses.length} response${aiDesign.responses.length === 1 ? '' : 's'} received`
                      : 'Awaiting responses'}
                  </p>
                </div>

                {aiDesign.responses && aiDesign.responses.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {aiDesign.responses.map((response: any) => (
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
                              {formatCurrency(
                                response.quoted_price || 
                                (response.price_per_unit && response.quantity 
                                  ? response.price_per_unit * response.quantity 
                                  : null)
                              )}
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
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                            <p className="text-sm font-medium text-black">
                              {response.quantity?.toLocaleString() || '—'}
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

                        {(!response.status || response.status === 'submitted') && (
                          <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleUpdateAiResponseStatus(response.id, 'accepted', aiDesign, response)}
                              disabled={updatingAiResponseId !== null}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {updatingAiResponseId === response.id && updatingAiResponseAction === 'accept' ? 'Accepting...' : 'Accept Quote'}
                            </button>
                            <button
                              onClick={() => handleUpdateAiResponseStatus(response.id, 'rejected', aiDesign, response)}
                              disabled={updatingAiResponseId !== null}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {updatingAiResponseId === response.id && updatingAiResponseAction === 'reject' ? 'Rejecting...' : 'Reject Quote'}
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

      {/* Empty State for AI Requirements */}
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
            
            <h3 className="text-xl font-semibold text-black mb-2">No AI Requirements Yet</h3>
            <p className="text-gray-400 max-w-md">
              Publish AI designs and request quotations to see responses here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

