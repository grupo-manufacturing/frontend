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
  // Calculate revenue metrics from accepted orders
  const acceptedOrders = useMemo(
    () => orders.filter((order) => order.status === 'accepted'),
    [orders]
  );

  // Calculate revenue from accepted AI Design responses
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
    // Sum of accepted orders revenue + accepted AI Design responses revenue
    const ordersRevenue = acceptedOrders.reduce((sum, order) => {
      return sum + (order.quoted_price || 0);
    }, 0);
    return ordersRevenue + acceptedAIRevenue;
  }, [acceptedOrders, acceptedAIRevenue]);

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

    </div>
  );
}

