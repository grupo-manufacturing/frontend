'use client';

import { useMemo } from 'react';
import type { ShopProduct, ShopOrder } from '../../lib/types';

interface OverviewProps {
  products: ShopProduct[];
  orders: ShopOrder[];
}

export default function Overview({ products, orders }: OverviewProps) {
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const inStockProducts = products.filter((p) => p.inStock).length;
    const outOfStockProducts = totalProducts - inStockProducts;
    const categories = new Set(products.map((p) => p.category)).size;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const confirmedOrders = orders.filter((o) => o.status === 'confirmed').length;
    const processingOrders = orders.filter((o) => o.status === 'processing').length;
    const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const avgOrderValue = totalOrders > 0 ? totalRevenue / (totalOrders - cancelledOrders || 1) : 0;

    return {
      totalProducts, inStockProducts, outOfStockProducts, categories,
      totalOrders, pendingOrders, confirmedOrders, processingOrders,
      shippedOrders, deliveredOrders, cancelledOrders,
      totalRevenue, avgOrderValue,
    };
  }, [products, orders]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [orders]
  );

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Products" value={stats.totalProducts} color="blue" />
        <MetricCard label="Categories" value={stats.categories} color="purple" />
        <MetricCard label="Total Orders" value={stats.totalOrders} color="green" />
        <MetricCard
          label="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Product Stats ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Product Inventory</h3>
          <div className="space-y-3">
            <StatRow label="In Stock" value={stats.inStockProducts} total={stats.totalProducts} color="bg-green-500" />
            <StatRow label="Out of Stock" value={stats.outOfStockProducts} total={stats.totalProducts} color="bg-red-400" />
          </div>
        </div>

        {/* ── Order Stats ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Status Breakdown</h3>
          <div className="space-y-3">
            <StatRow label="Pending" value={stats.pendingOrders} total={stats.totalOrders} color="bg-yellow-400" />
            <StatRow label="Confirmed" value={stats.confirmedOrders} total={stats.totalOrders} color="bg-blue-400" />
            <StatRow label="Processing" value={stats.processingOrders} total={stats.totalOrders} color="bg-indigo-400" />
            <StatRow label="Shipped" value={stats.shippedOrders} total={stats.totalOrders} color="bg-purple-400" />
            <StatRow label="Delivered" value={stats.deliveredOrders} total={stats.totalOrders} color="bg-green-500" />
            <StatRow label="Cancelled" value={stats.cancelledOrders} total={stats.totalOrders} color="bg-red-400" />
          </div>
        </div>
      </div>

      {/* ── Recent Orders ───────────────────────────────────────────── */}
      {recentOrders.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Orders</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50/80">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{order.customerName} &middot; {order.productName}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xs text-slate-500 mb-1">Avg. Order Value</p>
          <p className="text-lg font-bold text-slate-900">₹{Math.round(stats.avgOrderValue).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xs text-slate-500 mb-1">Active Orders</p>
          <p className="text-lg font-bold text-slate-900">{stats.pendingOrders + stats.confirmedOrders + stats.processingOrders}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xs text-slate-500 mb-1">Fulfillment Rate</p>
          <p className="text-lg font-bold text-slate-900">
            {stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-[#22a2f2]/10 text-[#22a2f2]',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] || 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

function StatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-24">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-700 w-8 text-right">{value}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize ${map[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
