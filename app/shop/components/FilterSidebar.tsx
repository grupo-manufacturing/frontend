'use client';

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

export type StockFilter = 'all' | 'in-stock' | 'out-of-stock';

interface FilterSidebarProps {
  categories: string[];
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
  categories,
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

  const filterContent = (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-nav mb-3 text-[10px] uppercase tracking-[0.18em] text-[#1C8FD7]">
          Category
        </h3>
        <div className="flex flex-col gap-1">
          {categories.map((category) => {
            const selected = selectedCategories.includes(category);
            return (
              <label
                key={category}
                className={`font-body flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  selected
                    ? 'bg-[#1C8FD7] text-surface'
                    : 'text-foreground/70 hover:bg-brand/5 hover:text-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleCategory(category)}
                  className="sr-only"
                />
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border transition-colors ${
                    selected ? 'border-surface bg-surface' : 'border-foreground/25'
                  }`}
                >
                  {selected && (
                    <svg className="h-2.5 w-2.5 text-[#1C8FD7]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <span className="flex-1">{category}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-nav mb-3 text-[10px] uppercase tracking-[0.18em] text-[#1C8FD7]">
          Price Range
        </h3>
        <div className="flex flex-col gap-1">
          {PRICE_RANGES.map((range) => {
            const selected = selectedPriceRanges.includes(range.id);
            return (
              <label
                key={range.id}
                className={`font-body flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  selected
                    ? 'bg-[#1C8FD7] text-surface'
                    : 'text-foreground/70 hover:bg-brand/5 hover:text-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePriceRange(range.id)}
                  className="sr-only"
                />
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border transition-colors ${
                    selected ? 'border-surface bg-surface' : 'border-foreground/25'
                  }`}
                >
                  {selected && (
                    <svg className="h-2.5 w-2.5 text-[#1C8FD7]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <span>{range.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-nav mb-3 text-[10px] uppercase tracking-[0.18em] text-[#1C8FD7]">
          Availability
        </h3>
        <div className="flex flex-col gap-1">
          {[
            { value: 'all' as StockFilter, label: 'All Products' },
            { value: 'in-stock' as StockFilter, label: 'In Stock Only' },
            { value: 'out-of-stock' as StockFilter, label: 'Out of Stock' },
          ].map((option) => {
            const selected = stockFilter === option.value;
            return (
              <label
                key={option.value}
                className={`font-body flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  selected
                    ? 'bg-[#1C8FD7] text-surface'
                    : 'text-foreground/70 hover:bg-brand/5 hover:text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="stock-filter"
                  checked={selected}
                  onChange={() => onStockFilterChange(option.value)}
                  className="sr-only"
                />
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected ? 'border-surface' : 'border-foreground/25'
                  }`}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
                </span>
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="font-nav w-full border border-red-400/30 py-2.5 text-[10px] uppercase tracking-[0.14em] text-red-500 transition-colors hover:bg-red-50"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border border-brand/10 bg-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold uppercase tracking-[-0.01em] text-foreground">
              Filters
            </h2>
            {hasActiveFilters && (
              <span className="font-nav text-[10px] uppercase tracking-[0.14em] text-[#1C8FD7]">
                Active
              </span>
            )}
          </div>
          {filterContent}
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col overflow-hidden border-t border-brand/15 bg-surface">
            <div className="flex items-center justify-between border-b border-brand/10 p-4">
              <h2 className="font-heading text-lg font-semibold uppercase text-foreground">Filters</h2>
              <button
                onClick={onClose}
                className="p-2 text-foreground/40 transition-colors hover:text-foreground"
                aria-label="Close filters"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterContent}</div>
            <div className="border-t border-brand/10 p-4">
              <button
                onClick={onClose}
                className="font-nav w-full bg-[#1C8FD7] py-3 text-[11px] uppercase tracking-[0.14em] text-[#0b1220] transition-colors hover:bg-[#1678B5] hover:text-surface"
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
