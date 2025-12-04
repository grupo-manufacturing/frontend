export const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const renderBadge = (
  label: string,
  tone: 'info' | 'success' | 'warning' | 'neutral' = 'neutral'
) => {
  const tones: Record<typeof tone, string> = {
    info: 'bg-[#22a2f2]/10 text-[#187dc5]',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    neutral: 'bg-slate-100 text-slate-600'
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'submitted':
      return 'Pending';
    default:
      return status;
  }
};

export const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'submitted':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

