'use client';

import { useMemo } from 'react';
import type { Buyer, Manufacturer, Order, AIDesign } from '../types';

interface OverviewProps {
  buyers: Buyer[];
  manufacturers: Manufacturer[];
  orders: Order[];
  aiDesigns: AIDesign[];
  isLoadingData: boolean;
  lastUpdated: string | null;
}

export default function Overview({
  buyers,
  manufacturers,
  orders,
  aiDesigns,
  isLoadingData,
  lastUpdated
}: OverviewProps) {
  // Calculate revenue from accepted AI Design responses
  // Note: Requirements don't have status or quoted_price, so we only calculate revenue from AI orders
  const acceptedAIRevenue = useMemo(() => {
    let total = 0;
    aiDesigns.forEach((design) => {
      // Check if design has responses (assuming responses are included in the design object)
      if (design.responses && Array.isArray(design.responses)) {
        design.responses.forEach((response: any) => {
          if (response.status === 'accepted') {
            // Calculate total price: quoted_price or (price_per_unit * quantity)
            const price = response.quoted_price || 
              (response.price_per_unit && response.quantity 
                ? response.price_per_unit * response.quantity 
                : 0);
            total += price;
          }
        });
      }
    });
    return total;
  }, [aiDesigns]);

  const totalRevenue = useMemo(() => {
    // Revenue is only from AI Design responses (requirements don't have quoted_price/status)
    return acceptedAIRevenue;
  }, [acceptedAIRevenue]);

  const acceptedAICount = useMemo(() => {
    let count = 0;
    aiDesigns.forEach((design) => {
      if (design.responses && Array.isArray(design.responses)) {
        design.responses.forEach((response: any) => {
          if (response.status === 'accepted') {
            count++;
          }
        });
      }
    });
    return count;
  }, [aiDesigns]);

  const averageOrderValue = useMemo(() => {
    if (acceptedAICount === 0) return 0;
    return totalRevenue / acceptedAICount;
  }, [totalRevenue, acceptedAICount]);

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

  // Top manufacturer is not available from requirements (requirements don't have manufacturer info)
  const topManufacturer = useMemo(() => {
    return { name: 'N/A', phone: '', total: 0, avgDeliveryTime: 'N/A' };
  }, []);

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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Order Value</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ₹{averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
            {topBuyer.phone && (
              <p className="text-sm text-slate-500">{topBuyer.phone}</p>
            )}
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
              {topManufacturer.name}
            </p>
            {topManufacturer.phone && (
              <p className="text-sm text-slate-500">{topManufacturer.phone}</p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Total Order Value</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  ₹{topManufacturer.total.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg. Delivery Time</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {topManufacturer.avgDeliveryTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

