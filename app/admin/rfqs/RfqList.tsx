'use client';

import { useState } from 'react';
import { useAdminToken } from '../AdminShell';
import { fetchAdminRfqs, updateRfqStatus, type AdminRfq } from '../api';
import {
  DataTable,
  dateFormatter,
  EmptyState,
  ErrorBanner,
  FilterChips,
  formatPhone,
  PageHeader,
  SearchBox,
  StatusPill,
  timeFormatter,
  type StatusStyle,
} from '../ui';
import { useAdminList } from '../useAdminList';

const STATUS_STYLES: Record<string, StatusStyle> = {
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
    {
      to: 'lost',
      label: 'Lost',
      confirmText: 'as Lost (rejected without a quotation)',
      className: 'bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50',
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

const COLUMNS = ['RFQ', 'Received', 'Customer', 'Contact', 'Products', 'Location', 'Tech Pack', 'Status'];

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

export default function RfqList() {
  const token = useAdminToken();
  const list = useAdminList(token, fetchAdminRfqs, 'Failed to load RFQs.');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const changeStatus = async (rfq: AdminRfq, action: StatusAction) => {
    if (!window.confirm(`Mark ${rfq.rfqNumber} (${rfq.brandName}) ${action.confirmText}? This cannot be undone.`)) return;
    setUpdatingId(rfq.id);
    list.setError('');
    try {
      await updateRfqStatus(token, rfq.id, action.to);
      list.setData((current) =>
        current && {
          ...current,
          rfqs: current.rfqs.map((r) => (r.id === rfq.id ? { ...r, status: action.to } : r)),
        },
      );
      list.reloadQuietly();
    } catch (err) {
      list.handleError(err, 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Requests for Quotation" loading={list.loading} onRefresh={list.refresh} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips styles={STATUS_STYLES} value={list.statusFilter} counts={list.data?.counts} onChange={list.selectStatus} />
        <SearchBox value={list.searchInput} onChange={list.setSearchInput} placeholder="Search RFQ no., name, brand, email, phone…" />
      </div>

      <ErrorBanner message={list.error} />

      <DataTable
        columns={COLUMNS}
        minWidth="1100px"
        loading={list.loading}
        loadingLabel="Loading RFQs…"
        isEmpty={!list.data || list.data.rfqs.length === 0}
        empty={
          <EmptyState
            filtered={list.isFiltered}
            noun="RFQs"
            emptyHint="New requests from the website will show up here."
            onClearFilters={list.clearFilters}
          />
        }
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.goToPage}
      >
        {list.data?.rfqs.map((rfq) => {
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
                <StatusPill status={rfq.status} styles={STATUS_STYLES} />
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
      </DataTable>
    </main>
  );
}
