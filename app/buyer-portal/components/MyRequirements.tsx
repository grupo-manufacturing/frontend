'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../../lib/apiService';
import { useToast } from '../../components/Toast';
import { getBuyerRequirementDisplayStatus } from '../lib/requirementStatus';
import PaymentModal from './PaymentModal';

interface MyRequirementsProps {
  requirements: any[];
  isLoadingRequirements: boolean;
  fetchRequirements: () => Promise<void>;
  onSwitchToCustomQuote?: () => void;
  onAcceptRequirementResponse?: (requirement: any, response: any) => Promise<void>;
  unseenRequirementResponsesCount?: number;
}

export default function MyRequirements({
  requirements,
  isLoadingRequirements,
  fetchRequirements,
  onSwitchToCustomQuote,
  onAcceptRequirementResponse,
  unseenRequirementResponsesCount = 0
}: MyRequirementsProps) {
  const toast = useToast();
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRequirement, setPaymentRequirement] = useState<any>(null);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [firstPaymentStatusByResponseId, setFirstPaymentStatusByResponseId] = useState<Record<string, string>>({});
  const [secondPaymentStatusByResponseId, setSecondPaymentStatusByResponseId] = useState<Record<string, string>>({});
  const [paymentNumber, setPaymentNumber] = useState<1 | 2>(1);
  const [approvingMilestoneForId, setApprovingMilestoneForId] = useState<string | null>(null);
  const [confirmingDeliveryForId, setConfirmingDeliveryForId] = useState<string | null>(null);

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

  const refreshPaymentStatuses = async () => {
    const allResponses = requirements.flatMap((req: any) => req.responses || []);
    if (!allResponses.length) {
      setFirstPaymentStatusByResponseId({});
      setSecondPaymentStatusByResponseId({});
      return;
    }

    const statusEntries = await Promise.all(
      allResponses.map(async (response: any) => {
        try {
          const paymentRes = await apiService.getPaymentStatus(response.id);
          const payments = Array.isArray(paymentRes?.data) ? paymentRes.data : [];
          const firstPayment = payments.find((p: any) => Number(p.payment_number) === 1);
          const secondPayment = payments.find((p: any) => Number(p.payment_number) === 2);
          return {
            responseId: response.id,
            firstStatus: firstPayment?.status || 'none',
            secondStatus: secondPayment?.status || 'none'
          };
        } catch {
          return { responseId: response.id, firstStatus: 'none', secondStatus: 'none' };
        }
      })
    );

    setFirstPaymentStatusByResponseId(
      Object.fromEntries(statusEntries.map(e => [e.responseId, e.firstStatus]))
    );
    setSecondPaymentStatusByResponseId(
      Object.fromEntries(statusEntries.map(e => [e.responseId, e.secondStatus]))
    );
  };

  // Handle Accept Quote - Opens Payment Modal for first payment
  const handleAcceptQuote = (requirement: any, response: any) => {
    playClickSound();
    setPaymentRequirement(requirement);
    setPaymentResponse(response);
    setPaymentNumber(1);
    setShowPaymentModal(true);
  };

  // Handle Pay Remaining 50% - Opens Payment Modal for second payment
  const handlePayRemaining = (requirement: any, response: any) => {
    playClickSound();
    setPaymentRequirement(requirement);
    setPaymentResponse(response);
    setPaymentNumber(2);
    setShowPaymentModal(true);
  };

  // Handle Reject Quote - Direct API call
  const handleRejectQuote = async (responseId: string) => {
    playClickSound();
    try {
      const apiResponse = await apiService.updateRequirementResponseStatus(responseId, 'rejected');
      
      if (apiResponse.success) {
        toast.success('Quote rejected successfully!');
        fetchRequirements();
      } else {
        toast.error(apiResponse.message || 'Failed to reject quote. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject quote. Please try again.');
    }
  };

  // Handle UTR submission - close modal and refresh list
  const handlePaymentSubmitted = async () => {
    setShowPaymentModal(false);
    setPaymentRequirement(null);
    setPaymentResponse(null);
    setPaymentNumber(1);
    await fetchRequirements();
    await refreshPaymentStatuses();
  };

  // Handle Payment Modal Close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentRequirement(null);
    setPaymentResponse(null);
  };

  // Handle Milestone Approval (Buyer approves M1 or M2)
  const handleApproveMilestone = async (responseId: string, milestone: 'm1' | 'm2') => {
    playClickSound();
    setApprovingMilestoneForId(responseId);
    
    try {
      const result = await apiService.approveMilestone(responseId, milestone);
      
      if (result.success) {
        toast.success(milestone === 'm1' 
          ? 'M1 (Sample) approved! Admin will process the payout.' 
          : 'M2 approved! Admin will process the payout.');
        await fetchRequirements();
      } else {
        toast.error(result.message || 'Failed to approve milestone. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve milestone. Please try again.');
    } finally {
      setApprovingMilestoneForId(null);
    }
  };

  // Handle Confirm Delivery (Buyer confirms they received the order)
  const handleConfirmDelivery = async (responseId: string) => {
    playClickSound();
    setConfirmingDeliveryForId(responseId);
    
    try {
      const result = await apiService.confirmDelivery(responseId);
      
      if (result.success) {
        toast.success('Delivery confirmed! Thank you for your order.');
        await fetchRequirements();
      } else {
        toast.error(result.message || 'Failed to confirm delivery. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm delivery. Please try again.');
    } finally {
      setConfirmingDeliveryForId(null);
    }
  };

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
      console.error('[MyRequirements] Socket connection error:', err);
    });

    // Listen for new requirement responses
    socket.on('requirement:response:new', async (data: any) => {
      const response = data.response || data;
      
      if (!response || !response.requirement_id || !response.requirement) return;

      // Check if this requirement belongs to the current buyer
      const buyerId = localStorage.getItem('buyerId');
      if (buyerId && response.requirement.buyer_id === buyerId) {
        // Refresh requirements to show the new response
        fetchRequirements();
      }
    });

    socket.on('payment:verified', async (data: any) => {
      await fetchRequirements();
      await refreshPaymentStatuses();
      if (data?.payment_number === 2) {
        toast.success('Payment verified! Manufacturer has been notified to ship your order.');
      }
    });

    socket.on('payment:rejected', async () => {
      await fetchRequirements();
      await refreshPaymentStatuses();
    });

    // Listen for milestone pending (manufacturer marked milestone done)
    socket.on('milestone:pending', async (data: any) => {
      await fetchRequirements();
      const milestoneLabel = data.milestone === 'm1' ? 'Sample (M1)' : 'Production (M2)';
      toast.info(`${milestoneLabel} is ready for your review!`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, wsUrl, wsPath]);

  useEffect(() => {
    void refreshPaymentStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirements]);


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
              {/* Row 1: Date Status | Requirement No */}
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {new Date(req.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  {/* Aggregate requirement status */}
                  {(() => {
                    const st = getBuyerRequirementDisplayStatus(req);
                    const badgeClass =
                      st === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : st === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700';
                    const label =
                      st === 'accepted' ? 'Accepted' : st === 'rejected' ? 'Rejected' : 'Pending';
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
                {req.requirement_no && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                    {req.requirement_no}
                  </span>
                )}
              </div>

              {/* Row 2: Quantity, Product Type, Responses */}
              <div className="grid grid-cols-3 gap-4 mb-4">
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

              {/* Additional Notes */}
              {req.requirement_text && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Additional Notes</p>
                  <p className="text-gray-800 leading-relaxed">{req.requirement_text}</p>
                </div>
              )}

              {/* Tech Packs Link */}
              {req.product_link && (
                <div className="mb-4">
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

              {/* Manufacturer Responses Section */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                  <p className="text-sm font-semibold text-black">Manufacturer Responses</p>
                  <p className="text-xs text-gray-500">
                    {req.responses && req.responses.length > 0
                      ? `${req.responses.length} response${req.responses.length === 1 ? '' : 's'} received`
                      : 'Awaiting Responses'}
                  </p>
                </div>

                {req.responses && req.responses.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {req.responses.map((response: any) => (
                      <div
                        key={response.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        {(() => {
                          const firstPaymentStatus = firstPaymentStatusByResponseId[response.id];
                          const isPendingVerification = firstPaymentStatus === 'pending_verification';

                          return (
                            <>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-black">
                                {response.manufacturer?.unit_name || 'Manufacturer'}
                              </p>
                              {response.status === 'submitted' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  Quote received — chat open
                                </span>
                              )}
                              {isPendingVerification && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                  Payment verification pending
                                </span>
                              )}
                              {response.status && response.status !== 'submitted' && !isPendingVerification && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  response.status === 'accepted' 
                                    ? 'bg-green-100 text-green-700' 
                                    : response.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : response.status === 'in_production'
                                    ? 'bg-purple-100 text-purple-700'
                                    : response.status === 'milestone_1_pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : response.status === 'milestone_1_done'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : response.status === 'milestone_2_pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : response.status === 'milestone_2_done'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : response.status === 'cleared_to_ship'
                                    ? 'bg-cyan-100 text-cyan-700'
                                    : response.status === 'shipped'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {response.status === 'in_production' ? 'In Production' 
                                    : response.status === 'milestone_1_pending' ? 'M1 Ready for Review'
                                    : response.status === 'milestone_1_done' ? 'M1 Approved'
                                    : response.status === 'milestone_2_pending' ? 'M2 Ready for Review'
                                    : response.status === 'milestone_2_done' ? 'M2 Approved'
                                    : response.status === 'cleared_to_ship' ? 'Ready to Ship'
                                    : response.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </span>
                              )}
                            </div>
                            {response.manufacturer?.business_type && (
                              <p className="text-xs text-gray-500">
                                {response.manufacturer.business_type}
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

                        {/* Notes intentionally hidden from buyer portal (internal payout/disbursement audit). */}

                        {/* M1 Approval Button */}
                        {response.status === 'milestone_1_pending' && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-amber-800">Sample Ready for Review</p>
                                <p className="text-xs text-amber-700 mt-1">
                                  The manufacturer has marked the sample as ready. Please review samples/photos shared in your chat and approve if satisfied.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleApproveMilestone(response.id, 'm1')}
                              disabled={approvingMilestoneForId === response.id}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-all"
                            >
                              {approvingMilestoneForId === response.id ? (
                                <>
                                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Approve M1 Sample</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* M2 Approval Button */}
                        {response.status === 'milestone_2_pending' && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-amber-800">Production Complete - Ready for Review</p>
                                <p className="text-xs text-amber-700 mt-1">
                                  The manufacturer has completed production. Please review the progress in your chat and approve to release the next milestone payment.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleApproveMilestone(response.id, 'm2')}
                              disabled={approvingMilestoneForId === response.id}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-all"
                            >
                              {approvingMilestoneForId === response.id ? (
                                <>
                                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Approve M2 Production</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Status info for other production stages */}
                        {response.status === 'in_production' && (
                          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="text-sm font-medium text-purple-700">Production in progress. The manufacturer will notify you when samples are ready.</span>
                            </div>
                          </div>
                        )}

                        {response.status === 'milestone_1_done' && (
                          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-emerald-700">M1 approved. Admin is processing the milestone payout to the manufacturer.</span>
                            </div>
                          </div>
                        )}

                        {response.status === 'milestone_2_done' && !response.m2_paid_at && (
                          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-emerald-700">M2 approved. Admin is processing the milestone payout.</span>
                            </div>
                          </div>
                        )}

                        {/* Pay Remaining 50% Button - Shows when M2 is done and paid */}
                        {response.status === 'milestone_2_done' && response.m2_paid_at && secondPaymentStatusByResponseId[response.id] !== 'pending_verification' && secondPaymentStatusByResponseId[response.id] !== 'paid' && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-800">Production Complete - Final Payment Required</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Both milestones are complete! Pay the remaining 50% to release the order for shipping.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handlePayRemaining(req, response)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span>Pay Remaining 50%</span>
                            </button>
                          </div>
                        )}

                        {/* Second payment pending verification */}
                        {secondPaymentStatusByResponseId[response.id] === 'pending_verification' && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-amber-700">Final payment verification pending. We'll notify you once approved.</span>
                            </div>
                          </div>
                        )}

                        {/* Cleared to ship status */}
                        {response.status === 'cleared_to_ship' && (
                          <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                              <span className="text-sm font-medium text-cyan-700">Payment complete! Manufacturer is preparing your order for shipment.</span>
                            </div>
                          </div>
                        )}

                        {/* Shipped status - Show Received button */}
                        {response.status === 'shipped' && (
                          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-indigo-800">Your Order Has Been Shipped!</p>
                                <p className="text-xs text-indigo-700 mt-1">
                                  Check chat for tracking details. Once you receive the order, click the button below to confirm delivery.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleConfirmDelivery(response.id)}
                              disabled={confirmingDeliveryForId === response.id}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-all"
                            >
                              {confirmingDeliveryForId === response.id ? (
                                <>
                                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Confirming...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>I've Received My Order</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Delivered status */}
                        {response.status === 'delivered' && (
                          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-emerald-700">Order delivered! Final payout is being processed.</span>
                            </div>
                          </div>
                        )}

                        {/* Completed status */}
                        {response.status === 'completed' && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-green-700">Order completed! Thank you for your business.</span>
                            </div>
                          </div>
                        )}

                        {(!response.status || response.status === 'submitted') && !isPendingVerification && (
                          <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleAcceptQuote(req, response)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Accept & Pay
                            </button>
                            <button
                              onClick={() => handleRejectQuote(response.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject Quote
                            </button>
                          </div>
                        )}
                            </>
                          );
                        })()}
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

      {/* Payment Modal */}
      {showPaymentModal && paymentRequirement && paymentResponse && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          onPaymentSubmitted={handlePaymentSubmitted}
          requirementResponse={{
            id: paymentResponse.id,
            quoted_price: paymentResponse.quoted_price,
            manufacturer: paymentResponse.manufacturer
          }}
          requirement={{
            id: paymentRequirement.id,
            requirement_no: paymentRequirement.requirement_no,
            product_type: paymentRequirement.product_type,
            quantity: paymentRequirement.quantity
          }}
          paymentNumber={paymentNumber}
        />
      )}
    </div>
  );
}

