'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatusFilter, OrderType, AIDesign } from '../types';
import { formatDate, getStatusLabel, getStatusBadgeColor } from '../utils';

interface OrdersProps {
  orders: Order[];
  aiDesigns: AIDesign[];
  isLoadingData: boolean;
  lastUpdated: string | null;
}

export default function Orders({
  orders,
  aiDesigns,
  isLoadingData,
  lastUpdated
}: OrdersProps) {
  const [orderType, setOrderType] = useState<OrderType>('custom');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const isShowingCustom = orderType === 'custom';
  const isShowingAI = orderType === 'ai';

  // Transform AI Design responses into order-like format
  const aiOrders = useMemo(() => {
    const aiOrdersList: Array<{
      id: string;
      design_no?: string;
      apparel_type: string;
      design_description?: string;
      buyer: {
        full_name?: string;
        phone_number: string;
      };
      manufacturer: {
        unit_name?: string;
      };
      quoted_price: number;
      price_per_unit: number;
      quantity: number;
      status: string;
      created_at: string;
      updated_at: string;
    }> = [];

    aiDesigns.forEach((design) => {
      if (design.responses && Array.isArray(design.responses)) {
        design.responses.forEach((response) => {
          // Include all responses (accepted, rejected, and submitted/pending)
          if (response.status === 'accepted' || response.status === 'rejected' || response.status === 'submitted') {
            const quotedPrice = response.quoted_price || 
              (response.price_per_unit && response.quantity 
                ? response.price_per_unit * response.quantity 
                : 0);
            
            aiOrdersList.push({
              id: response.id,
              design_no: design.design_no,
              apparel_type: design.apparel_type,
              design_description: design.design_description,
              buyer: {
                full_name: design.buyer?.full_name,
                phone_number: design.buyer?.phone_number || ''
              },
              manufacturer: {
                unit_name: response.manufacturer?.unit_name,
              },
              quoted_price: quotedPrice,
              price_per_unit: response.price_per_unit || 0,
              quantity: response.quantity || design.quantity,
              status: response.status,
              created_at: response.created_at,
              updated_at: response.created_at
            });
          }
        });
      }
    });

    return aiOrdersList;
  }, [aiDesigns]);

  const filteredCustomOrders = useMemo(() => {
    let filtered = orders;
    
    // Apply status filter
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === orderStatusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((order) =>
        (order.requirement?.buyer?.full_name || '').toLowerCase().includes(q) ||
        (order.manufacturer?.unit_name || '').toLowerCase().includes(q) ||
        (order.requirement?.requirement_text || '').toLowerCase().includes(q) ||
        (order.requirement?.buyer?.phone_number || '').includes(searchQuery) ||
        (order.manufacturer?.phone_number || '').includes(searchQuery)
      );
    }
    
    return filtered;
  }, [orders, orderStatusFilter, searchQuery]);

  const filteredAIOrders = useMemo(() => {
    let filtered = aiOrders;
    
    // Apply status filter
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === orderStatusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((order) =>
        (order.buyer?.full_name || '').toLowerCase().includes(q) ||
        (order.manufacturer?.unit_name || '').toLowerCase().includes(q) ||
        (order.apparel_type || '').toLowerCase().includes(q) ||
        (order.design_description || '').toLowerCase().includes(q) ||
        (order.buyer?.phone_number || '').includes(searchQuery) ||
        (order.design_no || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [aiOrders, orderStatusFilter, searchQuery]);

  // Get current filtered data based on active tab
  const currentFilteredOrders = isShowingCustom ? filteredCustomOrders : filteredAIOrders;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [orderType, orderStatusFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(currentFilteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = currentFilteredOrders.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">
            View and filter all orders by status (Accepted, Rejected, Pending).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Total orders:{' '}
            <span className="font-semibold text-slate-800">
              {isShowingCustom ? orders.length : aiOrders.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setOrderType('custom')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                isShowingCustom
                  ? 'bg-[#22a2f2] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Custom Orders
            </button>
            <button
              onClick={() => setOrderType('ai')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                isShowingAI
                  ? 'bg-[#22a2f2] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              AI Orders
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={isShowingCustom 
              ? "Search orders by buyer, manufacturer, or requirement"
              : "Search orders by buyer, manufacturer, or design"}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          >
            <option value="all">All Orders</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="submitted">Pending</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                {isShowingCustom ? 'Requirement ID' : 'Design ID'}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                {isShowingCustom ? 'Requirement' : 'Design'}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Buyer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Manufacturer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Quote
              </th>
              {isShowingCustom && (
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Delivery Time
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {currentFilteredOrders.length === 0 ? (
              <tr>
                <td colSpan={isShowingCustom ? 8 : 7} className="px-4 py-6 text-center text-sm text-slate-500">
                  {(isShowingCustom && orders.length === 0) || (isShowingAI && aiOrders.length === 0)
                    ? `No ${orderStatusFilter !== 'all' ? getStatusLabel(orderStatusFilter).toLowerCase() : ''} orders found.`
                    : 'No orders match your search criteria.'}
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                if (isShowingCustom) {
                  const customOrder = order as Order;
                  return (
                    <tr key={customOrder.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        {customOrder.requirement?.requirement_no ? (
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                            {customOrder.requirement.requirement_no}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-500 max-w-xs truncate">
                          {customOrder.requirement?.requirement_text || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {customOrder.requirement?.buyer?.full_name || 'Not provided'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {customOrder.requirement?.buyer?.phone_number || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {customOrder.manufacturer?.unit_name || 'Not provided'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {customOrder.manufacturer?.location || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          ₹{customOrder.quoted_price?.toLocaleString('en-IN') || '—'}
                        </div>
                        <div className="text-xs text-slate-500">
                          ₹{customOrder.price_per_unit?.toLocaleString('en-IN') || '—'} per unit
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {customOrder.delivery_time || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(customOrder.status || '')}`}>
                          {getStatusLabel(customOrder.status || '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(customOrder.updated_at || customOrder.created_at)}
                      </td>
                    </tr>
                  );
                } else {
                  const aiOrder = order as typeof aiOrders[0];
                  return (
                    <tr key={aiOrder.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        {aiOrder.design_no ? (
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                            {aiOrder.design_no}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {aiOrder.apparel_type || '—'}
                        </div>
                        {aiOrder.design_description && (
                          <div className="text-xs text-slate-500 max-w-xs truncate">
                            {aiOrder.design_description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {aiOrder.buyer?.full_name || 'Not provided'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {aiOrder.buyer?.phone_number || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {aiOrder.manufacturer?.unit_name || 'Not provided'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          ₹{aiOrder.quoted_price?.toLocaleString('en-IN') || '—'}
                        </div>
                        <div className="text-xs text-slate-500">
                          ₹{aiOrder.price_per_unit?.toLocaleString('en-IN') || '—'} per unit
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(aiOrder.status || '')}`}>
                          {getStatusLabel(aiOrder.status || '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(aiOrder.updated_at || aiOrder.created_at)}
                      </td>
                    </tr>
                  );
                }
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {currentFilteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-slate-900">
              {Math.min(endIndex, currentFilteredOrders.length)}
            </span>{' '}
            of <span className="font-medium text-slate-900">{currentFilteredOrders.length}</span> orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`min-w-[2.5rem] rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        currentPage === page
                          ? 'border-[#22a2f2] bg-[#22a2f2] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-sm text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

