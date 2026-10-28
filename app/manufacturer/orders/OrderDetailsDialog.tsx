'use client';

import { useEffect, useState } from 'react';
import type { OrderStatus } from '../../admin/api';
import { Card, MoneySummary, Pipeline, ProductsTable, TechPackLink, Timeline } from '../../admin/orders/orderParts';
import { MANUFACTURER_NEXT_STEP, ORDER_STATUS_STYLES } from '../../admin/orders/orderStatus';
import { toast } from '../../admin/toast';
import { dateFormatter, Dialog, ErrorBanner, ghostButtonCls, primaryButtonCls, StatusPill, timeFormatter } from '../../admin/ui';
import {
  expireManufacturerSession,
  fetchManufacturerOrder,
  ManufacturerAuthError,
  updateManufacturerOrderStatus,
  type ManufacturerOrderDetail,
} from '../api';

function errorMessage(err: unknown, fallback: string): string | null {
  if (err instanceof ManufacturerAuthError) {
    expireManufacturerSession();
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
  /** Called after the status changes, so the list behind can refresh. */
  onChanged?: () => void;
}) {
  const [order, setOrder] = useState<ManufacturerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchManufacturerOrder(token, orderId)
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
    if (!window.confirm(`Move ${order.orderNumber} to ${ORDER_STATUS_STYLES[to].label}? This cannot be undone.`)) return;
    setUpdating(true);
    setError('');
    try {
      setOrder(await updateManufacturerOrderStatus(token, order.id, to));
      toast.success(`${order.orderNumber} moved to ${ORDER_STATUS_STYLES[to].label}`);
      onChanged?.();
    } catch (err) {
      const message = errorMessage(err, 'Failed to update status.');
      if (message) setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const next = order && MANUFACTURER_NEXT_STEP[order.status];

  const footer = (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
      <button type="button" onClick={onClose} className={ghostButtonCls}>
        Close
      </button>
      {next && (
        <button type="button" onClick={() => changeStatus(next.to)} disabled={updating} className={primaryButtonCls}>
          {updating ? 'Updating…' : next.label}
        </button>
      )}
    </div>
  );

  return (
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
      className="max-w-4xl"
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
        <OrderBody order={order} error={error} />
      )}
    </Dialog>
  );
}

function OrderBody({ order, error }: { order: ManufacturerOrderDetail; error: string }) {
  const createdAt = new Date(order.createdAt);

  return (
    <div className="space-y-6 px-6 py-5">
      <p className="text-sm text-zinc-500">
        Received {dateFormatter.format(createdAt)}, {timeFormatter.format(createdAt)}
      </p>

      {error && <ErrorBanner message={error} />}

      <Pipeline status={order.status} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Shipping address">
          <p className="whitespace-pre-line text-zinc-700">{order.shippingAddress}</p>
        </Card>
        <Card title="Tech pack">
          {order.techPackUrl ? (
            <TechPackLink url={order.techPackUrl} />
          ) : (
            <p className="text-zinc-500">No tech pack was shared for this order.</p>
          )}
        </Card>
      </div>

      <ProductsTable items={order.items} />

      <MoneySummary
        title="Payment"
        totalLabel="Your price"
        total={order.manufacturerTotal}
        paidLabel="Paid by Grupo"
        paid={order.amountPaid}
        dueLabel="Still due"
        due={order.balanceDue}
        highlightDue={order.status !== 'cancelled'}
      />

      <Timeline events={order.timeline} actorLabels={{ admin: 'Grupo', manufacturer: 'You' }} />
    </div>
  );
}
