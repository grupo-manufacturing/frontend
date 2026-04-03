'use client';

import { useMemo } from 'react';
import type { Buyer, Manufacturer, Order } from '../types';

interface OverviewProps {
  buyers: Buyer[];
  manufacturers: Manufacturer[];
  orders: Order[];
  totalRevenue: number;
  topManufacturer?: {
    name: string;
    phone: string;
    total: number;
    acceptedCount: number;
    totalOrdersCount: number;
  } | null;
  isLoadingData: boolean;
  lastUpdated: string | null;
}

export default function Overview({
  buyers,
  manufacturers,
  orders,
  totalRevenue,
  topManufacturer,
  isLoadingData,
  lastUpdated
}: OverviewProps) {
  // Total Orders: simply the number of requirements shown in the Orders tab.
  const totalOrders = useMemo(() => orders.length, [orders]);

  // Calculate top buyer based on number of requirements (not revenue since requirements don't have quoted_price)
  const topBuyer = useMemo(() => {
    const buyerCounts = new Map<string, { name: string; phone: string; count: number; quantities: number[] }>();
    
    orders.forEach((requirement) => {
      const buyerId = requirement.buyer?.phone_number || '';
      const buyerName = requirement.buyer?.full_name || 'Unknown Buyer';
      const existing = buyerCounts.get(buyerId);
      const quantities = existing?.quantities || [];
      
      // Track quantity if available
      if (requirement.quantity) {
        quantities.push(requirement.quantity);
      }
      
      buyerCounts.set(buyerId, {
        name: buyerName,
        phone: buyerId,
        count: (existing?.count || 0) + 1,
        quantities: quantities
      });
    });

    let top = { name: 'N/A', phone: '', total: 0, avgProductsQuoted: 0 };
    buyerCounts.forEach((buyer) => {
      if (buyer.count > top.total) {
        // Calculate average products: sum of quantities / total requirements
        let avgProductsQuoted = 0;
        if (buyer.quantities.length > 0 && buyer.count > 0) {
          const sumQuantities = buyer.quantities.reduce((acc, qty) => acc + qty, 0);
          avgProductsQuoted = sumQuantities / buyer.count;
        }
        
        top = {
          name: buyer.name,
          phone: buyer.phone,
          total: buyer.count, // This is now count of requirements, not revenue
          avgProductsQuoted: avgProductsQuoted
        };
      }
    });

    return top;
  }, [orders]);

  const effectiveTopManufacturer =
    topManufacturer || {
      name: 'N/A',
      phone: '',
      total: 0,
      acceptedCount: 0,
      totalOrdersCount: 0
    };

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{buyers.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manufacturers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{manufacturers.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalOrders.toLocaleString('en-IN')}
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Buyer</p>
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              {topBuyer.name}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Total Requirements</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {topBuyer.total.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg. Products Quoted</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {topBuyer.avgProductsQuoted > 0 
                    ? topBuyer.avgProductsQuoted % 1 === 0 
                      ? topBuyer.avgProductsQuoted 
                      : topBuyer.avgProductsQuoted.toFixed(1)
                    : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Manufacturer</p>
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              {effectiveTopManufacturer.name}
            </p>
            {effectiveTopManufacturer.phone && (
              <p className="text-sm text-slate-500">{effectiveTopManufacturer.phone}</p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Total Order Value</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  ₹{effectiveTopManufacturer.total.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg. Accepted Orders</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {effectiveTopManufacturer.totalOrdersCount > 0
                    ? ((effectiveTopManufacturer.acceptedCount / effectiveTopManufacturer.totalOrdersCount) * 100).toFixed(1)
                    : '0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

