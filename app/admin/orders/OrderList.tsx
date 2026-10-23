'use client';

import { useState } from 'react';
import { useAdminToken } from '../AdminShell';
import { fetchOrders } from '../api';
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
} from '../ui';
import { useAdminList } from '../useAdminList';
import OrderDetailsDialog from './OrderDetailsDialog';
import { ORDER_STATUS_STYLES } from './orderStatus';

const COLUMNS = ['Order', 'Created', 'Customer', 'Manufacturer', 'Products', 'Grupo Price', 'Manufacturer Price', 'Net Profit', 'Status'];

function DueLine({ amount, paidLabel, cancelled }: { amount: number; paidLabel: string; cancelled: boolean }) {
  if (amount === 0) return <p className="text-xs text-emerald-700">{paidLabel}</p>;
  return (
    <p className={`text-xs ${cancelled ? 'text-zinc-400' : 'text-amber-700'}`}>
      Due <span className="admin-mono">{formatInr(amount)}</span>
    </p>
  );
}

export default function OrderList() {
  const token = useAdminToken();
  const list = useAdminList(token, fetchOrders, 'Failed to load orders.');
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Orders" loading={list.loading} onRefresh={list.refresh} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips styles={ORDER_STATUS_STYLES} value={list.statusFilter} counts={list.data?.counts} onChange={list.selectStatus} />
        <SearchBox value={list.searchInput} onChange={list.setSearchInput} placeholder="Search order no., name, brand, email, phone…" />
      </div>

      <ErrorBanner message={list.error} />

      <DataTable
        columns={COLUMNS}
        minWidth="1300px"
        loading={list.loading}
        loadingLabel="Loading orders…"
        isEmpty={!list.data || list.data.orders.length === 0}
        empty={
          <EmptyState
            filtered={list.isFiltered}
            noun="orders"
            emptyHint="Convert a won RFQ into an order from the RFQs page."
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
          const cancelled = order.status === 'cancelled';
          const netProfit = (Math.round(order.totalAmount * 100) - Math.round(order.manufacturerTotal * 100)) / 100;
          const profitTone = cancelled ? 'text-zinc-400' : netProfit < 0 ? 'text-red-600' : netProfit > 0 ? 'text-emerald-700' : 'text-zinc-900';
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
                <p className="admin-mono mt-0.5 text-xs text-zinc-400">{order.rfqNumber}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <p className="text-zinc-900">{dateFormatter.format(createdAt)}</p>
                <p className="text-xs text-zinc-500">{timeFormatter.format(createdAt)}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-zinc-900">{order.brandName}</p>
                <p className="text-zinc-500">{order.customerName}</p>
              </td>
              <td className="max-w-[200px] px-4 py-4 text-zinc-700">{order.manufacturerName}</td>
              <td className="max-w-[240px] px-4 py-4">
                <p className="line-clamp-2 text-zinc-700" title={order.items.map((item) => item.product).join(', ')}>
                  {order.items.map((item) => item.product).join(', ')}
                </p>
                <p className="admin-mono mt-0.5 text-xs text-zinc-400">{totalUnits.toLocaleString('en-IN')} units</p>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <p className="admin-mono font-medium text-zinc-900">{formatInr(order.totalAmount)}</p>
                <DueLine amount={order.balanceDue} paidLabel="Fully received" cancelled={cancelled} />
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <p className="admin-mono font-medium text-zinc-900">{formatInr(order.manufacturerTotal)}</p>
                <DueLine amount={order.manufacturerBalanceDue} paidLabel="Fully paid" cancelled={cancelled} />
              </td>
              <td className={`admin-mono whitespace-nowrap px-4 py-4 font-medium ${profitTone}`}>
                {formatInr(netProfit)}
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
