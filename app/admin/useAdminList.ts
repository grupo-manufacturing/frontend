'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminAuthError, expireSession, type ListFilters } from './api';
import { toast } from './toast';

const PAGE_SIZE = 25;

type ListPage = { total: number; pageSize: number; counts?: Record<string, number> };

type Fetcher<T extends ListPage> = (token: string, page: number, pageSize: number, filters: ListFilters) => Promise<T>;

/** Pass the portal's own expire function when the list belongs to a session other than the admin's. */
export function useAdminList<T extends ListPage>(token: string, fetcher: Fetcher<T>, errorText: string, onExpired: () => void = expireSession) {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Status counts only depend on the search, so tab and page changes reuse the last ones.
  const countsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const countsKey = `${search}|${reloadKey}`;
    const withCounts = countsKeyRef.current !== countsKey;
    fetcher(token, page, PAGE_SIZE, { status: statusFilter, search, withCounts })
      .then((result) => {
        if (cancelled) return;
        if (withCounts) countsKeyRef.current = countsKey;
        setData((current) => ({ ...result, counts: result.counts ?? current?.counts }));
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          onExpired();
          return;
        }
        setError(err instanceof Error ? err.message : errorText);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, fetcher, errorText, onExpired, page, reloadKey, statusFilter, search]);

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

  const reloadQuietly = () => setReloadKey((key) => key + 1);

  const handleError = (err: unknown, fallback: string) => {
    if (err instanceof AdminAuthError) {
      onExpired();
      return;
    }
    toast.error(err instanceof Error ? err.message : fallback);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return {
    data,
    setData,
    loading,
    error,
    setError,
    handleError,
    page,
    totalPages,
    goToPage,
    statusFilter,
    selectStatus,
    searchInput,
    setSearchInput,
    isFiltered: Boolean(search || statusFilter),
    clearFilters,
    reloadQuietly,
  };
}
