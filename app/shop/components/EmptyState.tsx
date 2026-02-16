'use client';

interface EmptyStateProps {
  searchQuery: string;
  onClearAll: () => void;
}

export default function EmptyState({ searchQuery, onClearAll }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4">
      {/* Illustration */}
      <div className="w-28 h-28 sm:w-36 sm:h-36 mb-6 relative">
        <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-14 h-14 sm:w-18 sm:h-18 text-[#22a2f2]/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
        No products found
      </h3>

      {searchQuery ? (
        <p className="text-sm sm:text-base text-gray-500 text-center max-w-md mb-6">
          We couldn&apos;t find any products matching &quot;<span className="font-medium text-gray-700">{searchQuery}</span>&quot;.
          Try adjusting your search or filters.
        </p>
      ) : (
        <p className="text-sm sm:text-base text-gray-500 text-center max-w-md mb-6">
          No products match the selected filters. Try removing some filters to see more results.
        </p>
      )}

      <button
        onClick={onClearAll}
        className="px-6 py-2.5 bg-[#22a2f2] text-white rounded-lg hover:bg-[#1b8bd0] transition-colors font-medium text-sm"
      >
        Clear All Filters
      </button>
    </div>
  );
}
