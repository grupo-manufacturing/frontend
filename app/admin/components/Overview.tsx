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

  // Calculate top manufacturer based on accepted AI Design responses
  const topManufacturer = useMemo(() => {
    const manufacturerStats = new Map<string, { 
      name: string; 
      phone: string; 
      totalRevenue: number; 
      acceptedCount: number;
      totalOrdersCount: number;
    }>();
    
    // Process all AI designs and their responses (both accepted and all)
    aiDesigns.forEach((design) => {
      if (design.responses && Array.isArray(design.responses)) {
        design.responses.forEach((response: any) => {
          const manufacturerId = response.manufacturer_id;
          
          // Skip if no manufacturer ID
          if (!manufacturerId) {
            return;
          }
          
          // Get manufacturer info from response or find in manufacturers array
          let manufacturerName = 'Unknown Manufacturer';
          let manufacturerPhone = '';
          
          // Prefer manufacturer data from response (most up-to-date)
          if (response.manufacturer) {
            manufacturerName = response.manufacturer.unit_name || response.manufacturer.manufacturer_id || 'Unknown Manufacturer';
            manufacturerPhone = response.manufacturer.phone_number || '';
          } else if (manufacturerId && manufacturers.length > 0) {
            // Try to find in manufacturers array
            const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId.toString());
            if (manufacturer) {
              manufacturerName = manufacturer.unit_name || manufacturer.manufacturer_id || 'Unknown Manufacturer';
              manufacturerPhone = manufacturer.phone_number || '';
            }
          }
          
          // Get existing stats or create new
          const existing = manufacturerStats.get(manufacturerId) || {
            name: manufacturerName,
            phone: manufacturerPhone,
            totalRevenue: 0,
            acceptedCount: 0,
            totalOrdersCount: 0
          };
          
          // Preserve better manufacturer info if we have it
          // Prefer response.manufacturer data, then existing good data, then fallback
          const finalName = response.manufacturer?.unit_name || response.manufacturer?.manufacturer_id 
            || (existing.name !== 'Unknown Manufacturer' ? existing.name : manufacturerName);
          const finalPhone = response.manufacturer?.phone_number 
            || (existing.phone ? existing.phone : manufacturerPhone);
          
          // Increment total orders count (all responses)
          const newTotalOrdersCount = existing.totalOrdersCount + 1;
          
          // If this is an accepted response, update accepted count and revenue
          if (response.status === 'accepted') {
            // Calculate price
            const price = response.quoted_price || 
              (response.price_per_unit && response.quantity 
                ? response.price_per_unit * response.quantity 
                : 0);
            
            manufacturerStats.set(manufacturerId, {
              name: finalName,
              phone: finalPhone,
              totalRevenue: existing.totalRevenue + price,
              acceptedCount: existing.acceptedCount + 1,
              totalOrdersCount: newTotalOrdersCount
            });
          } else {
            // Just update total orders count for non-accepted responses
            manufacturerStats.set(manufacturerId, {
              name: finalName,
              phone: finalPhone,
              totalRevenue: existing.totalRevenue,
              acceptedCount: existing.acceptedCount,
              totalOrdersCount: newTotalOrdersCount
            });
          }
        });
      }
    });
    
    // Find manufacturer with highest total revenue
    let top = { name: 'N/A', phone: '', total: 0, acceptedCount: 0, totalOrdersCount: 0 };
    
    manufacturerStats.forEach((stats) => {
      if (stats.totalRevenue > top.total) {
        top = {
          name: stats.name,
          phone: stats.phone,
          total: stats.totalRevenue,
          acceptedCount: stats.acceptedCount,
          totalOrdersCount: stats.totalOrdersCount
        };
      }
    });
    
    return top;
  }, [aiDesigns, manufacturers]);

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
                <p className="text-xs text-slate-500">Avg. Accepted Orders</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {topManufacturer.totalOrdersCount > 0
                    ? ((topManufacturer.acceptedCount / topManufacturer.totalOrdersCount) * 100).toFixed(1)
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

