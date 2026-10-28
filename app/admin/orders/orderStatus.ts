import type { OrderStatus, PaymentMethod, PaymentParty } from '../api';
import type { StatusStyle } from '../ui';

export const ORDER_STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  confirmed: { label: 'Confirmed', pill: 'bg-sky-50 text-sky-700 ring-sky-600/15', dot: 'bg-sky-500' },
  sampling: { label: 'Sampling', pill: 'bg-violet-50 text-violet-700 ring-violet-600/20', dot: 'bg-violet-500' },
  in_production: { label: 'In Production', pill: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  delivered: { label: 'Delivered', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' },
};

export const ORDER_PIPELINE: OrderStatus[] = ['confirmed', 'sampling', 'in_production', 'delivered'];

export const NEXT_ORDER_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  confirmed: { to: 'sampling', label: 'Start Sampling' },
  sampling: { to: 'in_production', label: 'Start Production' },
  in_production: { to: 'delivered', label: 'Mark Delivered' },
};

export const MANUFACTURER_NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  confirmed: NEXT_ORDER_STEP.confirmed,
  sampling: NEXT_ORDER_STEP.sampling,
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  upi: 'UPI',
  cash: 'Cash',
  other: 'Other',
};

export const PAYMENT_PARTY_LABELS: Record<PaymentParty, string> = {
  customer: 'From customer',
  manufacturer: 'To manufacturer',
};
