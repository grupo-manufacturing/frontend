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
const PER_PAGE = 15;

const SORT_PARAMS: Record<SortOption, Pick<GetProductsParams, 'sort' | 'order'>> = {
  default: { sort: 'created_at', order: 'desc' },
  newest: { sort: 'created_at', order: 'desc' },
  'price-low': { sort: 'price', order: 'asc' },
  'price-high': { sort: 'price', order: 'desc' },
  'name-az': { sort: 'name', order: 'asc' },
};

export default function ShopContent() {
  /* ── State ─────────────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      const params: GetProductsParams = { page, limit: PER_PAGE, ...SORT_PARAMS[sortOption] };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategories.length) params.category = selectedCategories.join(',');

      if (selectedPriceRanges.length) {
        params.price = PRICE_RANGES
          .filter((r) => selectedPriceRanges.includes(r.id))
          .map((r) => `${r.min}-${Number.isFinite(r.max) ? r.max : ''}`)
          .join(',');
      }

      if (stockFilter === 'in-stock') params.inStock = 'true';
      else if (stockFilter === 'out-of-stock') params.inStock = 'false';

      const data = await getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Unable to load products. Please try again.');
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategories, selectedPriceRanges, stockFilter, sortOption]);

  /* ── Back to page 1 whenever the result set changes ───────────────── */
  useEffect(() => {
    setPage(1);
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

  function goToPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            {loading ? '...' : `${total} ${total === 1 ? 'product' : 'products'}`}
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

        <div ref={resultsRef} className="min-w-0 flex-1 scroll-mt-24">
          <p className="font-nav mb-4 text-[10px] uppercase tracking-[0.14em] text-foreground/45 sm:hidden">
            {loading ? '...' : `${total} ${total === 1 ? 'product' : 'products'}`}
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
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
            </>
          ) : (
            <EmptyState searchQuery={searchQuery} onClearAll={clearAllFilters} />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function pageItems(page: number, totalPages: number): (number | 'gap')[] {
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ['gap' as const, p] : [p]));
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const base =
    'font-nav flex h-9 min-w-9 items-center justify-center border px-3 text-[10px] uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-40';
  const idle = 'border-brand/15 text-foreground hover:border-[#1C8FD7]';

  return (
    <nav aria-label="Product pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={`${base} ${idle}`}>
        Prev
      </button>
      {pageItems(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="font-nav px-1 text-[10px] text-foreground/40">
            ...
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`${base} ${item === page ? 'border-[#1C8FD7] bg-[#1C8FD7] text-[#0b1220]' : idle}`}
          >
            {item}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={`${base} ${idle}`}>
        Next
      </button>
    </nav>
  );
}
