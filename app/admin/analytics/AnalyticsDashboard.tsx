'use client';

import { useEffect, useState } from 'react';
import { useAdminToken } from '../AdminShell';
import { AdminAuthError, expireSession, fetchAnalytics, type Analytics, type AnalyticsPeriod, type OrderStatus, type RfqStatus } from '../api';
import { ORDER_STATUS_STYLES } from '../orders/orderStatus';
import { RFQ_STATUS_STYLES } from '../rfqs/rfqStatus';
import { ErrorBanner, formatInr, PageHeader, type StatusStyle } from '../ui';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'all_time', label: 'All time' },
];

const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' });

function formatPercent(ratio: number) {
  return `${(ratio * 100).toFixed(1)}%`;
}

const profitTone = (amount: number) => (amount < 0 ? 'text-red-600' : amount > 0 ? 'text-emerald-700' : 'text-zinc-900');

export default function AnalyticsDashboard() {
  const token = useAdminToken();
  const [period, setPeriod] = useState<AnalyticsPeriod>('this_month');
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics(token, period)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          expireSession();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load analytics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, period, reloadKey]);

  const selectPeriod = (next: AnalyticsPeriod) => {
    if (next === period) return;
    setLoading(true);
    setPeriod(next);
  };

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Analytics" loading={loading} onRefresh={refresh}>
        <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm" role="tablist" aria-label="Period">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={period === option.value}
              onClick={() => selectPeriod(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === option.value ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <ErrorBanner message={error} />

      {!data ? (
        loading && (
          <div className="flex flex-col items-center gap-3 py-24 text-sm text-zinc-500" role="status">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            Loading analytics…
          </div>
        )
      ) : (
        <div className={`space-y-8 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <Section title="Business summary" hint="Cancelled orders are left out of every amount.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Revenue (Grupo price)" value={formatInr(data.summary.revenue)} />
              <StatCard label="Manufacturer cost" value={formatInr(data.summary.manufacturerCost)} />
              <StatCard
                label="Net profit"
                value={formatInr(data.summary.netProfit)}
                tone={profitTone(data.summary.netProfit)}
                note={data.summary.revenue > 0 ? `${formatPercent(data.summary.netProfit / data.summary.revenue)} margin` : undefined}
              />
              <StatCard label="Orders" value={data.summary.orders.toLocaleString('en-IN')} />
            </div>
          </Section>

          <Section title="Cash position">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Received from customers" value={formatInr(data.cash.received)} tone="text-emerald-700" />
              <StatCard
                label="Customers still owe"
                value={formatInr(data.cash.receivable)}
                tone={data.cash.receivable > 0 ? 'text-amber-700' : 'text-zinc-900'}
              />
              <StatCard label="Paid to manufacturers" value={formatInr(data.cash.paidToManufacturers)} />
              <StatCard
                label="We still owe manufacturers"
                value={formatInr(data.cash.payableToManufacturers)}
                tone={data.cash.payableToManufacturers > 0 ? 'text-amber-700' : 'text-zinc-900'}
              />
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Section title="RFQ funnel" hint="RFQs received in this period, by their current status.">
              <Panel>
                <StatusBars<RfqStatus> styles={RFQ_STATUS_STYLES} counts={data.rfqFunnel.counts} />
                <p className="mt-4 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
                  Win rate{' '}
                  <span className="admin-mono font-medium text-zinc-900">
                    {data.rfqFunnel.winRate === null ? '—' : formatPercent(data.rfqFunnel.winRate)}
                  </span>{' '}
                  <span className="text-xs text-zinc-400">(won out of won + lost)</span>
                </p>
              </Panel>
            </Section>

            <Section title="Orders by status" hint="Orders created in this period, including cancelled ones.">
              <Panel>
                <StatusBars<OrderStatus> styles={ORDER_STATUS_STYLES} counts={data.ordersByStatus} />
              </Panel>
            </Section>
          </div>

          <Section title="Monthly trend" hint="Last 6 months, whatever period is selected.">
            <Panel>
              <MonthlyTrend trend={data.monthlyTrend} />
            </Panel>
          </Section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Section title="Top products" hint="By units ordered.">
              <RankTable
                columns={['Product', 'Orders', 'Units']}
                rows={data.topProducts.map((product) => ({
                  key: product.product,
                  cells: [product.product, product.orders.toLocaleString('en-IN'), product.units.toLocaleString('en-IN')],
                }))}
              />
            </Section>

            <Section title="Top manufacturers" hint="By manufacturer price of their orders.">
              <RankTable
                columns={['Manufacturer', 'Orders', 'Value', 'Profit']}
                rows={data.topManufacturers.map((manufacturer) => ({
                  key: manufacturer.id,
                  cells: [
                    manufacturer.name,
                    manufacturer.orders.toLocaleString('en-IN'),
                    formatInr(manufacturer.value),
                    <span key="profit" className={profitTone(manufacturer.profit)}>
                      {formatInr(manufacturer.profit)}
                    </span>,
                  ],
                }))}
              />
            </Section>
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">{children}</div>;
}

function StatCard({ label, value, tone = 'text-zinc-900', note }: { label: string; value: string; tone?: string; note?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`admin-mono mt-2 text-2xl font-semibold tracking-tight ${tone}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
    </div>
  );
}

function StatusBars<K extends string>({ styles, counts }: { styles: Record<K, StatusStyle>; counts: Record<K, number> }) {
  const keys = Object.keys(styles) as K[];
  const max = Math.max(1, ...keys.map((key) => counts[key]));
  const total = keys.reduce((sum, key) => sum + counts[key], 0);
  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <div key={key} className="grid grid-cols-[110px_1fr_48px] items-center gap-3 text-sm">
          <span className="flex items-center gap-2 text-zinc-600">
            <span className={`h-2 w-2 rounded-full ${styles[key].dot}`} />
            {styles[key].label}
          </span>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className={`h-full rounded-full ${styles[key].dot}`} style={{ width: `${(counts[key] / max) * 100}%` }} />
          </div>
          <span className="admin-mono text-right font-medium text-zinc-900">{counts[key].toLocaleString('en-IN')}</span>
        </div>
      ))}
      <p className="text-right text-xs text-zinc-400">
        Total <span className="admin-mono">{total.toLocaleString('en-IN')}</span>
      </p>
    </div>
  );
}

