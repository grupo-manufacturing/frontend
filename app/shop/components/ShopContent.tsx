'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ShopProduct } from '../lib/types';
import { getProducts, getCategories, type GetProductsParams } from '../lib/api';
import { PRICE_RANGES, StockFilter } from './FilterSidebar';
import { SortOption } from './SortDropdown';
import SearchBar from './SearchBar';
import FilterSidebar from './FilterSidebar';
import SortDropdown from './SortDropdown';
import ActiveFilters from './ActiveFilters';
import ProductCard from './ProductCard';
import EmptyState from './EmptyState';

export default function ShopContent() {
  /* ── State ─────────────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch categories once ─────────────────────────────────────────── */
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  /* ── Build API params from state & fetch ──────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: GetProductsParams = { limit: 100 };

      if (searchQuery.trim()) params.search = searchQuery.trim();

      if (selectedCategories.length === 1) {
        params.category = selectedCategories[0];
      }

      if (stockFilter === 'in-stock') params.inStock = 'true';
      else if (stockFilter === 'out-of-stock') params.inStock = 'false';

      switch (sortOption) {
        case 'price-low':
          params.sort = 'name';
          params.order = 'asc';
          break;
        case 'price-high':
          params.sort = 'name';
          params.order = 'desc';
          break;
        case 'newest':
          params.sort = 'created_at';
          params.order = 'desc';
          break;
        case 'name-az':
          params.sort = 'name';
          params.order = 'asc';
          break;
        default:
          params.sort = 'created_at';
          params.order = 'desc';
      }

      const data = await getProducts(params);
      let fetched = data.products;

      // Client-side: multi-category filter (API only supports single category)
      if (selectedCategories.length > 1) {
        fetched = fetched.filter((p) => selectedCategories.includes(p.category));
      }

      // Client-side: price-range filter
      if (selectedPriceRanges.length > 0) {
        const ranges = selectedPriceRanges
          .map((id) => PRICE_RANGES.find((r) => r.id === id))
          .filter(Boolean);
        fetched = fetched.filter((p) => {
          const price = p.bulkPricing[0]?.unitPrice ?? 0;
          return ranges.some((r) => r && price >= r.min && price <= r.max);
        });
      }

      // Client-side: price sorting (backend can't sort by JSONB field)
      if (sortOption === 'price-low') {
        fetched.sort((a, b) => (a.bulkPricing[0]?.unitPrice ?? 0) - (b.bulkPricing[0]?.unitPrice ?? 0));
      } else if (sortOption === 'price-high') {
        fetched.sort((a, b) => (b.bulkPricing[0]?.unitPrice ?? 0) - (a.bulkPricing[0]?.unitPrice ?? 0));
      }

      setProducts(fetched);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Unable to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategories, selectedPriceRanges, stockFilter, sortOption]);

  /* ── Debounced fetch on state changes ─────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchProducts, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProducts]);

  /* ── Helpers ───────────────────────────────────────────────────────── */
  const activeFilterCount =
    selectedCategories.length +
    selectedPriceRanges.length +
    (stockFilter !== 'all' ? 1 : 0);

  function clearAllFilters() {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setStockFilter('all');
    setSortOption('default');
  }

  function clearFiltersOnly() {
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setStockFilter('all');
  }

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Grupo Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">
          Premium bulk apparel for brands &amp; businesses
        </p>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <div className="mb-5">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* ── Toolbar: Filter toggle (mobile) + Active count + Sort ─────── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
            aria-label="Open filters"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[#22a2f2] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Product count */}
          <span className="text-sm text-gray-500 hidden sm:inline">
            {loading ? '...' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
          </span>
        </div>

        <SortDropdown value={sortOption} onChange={setSortOption} />
      </div>

      {/* ── Active Filter Chips ────────────────────────────────────────── */}
      <div className="mb-5">
        <ActiveFilters
          selectedCategories={selectedCategories}
          onRemoveCategory={(cat) =>
            setSelectedCategories((prev) => prev.filter((c) => c !== cat))
          }
          selectedPriceRanges={selectedPriceRanges}
          onRemovePriceRange={(id) =>
            setSelectedPriceRanges((prev) => prev.filter((r) => r !== id))
          }
          stockFilter={stockFilter}
          onClearStockFilter={() => setStockFilter('all')}
          onClearAll={clearFiltersOnly}
        />
      </div>

      {/* ── Main Layout: Sidebar + Grid ──────────────────────────────── */}
      <div className="flex gap-8">
        {/* Filter Sidebar */}
        <FilterSidebar
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          selectedPriceRanges={selectedPriceRanges}
          onPriceRangeChange={setSelectedPriceRanges}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          onClearAll={clearFiltersOnly}
          isOpen={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
        />

        {/* Product Grid / Loading / Error / Empty State */}
        <div className="flex-1 min-w-0">
          {/* Mobile product count */}
          <p className="text-sm text-gray-500 mb-4 sm:hidden">
            {loading ? '...' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-9 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-5 py-2.5 bg-[#22a2f2] text-white rounded-lg hover:bg-[#1b8bd0] transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState searchQuery={searchQuery} onClearAll={clearAllFilters} />
          )}
        </div>
      </div>
    </div>
  );
}
