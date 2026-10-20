'use client';

import { useEffect, useId } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const inputCls =
  'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5';

export const ghostButtonCls =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButtonCls =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60';

export const ICONS = {
  user: 'M10 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4 16.5c.8-2.6 3.1-4 6-4s5.2 1.4 6 4',
  search: 'M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM17.5 17.5l-3.9-3.9',
  lock: 'M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9M4.5 9h11v7.5h-11V9Z',
  logout: 'M8 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3M13 6.5 16.5 10 13 13.5M16.5 10H8',
  refresh: 'M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.5H13',
  plus: 'M10 4.5v11M4.5 10h11',
  edit: 'M12.5 4.5l3 3M4 16l1-4 8.5-8.5 3 3L8 15l-4 1Z',
  trash: 'M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6',
};

export function Icon({ d, className = 'h-4 w-4' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FieldIcon({ d }: { d: string }) {
  return <Icon d={d} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />;
}

export const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
export const timeFormatter = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

export function formatPhone(phone: string) {
  return parsePhoneNumberFromString(phone)?.formatInternational() ?? phone;
}

const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

export function formatInr(amount: number) {
  return (Number.isInteger(amount) ? inrWhole : inrPaise).format(amount);
}

export function Field({
  label,
  htmlFor,
  hint,
  className = '',
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

// Ids of open dialogs, innermost last, so Escape only closes the dialog on top.
const openDialogs: string[] = [];

/**
 * A modal centred on screen: closes on Escape or a click outside, and locks page scroll while open.
 * The header and footer stay put while the body scrolls. Pass onSubmit to render it as a form.
 */
export function Dialog({
  title,
  onClose,
  onSubmit,
  footer,
  className = 'max-w-3xl',
  children,
}: {
  title: React.ReactNode;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    openDialogs.push(titleId);
    return () => {
      openDialogs.splice(openDialogs.indexOf(titleId), 1);
    };
  }, [titleId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openDialogs[openDialogs.length - 1] === titleId) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, titleId]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  const panelProps = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    className: `flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ${className}`,
  };

  const content = (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4">
        <h2 id={titleId} className="flex items-center gap-3 text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-lg text-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-900/30 p-4 backdrop-blur-[2px] sm:p-10"
      onMouseDown={onClose}
    >
      {onSubmit ? (
        <form {...panelProps} onSubmit={onSubmit}>
          {content}
        </form>
      ) : (
        <div {...panelProps}>{content}</div>
      )}
    </div>
  );
}

export function DialogFooter({ saving, submitLabel, onCancel }: { saving: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-100 px-6 py-4">
      <button type="button" onClick={onCancel} className={ghostButtonCls}>
        Cancel
      </button>
      <button type="submit" disabled={saving} className={primaryButtonCls}>
        {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        {submitLabel}
      </button>
    </div>
  );
}

export type StatusStyle = { label: string; pill: string; dot: string };

const FALLBACK_STATUS: StatusStyle = { label: '', pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' };

export function StatusPill({ status, styles }: { status: string; styles: Record<string, StatusStyle> }) {
  const style = styles[status] ?? { ...FALLBACK_STATUS, label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function PageHeader({
  title,
  loading,
  onRefresh,
  children,
}: {
  title: string;
  loading: boolean;
  onRefresh: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onRefresh} disabled={loading} className={ghostButtonCls}>
          <Icon d={ICONS.refresh} className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        {children}
      </div>
    </div>
  );
}

export function FilterChips({
  styles,
  value,
  counts,
  onChange,
}: {
  styles: Record<string, StatusStyle>;
  value: string;
  counts: Record<string, number> | undefined;
  onChange: (value: string) => void;
}) {
  const filters = [
    { value: '', label: 'All', dot: '' },
    ...Object.entries(styles).map(([key, style]) => ({ value: key, label: style.label, dot: style.dot })),
  ];

  return (
    <div className="flex max-w-full gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="Filter by status">
      {filters.map((filter) => {
        const active = value === filter.value;
        const count = counts
          ? filter.value
            ? counts[filter.value] ?? 0
            : Object.values(counts).reduce((sum, n) => sum + n, 0)
          : null;
        return (
          <button
            key={filter.label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.value)}
            className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-full border pl-3.5 pr-1.5 text-sm font-medium transition ${
              active
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
            }`}
          >
            {filter.dot && <span className={`h-2 w-2 rounded-full ${filter.dot}`} />}
            {filter.label}
            <span
              className={`admin-mono min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs ${
                active ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {count ?? '–'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full lg:w-80">
      <FieldIcon d={ICONS.search} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
        className={`${inputCls} pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{message}</p>;
}

export function DataTable({
  columns,
  minWidth,
  loading,
  loadingLabel,
  isEmpty,
  empty,
  page,
  totalPages,
  onPageChange,
  children,
}: {
  columns: string[];
  minWidth: string;
  loading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  empty: React.ReactNode;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60">
              {columns.map((heading, i) => (
                <th key={heading || i} className="px-4 py-3 text-xs font-medium text-zinc-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20">
                  <div className="flex flex-col items-center gap-3 text-zinc-500" role="status">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                    <span className="text-sm">{loadingLabel}</span>
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
          <span className="text-zinc-500">
            Page <span className="font-medium text-zinc-900">{page}</span> of {totalPages}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={loading || page <= 1} className={ghostButtonCls}>
              Previous
            </button>
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={loading || page >= totalPages} className={ghostButtonCls}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  filtered,
  noun,
  emptyHint,
  onClearFilters,
}: {
  filtered: boolean;
  noun: string;
  emptyHint: string;
  onClearFilters: () => void;
}) {
  if (filtered) {
    return (
      <>
        <p className="font-medium text-zinc-900">No matching {noun}</p>
        <p className="mt-1 text-zinc-500">Try a different search or status.</p>
        <button type="button" onClick={onClearFilters} className={`${ghostButtonCls} mt-4`}>
          Clear filters
        </button>
      </>
    );
  }
  return (
    <>
      <p className="font-medium text-zinc-900">No {noun} yet</p>
      <p className="mt-1 text-zinc-500">{emptyHint}</p>
    </>
  );
}
