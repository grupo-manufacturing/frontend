'use client';

import { useEffect, useState, useMemo } from 'react';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

interface Manufacturer {
  id: string;
  manufacturer_id?: string;
  unit_name?: string;
  business_type?: string;
  location?: string;
  daily_capacity?: number;
  product_types?: string[];
}

interface HomeTabProps {
  onContactManufacturer: (manufacturer: Manufacturer) => Promise<void>;
}

const ITEMS_PER_PAGE = 6;

export default function HomeTab({ onContactManufacturer }: HomeTabProps) {
  const toast = useToast();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [contactingManufacturerId, setContactingManufacturerId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(manufacturers.length / ITEMS_PER_PAGE), [manufacturers.length]);
  
  const paginatedManufacturers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return manufacturers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [manufacturers, currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchManufacturers = async () => {
    setIsLoadingManufacturers(true);
    setErrorMessage('');

    try {
      const response = await apiService.getAllManufacturers({
        verified: true,
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 100
      });

      const list = response?.data?.manufacturers || response?.data || [];
      setManufacturers(Array.isArray(list) ? list : []);
    } catch (error: any) {
      setManufacturers([]);
      setErrorMessage('Unable to load manufacturers right now. Please try again.');
      console.error('Failed to fetch manufacturers:', error);
    } finally {
      setIsLoadingManufacturers(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleContactManufacturer = async (manufacturer: Manufacturer) => {
    setContactingManufacturerId(manufacturer.id);
    try {
      await onContactManufacturer(manufacturer);
      toast.success('Opening chat with manufacturer...');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to start chat. Please try again.');
    } finally {
      setContactingManufacturerId(null);
    }
  };

  return (
    <div>
      {isLoadingManufacturers && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading manufacturers...</p>
          </div>
        </div>
      )}

      {!isLoadingManufacturers && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button
            onClick={fetchManufacturers}
            className="mt-3 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoadingManufacturers && !errorMessage && manufacturers.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedManufacturers.map((manufacturer) => (
              <div key={manufacturer.id} className="bg-white rounded-xl border border-[#22a2f2]/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-black">
                      {manufacturer.unit_name || 'Manufacturer'}
                    </h3>
                    <p className="text-xs text-[#22a2f2] font-medium mt-1">
                      {manufacturer.manufacturer_id || 'Verified Partner'}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
                    Verified
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="text-gray-500">Business Type:</span>{' '}
                    <span className="font-medium">{manufacturer.business_type || 'Not specified'}</span>
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Location:</span>{' '}
                    <span className="font-medium">{manufacturer.location || 'Not specified'}</span>
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Daily Capacity:</span>{' '}
                    <span className="font-medium">
                      {manufacturer.daily_capacity ? manufacturer.daily_capacity.toLocaleString() : 'Not specified'}
                    </span>
                  </p>
                </div>

                {Array.isArray(manufacturer.product_types) && manufacturer.product_types.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Product Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {manufacturer.product_types.slice(0, 4).map((productType) => (
                        <span
                          key={`${manufacturer.id}-${productType}`}
                          className="px-2 py-0.5 rounded-full text-xs bg-[#22a2f2]/10 text-[#22a2f2] border border-[#22a2f2]/20"
                        >
                          {productType}
                        </span>
                      ))}
                      {manufacturer.product_types.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{manufacturer.product_types.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleContactManufacturer(manufacturer)}
                  disabled={contactingManufacturerId === manufacturer.id}
                  className={`mt-5 w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    contactingManufacturerId === manufacturer.id
                      ? 'bg-[#22a2f2]/60 text-white cursor-not-allowed'
                      : 'bg-[#22a2f2] hover:bg-[#1b8bd0] text-white'
                  }`}
                >
                  {contactingManufacturerId === manufacturer.id ? 'Opening Chat...' : 'Contact Manufacturer'}
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[40px] h-10 rounded-lg font-medium text-sm transition-all ${
                          currentPage === page
                            ? 'bg-[#22a2f2] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-1 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                aria-label="Next page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <span className="ml-4 text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>
      )}

      {!isLoadingManufacturers && !errorMessage && manufacturers.length === 0 && (
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
                    d="M17 20h5V4H2v16h5m10 0v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m10 0H7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No Manufacturers Found</h3>
            <p className="text-gray-400 max-w-md">
              We could not find verified manufacturers right now. Please check back shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
