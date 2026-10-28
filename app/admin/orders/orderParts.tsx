import type { OrderStatus } from '../api';
import { formatInr, ghostButtonCls, Icon, ICONS } from '../ui';
import { ORDER_PIPELINE, ORDER_STATUS_STYLES } from './orderStatus';

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4 text-sm">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</h3>
      {children}
    </section>
  );
}

export function MoneySummary({
  title,
  totalLabel,
  total,
  paidLabel,
  paid,
  dueLabel,
  due,
  highlightDue,
  onRecord,
}: {
  title: string;
  totalLabel: string;
  total: number;
  paidLabel: string;
  paid: number;
  dueLabel: string;
  due: number;
  highlightDue: boolean;
  onRecord?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onRecord && (
          <button type="button" onClick={onRecord} className={ghostButtonCls}>
            <Icon d={ICONS.plus} />
            Record Payment
          </button>
        )}
      </div>
      <dl className="grid grid-cols-3 divide-x divide-zinc-100">
        <Amount label={totalLabel} value={total} />
        <Amount label={paidLabel} value={paid} tone="text-emerald-700" />
        <Amount label={dueLabel} value={due} tone={due > 0 && highlightDue ? 'text-amber-700' : 'text-zinc-900'} />
      </dl>
    </section>
  );
}

function Amount({ label, value, tone = 'text-zinc-900' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`admin-mono mt-0.5 text-lg font-semibold ${tone}`}>{formatInr(value)}</dd>
    </div>
  );
}

export function Pipeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
        This order was cancelled. Payments already recorded are kept for reference.
      </p>
    );
  }

  const currentIndex = ORDER_PIPELINE.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {ORDER_PIPELINE.map((step, i) => {
        const reached = i <= currentIndex;
        return (
          <li key={step} aria-current={i === currentIndex ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${reached ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            <p className={`mt-2 text-xs font-medium ${reached ? 'text-zinc-900' : 'text-zinc-400'}`}>{ORDER_STATUS_STYLES[step].label}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function ProductsTable({ items }: { items: { product: string; quantity: number }[] }) {
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200">
      <h3 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 text-xs font-medium text-zinc-500">
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item) => (
              <tr key={item.product}>
                <td className="px-4 py-3 text-zinc-900">{item.product}</td>
                <td className="admin-mono px-4 py-3 text-right text-zinc-700">{item.quantity.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200 bg-zinc-50/60">
              <td className="px-4 py-3 font-medium text-zinc-900">Total</td>
              <td className="admin-mono px-4 py-3 text-right font-semibold text-zinc-900">{totalUnits.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function TechPackLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200 transition hover:bg-zinc-50"
    >
      Tech pack ↗
    </a>
  );
}
