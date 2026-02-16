'use client';

import { useState, useMemo } from 'react';
import { SHOP_PRODUCTS, ShopProduct } from '../data';
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

  /* ── Derived filtered + sorted products ────────────────────────────── */
  const filteredProducts = useMemo(() => {
    let products: ShopProduct[] = [...SHOP_PRODUCTS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      products = products.filter((p) => selectedCategories.includes(p.category));
    }

    // Price range filter (Standard tier unit price)
    if (selectedPriceRanges.length > 0) {
      const ranges = selectedPriceRanges
        .map((id) => PRICE_RANGES.find((r) => r.id === id))
        .filter(Boolean);
      products = products.filter((p) => {
        const price = p.bulkPricing[0]?.unitPrice ?? 0;
        return ranges.some((r) => r && price >= r.min && price <= r.max);
      });
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      products = products.filter((p) => p.inStock);
    } else if (stockFilter === 'out-of-stock') {
      products = products.filter((p) => !p.inStock);
    }

    // Sorting
    switch (sortOption) {
      case 'price-low':
        products.sort((a, b) => (a.bulkPricing[0]?.unitPrice ?? 0) - (b.bulkPricing[0]?.unitPrice ?? 0));
        break;
      case 'price-high':
        products.sort((a, b) => (b.bulkPricing[0]?.unitPrice ?? 0) - (a.bulkPricing[0]?.unitPrice ?? 0));
        break;
      case 'newest':
        products.sort((a, b) => b.id - a.id);
        break;
      case 'name-az':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return products;
  }, [searchQuery, selectedCategories, selectedPriceRanges, stockFilter, sortOption]);

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
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
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

        {/* Product Grid / Empty State */}
        <div className="flex-1 min-w-0">
          {/* Mobile product count */}
          <p className="text-sm text-gray-500 mb-4 sm:hidden">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
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
