'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Buyer, Manufacturer, UserType } from '../types';
import { formatDate, renderBadge } from '../utils';
import apiService from '../../lib/apiService';

interface UsersProps {
  buyers: Buyer[];
  manufacturers: Manufacturer[];
  isLoadingData: boolean;
  lastUpdated: string | null;
  onError: (message: string) => void;
  onReload: () => Promise<void>;
}

export default function Users({
  buyers,
  manufacturers,
  isLoadingData,
  lastUpdated,
  onError,
  onReload
}: UsersProps) {
  const [userType, setUserType] = useState<UserType>('buyers');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingVerifiedId, setUpdatingVerifiedId] = useState<string | null>(null);
  const itemsPerPage = 7;

  const isShowingBuyers = userType === 'buyers';
  const isShowingManufacturers = userType === 'manufacturers';

  const filteredBuyers = useMemo(() => {
    if (!searchQuery.trim()) return buyers;
    const q = searchQuery.toLowerCase();
    return buyers.filter((buyer) =>
      (buyer.full_name || '').toLowerCase().includes(q) ||
      (buyer.business_name || '').toLowerCase().includes(q) ||
      buyer.phone_number.includes(searchQuery) ||
      (buyer.buyer_identifier || '').toLowerCase().includes(q)
    );
  }, [buyers, searchQuery]);

  const filteredManufacturers = useMemo(() => {
    if (!searchQuery.trim()) return manufacturers;
    const q = searchQuery.toLowerCase();
    return manufacturers.filter((manufacturer) =>
      (manufacturer.unit_name || '').toLowerCase().includes(q) ||
      (manufacturer.business_name || '').toLowerCase().includes(q) ||
      (manufacturer.business_type || '').toLowerCase().includes(q) ||
      manufacturer.phone_number.includes(searchQuery)
    );
  }, [manufacturers, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userType, searchQuery]);

  // Calculate pagination based on active tab
  const currentFilteredData = isShowingBuyers ? filteredBuyers : filteredManufacturers;
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBuyers = isShowingBuyers ? filteredBuyers.slice(startIndex, endIndex) : [];
  const paginatedManufacturers = isShowingManufacturers ? filteredManufacturers.slice(startIndex, endIndex) : [];

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleVerified = async (manufacturerId: string, currentVerified: boolean) => {
    setUpdatingVerifiedId(manufacturerId);
    onError('');
    
    try {
      await apiService.updateManufacturerVerifiedStatus(manufacturerId, !currentVerified);
      // Reload data to get updated status
      await onReload();
    } catch (error: any) {
      console.error('Failed to update verification status:', error);
      onError(error?.message || 'Failed to update verification status. Please try again.');
    } finally {
      setUpdatingVerifiedId(null);
    }
  };

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">User Directory</h1>
          <p className="text-sm text-slate-500">
            View and manage all registered buyers and manufacturers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Total records:{' '}
            <span className="font-semibold text-slate-800">
              {isShowingBuyers ? buyers.length : manufacturers.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setUserType('buyers')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                isShowingBuyers
                  ? 'bg-[#22a2f2] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Buyers
            </button>
            <button
              onClick={() => setUserType('manufacturers')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                isShowingManufacturers
                  ? 'bg-[#22a2f2] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Manufacturers
            </button>
          </div>
        </div>
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
            placeholder={`Search ${isShowingBuyers ? 'buyers' : 'manufacturers'} by name or phone`}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {isShowingBuyers && (
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Buyer ID
                </th>
              )}
              {isShowingManufacturers && (
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Manufacturer ID
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                {isShowingBuyers ? 'Buyer' : 'Manufacturer'}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Contact
              </th>
              {isShowingManufacturers && (
                <>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    GST Number
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    PAN Number
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Unit Image
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Verified
                  </th>
                </>
              )}
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {isShowingBuyers &&
              paginatedBuyers.map((buyer) => (
                <tr key={buyer.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {buyer.buyer_identifier || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {buyer.full_name || buyer.business_name || 'Not provided'}
                    </div>
                    <div className="text-xs text-slate-500">{buyer.business_name || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">{buyer.phone_number}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(buyer.created_at)}</td>
                </tr>
              ))}
            {isShowingManufacturers &&
              paginatedManufacturers.map((manufacturer) => (
                <tr key={manufacturer.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {manufacturer.manufacturer_id || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {manufacturer.unit_name || manufacturer.business_name || 'Not provided'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {manufacturer.business_type || 'Business type not provided'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">{manufacturer.phone_number}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">
                      {manufacturer.gst_number || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">
                      {manufacturer.pan_number || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {manufacturer.manufacturing_unit_image_url ? (
                      <a
                        href={manufacturer.manufacturing_unit_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#22a2f2] hover:text-[#1b8bd0] hover:underline transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        View Image
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVerified(String(manufacturer.id), manufacturer.is_verified)}
                      disabled={updatingVerifiedId === String(manufacturer.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#22a2f2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        manufacturer.is_verified ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={manufacturer.is_verified}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          manufacturer.is_verified ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(manufacturer.created_at)}
                  </td>
                </tr>
              ))}
            {(isShowingBuyers && filteredBuyers.length === 0) ||
            (isShowingManufacturers && filteredManufacturers.length === 0) ? (
              <tr>
                <td colSpan={isShowingBuyers ? 4 : 8} className="px-4 py-6 text-center text-sm text-slate-500">
                  No records found for your current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {currentFilteredData.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-slate-900">
              {Math.min(endIndex, currentFilteredData.length)}
            </span>{' '}
            of <span className="font-medium text-slate-900">{currentFilteredData.length}</span> {isShowingBuyers ? 'buyers' : 'manufacturers'}
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

