'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AIDesign } from '../types';
import { formatDate } from '../utils';
import aiDesignService from '../../lib/services/features/AIDesignService';

interface AIDesignsProps {
  aiDesigns: AIDesign[];
  isLoadingData: boolean;
  lastUpdated: string | null;
  onDelete?: () => void;
}

export default function AIDesigns({
  aiDesigns,
  isLoadingData,
  lastUpdated,
  onDelete
}: AIDesignsProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const itemsPerPage = 9;

  const filteredDesigns = useMemo(() => {
    let filtered = aiDesigns;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((design) => design.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((design) =>
        (design.design_no || '').toLowerCase().includes(q) ||
        (design.buyer?.full_name || '').toLowerCase().includes(q) ||
        (design.apparel_type || '').toLowerCase().includes(q) ||
        (design.design_description || '').toLowerCase().includes(q) ||
        (design.buyer?.phone_number || '').includes(searchQuery)
      );
    }
    
    return filtered;
  }, [aiDesigns, statusFilter, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDesigns = filteredDesigns.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleDelete = async (designId: string) => {
    if (confirmDeleteId !== designId) {
      setConfirmDeleteId(designId);
      return;
    }

    setDeletingId(designId);
    try {
      await aiDesignService.deleteAIDesign(designId);
      setConfirmDeleteId(null);
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error('Failed to delete AI design:', error);
      alert(error?.message || 'Failed to delete AI design. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">AI Designs</h1>
          <p className="text-sm text-slate-500">
            View all AI-generated designs created by buyers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Total designs:{' '}
            <span className="font-semibold text-slate-800">{aiDesigns.length}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by buyer name, apparel type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      {filteredDesigns.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-500">
            {searchQuery || statusFilter !== 'all'
              ? 'No designs match your filters.'
              : 'No AI designs found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedDesigns.map((design) => (
              <div
                key={design.id}
                className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#22a2f2]/50 hover:shadow-md"
              >
                {/* Design Image */}
                <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={design.image_url || '/placeholder-design.png'}
                    alt={design.apparel_type || 'AI Design'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Design Number - Top Left */}
                  {design.design_no && (
                    <div className="absolute top-2 left-2">
                      <span className="rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {design.design_no}
                      </span>
                    </div>
                  )}
                  {/* Status Badge - Top Right */}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(
                        design.status
                      )}`}
                    >
                      {getStatusLabel(design.status)}
                    </span>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(design.id)}
                      disabled={deletingId === design.id}
                      className={`rounded-full p-1.5 transition ${
                        confirmDeleteId === design.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-black/70 text-white backdrop-blur-sm hover:bg-red-600'
                      } ${deletingId === design.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={confirmDeleteId === design.id ? 'Click again to confirm' : 'Delete design'}
                    >
                      {deletingId === design.id ? (
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Design Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">
                    {design.apparel_type || 'Untitled Design'}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Quantity: {design.quantity?.toLocaleString() || 'N/A'}</span>
                    <span>{formatDate(design.created_at)}</span>
                  </div>
                  {design.buyer && (
                    <div className="border-t border-slate-100 pt-2">
                      <p className="text-xs text-slate-500">
                        Buyer: <span className="font-medium text-slate-700">{design.buyer.full_name || design.buyer.phone_number}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredDesigns.length > 0 && totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between border-t border-slate-200 pt-4">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{' '}
                <span className="font-medium text-slate-900">
                  {Math.min(endIndex, filteredDesigns.length)}
                </span>{' '}
                of <span className="font-medium text-slate-900">{filteredDesigns.length}</span> designs
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
        </>
      )}
    </div>
  );
}

