'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';
import aiDesignService from '../../lib/services/features/AIDesignService.js';

interface AIDesignsTabProps {
  onSwitchToGenerateDesigns?: () => void;
  onAcceptAIDesignResponse?: (aiDesign: any, response: any) => Promise<void>;
}

export default function AIDesignsTab({ onSwitchToGenerateDesigns, onAcceptAIDesignResponse }: AIDesignsTabProps) {
  const toast = useToast();
  // AI Designs States
  const [aiDesigns, setAiDesigns] = useState<any[]>([]);
  const [isLoadingAiDesigns, setIsLoadingAiDesigns] = useState(false);
  const [pushingDesignId, setPushingDesignId] = useState<string | null>(null);
  const [downloadingDesignId, setDownloadingDesignId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Audio ref for notification sound
  const notifySoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    notifySoundRef.current = new Audio('/notify.mp3');
    notifySoundRef.current.volume = 0.5; // Set volume to 50%

    // Cleanup on unmount
    return () => {
      if (notifySoundRef.current) {
        notifySoundRef.current.pause();
        notifySoundRef.current = null;
      }
    };
  }, []);

  // Helper function to play notification sound
  const playNotifySound = () => {
    if (notifySoundRef.current) {
      notifySoundRef.current.currentTime = 0; // Reset to start
      notifySoundRef.current.play().catch((err) => {
        // Silently handle autoplay restrictions
        console.log('Could not play sound:', err);
      });
    }
  };

  // Helper function to download full shirt image (no extraction needed)
  const downloadFullShirt = (imageUrl: string, designNo: string, apparelType: string) => {
    const filename = `${designNo || 'GRUPO-AI'}-${apparelType?.replace(/\s+/g, '-') || 'design'}-full-shirt.png`;
    
    if (imageUrl.startsWith('data:image')) {
      // Base64 image - download directly
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Full shirt image downloaded successfully!');
    } else {
      // Cloudinary URL - fetch and download
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create a canvas and draw the full shirt image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          toast.error('Could not process image for download');
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to create download file');
            return;
          }
          
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          toast.success('Full shirt image downloaded successfully!');
        }, 'image/png');
      };
      
      img.onerror = () => {
        toast.error('Failed to load image for download');
      };
      
      img.src = imageUrl;
    }
  };

  // Helper function to trigger download (for extracted pattern)
  const triggerDownload = (imageUrl: string, designNo: string, apparelType: string, isBase64: boolean) => {
    const filename = `${designNo || 'GRUPO-AI'}-${apparelType?.replace(/\s+/g, '-') || 'design'}-design-only.png`;
    
    if (isBase64 || imageUrl.startsWith('data:image')) {
      // Base64 image - download directly
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Design pattern downloaded successfully!');
    } else {
      // Cloudinary URL - fetch and download
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create a canvas and draw the extracted design
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          toast.error('Could not process image for download');
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to create download file');
            return;
          }
          
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          toast.success('Design pattern downloaded successfully!');
        }, 'image/png');
      };
      
      img.onerror = () => {
        toast.error('Failed to load image for download');
      };
      
      img.src = imageUrl;
    }
  };

  // Extract and download design only (without garment) - Background processing
  const extractAndDownloadDesign = async (imageUrl: string, designNo: string, apparelType: string, designId: string) => {
    // Show immediate feedback - extraction runs in background
    toast.success('Extracting design. Feel free to do other operations');
    
    // Reset downloading state immediately so button is clickable again
    setDownloadingDesignId(null);
    
    // Run extraction in background (non-blocking)
    (async () => {
      try {
        // Call the backend API to extract the design (processing time varies based on Gemini AI)
        const response = await aiDesignService.extractDesign({
          image_url: imageUrl,
          design_id: designId
        });

        if (response.success && response.data && response.data.image_url) {
          const extractedImageUrl = response.data.image_url;
          const isBase64 = response.data.isBase64 || extractedImageUrl.startsWith('data:image');
          
          // Automatically trigger download when extraction completes
          triggerDownload(extractedImageUrl, designNo, apparelType, isBase64);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        console.error('Error extracting design:', error);
        toast.error(error.message || 'Failed to extract design. Please try again.');
      }
    })();
  };

  // Fetch AI designs (without responses - responses are shown in Requirements tab)
  const fetchAiDesigns = async () => {
    setIsLoadingAiDesigns(true);
    try {
      // Don't include responses - they're shown in the Requirements tab
      const response = await apiService.getAIDesigns({ include_responses: false });
      if (response.success && response.data) {
        const designs = response.data || [];
        setAiDesigns(designs);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.dropdown-menu-container')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdownId]);

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
                  {/* Three Dots Menu */}
                  <div className="absolute top-2 right-2 dropdown-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === aiDesign.id ? null : aiDesign.id);
                      }}
                      className="p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all"
                      title="More options"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openDropdownId === aiDesign.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFullShirt(aiDesign.image_url, aiDesign.design_no, aiDesign.apparel_type);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                          Download Full Shirt
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show brief loading state, then reset (extraction runs in background)
                            setDownloadingDesignId(aiDesign.id);
                            setTimeout(() => setDownloadingDesignId(null), 500); // Brief visual feedback
                            extractAndDownloadDesign(aiDesign.image_url, aiDesign.design_no, aiDesign.apparel_type, aiDesign.id);
                            setOpenDropdownId(null);
                          }}
                          disabled={downloadingDesignId === aiDesign.id}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingDesignId === aiDesign.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Extracting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download Design Only
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
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

                  {/* Request for Quotation Button */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {aiDesign.status === 'published' ? (
                      <button
                        disabled
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Published</span>
                      </button>
                    ) : (
                      // If draft, show Request for Quotation button
                      <button
                        onClick={async () => {
                          setPushingDesignId(aiDesign.id);
                          try {
                            await apiService.pushAIDesign(aiDesign.id);
                            toast.success('Request for quotation sent to manufacturers successfully!');
                            // Play notification sound when design is pushed
                            playNotifySound();
                            // Refresh AI designs to show updated status
                            await fetchAiDesigns();
                          } catch (error: any) {
                            toast.error(error?.message || 'Failed to push design to manufacturers. Please try again.');
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
                            <span>Requesting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            <span>Request for Quotation</span>
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
    </>
  );
}

