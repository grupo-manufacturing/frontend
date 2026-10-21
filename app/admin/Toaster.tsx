'use client';

import { useSyncExternalStore } from 'react';
import { dismissToast, getToasts, subscribeToasts, type Toast, type ToastTone } from './toast';
import { Icon, ICONS } from './ui';

const NO_TOASTS: Toast[] = [];

const TONES: Record<ToastTone, { icon: string; iconCls: string }> = {
  success: { icon: ICONS.check, iconCls: 'bg-emerald-50 text-emerald-600' },
  error: { icon: ICONS.alert, iconCls: 'bg-red-50 text-red-600' },
  info: { icon: ICONS.info, iconCls: 'bg-zinc-100 text-zinc-600' },
};

export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => NO_TOASTS);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const tone = TONES[toast.tone];
        return (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-lg shadow-zinc-900/10 animate-[toast-slide-in_0.35s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${tone.iconCls}`}>
              <Icon d={tone.icon} className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 self-center text-zinc-800">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <Icon d={ICONS.close} className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
