'use client';

import { useState } from 'react';
import type { Payment } from '../types';
import { formatDate } from '../utils';

interface PaymentVerificationProps {
  payments: Payment[];
  isLoadingData: boolean;
  lastUpdated: string | null;
  onVerify: (paymentId: string, approved: boolean, notes?: string) => Promise<void>;
  onReload: () => void;
}

export default function PaymentVerification({
  payments,
  isLoadingData,
  onVerify,
  onReload
}: PaymentVerificationProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (payment.utr_number || '').toLowerCase().includes(q) ||
      (payment.buyer?.full_name || '').toLowerCase().includes(q) ||
      (payment.buyer?.phone_number || '').includes(searchQuery) ||
      (payment.manufacturer?.unit_name || '').toLowerCase().includes(q) ||
      (payment.requirement_response?.requirement?.requirement_no || '').toLowerCase().includes(q)
    );
  });

  const handleApprove = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      await onVerify(paymentId, true);
      onReload();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectNotes.trim()) return;
    setProcessingId(paymentId);
    try {
      await onVerify(paymentId, false, rejectNotes.trim());
      setRejectingId(null);
      setRejectNotes('');
      onReload();
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
          <h1 className="text-xl font-semibold text-slate-900">Payment Verification</h1>
          <p className="text-sm text-slate-500">
            Verify UTR numbers submitted by buyers for payment confirmation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Pending:{' '}
            <span className="font-semibold">{payments.length}</span>
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
            placeholder="Search by UTR, buyer, manufacturer, or requirement"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-900">All caught up!</h3>
          <p className="mt-1 text-sm text-slate-500">
            {payments.length === 0 
              ? 'No payments pending verification.'
              : 'No payments match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Payment {payment.payment_number} of 2
                    </span>
                    <span className="inline-flex items-center rounded-md bg-[#22a2f2]/10 px-2.5 py-1 text-xs font-semibold text-[#22a2f2]">
                      {formatAmount(payment.amount)}
                    </span>
                    {payment.requirement_response?.requirement?.requirement_no && (
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {payment.requirement_response.requirement.requirement_no}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">UTR Number</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                        {payment.utr_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Buyer</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {payment.buyer?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{payment.buyer?.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Manufacturer</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {payment.manufacturer?.unit_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{payment.manufacturer?.phone_number || '—'}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Product</p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {payment.requirement_response?.requirement?.product_type || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Quantity</p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {payment.requirement_response?.requirement?.quantity?.toLocaleString('en-IN') || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Quote</p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {payment.requirement_response?.quoted_price 
                          ? formatAmount(payment.requirement_response.quoted_price)
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Submitted: {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:ml-6 lg:w-48">
                  {rejectingId === payment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(payment.id)}
                          disabled={!rejectNotes.trim() || processingId === payment.id}
                          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processingId === payment.id ? 'Rejecting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectNotes('');
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(payment.id)}
                        disabled={processingId === payment.id}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === payment.id ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(payment.id)}
                        disabled={processingId === payment.id}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </>
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
