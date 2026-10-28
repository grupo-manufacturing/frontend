'use client';

import { useState } from 'react';
import { ORDER_STATUS_STYLES } from '../../admin/orders/orderStatus';
import {
  DataTable,
  dateFormatter,
  EmptyState,
  ErrorBanner,
  FilterChips,
  formatInr,
  PageHeader,
  SearchBox,
  StatusPill,
  timeFormatter,
} from '../../admin/ui';
import { useAdminList } from '../../admin/useAdminList';
import { expireManufacturerSession, fetchManufacturerOrders } from '../api';
import { useManufacturerToken } from '../ManufacturerShell';
import OrderDetailsDialog from './OrderDetailsDialog';

const COLUMNS = ['Order', 'Received', 'Products', 'Your Price', 'Paid', 'Due', 'Status'];

export default function OrderList() {
  const token = useManufacturerToken();
  const list = useAdminList(token, fetchManufacturerOrders, 'Failed to load orders.', expireManufacturerSession);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Orders" loading={list.loading} onRefresh={list.refresh} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips styles={ORDER_STATUS_STYLES} value={list.statusFilter} counts={list.data?.counts} onChange={list.selectStatus} />
        <SearchBox value={list.searchInput} onChange={list.setSearchInput} placeholder="Search order no.…" />
      </div>

      <ErrorBanner message={list.error} />

      <DataTable
        columns={COLUMNS}
        minWidth="960px"
        loading={list.loading}
        loadingLabel="Loading orders…"
        isEmpty={!list.data || list.data.orders.length === 0}
        empty={
          <EmptyState
            filtered={list.isFiltered}
            noun="orders"
            emptyHint="Orders Grupo assigns to you will appear here."
            onClearFilters={list.clearFilters}
          />
        }
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.goToPage}
      >
        {list.data?.orders.map((order) => {
          const createdAt = new Date(order.createdAt);
          const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const products = order.items.map((item) => item.product).join(', ');
          return (
            <tr
              key={order.id}
              onClick={() => setOpenOrderId(order.id)}
              className="cursor-pointer align-top transition-colors hover:bg-zinc-50/70"
            >
              <td className="whitespace-nowrap px-4 py-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenOrderId(order.id);
                  }}
                  className="admin-mono text-xs font-medium text-zinc-900 underline-offset-2 hover:underline"
                >
                  {order.orderNumber}
                </button>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <p className="text-zinc-900">{dateFormatter.format(createdAt)}</p>
                <p className="text-xs text-zinc-500">{timeFormatter.format(createdAt)}</p>
              </td>
              <td className="max-w-[280px] px-4 py-4">
                <p className="line-clamp-2 text-zinc-700" title={products}>
                  {products}
                </p>
                <p className="admin-mono mt-0.5 text-xs text-zinc-400">{totalUnits.toLocaleString('en-IN')} units</p>
              </td>
              <td className="admin-mono whitespace-nowrap px-4 py-4 font-medium text-zinc-900">{formatInr(order.manufacturerTotal)}</td>
              <td className="admin-mono whitespace-nowrap px-4 py-4 text-emerald-700">{formatInr(order.amountPaid)}</td>
              <td className="whitespace-nowrap px-4 py-4">
                {order.balanceDue === 0 ? (
                  <span className="text-xs text-emerald-700">Fully paid</span>
                ) : (
                  <span className={`admin-mono ${order.status === 'cancelled' ? 'text-zinc-400' : 'text-amber-700'}`}>
                    {formatInr(order.balanceDue)}
                  </span>
                )}
              </td>
              <td className="px-4 py-4">
                <StatusPill status={order.status} styles={ORDER_STATUS_STYLES} />
              </td>
            </tr>
          );
        })}
      </DataTable>

      {openOrderId && (
        <OrderDetailsDialog
          token={token}
          orderId={openOrderId}
          onClose={() => setOpenOrderId(null)}
          onChanged={list.reloadQuietly}
        />
      )}
    </main>
  );
}
