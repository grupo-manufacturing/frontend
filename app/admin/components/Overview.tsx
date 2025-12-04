'use client';

import { useMemo } from 'react';
import type { Buyer, Manufacturer, Order, Design } from '../types';
import { formatDate } from '../utils';

interface OverviewProps {
  buyers: Buyer[];
  manufacturers: Manufacturer[];
  orders: Order[];
  designs: Design[];
  isLoadingData: boolean;
  lastUpdated: string | null;
}

export default function Overview({
  buyers,
  manufacturers,
  orders,
  designs,
  isLoadingData,
  lastUpdated
}: OverviewProps) {
  // Calculate revenue metrics from accepted orders
  const acceptedOrders = useMemo(
    () => orders.filter((order) => order.status === 'accepted'),
    [orders]
  );

  const totalRevenue = useMemo(() => {
    return acceptedOrders.reduce((sum, order) => {
      return sum + (order.quoted_price || 0);
    }, 0);
  }, [acceptedOrders]);

  const averageOrderValue = useMemo(() => {
    if (acceptedOrders.length === 0) return 0;
    return totalRevenue / acceptedOrders.length;
  }, [totalRevenue, acceptedOrders.length]);

  // Calculate top buyer and top manufacturer
  const topBuyer = useMemo(() => {
    const buyerTotals = new Map<string, { name: string; phone: string; total: number; quantities: number[]; orderCount: number }>();
    
    acceptedOrders.forEach((order) => {
      const buyerId = order.requirement?.buyer?.phone_number || '';
      const buyerName = order.requirement?.buyer?.full_name || 'Unknown Buyer';
      const existing = buyerTotals.get(buyerId);
      const currentTotal = existing?.total || 0;
      const quantities = existing?.quantities || [];
      const orderCount = existing?.orderCount || 0;
      
      // Track quantity if available
      if (order.requirement?.quantity) {
        quantities.push(order.requirement.quantity);
      }
      
      buyerTotals.set(buyerId, {
        name: buyerName,
        phone: buyerId,
        total: currentTotal + (order.quoted_price || 0),
        quantities: quantities,
        orderCount: orderCount + 1
      });
    });

    let top = { name: 'N/A', phone: '', total: 0, avgProductsQuoted: 0 };
    buyerTotals.forEach((buyer) => {
      if (buyer.total > top.total) {
        // Calculate average products quoted: sum of quantities / total accepted orders
        let avgProductsQuoted = 0;
        if (buyer.quantities.length > 0 && buyer.orderCount > 0) {
          const sumQuantities = buyer.quantities.reduce((acc, qty) => acc + qty, 0);
          avgProductsQuoted = sumQuantities / buyer.orderCount;
        }
        
        top = {
          name: buyer.name,
          phone: buyer.phone,
          total: buyer.total,
          avgProductsQuoted: avgProductsQuoted
        };
      }
    });

    return top;
  }, [acceptedOrders]);

  // Calculate design metrics
  const totalDesigns = useMemo(() => designs.length, [designs]);

  const topDesignCategory = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    
    designs.forEach((design) => {
      const category = design.product_category || 'Uncategorized';
      const count = categoryCounts.get(category) || 0;
      categoryCounts.set(category, count + 1);
    });

    let topCategory = 'N/A';
    let maxCount = 0;
    
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    });

    return { category: topCategory, count: maxCount };
  }, [designs]);

  const mostValuableDesigner = useMemo(() => {
    const manufacturerCounts = new Map<string, { name: string; phone: string; count: number }>();
    
    designs.forEach((design) => {
      const manufacturerId = design.manufacturer_profiles?.phone_number || '';
      const manufacturerName = design.manufacturer_profiles?.unit_name || 'Unknown Manufacturer';
      const existing = manufacturerCounts.get(manufacturerId);
      
      manufacturerCounts.set(manufacturerId, {
        name: manufacturerName,
        phone: manufacturerId,
        count: (existing?.count || 0) + 1
      });
    });

    let top = { name: 'N/A', phone: '', count: 0 };
    manufacturerCounts.forEach((manufacturer) => {
      if (manufacturer.count > top.count) {
        top = manufacturer;
      }
    });

    return top;
  }, [designs]);

  const topManufacturer = useMemo(() => {
    const manufacturerTotals = new Map<string, { name: string; phone: string; total: number; deliveryTimes: string[]; orderCount: number }>();
    
    acceptedOrders.forEach((order) => {
      const manufacturerId = order.manufacturer?.phone_number || '';
      const manufacturerName = order.manufacturer?.unit_name || 'Unknown Manufacturer';
      const existing = manufacturerTotals.get(manufacturerId);
      const currentTotal = existing?.total || 0;
      const deliveryTimes = existing?.deliveryTimes || [];
      const orderCount = existing?.orderCount || 0;
      
      if (order.delivery_time) {
        deliveryTimes.push(order.delivery_time);
      }
      
      manufacturerTotals.set(manufacturerId, {
        name: manufacturerName,
        phone: manufacturerId,
        total: currentTotal + (order.quoted_price || 0),
        deliveryTimes: deliveryTimes,
        orderCount: orderCount + 1
      });
    });

    let top = { name: 'N/A', phone: '', total: 0, avgDeliveryTime: 'N/A' };
    manufacturerTotals.forEach((manufacturer) => {
      if (manufacturer.total > top.total) {
        // Calculate average delivery time: sum all delivery times and divide by count
        let avgDeliveryTime = 'N/A';
        if (manufacturer.deliveryTimes.length > 0) {
          // Extract numeric values from delivery time strings
          const numericValues = manufacturer.deliveryTimes.map((time) => {
            const match = time.match(/(\d+)/);
            return match ? parseFloat(match[1]) : 0;
          }).filter((num) => num > 0);
          
          if (numericValues.length > 0) {
            // Sum all numeric values
            const sum = numericValues.reduce((acc, val) => acc + val, 0);
            
            // Divide by total number of accepted orders (count of delivery times)
            const average = sum / numericValues.length;
            
            // Get the unit from the first delivery time (assuming all have same unit)
            // Match pattern like "19 days", "20 days", etc.
            const unitMatch = manufacturer.deliveryTimes[0]?.match(/\d+\s+([a-zA-Z]+)/);
            const unit = unitMatch && unitMatch[1] ? unitMatch[1].trim() : 'days';
            
            // Format with one decimal place if needed
            const roundedAverage = average % 1 === 0 ? average : average.toFixed(1);
            avgDeliveryTime = `${roundedAverage} ${unit}`;
          }
        }
        
        top = {
          name: manufacturer.name,
          phone: manufacturer.phone,
          total: manufacturer.total,
          avgDeliveryTime: avgDeliveryTime
        };
      }
    });

    return top;
  }, [acceptedOrders]);

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
                <p className="text-xs text-slate-500">Total Order Value</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  ₹{topBuyer.total.toLocaleString('en-IN')}
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

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total No of Designs</p>
          <p className="flex-1 flex items-center text-2xl font-semibold text-slate-900">{totalDesigns}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Design Category</p>
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              {topDesignCategory.category}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">No of Designs</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {topDesignCategory.count}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Most Valuable Designer</p>
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              {mostValuableDesigner.name}
            </p>
            {mostValuableDesigner.phone && (
              <p className="text-sm text-slate-500">{mostValuableDesigner.phone}</p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">No of Designs</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {mostValuableDesigner.count}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

