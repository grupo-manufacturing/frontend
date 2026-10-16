'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Grupo home">
            <Image src="/logo.jpg" alt="Grupo" width={32} height={32} priority className="h-8 w-8 rounded-lg" />
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">Admin</span>
          </Link>
          {token && (
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
          )}
        </div>
      </header>

      {token === undefined ? null : token ? <RfqList token={token} /> : <LoginForm />}
    </div>
  );
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <main className="flex items-center justify-center px-4 py-20 sm:py-28">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to manage RFQs.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="text-sm font-medium text-zinc-700">
              Username
            </label>
            <input
              id="admin-username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
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

  useEffect(() => {
    let cancelled = false;
    fetchAdminRfqs(token, page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setData(result);
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
  }, [token, page, reloadKey]);

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
                    <p className="font-medium text-zinc-900">No RFQs yet</p>
                    <p className="mt-1 text-zinc-500">New requests from the website will show up here.</p>
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
