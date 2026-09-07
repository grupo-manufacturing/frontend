'use client';

interface EmptyStateProps {
  searchQuery: string;
  onClearAll: () => void;
}

export default function EmptyState({ searchQuery, onClearAll }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-brand/10 px-4 py-16 sm:py-24">
      <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7]">No Results</p>
      <h3 className="font-heading mt-3 text-xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-2xl">
        No products found
      </h3>

      {searchQuery ? (
        <p className="font-body mt-3 max-w-md text-center text-sm text-foreground/55 sm:text-base">
          Nothing matched &quot;<span className="font-medium text-foreground">{searchQuery}</span>&quot;.
          Try adjusting your search or filters.
        </p>
      ) : (
        <p className="font-body mt-3 max-w-md text-center text-sm text-foreground/55 sm:text-base">
          No products match the selected filters. Try removing some filters to see more results.
        </p>
      )}

      <button
        onClick={onClearAll}
        className="font-nav mt-6 bg-[#1C8FD7] px-6 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-colors hover:bg-[#1678B5] hover:text-surface sm:text-[11px]"
      >
        Clear All Filters
      </button>
    </div>
  );
}
