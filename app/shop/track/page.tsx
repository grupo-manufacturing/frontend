'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/landing/Navbar';
import { TrackedOrder } from '../lib/types';
import { trackOrder } from '../lib/api';

const STEPS = [
  { key: 'confirmed',  label: 'Confirmed',  icon: 'check'    },
  { key: 'processing', label: 'Processing', icon: 'gear'     },
  { key: 'shipped',    label: 'Shipped',    icon: 'truck'    },
  { key: 'delivered',  label: 'Delivered',  icon: 'package'  },
] as const;

const STATUS_RANK: Record<string, number> = {
  payment_pending: -1,
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -2,
  payment_failed: -3,
};

function StepIcon({ type, active }: { type: string; active: boolean }) {
  const cls = active ? 'text-surface' : 'text-foreground/40';

  if (type === 'check') return (
    <svg className={`w-4 h-4 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
  if (type === 'gear') return (
    <svg className={`w-4 h-4 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (type === 'truck') return (
    <svg className={`w-4 h-4 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
  return (
    <svg className={`w-4 h-4 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function StatusStepper({ status }: { status: string }) {
  const rank = STATUS_RANK[status] ?? 0;

  if (status === 'cancelled' || status === 'payment_failed') {
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span className="font-nav text-[11px] uppercase tracking-[0.14em] font-semibold text-red-600">
          {status === 'cancelled' ? 'Order Cancelled' : 'Payment Failed'}
        </span>
      </div>
    );
  }

  if (status === 'payment_pending' || status === 'pending') {
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <span className="font-nav text-[11px] uppercase tracking-[0.14em] font-semibold text-amber-600">
          {status === 'payment_pending' ? 'Awaiting Payment' : 'Order Pending'}
        </span>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between relative">
        {STEPS.map((step, i) => {
          const stepRank = STATUS_RANK[step.key] ?? 0;
          const done = rank > stepRank;
          const active = rank === stepRank;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              {i > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -z-10 ${
                    done || active ? 'bg-[#1C8FD7]' : 'bg-brand/15'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                  done
                    ? 'bg-[#1C8FD7]'
                    : active
                      ? 'bg-[#1C8FD7] ring-4 ring-brand/20'
                      : 'bg-brand/5 border-2 border-brand/15'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <StepIcon type={step.icon} active={active} />
                )}
              </div>
              <span
                className={`font-nav mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  done || active ? 'text-[#1C8FD7]' : 'text-foreground/40'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar variant="dark" />
        <div className="flex-1 pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-lg">
            <div className="h-16 bg-brand/10 mx-auto w-16" />
            <div className="h-8 bg-brand/10 w-1/2 mx-auto" />
            <div className="h-4 bg-brand/10 w-1/3 mx-auto" />
            <div className="h-12 bg-brand/10 mt-8" />
          </div>
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get('order') || '';

  const [input, setInput] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const didAutoLookup = useRef(false);

  useEffect(() => {
    if (initialOrder && !didAutoLookup.current) {
      didAutoLookup.current = true;
      handleLookup(initialOrder);
    } else if (!initialOrder) {
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrder]);

  async function handleLookup(orderNum?: string) {
    const num = (orderNum ?? input).trim().toUpperCase();
    if (!num) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const result = await trackOrder(num);
      setOrder(result);
    } catch {
      setError('No order found with this number. Please check and try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup();
  };

  const handleReset = () => {
    setOrder(null);
    setError('');
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="dark" />

      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-brand/15 bg-brand/5 mb-5">
              <svg className="w-8 h-8 text-[#1C8FD7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-[-0.02em] text-foreground">Track Your Order</h1>
            <p className="font-body text-sm text-foreground/40 mt-2">Enter your order number to see its current status</p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. GRUPO-ORD-0001"
                className="font-nav flex-1 px-4 py-3.5 bg-surface border border-brand/10 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-[#1C8FD7] focus:ring-1 focus:ring-[#1C8FD7]/20 tracking-wide"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="font-nav px-6 py-3.5 bg-[#1C8FD7] text-[#0b1220] text-[10px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 sm:text-[11px]"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Track
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 p-5 text-center">
              <svg className="w-10 h-10 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-body text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Order result */}
          {order && (
            <div className="space-y-5">
              {/* Status stepper */}
              <div className="bg-surface border border-brand/10 px-5 py-2">
                <StatusStepper status={order.status} />
              </div>

              {/* Product info */}
              <div className="bg-surface border border-brand/10 p-5">
                <div className="flex gap-4 items-start">
                  <div className="relative w-16 h-16 overflow-hidden flex-shrink-0 bg-brand/5 border border-brand/10">
                    <Image src={order.productImage} alt={order.productName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground text-sm leading-tight">{order.productName}</h3>
                    <p className="font-body text-xs text-foreground/40 mt-0.5">{order.quantity} units</p>
                    <span className="font-nav inline-block mt-1 px-2 py-0.5 bg-[#1C8FD7]/10 text-[#1C8FD7] text-[10px] font-bold uppercase tracking-[0.12em]">
                      {order.tier}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading text-lg font-bold text-foreground">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="font-body text-[11px] text-foreground/40">
                      ₹{order.unitPrice.toLocaleString('en-IN')}/unit
                    </p>
                  </div>
                </div>

                {order.variations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-brand/10 space-y-1.5">
                    <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40">Variations</p>
                    {order.variations.map((v) => (
                      <div key={v.color} className="font-body text-xs">
                        <span className="font-semibold text-foreground/70">{v.color}</span>
                        <span className="text-foreground/40 ml-1">
                          — {v.sizes.map((s) => `${s.size} ×${s.qty}`).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface p-3 border border-brand/10">
                  <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40 mb-1">Order Number</p>
                  <p className="font-nav text-sm font-semibold text-foreground">{order.orderNumber}</p>
                </div>
                <div className="bg-surface p-3 border border-brand/10">
                  <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40 mb-1">Shipping To</p>
                  <p className="font-body text-sm font-semibold text-foreground">{order.city}, {order.state}</p>
                </div>
                <div className="bg-surface p-3 border border-brand/10">
                  <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40 mb-1">Placed On</p>
                  <p className="font-body text-sm font-semibold text-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-surface p-3 border border-brand/10">
                  <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40 mb-1">Last Updated</p>
                  <p className="font-body text-sm font-semibold text-foreground">
                    {new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Track another */}
              <button
                onClick={handleReset}
                className="font-nav w-full py-3 bg-surface border border-brand/15 text-foreground/60 text-[10px] uppercase tracking-[0.14em] hover:border-[#1C8FD7] hover:text-[#1C8FD7] transition-colors sm:text-[11px]"
              >
                Track Another Order
              </button>
            </div>
          )}

          {/* Back to shop */}
          {!order && !error && (
            <div className="text-center mt-12">
              <Link href="/shop" className="font-nav text-[10px] uppercase tracking-[0.14em] text-foreground/40 hover:text-[#1C8FD7] transition-colors">
                ← Back to Shop
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