function MonthlyTrend({ trend }: { trend: Analytics['monthlyTrend'] }) {
  const max = Math.max(1, ...trend.flatMap((month) => [month.revenue, Math.abs(month.profit)]));
  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-zinc-900" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Profit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Loss
        </span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {trend.map((month) => (
          <div key={month.month} className="flex flex-col items-center">
            <div className="flex h-40 w-full items-end justify-center gap-1.5">
              <Bar value={month.revenue} max={max} className="bg-zinc-900" title={`Revenue ${formatInr(month.revenue)}`} />
              <Bar
                value={Math.abs(month.profit)}
                max={max}
                className={month.profit < 0 ? 'bg-red-500' : 'bg-emerald-500'}
                title={`${month.profit < 0 ? 'Loss' : 'Profit'} ${formatInr(Math.abs(month.profit))}`}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-zinc-700">{monthFormatter.format(new Date(`${month.month}-01T00:00:00+05:30`))}</p>
            <p className="admin-mono text-[11px] text-zinc-500">{formatInr(month.revenue)}</p>
            <p className={`admin-mono text-[11px] ${profitTone(month.profit)}`}>{formatInr(month.profit)}</p>
            <p className="text-[11px] text-zinc-400">
              {month.orders} {month.orders === 1 ? 'order' : 'orders'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ value, max, className, title }: { value: number; max: number; className: string; title: string }) {
  return (
    <div
      title={title}
      className={`w-full max-w-6 rounded-t ${className}`}
      style={{ height: value > 0 ? `${Math.max(2, (value / max) * 100)}%` : '0' }}
    />
  );
}

function RankTable({ columns, rows }: { columns: string[]; rows: { key: string; cells: React.ReactNode[] }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/60">
            {columns.map((heading, i) => (
              <th key={heading} className={`px-4 py-2.5 text-xs font-medium text-zinc-500 ${i > 0 ? 'text-right' : ''}`}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-zinc-400">
                No orders in this period.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.key}>
                {row.cells.map((cell, i) => (
                  <td key={i} className={i === 0 ? 'px-4 py-3 text-zinc-900' : 'admin-mono px-4 py-3 text-right text-zinc-700'}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
