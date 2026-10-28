'use client';

import { useEffect, useState } from 'react';
import {
  AdminAuthError,
  addOrderPayment,
  expireSession,
  fetchOrder,
  updateOrderStatus,
  type AdminOrderDetail,
  type OrderPayment,
  type OrderStatus,
  type PaymentMethod,
  type PaymentParty,
  type ShipmentInput,
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
  inputCls,
  primaryButtonCls,
  StatusPill,
  timeFormatter,
} from '../ui';
import { toast } from '../toast';
import { Card, MoneySummary, Pipeline, ProductsTable, ShipmentCard, shippedAt, TechPackLink, Timeline } from './orderParts';
import {
  CANCELLABLE_STATUSES,
  NEXT_ORDER_STEP,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_PARTY_LABELS,
} from './orderStatus';
import ShipmentDialog from './ShipmentDialog';

const isoDateInIndia = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
const todayInIndia = () => isoDateInIndia(new Date());

function PaymentTime({ payment }: { payment: OrderPayment }) {
  const recordedAt = new Date(payment.createdAt);
  const backdated = isoDateInIndia(recordedAt) !== payment.paidOn;
  return (
    <>
      <p className="text-zinc-900">{dateFormatter.format(new Date(payment.paidOn))}</p>
      <p className="text-xs text-zinc-500">
        {backdated
          ? `Recorded ${dateFormatter.format(recordedAt)}, ${timeFormatter.format(recordedAt)}`
          : timeFormatter.format(recordedAt)}
      </p>
    </>
  );
}

function errorMessage(err: unknown, fallback: string): string | null {
  if (err instanceof AdminAuthError) {
    expireSession();
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
  const [shipping, setShipping] = useState(false);

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

  const applyStatus = async (current: AdminOrderDetail, to: OrderStatus, shipment?: ShipmentInput) => {
    setOrder(await updateOrderStatus(token, current.id, to, shipment));
    toast.success(to === 'cancelled' ? `${current.orderNumber} cancelled` : `${current.orderNumber} moved to ${ORDER_STATUS_STYLES[to].label}`);
    onChanged?.();
  };

  const changeStatus = async (to: OrderStatus) => {
    if (!order) return;
    if (to === 'shipped') {
      setShipping(true);
      return;
    }
    const question =
      to === 'cancelled' ? `Cancel ${order.orderNumber}?` : `Move ${order.orderNumber} to ${ORDER_STATUS_STYLES[to].label}?`;
    if (!window.confirm(`${question} This cannot be undone.`)) return;
    setUpdating(true);
    setError('');
    try {
      await applyStatus(order, to);
    } catch (err) {
      const message = errorMessage(err, 'Failed to update status.');
      if (message) setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const ship = async (shipment: ShipmentInput) => {
    if (!order) return;
    try {
      await applyStatus(order, 'shipped', shipment);
      setShipping(false);
    } catch (err) {
      const message = errorMessage(err, 'Failed to mark the order as shipped.');
      if (message) throw new Error(message);
    }
  };

  const next = order && NEXT_ORDER_STEP[order.status];
  const cancellable = order !== null && CANCELLABLE_STATUSES.includes(order.status);

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

      {order && shipping && <ShipmentDialog orderNumber={order.orderNumber} onClose={() => setShipping(false)} onSubmit={ship} />}

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
  const createdAt = new Date(order.createdAt);

  return (
    <div className="space-y-6 px-6 py-5">
      <p className="text-sm text-zinc-500">
        Created {dateFormatter.format(createdAt)}, {timeFormatter.format(createdAt)} from{' '}
        <span className="admin-mono text-zinc-700">{order.rfq.rfqNumber}</span>
      </p>

      {error && <ErrorBanner message={error} />}

      <Pipeline status={order.status} />

      {order.shipment && <ShipmentCard shipment={order.shipment} shippedAt={shippedAt(order.timeline)} />}

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
            <div className="mt-3">
              <TechPackLink url={order.rfq.techPackUrl} />
            </div>
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

      <ProductsTable items={order.items} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MoneySummary
          title="Customer"
          totalLabel="Final customer price"
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
          totalLabel="Final manufacturer price"
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
                <th className="px-4 py-2.5">Date &amp; time</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <PaymentTime payment={payment} />
                  </td>
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
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </td>
                  <td className="admin-mono px-4 py-3 text-xs text-zinc-600">{payment.reference ?? <span className="text-zinc-300">—</span>}</td>
                  <td className="admin-mono px-4 py-3 text-right text-zinc-900">{formatInr(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Timeline events={order.timeline} actorLabels={{ admin: 'Admin', manufacturer: order.manufacturer.companyName }} />
    </div>
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
      const updated = await addOrderPayment(token, order.id, {
        party,
        amount: Number(amount),
        paidOn,
        method,
        reference: reference.trim() || undefined,
      });
      toast.success(`${formatInr(Number(amount))} ${isCustomer ? 'received from customer' : 'paid to manufacturer'} · ${order.orderNumber}`);
      onSaved(updated);
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
