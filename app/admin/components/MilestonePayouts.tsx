'use client';

import { useState } from 'react';
import { formatDate } from '../utils';

interface MilestonePayout {
  id: string;
  requirement_id: string;
  manufacturer_id: string;
  status: string;
  quoted_price: number;
  pendingMilestone: 'm1' | 'm2' | 'final';
  payoutAmount: number;
  payoutLabel?: string;
  m1_marked_at?: string;
  m1_approved_at?: string;
  m2_marked_at?: string;
  m2_approved_at?: string;
  delivered_at?: string;
  requirement?: {
    id: string;
    requirement_no?: string;
    product_type?: string;
    quantity?: number;
    buyer?: {
      id: string;
      full_name?: string;
      phone_number?: string;
    };
  };
  manufacturer?: {
    id: string;
    unit_name?: string;
    phone_number?: string;
    manufacturer_id?: string;
  };
}

interface MilestonePayoutsProps {
  payouts: MilestonePayout[];
  isLoadingData: boolean;
  lastUpdated: string | null;
  onMarkPaid: (responseId: string, milestone: 'm1' | 'm2' | 'final', transactionRef?: string) => Promise<void>;
  onReload: () => void;
}

export default function MilestonePayouts({
  payouts,
  isLoadingData,
  onMarkPaid,
  onReload
}: MilestonePayoutsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPayoutModalFor, setShowPayoutModalFor] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayouts = payouts.filter((payout) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (payout.requirement?.requirement_no || '').toLowerCase().includes(q) ||
      (payout.requirement?.buyer?.full_name || '').toLowerCase().includes(q) ||
      (payout.manufacturer?.unit_name || '').toLowerCase().includes(q) ||
      (payout.manufacturer?.manufacturer_id || '').toLowerCase().includes(q)
    );
  });

  const handleMarkPaid = async (payout: MilestonePayout) => {
    setProcessingId(payout.id);
    try {
      await onMarkPaid(payout.id, payout.pendingMilestone, transactionRef.trim());
      setShowPayoutModalFor(null);
      setTransactionRef('');
      onReload();
    } catch (error) {
      console.error('Failed to mark payout:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoadingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Milestone Payouts</h1>
          <p className="text-sm text-slate-500">
            Mark milestone payouts as transferred after manually sending funds to manufacturers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700">
            Pending:{' '}
            <span className="font-semibold">{payouts.length}</span>
          </div>
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
            placeholder="Search by requirement, buyer, or manufacturer"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      {filteredPayouts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-900">All caught up!</h3>
          <p className="mt-1 text-sm text-slate-500">
            {payouts.length === 0 
              ? 'No milestone payouts pending.'
              : 'No payouts match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <div
              key={payout.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                      payout.pendingMilestone === 'm1' 
                        ? 'bg-purple-100 text-purple-800' 
                        : payout.pendingMilestone === 'm2'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {payout.payoutLabel || (
                        payout.pendingMilestone === 'm1' ? 'M1 Payout (30% - 3% fee = 27%)' 
                        : payout.pendingMilestone === 'm2' ? 'M2 Payout (20% - 2% fee = 18%)'
                        : 'Final Payout (50% - 5% fee = 45%)'
                      )}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {formatAmount(payout.payoutAmount)}
                    </span>
                    {payout.requirement?.requirement_no && (
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {payout.requirement.requirement_no}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Manufacturer</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {payout.manufacturer?.unit_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{payout.manufacturer?.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Buyer</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {payout.requirement?.buyer?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{payout.requirement?.buyer?.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Order Value</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {formatAmount(payout.quoted_price)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Product</p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {payout.requirement?.product_type || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Quantity</p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {payout.requirement?.quantity?.toLocaleString('en-IN') || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        {payout.pendingMilestone === 'm1' 
                          ? 'M1 Approved At' 
                          : payout.pendingMilestone === 'm2' 
                          ? 'M2 Approved At'
                          : 'Delivered At'}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {payout.pendingMilestone === 'm1' 
                          ? (payout.m1_approved_at ? formatDate(payout.m1_approved_at) : '—')
                          : payout.pendingMilestone === 'm2'
                          ? (payout.m2_approved_at ? formatDate(payout.m2_approved_at) : '—')
                          : (payout.delivered_at ? formatDate(payout.delivered_at) : '—')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:ml-6 lg:w-48">
                  {showPayoutModalFor === payout.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="Transaction ref"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkPaid(payout)}
                          disabled={processingId === payout.id}
                          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processingId === payout.id ? 'Processing...' : 'Confirm Paid'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPayoutModalFor(null);
                            setTransactionRef('');
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPayoutModalFor(payout.id)}
                      disabled={processingId === payout.id}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === payout.id ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
