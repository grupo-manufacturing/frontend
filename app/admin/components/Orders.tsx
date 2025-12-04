'use client';

import { useMemo, useState } from 'react';
import type { Order, OrderStatusFilter } from '../types';
import { formatDate, getStatusLabel, getStatusBadgeColor } from '../utils';

interface OrdersProps {
  orders: Order[];
  isLoadingData: boolean;
  lastUpdated: string | null;
}

export default function Orders({
  orders,
  isLoadingData,
  lastUpdated
}: OrdersProps) {
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    // Apply status filter
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === orderStatusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((order) =>
        (order.requirement?.buyer?.full_name || '').toLowerCase().includes(q) ||
        (order.manufacturer?.unit_name || '').toLowerCase().includes(q) ||
        (order.requirement?.requirement_text || '').toLowerCase().includes(q) ||
        (order.requirement?.buyer?.phone_number || '').includes(searchQuery) ||
        (order.manufacturer?.phone_number || '').includes(searchQuery)
      );
    }
    
    return filtered;
  }, [orders, orderStatusFilter, searchQuery]);

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">
            View and filter all orders by status (Accepted, Rejected, Pending).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Total orders:{' '}
            <span className="font-semibold text-slate-800">{orders.length}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          >
            <option value="all">All Orders</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="submitted">Pending</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search orders by buyer, manufacturer, or requirement"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Requirement
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Buyer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Manufacturer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Quote
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Delivery Time
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  {orders.length === 0
                    ? `No ${orderStatusFilter !== 'all' ? getStatusLabel(orderStatusFilter).toLowerCase() : ''} orders found.`
                    : 'No orders match your search criteria.'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 max-w-xs">
                      {order.requirement?.requirement_text
                        ? order.requirement.requirement_text.length > 60
                          ? `${order.requirement.requirement_text.substring(0, 60)}...`
                          : order.requirement.requirement_text
                        : '—'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {order.requirement?.quantity && (
                        <span>Qty: {order.requirement.quantity.toLocaleString()}</span>
                      )}
                      {order.requirement?.product_type && (
                        <span className="ml-2">Type: {order.requirement.product_type}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {order.requirement?.buyer?.full_name || 'Not provided'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.requirement?.buyer?.phone_number || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {order.manufacturer?.unit_name || 'Not provided'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.manufacturer?.location || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      ₹{order.quoted_price?.toLocaleString('en-IN') || '—'}
                    </div>
                    <div className="text-xs text-slate-500">
                      ₹{order.price_per_unit?.toLocaleString('en-IN') || '—'} per unit
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {order.delivery_time || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(order.status || '')}`}>
                      {getStatusLabel(order.status || '')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(order.updated_at || order.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

