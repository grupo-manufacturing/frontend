'use client';

import { SHOP_PRODUCTS } from '../data';

/* ── Derive unique categories from product data ─────────────────────── */
const ALL_CATEGORIES = Array.from(
  new Set(SHOP_PRODUCTS.map((p) => p.category))
).sort();

/* ── Price range buckets (based on Standard tier unit price) ────────── */
export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: 'under-300', label: 'Under ₹300', min: 0, max: 299 },
  { id: '300-500', label: '₹300 – ₹500', min: 300, max: 500 },
  { id: '500-1000', label: '₹500 – ₹1,000', min: 501, max: 1000 },
  { id: 'above-1000', label: 'Above ₹1,000', min: 1001, max: Infinity },
];

/* ── Stock filter options ───────────────────────────────────────────── */
export type StockFilter = 'all' | 'in-stock' | 'out-of-stock';

/* ── Props ──────────────────────────────────────────────────────────── */
interface FilterSidebarProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedPriceRanges: string[];
  onPriceRangeChange: (ranges: string[]) => void;
  stockFilter: StockFilter;
  onStockFilterChange: (filter: StockFilter) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterSidebar({
  selectedCategories,
  onCategoryChange,
  selectedPriceRanges,
  onPriceRangeChange,
  stockFilter,
  onStockFilterChange,
  onClearAll,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const hasActiveFilters =
    selectedCategories.length > 0 || selectedPriceRanges.length > 0 || stockFilter !== 'all';

  function toggleCategory(category: string) {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  }

  function togglePriceRange(rangeId: string) {
    if (selectedPriceRanges.includes(rangeId)) {
      onPriceRangeChange(selectedPriceRanges.filter((r) => r !== rangeId));
    } else {
      onPriceRangeChange([...selectedPriceRanges, rangeId]);
    }
  }

  /* Count products per category for badge */
  function categoryCount(category: string) {
    return SHOP_PRODUCTS.filter((p) => p.category === category).length;
  }

  /* ── Shared filter panel content ────────────────────────────────── */
  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* ── Category ────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Category
        </h3>
        <div className="flex flex-col gap-1.5">
          {ALL_CATEGORIES.map((category) => (
            <label
              key={category}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                selectedCategories.includes(category)
                  ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="sr-only"
              />
              {/* Custom checkbox */}
              <span
                className={`w-4.5 h-4.5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                  selectedCategories.includes(category)
                    ? 'bg-[#22a2f2] border-[#22a2f2]'
                    : 'border-gray-300'
                }`}
              >
                {selectedCategories.includes(category) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              <span className="flex-1">{category}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {categoryCount(category)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Price Range ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Price Range
        </h3>
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                selectedPriceRanges.includes(range.id)
                  ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPriceRanges.includes(range.id)}
                onChange={() => togglePriceRange(range.id)}
                className="sr-only"
              />
              <span
                className={`w-4.5 h-4.5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                  selectedPriceRanges.includes(range.id)
                    ? 'bg-[#22a2f2] border-[#22a2f2]'
                    : 'border-gray-300'
                }`}
              >
                {selectedPriceRanges.includes(range.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Availability ────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Availability
        </h3>
        <div className="flex flex-col gap-1.5">
          {[
            { value: 'all' as StockFilter, label: 'All Products' },
            { value: 'in-stock' as StockFilter, label: 'In Stock Only' },
            { value: 'out-of-stock' as StockFilter, label: 'Out of Stock' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                stockFilter === option.value
                  ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="stock-filter"
                checked={stockFilter === option.value}
                onChange={() => onStockFilterChange(option.value)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                  stockFilter === option.value
                    ? 'border-[#22a2f2]'
                    : 'border-gray-300'
                }`}
              >
                {stockFilter === option.value && (
                  <span className="w-2 h-2 rounded-full bg-[#22a2f2]" />
                )}
              </span>
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Clear All Button ─────────────────────────────────────────── */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="w-full py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <span className="text-xs font-medium text-[#22a2f2] bg-[#22a2f2]/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          {filterContent}
        </div>
      </aside>

      {/* ── Mobile Filter Overlay ────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-2xl shadow-xl flex flex-col animate-fade-in-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">{filterContent}</div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#22a2f2] text-white rounded-xl font-medium text-sm hover:bg-[#1b8bd0] transition-colors"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
