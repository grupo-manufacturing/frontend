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
      {selectedCategories.map((category) => (
        <Chip key={`cat-${category}`} label={category} onRemove={() => onRemoveCategory(category)} />
      ))}

      {selectedPriceRanges.map((rangeId) => {
        const range = PRICE_RANGES.find((r) => r.id === rangeId);
        return range ? (
          <Chip key={`price-${rangeId}`} label={range.label} onRemove={() => onRemovePriceRange(rangeId)} />
        ) : null;
      })}

      {stockFilter !== 'all' && (
        <Chip
          label={stockFilter === 'in-stock' ? 'In Stock' : 'Out of Stock'}
          onRemove={onClearStockFilter}
        />
      )}

      <button
        onClick={onClearAll}
        className="font-nav ml-1 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-foreground/45 transition-colors hover:text-red-500"
      >
        Clear all
      </button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="font-nav inline-flex items-center gap-1.5 border border-[#1C8FD7]/25 bg-[#1C8FD7]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#1C8FD7]">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 transition-colors hover:bg-[#1C8FD7]/20"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
