'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { wakeOmsBackend } from '../rfq/api';
import {
  AdminAuthError,
  adminLogin,
  clearSession,
  fetchAdminRfqs,
  getSessionToken,
  subscribeSession,
  type AdminRfqPage,
} from './api';

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-brand/10 text-brand',
  contacted: 'bg-amber-100 text-amber-700',
  quoted: 'bg-violet-100 text-violet-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-100 text-gray-500',
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

function formatPhone(phone: string) {
  return parsePhoneNumberFromString(phone)?.formatInternational() ?? phone;
}

const inputCls =
  'font-body h-12 w-full border border-brand/15 bg-[#f7fbfe] px-4 text-sm text-foreground placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-brand/35 focus:border-brand focus:bg-surface focus:shadow-[0_0_0_4px_rgba(28,143,215,0.12)]';

export default function AdminDashboard() {
  const token = useSyncExternalStore(subscribeSession, getSessionToken, () => undefined);

  useEffect(() => {
    wakeOmsBackend();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-foreground">
      <header className="border-b border-brand/15 bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-baseline gap-2" aria-label="Grupo home">
            <span className="font-brand text-3xl font-bold leading-none text-brand">Grupo</span>
            <span className="font-nav text-[10px] uppercase tracking-[0.18em] text-foreground/50">Admin</span>
          </Link>
          {token && (
            <button
              type="button"
              onClick={clearSession}
              className="font-nav border border-foreground/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground/70 transition-colors hover:border-brand hover:text-brand sm:text-[11px]"
            >
              Log Out
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-brand/15 bg-surface p-8 shadow-[0_20px_60px_-30px_rgba(28,143,215,0.35)]">
        <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand">Admin Dashboard</p>
        <h1 className="font-heading mt-2 mb-8 text-3xl font-black uppercase tracking-[-0.02em]">
          Log In<span className="text-brand">.</span>
        </h1>

        <label htmlFor="admin-username" className="font-nav mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/70">
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

        <label htmlFor="admin-password" className="font-nav mt-5 mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/70">
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

        {error && <p className="font-body mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-nav mt-7 h-12 w-full bg-brand text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b1220] transition-colors hover:bg-[#1678B5] hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Logging In…' : 'Log In →'}
        </button>
      </form>
    </main>
  );
}

function RfqList({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<AdminRfqPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand">Admin Dashboard</p>
          <h1 className="font-heading mt-2 text-3xl font-black tracking-[-0.02em] sm:text-4xl">
            RFQs<span className="text-brand">.</span>
          </h1>
          {data && (
            <p className="font-body mt-1 text-sm text-foreground/50">
              {data.total} {data.total === 1 ? 'request' : 'requests'} in total
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="font-nav border border-brand/30 bg-surface px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-[#0b1220] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px]"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="font-body mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className={`overflow-x-auto border border-brand/15 bg-surface transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-brand/15 bg-[#f7fbfe]">
              {['RFQ No.', 'Received', 'Customer', 'Contact', 'Products', 'Location', 'Tech Pack', 'Status'].map((heading) => (
                <th key={heading} className="font-nav px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body text-sm">
            {!data && loading && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-foreground/50">
                  Loading RFQs…
                </td>
              </tr>
            )}
            {data && data.rfqs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-foreground/50">
                  No RFQs yet.
                </td>
              </tr>
            )}
            {data?.rfqs.map((rfq) => {
              const totalUnits = rfq.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <tr key={rfq.id} className="border-b border-brand/10 align-top last:border-b-0 hover:bg-[#f7fbfe]">
                  <td className="font-nav whitespace-nowrap px-4 py-4 text-xs font-semibold text-foreground">{rfq.rfqNumber}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-foreground/70">{dateFormatter.format(new Date(rfq.createdAt))}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">{rfq.name}</p>
                    <p className="text-foreground/60">{rfq.brandName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`mailto:${rfq.email}`} className="block break-all text-brand hover:underline">
                      {rfq.email}
                    </a>
                    <a href={`tel:${rfq.phone}`} className="block whitespace-nowrap text-foreground/70 hover:text-brand">
                      {formatPhone(rfq.phone)}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <ul className="space-y-0.5">
                      {rfq.items.map((item) => (
                        <li key={item.product} className="text-foreground/80">
                          {item.product} <span className="text-foreground/50">× {item.quantity.toLocaleString('en-IN')}</span>
                        </li>
                      ))}
                    </ul>
                    {rfq.items.length > 1 && (
                      <p className="font-nav mt-1.5 text-[10px] uppercase tracking-[0.12em] text-foreground/45">
                        {totalUnits.toLocaleString('en-IN')} units total
                      </p>
                    )}
                  </td>
                  <td className="max-w-[200px] px-4 py-4 text-foreground/70">{rfq.location}</td>
                  <td className="px-4 py-4">
                    {rfq.techPackUrl ? (
                      <a href={rfq.techPackUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-brand hover:underline">
                        Open ↗
                      </a>
                    ) : (
                      <span className="text-foreground/35">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-nav inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLES[rfq.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {rfq.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && totalPages > 1 && (
        <div className="font-nav mt-6 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-foreground/60">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={loading || page <= 1}
            className="border border-foreground/20 bg-surface px-4 py-2 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={loading || page >= totalPages}
            className="border border-foreground/20 bg-surface px-4 py-2 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
