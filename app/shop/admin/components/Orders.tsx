'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { ShopOrder } from '../../lib/types';
import { updateOrderStatus } from '../../lib/api';
import { StatusBadge } from './Overview';

interface OrdersProps {
  orders: ShopOrder[];
  onReload: () => void;
}

const PER_PAGE = 8;
const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const STATUS_FLOW: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function Orders({ orders, onReload }: OrdersProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const filtered = useMemo(() => {
    let result = [...orders];

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setActionError('');
    try {
      await updateOrderStatus(orderId, newStatus);
      onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search orders…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? 'bg-[#22a2f2] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{actionError}</div>
      )}

      {/* ── Orders Table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    {search || statusFilter !== 'all' ? 'No orders match your filters.' : 'No orders yet.'}
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const nextStatuses = STATUS_FLOW[order.status] || [];

                  return (
                    <tr key={order.id} className="group">
                      <td colSpan={8} className="p-0">
                        {/* Main row */}
                        <div
                          className="flex items-center gap-0 px-0 cursor-pointer hover:bg-slate-50/80 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                          <div className="px-4 py-3 w-[14%] min-w-[100px]">
                            <p className="text-sm font-medium text-[#22a2f2]">{order.orderNumber}</p>
                          </div>
                          <div className="px-4 py-3 w-[16%] min-w-[120px]">
                            <p className="text-sm text-slate-900 truncate">{order.customerName}</p>
                            <p className="text-xs text-slate-400 truncate">{order.customerEmail}</p>
                          </div>
                          <div className="px-4 py-3 w-[18%] min-w-[140px]">
                            <div className="flex items-center gap-2">
                              {order.productImage && (
                                <div className="relative w-8 h-8 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                                  <Image src={order.productImage} alt="" fill className="object-cover" sizes="32px" />
                                </div>
                              )}
                              <span className="text-sm text-slate-700 truncate">{order.productName}</span>
                            </div>
                          </div>
                          <div className="px-4 py-3 w-[7%] min-w-[50px] text-sm text-slate-700">{order.quantity}</div>
                          <div className="px-4 py-3 w-[10%] min-w-[80px] text-sm font-medium text-slate-700">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                          <div className="px-4 py-3 w-[12%] min-w-[90px]"><StatusBadge status={order.status} /></div>
                          <div className="px-4 py-3 w-[10%] min-w-[80px] text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                          <div className="px-4 py-3 w-[13%] min-w-[100px] text-right">
                            <span className="text-xs text-slate-400">
                              {isExpanded ? 'Hide ▲' : 'Details ▼'}
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail panel */}
                        {isExpanded && (
                          <div className="bg-slate-50/60 border-t border-slate-100 px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Details</p>
                                <p className="text-slate-700">{order.customerName}</p>
                                <p className="text-slate-500">{order.customerEmail}</p>
                                <p className="text-slate-500">{order.customerPhone}</p>
                                {order.customerCompany && <p className="text-slate-500">{order.customerCompany}</p>}
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shipping Address</p>
                                <p className="text-slate-700">{order.address}</p>
                                <p className="text-slate-500">{order.city}, {order.state} - {order.pincode}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Details</p>
                                {order.variations?.length > 0 && (
                                  <div className="space-y-1">
                                    {order.variations.map((v) => (
                                      <p key={v.color} className="text-slate-700">
                                        <span className="font-medium">{v.color}:</span>{' '}
                                        {v.sizes.map((s) => `${s.size} ×${s.qty}`).join(', ')}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                <p className="text-slate-700">Tier: {order.tier}</p>
                                <p className="text-slate-700">Unit Price: ₹{order.unitPrice.toLocaleString('en-IN')}</p>
                              </div>
                            </div>

                            {/* Status Actions */}
                            {nextStatuses.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                                <span className="text-xs text-slate-500 mr-2">Update status:</span>
                                {nextStatuses.map((ns) => (
                                  <button
                                    key={ns}
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, ns); }}
                                    disabled={updatingId === order.id}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                      ns === 'cancelled'
                                        ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'border border-[#22a2f2]/30 bg-[#22a2f2]/10 text-[#22a2f2] hover:bg-[#22a2f2]/20'
                                    }`}
                                  >
                                    {updatingId === order.id ? '…' : `Mark ${ns}`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">{filtered.length} orders</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    page === p ? 'bg-[#22a2f2] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
