'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order } from '../types';
import { formatDate } from '../utils';

interface OrdersProps {
  orders: Order[];
  isLoadingData: boolean;
  lastUpdated: string | null;
}

export default function Orders({
  orders,
  isLoadingData,
  lastUpdated
}: OrdersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const filteredCustomOrders = useMemo(() => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((order) =>
        (order.buyer?.full_name || '').toLowerCase().includes(q) ||
        (order.requirement_text || '').toLowerCase().includes(q) ||
        (order.requirement_no || '').toLowerCase().includes(q) ||
        (order.product_type || '').toLowerCase().includes(q) ||
        (order.buyer?.phone_number || '').includes(searchQuery)
      );
    }
    
    return filtered;
  }, [orders, searchQuery]);

  const currentFilteredOrders = filteredCustomOrders;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
            View and manage all custom requirement orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Total orders:{' '}
            <span className="font-semibold text-slate-800">
              {orders.length}
            </span>
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
            placeholder="Search requirements by buyer, requirement text, or product type"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Requirement ID
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Buyer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Product Type
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Quantity
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Additional Notes
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Product Image
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {currentFilteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  {orders.length === 0 ? 'No orders found.' : 'No orders match your search criteria.'}
                </td>
              </tr>
            ) : (
              paginatedOrders.map((requirement) => (
                <tr key={requirement.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    {requirement.requirement_no ? (
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20">
                        {requirement.requirement_no}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {requirement.buyer?.full_name || 'Not provided'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {requirement.buyer?.phone_number || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-500">
                      {requirement.product_type || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-500">
                      {requirement.quantity?.toLocaleString('en-IN') || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-500 max-w-xs truncate">
                      {requirement.requirement_text || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {requirement.image_url ? (
                      <a
                        href={requirement.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22a2f2] hover:underline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14h14v-5" />
                        </svg>
                        Open File
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(requirement.updated_at || requirement.created_at)}
                  </td>
                </tr>
              ))
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

