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

const PET_CLOTHING_CATEGORY = 'Pet Clothing';

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
      .then((fetchedCategories) => {
        const allCategories = [...new Set([...fetchedCategories, PET_CLOTHING_CATEGORY])];
        setCategories(allCategories);
      })
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
    <div className="bg-surface">
      {/* Editorial header */}
      <div className="relative overflow-hidden border-b border-brand/10 bg-[#0a0f14]">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 50% 60% at 80% 20%, rgba(28,143,215,0.2), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
          <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7]">
            Wholesale Catalog
          </p>
          <h1 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-surface sm:text-4xl md:text-5xl">
            Grupo Marketplace.
            <span className="mt-1 block text-[#1C8FD7]">Bulk Apparel for Brands.</span>
          </h1>
          <p className="font-body mt-4 max-w-xl text-sm leading-relaxed text-surface/65 sm:text-base">
            Premium manufacturing-ready styles for commercial quantities and repeat orders.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* ── Toolbar: Filter toggle (mobile) + Active count + Sort ─────── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="font-nav flex items-center gap-2 border border-brand/15 bg-surface px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-[#1C8FD7] lg:hidden"
            aria-label="Open filters"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center bg-[#1C8FD7] text-[10px] font-bold text-surface">
                {activeFilterCount}
              </span>
            )}
          </button>

          <span className="font-nav hidden text-[10px] uppercase tracking-[0.14em] text-foreground/45 sm:inline">
            {loading ? '...' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
          </span>
        </div>

        <SortDropdown value={sortOption} onChange={setSortOption} />
      </div>

      {/* ── Active Filter Chips ────────────────────────────────────────── */}
      <div className="mb-6">
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

        <div className="min-w-0 flex-1">
          <p className="font-nav mb-4 text-[10px] uppercase tracking-[0.14em] text-foreground/45 sm:hidden">
            {loading ? '...' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden border border-brand/10">
                  <div className="aspect-[4/5] bg-brand/10" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 bg-brand/10" />
                    <div className="h-4 w-2/3 bg-brand/10" />
                    <div className="h-9 bg-brand/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="border border-brand/10 py-16 text-center">
              <p className="font-body mb-4 text-red-500">{error}</p>
              <button
                onClick={fetchProducts}
                className="font-nav bg-[#1C8FD7] px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-colors hover:bg-[#1678B5] hover:text-surface"
              >
                Retry
              </button>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
    </div>
  );
}
