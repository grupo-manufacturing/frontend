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
  const cls = active ? 'text-white' : 'text-gray-400';

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
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-red-600">
          {status === 'cancelled' ? 'Order Cancelled' : 'Payment Failed'}
        </span>
      </div>
    );
  }

  if (status === 'payment_pending' || status === 'pending') {
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-amber-600">
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
                    done || active ? 'bg-[#22a2f2]' : 'bg-gray-200'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done
                    ? 'bg-[#22a2f2] shadow-md shadow-blue-200'
                    : active
                      ? 'bg-[#22a2f2] shadow-lg shadow-blue-300 ring-4 ring-blue-100'
                      : 'bg-gray-100 border-2 border-gray-200'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <StepIcon type={step.icon} active={active} />
                )}
              </div>
              <span
                className={`mt-2 text-[11px] font-semibold tracking-wide ${
                  done || active ? 'text-[#22a2f2]' : 'text-gray-400'
                } ${active ? 'font-bold' : ''}`}
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-lg">
            <div className="h-16 bg-gray-200 rounded-2xl mx-auto w-16" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-12 bg-gray-200 rounded-xl mt-8" />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-5">
              <svg className="w-8 h-8 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Track Your Order</h1>
            <p className="text-sm text-gray-400 mt-2">Enter your order number to see its current status</p>
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
                className="flex-1 px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:border-[#22a2f2] focus:ring-2 focus:ring-[#22a2f2]/10 font-mono tracking-wide shadow-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3.5 bg-[#22a2f2] text-white rounded-xl font-semibold text-sm hover:bg-[#1b8bd0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 shadow-sm"
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
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-center">
              <svg className="w-10 h-10 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Order result */}
          {order && (
            <div className="space-y-5">
              {/* Status stepper */}
              <div className="bg-white rounded-2xl px-5 py-2 border border-gray-200 shadow-sm">
                <StatusStepper status={order.status} />
              </div>

              {/* Product info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex gap-4 items-start">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-blue-50">
                    <Image src={order.productImage} alt={order.productName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{order.productName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{order.quantity} units</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#22a2f2]/10 text-[#22a2f2] text-[11px] font-bold rounded-md">
                      {order.tier}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      ₹{order.unitPrice.toLocaleString('en-IN')}/unit
                    </p>
                  </div>
                </div>

                {order.variations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Variations</p>
                    {order.variations.map((v) => (
                      <div key={v.color} className="text-xs">
                        <span className="font-semibold text-gray-700">{v.color}</span>
                        <span className="text-gray-400 ml-1">
                          — {v.sizes.map((s) => `${s.size} ×${s.qty}`).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1">Order Number</p>
                  <p className="text-sm font-semibold text-gray-800 font-mono">{order.orderNumber}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1">Shipping To</p>
                  <p className="text-sm font-semibold text-gray-800">{order.city}, {order.state}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1">Placed On</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Track another */}
              <button
                onClick={handleReset}
                className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
              >
                Track Another Order
              </button>
            </div>
          )}

          {/* Back to shop */}
          {!order && !error && (
            <div className="text-center mt-12">
              <Link href="/shop" className="text-sm text-gray-400 hover:text-[#22a2f2] transition-colors">
                ← Back to Shop
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
