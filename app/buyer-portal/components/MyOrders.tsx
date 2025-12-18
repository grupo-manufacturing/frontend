'use client';

import { useState, useEffect } from 'react';
import apiService from '../../lib/apiService';

interface MyOrdersProps {
  requirements: any[];
  isLoadingRequirements: boolean;
  fetchRequirements: () => Promise<void>;
  onOpenChat?: (requirement: any, response: any) => void;
}

export default function MyOrders({ 
  requirements, 
  isLoadingRequirements, 
  fetchRequirements,
  onOpenChat 
}: MyOrdersProps) {
  // Requirements Stats
  const [requirementStats, setRequirementStats] = useState({
    total: 0,
    accepted: 0,
    pending_review: 0,
    in_negotiation: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Search and Filter
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [isOrderFilterDropdownOpen, setIsOrderFilterDropdownOpen] = useState(false);

  // Helper function to determine requirement status based on responses
  const getRequirementStatus = (requirement: any): 'accepted' | 'pending' | 'negotiation' => {
    const responses = requirement.responses || [];
    
    if (responses.length === 0) {
      return 'pending';
    }
    
    // Check if any response is accepted
    const hasAccepted = responses.some((r: any) => r.status === 'accepted');
    if (hasAccepted) {
      return 'accepted';
    }
    
    // Check if any response is negotiating
    const hasNegotiating = responses.some((r: any) => r.status === 'negotiating');
    if (hasNegotiating) {
      return 'negotiation';
    }
    
    // Has responses but none are accepted or negotiating = pending review
    return 'pending';
  };

  // Fetch requirement statistics
  const fetchRequirementStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiService.getBuyerRequirementStatistics();
      if (response && response.success && response.data) {
        setRequirementStats(response.data);
      } else {
        console.error('Failed to fetch requirement statistics');
      }
    } catch (error) {
      console.error('Failed to fetch requirement statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch data when component mounts or filter changes
  useEffect(() => {
    fetchRequirementStatistics();
    fetchRequirements();
  }, [orderFilter]);

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-9 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Order timeline</span>
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">My Orders</h1>
        <p className="text-gray-500">Track and manage all your orders in one place</p>
      </div>

      {/* Requirements Content */}
      <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Requirements Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#22a2f2] font-semibold mb-1">Total Requirements</p>
                    <p className="text-3xl font-bold text-black">{isLoadingStats ? '...' : requirementStats.total}</p>
                  </div>
                  <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Accepted Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Accepted</p>
                    <p className="text-3xl font-bold text-[#22a2f2]">{isLoadingStats ? '...' : requirementStats.accepted}</p>
                  </div>
                  <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Pending</p>
                    <p className="text-3xl font-bold text-[#22a2f2]">{isLoadingStats ? '...' : requirementStats.pending_review}</p>
                  </div>
                  <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Negotiating Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#22a2f2]/15 to-[#1b8bd0]/10 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 hover:border-[#22a2f2]/60 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#1b8bd0] font-semibold mb-1">Negotiating</p>
                    <p className="text-3xl font-bold text-[#22a2f2]">{isLoadingStats ? '...' : requirementStats.in_negotiation}</p>
                  </div>
                  <div className="p-3 bg-[#22a2f2]/15 rounded-xl shadow-lg shadow-[#22a2f2]/20 text-[#22a2f2]">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 group-focus-within:text-[#22a2f2] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search orders by product, brand, or order ID..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOrderFilterDropdownOpen(!isOrderFilterDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsOrderFilterDropdownOpen(false), 200)}
                  className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                >
                  <span className={orderFilter !== 'all' ? 'text-black' : 'text-gray-500'}>
                    {orderFilter === 'all' 
                      ? 'All Orders' 
                      : orderFilter === 'accepted' 
                      ? 'Accepted' 
                      : orderFilter === 'pending'
                      ? 'Pending'
                      : orderFilter === 'negotiation'
                      ? 'Negotiating'
                      : 'All Orders'}
                  </span>
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform ${isOrderFilterDropdownOpen ? 'transform rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {isOrderFilterDropdownOpen && (
                  <div className="absolute z-50 w-full md:w-48 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-[180px] overflow-y-auto">
                      {[
                        { value: 'all', label: 'All Orders' },
                        { value: 'accepted', label: 'Accepted' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'negotiation', label: 'Negotiating' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setOrderFilter(option.value);
                            setIsOrderFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            orderFilter === option.value ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requirements List */}
          {isLoadingRequirements ? (
            <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22a2f2] mb-4"></div>
                <p className="text-gray-500">Loading requirements...</p>
              </div>
            </div>
          ) : (() => {
            // Filter requirements based on search query and filter
            const filteredRequirements = requirements.filter((req: any) => {
              // Search filter
              const searchLower = orderSearchQuery.toLowerCase();
              const matchesSearch = !orderSearchQuery || 
                req.requirement_text?.toLowerCase().includes(searchLower) ||
                req.product_type?.toLowerCase().includes(searchLower) ||
                req.id?.toLowerCase().includes(searchLower);
              
              if (!matchesSearch) return false;
              
              // Status filter
              if (orderFilter === 'all') return true;
              
              const status = getRequirementStatus(req);
              return status === orderFilter;
            });
            
            return filteredRequirements.length > 0 ? (
              <div className="bg-white rounded-xl border border-[#22a2f2]/30 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    <div className="col-span-5">Requirement</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-1">Quantity</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Delivery</div>
                  </div>
                </div>
                
                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {filteredRequirements.map((req: any) => {
                    const status = getRequirementStatus(req);
                    const statusColors = {
                      accepted: 'bg-green-100 text-green-700',
                      pending: 'bg-yellow-100 text-yellow-700',
                      negotiation: 'bg-orange-100 text-orange-700'
                    };
                    const statusLabels = {
                      accepted: 'Accepted',
                      pending: 'Pending',
                      negotiation: 'Negotiating'
                    };
                    
                    // Get best quote
                    const acceptedResponse = req.responses?.find((r: any) => r.status === 'accepted');
                    const negotiatingResponse = req.responses?.find((r: any) => r.status === 'negotiating');
                    const bestResponse = acceptedResponse || negotiatingResponse || req.responses?.[0];
                    
                    return (
                      <div key={req.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Requirement */}
                          <div className="col-span-5">
                            <p className="text-sm font-medium text-black line-clamp-2">
                              {req.requirement_text || 'Requirement'}
                            </p>
                            {req.image_url && (
                              <img 
                                src={req.image_url} 
                                alt="Requirement" 
                                className="w-12 h-12 object-cover rounded mt-2 border border-gray-200"
                              />
                            )}
                          </div>
                          
                          {/* Type */}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">
                              {req.product_type || '—'}
                            </p>
                          </div>
                          
                          {/* Quantity */}
                          <div className="col-span-1">
                            <p className="text-sm text-gray-600">
                              {req.quantity || '—'}
                            </p>
                          </div>
                          
                          {/* Status */}
                          <div className="col-span-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
                              {statusLabels[status]}
                            </span>
                          </div>
                          
                          {/* Delivery */}
                          <div className="col-span-2">
                            {bestResponse?.delivery_time ? (
                              <p className="text-sm text-gray-600">
                                {bestResponse.delivery_time}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">—</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
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
                  
                  <h3 className="text-xl font-semibold text-black mb-2">
                    {orderSearchQuery || orderFilter !== 'all' ? 'No requirements found' : 'No requirements yet'}
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    {orderSearchQuery || orderFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Your requirements will appear here once you submit them'}
                  </p>
                </div>
              </div>
            );
          })()}
      </>
    </div>
  );
}

