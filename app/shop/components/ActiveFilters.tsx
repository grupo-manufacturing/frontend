'use client';

import { PRICE_RANGES, StockFilter } from './FilterSidebar';

interface ActiveFiltersProps {
  selectedCategories: string[];
  onRemoveCategory: (category: string) => void;
  selectedPriceRanges: string[];
  onRemovePriceRange: (rangeId: string) => void;
  stockFilter: StockFilter;
  onClearStockFilter: () => void;
  onClearAll: () => void;
}

export default function ActiveFilters({
  selectedCategories,
  onRemoveCategory,
  selectedPriceRanges,
  onRemovePriceRange,
  stockFilter,
  onClearStockFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const hasFilters =
    selectedCategories.length > 0 || selectedPriceRanges.length > 0 || stockFilter !== 'all';

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category chips */}
      {selectedCategories.map((category) => (
        <Chip key={`cat-${category}`} label={category} onRemove={() => onRemoveCategory(category)} />
      ))}

      {/* Price range chips */}
      {selectedPriceRanges.map((rangeId) => {
        const range = PRICE_RANGES.find((r) => r.id === rangeId);
        return range ? (
          <Chip key={`price-${rangeId}`} label={range.label} onRemove={() => onRemovePriceRange(rangeId)} />
        ) : null;
      })}

      {/* Stock filter chip */}
      {stockFilter !== 'all' && (
        <Chip
          label={stockFilter === 'in-stock' ? 'In Stock' : 'Out of Stock'}
          onRemove={onClearStockFilter}
        />
      )}

      {/* Clear all */}
      <button
        onClick={onClearAll}
        className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors ml-1 px-2 py-1"
      >
        Clear all
      </button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#22a2f2]/10 text-[#22a2f2] rounded-full text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-[#22a2f2]/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
