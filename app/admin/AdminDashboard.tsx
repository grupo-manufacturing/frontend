'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { wakeOmsBackend } from '../request-for-quotation/api';
import {
  AdminAuthError,
  adminLogin,
  clearSession,
  fetchAdminRfqs,
  getSessionToken,
  subscribeSession,
  updateRfqStatus,
  type AdminRfq,
  type AdminRfqPage,
} from './api';

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<string, { label: string; pill: string; dot: string }> = {
  lead: { label: 'Lead', pill: 'bg-sky-50 text-sky-700 ring-sky-600/15', dot: 'bg-sky-500' },
  quotation: { label: 'Quotation', pill: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  won: { label: 'Won', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  lost: { label: 'Lost', pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' },
};

const STATUS_FILTERS = [
  { value: '', label: 'All', dot: '' },
  ...Object.entries(STATUS_STYLES).map(([value, style]) => ({ value, label: style.label, dot: style.dot })),
];

type StatusAction = { to: string; label: string; confirmText: string; className: string };

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  lead: [
    {
      to: 'quotation',
      label: 'Send Quotation',
      confirmText: 'as Quotation sent',
      className: 'bg-zinc-900 text-white hover:bg-zinc-700',
    },
  ],
  quotation: [
    {
      to: 'won',
      label: 'Won',
      confirmText: 'as Won (customer accepted the quotation)',
      className: 'bg-white text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50',
    },
    {
      to: 'lost',
      label: 'Lost',
      confirmText: 'as Lost (customer rejected the quotation)',
      className: 'bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50',
    },
  ],
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const timeFormatter = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

function formatPhone(phone: string) {
  return parsePhoneNumberFromString(phone)?.formatInternational() ?? phone;
}

const inputCls =
  'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5';

const ghostButtonCls =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminDashboard() {
  const token = useSyncExternalStore(subscribeSession, getSessionToken, () => undefined);

  useEffect(() => {
    wakeOmsBackend();
  }, []);

  if (token === undefined) return <div className="min-h-screen bg-zinc-50" />;
  if (!token) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Grupo home">
            <Image src="/logo.jpg" alt="Grupo" width={32} height={32} priority className="h-8 w-8 rounded-lg" />
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">Admin</span>
          </Link>
          <button
            type="button"
            onClick={clearSession}
            aria-label="Log out"
            title="Log out"
            className="grid h-9 w-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]" aria-hidden>
              <path d="M8 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3M13 6.5 16.5 10 13 13.5M16.5 10H8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <RfqList token={token} />
    </div>
  );
}

function FieldIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
      aria-hidden
    >
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const USER_ICON = 'M10 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4 16.5c.8-2.6 3.1-4 6-4s5.2 1.4 6 4';
const SEARCH_ICON = 'M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM17.5 17.5l-3.9-3.9';
const LOCK_ICON = 'M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9M4.5 9h11v7.5h-11V9Z';

function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16 text-zinc-900 antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Grupo" width={56} height={56} priority className="h-14 w-14 rounded-2xl shadow-lg shadow-sky-500/20 ring-1 ring-black/5" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Sign in to the Grupo admin portal.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white/90 p-7 shadow-xl shadow-zinc-900/5 backdrop-blur"
        >
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="text-sm font-medium text-zinc-700">
              Username
            </label>
            <div className="relative">
              <FieldIcon d={USER_ICON} />
              <input
                id="admin-username"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <div className="relative">
              <FieldIcon d={LOCK_ICON} />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`${inputCls} pl-9 pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-label="Signing in" />
            ) : (
              <>
                Sign in
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">Restricted area · Authorised Grupo staff only</p>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} aria-hidden>
      <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.5H13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductLine({ item }: { item: AdminRfq['items'][number] }) {
  return (
    <li className="flex items-baseline justify-between gap-3 whitespace-nowrap text-zinc-700">
      <span className="truncate">{item.product}</span>
      <span className="admin-mono text-xs text-zinc-400">× {item.quantity.toLocaleString('en-IN')}</span>
    </li>
  );
}

function ProductsCell({ items, totalUnits }: { items: AdminRfq['items']; totalUnits: number }) {
  const [expanded, setExpanded] = useState(false);
  const [first, ...rest] = items;
  if (!first) return <span className="text-zinc-300">—</span>;

  return (
    <div className="w-48">
      <ul className="space-y-0.5">
        <ProductLine item={first} />
        {expanded && rest.map((item) => <ProductLine key={item.product} item={item} />)}
      </ul>
      {rest.length > 0 && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900"
          >
            {expanded ? 'Show less' : `+${rest.length} more`}
          </button>
          <span className="admin-mono text-zinc-400">{totalUnits.toLocaleString('en-IN')} units</span>
        </div>
      )}
    </div>
  );
}

const COLUMNS = ['RFQ', 'Received', 'Customer', 'Contact', 'Products', 'Location', 'Tech Pack', 'Status'];

function RfqList({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<AdminRfqPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const term = searchInput.trim();
    if (term === search) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setPage(1);
      setSearch(term);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const countsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const countsKey = `${search}|${reloadKey}`;
    const withCounts = countsKeyRef.current !== countsKey;
    fetchAdminRfqs(token, page, PAGE_SIZE, { status: statusFilter, search, withCounts })
      .then((result) => {
        if (cancelled) return;
        if (withCounts) countsKeyRef.current = countsKey;
        setData((current) => ({ ...result, counts: result.counts ?? current?.counts }));
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          clearSession();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load RFQs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, page, reloadKey, statusFilter, search]);

  const selectStatus = (status: string) => {
    if (status === statusFilter) return;
    setLoading(true);
    setPage(1);
    setStatusFilter(status);
  };

  const clearFilters = () => {
    setSearchInput('');
    if (search || statusFilter) {
      setLoading(true);
      setPage(1);
      setSearch('');
      setStatusFilter('');
    }
  };

  const goToPage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const changeStatus = async (rfq: AdminRfq, action: StatusAction) => {
    if (!window.confirm(`Mark ${rfq.rfqNumber} (${rfq.brandName}) ${action.confirmText}? This cannot be undone.`)) return;
    setUpdatingId(rfq.id);
    setError('');
    try {
      await updateRfqStatus(token, rfq.id, action.to);
      setData((current) =>
        current && {
          ...current,
          rfqs: current.rfqs.map((r) => (r.id === rfq.id ? { ...r, status: action.to } : r)),
        },
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        clearSession();
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests for Quotation</h1>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className={ghostButtonCls}>
          <RefreshIcon spinning={loading} />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            const count = data
              ? filter.value
                ? data.counts?.[filter.value] ?? 0
                : Object.values(data.counts ?? {}).reduce((sum, n) => sum + n, 0)
              : null;
            return (
              <button
                key={filter.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectStatus(filter.value)}
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

        <div className="relative w-full lg:w-80">
          <FieldIcon d={SEARCH_ICON} />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search RFQ no., name, brand, email, phone…"
            aria-label="Search RFQs"
            maxLength={100}
            className={`${inputCls} pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{error}</p>}

      <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60">
                {COLUMNS.map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-medium text-zinc-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {!data &&
                loading &&
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((heading) => (
                      <td key={heading} className="px-4 py-4">
                        <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100" />
                      </td>
                    ))}
                  </tr>
                ))}
              {data && data.rfqs.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                    {search || statusFilter ? (
                      <>
                        <p className="font-medium text-zinc-900">No matching RFQs</p>
                        <p className="mt-1 text-zinc-500">Try a different search or status.</p>
                        <button type="button" onClick={clearFilters} className={`${ghostButtonCls} mt-4`}>
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-zinc-900">No RFQs yet</p>
                        <p className="mt-1 text-zinc-500">New requests from the website will show up here.</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {data?.rfqs.map((rfq) => {
                const totalUnits = rfq.items.reduce((sum, item) => sum + item.quantity, 0);
                const createdAt = new Date(rfq.createdAt);
                return (
                  <tr key={rfq.id} className="align-top transition-colors hover:bg-zinc-50/70">
                    <td className="admin-mono whitespace-nowrap px-4 py-4 text-xs font-medium text-zinc-900">{rfq.rfqNumber}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="text-zinc-900">{dateFormatter.format(createdAt)}</p>
                      <p className="text-xs text-zinc-500">{timeFormatter.format(createdAt)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-zinc-900">{rfq.name}</p>
                      <p className="text-zinc-500">{rfq.brandName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <a href={`mailto:${rfq.email}`} className="block break-all text-zinc-900 underline-offset-2 hover:underline">
                        {rfq.email}
                      </a>
                      <a href={`tel:${rfq.phone}`} className="admin-mono block whitespace-nowrap text-xs text-zinc-500 hover:text-zinc-900">
                        {formatPhone(rfq.phone)}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <ProductsCell items={rfq.items} totalUnits={totalUnits} />
                    </td>
                    <td className="max-w-[200px] px-4 py-4 text-zinc-600">{rfq.location}</td>
                    <td className="px-4 py-4">
                      {rfq.techPackUrl ? (
                        <a
                          href={rfq.techPackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200 transition hover:bg-zinc-50"
                        >
                          Open ↗
                        </a>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={rfq.status} />
                      {STATUS_ACTIONS[rfq.status] && (
                        <div className="mt-2 flex gap-1.5">
                          {STATUS_ACTIONS[rfq.status].map((action) => (
                            <button
                              key={action.to}
                              type="button"
                              onClick={() => changeStatus(rfq, action)}
                              disabled={updatingId !== null}
                              className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
            <span className="text-zinc-500">
              Page <span className="font-medium text-zinc-900">{page}</span> of {totalPages}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => goToPage(page - 1)} disabled={loading || page <= 1} className={ghostButtonCls}>
                Previous
              </button>
              <button type="button" onClick={() => goToPage(page + 1)} disabled={loading || page >= totalPages} className={ghostButtonCls}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
