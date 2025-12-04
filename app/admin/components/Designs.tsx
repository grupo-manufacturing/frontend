'use client';

import { useState } from 'react';
import type { Design } from '../types';
import { formatDate, renderBadge } from '../utils';
import apiService from '../../lib/apiService';

interface DesignsProps {
  designs: Design[];
  isLoadingData: boolean;
  lastUpdated: string | null;
  onError: (message: string) => void;
  onReload: () => Promise<void>;
}

export default function Designs({
  designs,
  isLoadingData,
  lastUpdated,
  onError,
  onReload
}: DesignsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingDesignId, setDeletingDesignId] = useState<string | null>(null);

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    setDeletingDesignId(designId);
    onError('');
    
    try {
      await apiService.deleteDesign(designId);
      // Reload designs to reflect the deletion
      await onReload();
    } catch (error: any) {
      console.error('Failed to delete design:', error);
      onError(error?.message || 'Failed to delete design. Please try again.');
    } finally {
      setDeletingDesignId(null);
    }
  };

  const filteredDesigns = designs.filter((design) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (design.product_name || '').toLowerCase().includes(q) ||
      (design.product_category || '').toLowerCase().includes(q) ||
      (design.manufacturer_profiles?.unit_name || '').toLowerCase().includes(q) ||
      (design.description || '').toLowerCase().includes(q)
    );
  });

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Designs Directory</h1>
          <p className="text-sm text-slate-500">
            View and manage all product designs in the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Total designs:{' '}
            <span className="font-semibold text-slate-800">{designs.length}</span>
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
            placeholder="Search designs by name, category, or manufacturer"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Design
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Manufacturer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Pricing
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Created
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {filteredDesigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  {designs.length === 0
                    ? 'No designs found.'
                    : 'No designs match your search criteria.'}
                </td>
              </tr>
            ) : (
              filteredDesigns.map((design) => (
                <tr key={design.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {design.image_url && (
                        <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={design.image_url}
                            alt={design.product_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">
                          {design.product_name || 'Unnamed Design'}
                        </div>
                        {design.description && (
                          <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                            {design.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {design.product_category ? (
                      renderBadge(design.product_category, 'info')
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">
                      {design.manufacturer_profiles?.unit_name || '—'}
                    </div>
                    {design.manufacturer_profiles?.phone_number && (
                      <div className="text-xs text-slate-500">
                        {design.manufacturer_profiles.phone_number}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      {design.price_1_50 && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 w-fit">
                          1-50: ₹{design.price_1_50.toLocaleString('en-IN')}
                        </span>
                      )}
                      {design.price_51_100 && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 w-fit">
                          51-100: ₹{design.price_51_100.toLocaleString('en-IN')}
                        </span>
                      )}
                      {design.price_101_200 && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-600 w-fit">
                          101-200: ₹{design.price_101_200.toLocaleString('en-IN')}
                        </span>
                      )}
                      {!design.price_1_50 && !design.price_51_100 && !design.price_101_200 && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(design.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteDesign(design.id)}
                      disabled={deletingDesignId === design.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Delete design"
                    >
                      {deletingDesignId === design.id ? (
                        <>
                          <svg
                            className="h-3 w-3 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                            <path d="M21 3v6h-6" />
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

