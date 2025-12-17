'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiService from '../../lib/apiService';

interface AIDesignsTabProps {
  onSwitchToGenerateDesigns?: () => void;
  onAcceptAIDesignResponse?: (aiDesign: any, response: any) => Promise<void>;
}

export default function AIDesignsTab({ onSwitchToGenerateDesigns, onAcceptAIDesignResponse }: AIDesignsTabProps) {
  // AI Designs States
  const [aiDesigns, setAiDesigns] = useState<any[]>([]);
  const [isLoadingAiDesigns, setIsLoadingAiDesigns] = useState(false);
  const [selectedDesignForResponses, setSelectedDesignForResponses] = useState<any | null>(null);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [pushingDesignId, setPushingDesignId] = useState<string | null>(null);
  const [updatingResponseId, setUpdatingResponseId] = useState<string | null>(null);
  const [updatingResponseAction, setUpdatingResponseAction] = useState<'accept' | 'reject' | null>(null);
  const [downloadingDesignId, setDownloadingDesignId] = useState<string | null>(null);

  // Download image as PNG
  const downloadImageAsPNG = async (imageUrl: string, designNo: string, apparelType: string) => {
    try {
      // Convert HTTP to HTTPS to avoid mixed content issues
      const secureUrl = imageUrl.replace(/^http:\/\//i, 'https://');
      
      // Create an image element to load the image
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS
      
      // Load the image
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = secureUrl;
      });
      
      // Create a canvas and draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        
        // Create a temporary URL for the blob
        const blobUrl = URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${designNo || 'GRUPO-AI'}-${apparelType?.replace(/\s+/g, '-') || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  // Fetch AI designs
  const fetchAiDesigns = async () => {
    setIsLoadingAiDesigns(true);
    try {
      // Use include_responses to optimize N+1 queries - responses are fetched in batch
      const response = await apiService.getAIDesigns({ include_responses: true });
      if (response.success && response.data) {
        const designs = response.data || [];
        
        // Responses are already included in the response, no need for separate API calls
        setAiDesigns(designs.map((design: any) => ({
          ...design,
          responses: design.responses || []
        })));
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

  // Fetch AI designs when component mounts
  useEffect(() => {
    fetchAiDesigns();
  }, []);

  return (
    <>
      <div>
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>AI Generated Designs</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">My AI Designs</h1>
          <p className="text-gray-600">
            View your AI-generated designs that are published to manufacturers
          </p>
        </div>

        {/* Loading State */}
        {isLoadingAiDesigns && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading your AI designs...</p>
          </div>
        )}

        {/* AI Designs Grid */}
        {!isLoadingAiDesigns && aiDesigns.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aiDesigns.map((aiDesign: any) => (
              <div
                key={aiDesign.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={aiDesign.image_url}
                    alt={aiDesign.apparel_type || 'AI Design'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Download Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setDownloadingDesignId(aiDesign.id);
                      try {
                        await downloadImageAsPNG(aiDesign.image_url, aiDesign.design_no, aiDesign.apparel_type);
                      } finally {
                        setDownloadingDesignId(null);
                      }
                    }}
                    disabled={downloadingDesignId === aiDesign.id}
                    className="absolute top-2 left-2 p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group/download"
                    title="Download as PNG"
                  >
                    {downloadingDesignId === aiDesign.id ? (
                      <svg className="w-4 h-4 text-gray-700 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-700 group-hover/download:text-[#22a2f2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                  {/* Status Badge (Accepted) or AI Badge */}
                  {aiDesign.responses && aiDesign.responses.some((r: any) => r.status === 'accepted') ? (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                      Accepted
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-[#22a2f2] text-white text-xs font-semibold rounded-lg">
                      AI
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-5">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#22a2f2] transition-colors">
                      {aiDesign.apparel_type}
                    </h3>
                  </div>
                  
                  {/* Design Details */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium text-gray-900">{aiDesign.quantity}</span>
                    </div>
                  </div>

                  {/* Push To Manufacturer or View Responses Button */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {aiDesign.status === 'published' ? (
                      // If published, check if there's an accepted response
                      aiDesign.responses && aiDesign.responses.length > 0 ? (
                        // Check if any response is accepted
                        aiDesign.responses.some((r: any) => r.status === 'accepted') ? (
                          <button
                            disabled
                            className="w-full px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Already Accepted</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedDesignForResponses(aiDesign);
                              setShowResponsesModal(true);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-[#22a2f2] bg-[#22a2f2]/10 hover:bg-[#22a2f2]/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <span>View {aiDesign.responses.length} Response{aiDesign.responses.length !== 1 ? 's' : ''}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="w-full px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Published</span>
                        </button>
                      )
                    ) : (
                      // If draft, show Push To Manufacturer button
                      <button
                        onClick={async () => {
                          setPushingDesignId(aiDesign.id);
                          try {
                            await apiService.pushAIDesign(aiDesign.id);
                            // Refresh AI designs to show updated status
                            await fetchAiDesigns();
                          } catch (error: any) {
                            console.error('Failed to push design:', error);
                            alert(error?.message || 'Failed to push design to manufacturers. Please try again.');
                          } finally {
                            setPushingDesignId(null);
                          }
                        }}
                        disabled={pushingDesignId === aiDesign.id}
                        className="w-full px-3 py-2 text-xs font-semibold text-white bg-[#22a2f2] hover:bg-[#1b8bd0] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {pushingDesignId === aiDesign.id ? (
                          <>
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Pushing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            <span>Push To Manufacturer</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for AI Designs */}
        {!isLoadingAiDesigns && aiDesigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="relative group mb-6">
                <div className="bg-[#22a2f2]/10 rounded-2xl p-8 border border-[#22a2f2]/30 shadow-sm">
                  <svg
                    className="mx-auto h-20 w-20 text-[#22a2f2]"
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
              <p className="text-lg font-semibold text-[#22a2f2] mb-2">No AI designs yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Generate and publish your first AI design to see it here
              </p>
              {onSwitchToGenerateDesigns && (
                <button
                  onClick={onSwitchToGenerateDesigns}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#22a2f2] text-white rounded-lg font-medium hover:bg-[#1b8bd0] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Design
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Responses Modal */}
      {showResponsesModal && selectedDesignForResponses && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={() => setShowResponsesModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-black">Manufacturer Responses</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedDesignForResponses.apparel_type}</p>
              </div>
              <button
                onClick={() => setShowResponsesModal(false)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {/* Design Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-200 rounded-lg">
                    <img
                      src={selectedDesignForResponses.image_url}
                      alt={selectedDesignForResponses.apparel_type || 'AI Design'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 mb-1">{selectedDesignForResponses.apparel_type}</h4>
                    {selectedDesignForResponses.design_description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{selectedDesignForResponses.design_description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Your Qty: {selectedDesignForResponses.quantity?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responses List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedDesignForResponses.responses?.length || 0} Response{selectedDesignForResponses.responses?.length !== 1 ? 's' : ''}
                  </h4>
                </div>

                {selectedDesignForResponses.responses && selectedDesignForResponses.responses.length > 0 ? (
                  selectedDesignForResponses.responses.map((response: any, idx: number) => (
                    <div 
                      key={response.id || idx} 
                      className="p-4 bg-white border border-gray-200 rounded-xl hover:border-[#22a2f2]/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-gray-900">
                              {response.manufacturer?.unit_name || 'Manufacturer'}
                            </h5>
                            {response.manufacturer?.location && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {response.manufacturer.location}
                              </span>
                            )}
                          </div>
                          {response.manufacturer?.business_type && (
                            <p className="text-xs text-gray-500">{response.manufacturer.business_type}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          {new Date(response.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Price Per Unit</p>
                          <p className="text-lg font-bold text-gray-900">₹{response.price_per_unit?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                          <p className="text-lg font-bold text-gray-900">{response.quantity?.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Total Price */}
                      {response.quoted_price && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total Price</span>
                            <span className="text-lg font-bold text-gray-900">
                              ₹{response.quoted_price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Status and Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {response.status === 'accepted' ? (
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                              Accepted
                            </span>
                          </div>
                        ) : response.status === 'rejected' ? (
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                              Rejected
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                setUpdatingResponseId(response.id);
                                setUpdatingResponseAction('accept');
                                try {
                                  await apiService.updateAIDesignResponseStatus(response.id, 'accepted');
                                  
                                  // If handler is provided, open chat with the AI design
                                  if (onAcceptAIDesignResponse) {
                                    // Close the modal first
                                    setShowResponsesModal(false);
                                    // Wait a moment for modal to close
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                    // Open chat
                                    await onAcceptAIDesignResponse(selectedDesignForResponses, response);
                                  }
                                  
                                  // Refresh AI designs to show updated status
                                  await fetchAiDesigns();
                                  // Update the modal's selected design
                                  const updatedResponses = selectedDesignForResponses.responses.map((r: any) =>
                                    r.id === response.id ? { ...r, status: 'accepted' } : r
                                  );
                                  setSelectedDesignForResponses({
                                    ...selectedDesignForResponses,
                                    responses: updatedResponses
                                  });
                                } catch (error: any) {
                                  console.error('Failed to accept response:', error);
                                  alert(error?.message || 'Failed to accept response. Please try again.');
                                } finally {
                                  setUpdatingResponseId(null);
                                  setUpdatingResponseAction(null);
                                }
                              }}
                              disabled={updatingResponseId !== null}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {updatingResponseId === response.id && updatingResponseAction === 'accept' ? (
                                <>
                                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Accept
                                </>
                              )}
                            </button>
                            <button
                              onClick={async () => {
                                setUpdatingResponseId(response.id);
                                setUpdatingResponseAction('reject');
                                try {
                                  await apiService.updateAIDesignResponseStatus(response.id, 'rejected');
                                  // Refresh AI designs to show updated status
                                  await fetchAiDesigns();
                                  // Update the modal's selected design
                                  const updatedResponses = selectedDesignForResponses.responses.map((r: any) =>
                                    r.id === response.id ? { ...r, status: 'rejected' } : r
                                  );
                                  setSelectedDesignForResponses({
                                    ...selectedDesignForResponses,
                                    responses: updatedResponses
                                  });
                                } catch (error: any) {
                                  console.error('Failed to reject response:', error);
                                  alert(error?.message || 'Failed to reject response. Please try again.');
                                } finally {
                                  setUpdatingResponseId(null);
                                  setUpdatingResponseAction(null);
                                }
                              }}
                              disabled={updatingResponseId !== null}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {updatingResponseId === response.id && updatingResponseAction === 'reject' ? (
                                <>
                                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-500">No responses yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

