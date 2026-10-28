'use client';

import { useEffect, useState } from 'react';
import { Card, MoneySummary, Pipeline, ProductsTable, TechPackLink } from '../../admin/orders/orderParts';
import { ORDER_STATUS_STYLES } from '../../admin/orders/orderStatus';
import { dateFormatter, Dialog, ErrorBanner, ghostButtonCls, StatusPill, timeFormatter } from '../../admin/ui';
import { expireManufacturerSession, fetchManufacturerOrder, ManufacturerAuthError, type ManufacturerOrderDetail } from '../api';

export default function OrderDetailsDialog({ token, orderId, onClose }: { token: string; orderId: string; onClose: () => void }) {
  const [order, setOrder] = useState<ManufacturerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchManufacturerOrder(token, orderId)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ManufacturerAuthError) {
          expireManufacturerSession();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, orderId]);

  const footer = (
    <div className="flex shrink-0 items-center justify-end border-t border-zinc-100 px-6 py-4">
      <button type="button" onClick={onClose} className={ghostButtonCls}>
        Close
      </button>
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
        <OrderBody order={order} />
      )}
    </Dialog>
  );
}

function OrderBody({ order }: { order: ManufacturerOrderDetail }) {
  const createdAt = new Date(order.createdAt);

  return (
    <div className="space-y-6 px-6 py-5">
      <p className="text-sm text-zinc-500">
        Received {dateFormatter.format(createdAt)}, {timeFormatter.format(createdAt)}
      </p>

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
    </div>
  );
}
