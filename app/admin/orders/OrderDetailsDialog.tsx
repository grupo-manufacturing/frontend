'use client';

import { useEffect, useState } from 'react';
import {
  AdminAuthError,
  addOrderPayment,
  clearSession,
  fetchOrder,
  updateOrderStatus,
  type AdminOrderDetail,
  type OrderStatus,
  type PaymentMethod,
  type PaymentParty,
} from '../api';
import {
  dateFormatter,
  Dialog,
  DialogFooter,
  ErrorBanner,
  Field,
  formatInr,
  formatPhone,
  ghostButtonCls,
  Icon,
  ICONS,
  inputCls,
  primaryButtonCls,
  StatusPill,
  timeFormatter,
} from '../ui';
import { NEXT_ORDER_STEP, ORDER_PIPELINE, ORDER_STATUS_STYLES, PAYMENT_METHOD_LABELS, PAYMENT_PARTY_LABELS } from './orderStatus';

const todayInIndia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

function errorMessage(err: unknown, fallback: string): string | null {
  if (err instanceof AdminAuthError) {
    clearSession();
    return null;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function OrderDetailsDialog({
  token,
  orderId,
  onClose,
  onChanged,
}: {
  token: string;
  orderId: string;
  onClose: () => void;
  /** Called after the order's status or payments change, so the list behind can refresh. */
  onChanged?: () => void;
}) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [recordingFor, setRecordingFor] = useState<PaymentParty | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOrder(token, orderId)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = errorMessage(err, 'Failed to load order.');
        if (message) setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, orderId]);

  const changeStatus = async (to: OrderStatus) => {
    if (!order) return;
    const question =
      to === 'cancelled' ? `Cancel ${order.orderNumber}?` : `Move ${order.orderNumber} to ${ORDER_STATUS_STYLES[to].label}?`;
    if (!window.confirm(`${question} This cannot be undone.`)) return;
    setUpdating(true);
    setError('');
    try {
      setOrder(await updateOrderStatus(token, order.id, to));
      onChanged?.();
    } catch (err) {
      const message = errorMessage(err, 'Failed to update status.');
      if (message) setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const next = order && NEXT_ORDER_STEP[order.status];
  const cancellable = order !== null && order.status !== 'cancelled' && order.status !== 'delivered';

  const footer = (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-100 px-6 py-4">
      <div>
        {cancellable && (
          <button
            type="button"
            onClick={() => changeStatus('cancelled')}
            disabled={updating}
            className={`${ghostButtonCls} text-red-600 hover:bg-red-50`}
          >
            Cancel Order
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className={ghostButtonCls}>
          Close
        </button>
        {next && (
          <button type="button" onClick={() => changeStatus(next.to)} disabled={updating} className={primaryButtonCls}>
            {updating && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {next.label}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Dialog
        title={
          order ? (
            <>
              <span className="admin-mono">{order.orderNumber}</span>
              <StatusPill status={order.status} styles={ORDER_STATUS_STYLES} />
            </>
          ) : (
            'Order Details'
          )
        }
        onClose={onClose}
        footer={footer}
        className="max-w-5xl"
      >
        {loading ? (
          <div className="flex justify-center py-24" role="status">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          </div>
        ) : !order ? (
          <div className="px-6 py-5">
            <ErrorBanner message={error || 'Order not found.'} />
          </div>
        ) : (
          <OrderBody order={order} error={error} onRecordPayment={setRecordingFor} />
        )}
      </Dialog>

      {order && recordingFor && (
        <PaymentDialog
          token={token}
          order={order}
          party={recordingFor}
          onClose={() => setRecordingFor(null)}
          onSaved={(updated) => {
            setOrder(updated);
            setRecordingFor(null);
            onChanged?.();
          }}
        />
      )}
    </>
  );
}

function OrderBody({
  order,
  error,
  onRecordPayment,
}: {
  order: AdminOrderDetail;
  error: string;
  onRecordPayment: (party: PaymentParty) => void;
}) {
  const open = order.status !== 'cancelled';
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const createdAt = new Date(order.createdAt);

  return (
    <div className="space-y-6 px-6 py-5">
      <p className="text-sm text-zinc-500">
        Created {dateFormatter.format(createdAt)}, {timeFormatter.format(createdAt)} from{' '}
        <span className="admin-mono text-zinc-700">{order.rfq.rfqNumber}</span>
      </p>

      {error && <ErrorBanner message={error} />}

      <Pipeline status={order.status} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Customer">
          <p className="font-medium text-zinc-900">{order.brandName}</p>
          <p className="text-zinc-600">{order.customerName}</p>
          <a href={`mailto:${order.email}`} className="mt-2 block break-all text-zinc-900 underline-offset-2 hover:underline">
            {order.email}
          </a>
          <a href={`tel:${order.phone}`} className="admin-mono block text-xs text-zinc-500 hover:text-zinc-900">
            {formatPhone(order.phone)}
          </a>
          <p className="mt-2 text-xs text-zinc-500">{order.rfq.location}</p>
          {order.rfq.techPackUrl && (
            <a
              href={order.rfq.techPackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200 transition hover:bg-zinc-50"
            >
              Tech pack ↗
            </a>
          )}
        </Card>
        <Card title="Manufacturer">
          <p className="font-medium text-zinc-900">{order.manufacturer.companyName}</p>
          <p className="text-zinc-600">{order.manufacturer.location}</p>
          <a
            href={`mailto:${order.manufacturer.email}`}
            className="mt-2 block break-all text-zinc-900 underline-offset-2 hover:underline"
          >
            {order.manufacturer.email}
          </a>
          <a href={`tel:${order.manufacturer.phone}`} className="admin-mono block text-xs text-zinc-500 hover:text-zinc-900">
            {formatPhone(order.manufacturer.phone)}
          </a>
        </Card>
        <Card title="Shipping address">
          <p className="whitespace-pre-line text-zinc-700">{order.shippingAddress}</p>
        </Card>
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-200">
        <h3 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60 text-xs font-medium text-zinc-500">
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5 text-right">Customer price</th>
                <th className="px-4 py-2.5 text-right">Customer total</th>
                <th className="px-4 py-2.5 text-right">Manufacturer price</th>
                <th className="px-4 py-2.5 text-right">Manufacturer total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <tr key={item.product}>
                  <td className="px-4 py-3 text-zinc-900">{item.product}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-700">{item.quantity.toLocaleString('en-IN')}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-700">{formatInr(item.unitPrice)}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-900">{formatInr(item.lineTotal)}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-700">{formatInr(item.manufacturerUnitPrice)}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-900">{formatInr(item.manufacturerLineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50/60">
                <td className="px-4 py-3 font-medium text-zinc-900">Total</td>
                <td className="admin-mono px-4 py-3 text-right text-zinc-700">{totalUnits.toLocaleString('en-IN')}</td>
                <td />
                <td className="admin-mono px-4 py-3 text-right font-semibold text-zinc-900">{formatInr(order.totalAmount)}</td>
                <td />
                <td className="admin-mono px-4 py-3 text-right font-semibold text-zinc-900">{formatInr(order.manufacturerTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MoneySummary
          title="Customer"
          totalLabel="Order total"
          total={order.totalAmount}
          paidLabel="Received"
          paid={order.amountReceived}
          dueLabel="Balance due"
          due={order.balanceDue}
          highlightDue={open}
          onRecord={open && order.balanceDue > 0 ? () => onRecordPayment('customer') : undefined}
        />
        <MoneySummary
          title="Manufacturer"
          totalLabel="Manufacturer total"
          total={order.manufacturerTotal}
          paidLabel="Paid"
          paid={order.amountPaidToManufacturer}
          dueLabel="Due to manufacturer"
          due={order.manufacturerBalanceDue}
          highlightDue={open}
          onRecord={open && order.manufacturerBalanceDue > 0 ? () => onRecordPayment('manufacturer') : undefined}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-200">
        <h3 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Payment history</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60 text-xs font-medium text-zinc-500">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-900">{dateFormatter.format(new Date(payment.paidOn))}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                        payment.party === 'customer' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {PAYMENT_PARTY_LABELS[payment.party]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {payment.method ? PAYMENT_METHOD_LABELS[payment.method] : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="admin-mono px-4 py-3 text-xs text-zinc-600">{payment.reference ?? <span className="text-zinc-300">—</span>}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-900">{formatInr(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4 text-sm">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</h3>
      {children}
    </section>
  );
}

function MoneySummary({
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

function Pipeline({ status }: { status: OrderStatus }) {
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

function PaymentDialog({
  token,
  order,
  party,
  onClose,
  onSaved,
}: {
  token: string;
  order: AdminOrderDetail;
  party: PaymentParty;
  onClose: () => void;
  onSaved: (order: AdminOrderDetail) => void;
}) {
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayInIndia);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isCustomer = party === 'customer';
  const balance = isCustomer ? order.balanceDue : order.manufacturerBalanceDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(
        await addOrderPayment(token, order.id, {
          party,
          amount: Number(amount),
          paidOn,
          method,
          reference: reference.trim() || undefined,
        }),
      );
    } catch (err) {
      const message = errorMessage(err, 'Failed to record payment.');
      if (message) setError(message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      title={`${isCustomer ? 'Payment from Customer' : 'Payment to Manufacturer'} · ${order.orderNumber}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={<DialogFooter saving={saving} submitLabel="Record Payment" onCancel={onClose} />}
      className="max-w-lg"
    >
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-6 py-5 sm:grid-cols-2">
        <Field
          label="Amount (₹)"
          htmlFor="payment-amount"
          hint={`${isCustomer ? 'Balance due' : 'Due to manufacturer'}: ${formatInr(balance)}`}
        >
          <input
            id="payment-amount"
            type="number"
            required
            autoFocus
            min={0.01}
            max={balance}
            step={0.01}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`${inputCls} admin-mono`}
          />
        </Field>
        <Field label={isCustomer ? 'Received on' : 'Paid on'} htmlFor="payment-date">
          <input
            id="payment-date"
            type="date"
            required
            max={todayInIndia()}
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Method" htmlFor="payment-method">
          <select id="payment-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputCls}>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => (
              <option key={key} value={key}>
                {PAYMENT_METHOD_LABELS[key]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference" htmlFor="payment-reference" hint="UTR, transaction ID or cheque no. (optional)">
          <input
            id="payment-reference"
            maxLength={100}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="UTR123456789"
            className={`${inputCls} admin-mono`}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15 sm:col-span-2">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
