import type { RfqStatus } from '../api';
import type { StatusStyle } from '../ui';

export const RFQ_STATUS_STYLES: Record<RfqStatus, StatusStyle> = {
  lead: { label: 'Lead', pill: 'bg-sky-50 text-sky-700 ring-sky-600/15', dot: 'bg-sky-500' },
  quotation: { label: 'Quotation', pill: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  won: { label: 'Won', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  lost: { label: 'Lost', pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' },
};
