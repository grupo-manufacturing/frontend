'use client';

import { useState, useRef, useEffect } from 'react';

export type SortOption = 'default' | 'price-low' | 'price-high' | 'newest' | 'name-az';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Popularity' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name-az', label: 'Name: A to Z' },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-nav flex items-center gap-2 whitespace-nowrap border border-brand/15 bg-surface px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-[#1C8FD7] sm:text-[11px]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Sort products"
      >
        <span className="hidden sm:inline">{selectedLabel}</span>
        <span className="sm:hidden">Sort</span>
        <svg
          className={`h-3.5 w-3.5 text-foreground/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-30 mt-2 w-56 border border-brand/15 bg-surface py-1 shadow-[0_16px_40px_rgba(11,18,32,0.12)]"
          role="listbox"
          aria-label="Sort options"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={value === option.value}
              className={`font-body w-full px-4 py-2.5 text-left text-sm transition-colors ${
                value === option.value
                  ? 'bg-[#1C8FD7]/10 font-medium text-[#1C8FD7]'
                  : 'text-foreground/70 hover:bg-brand/5 hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
