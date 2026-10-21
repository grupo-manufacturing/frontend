export type ToastTone = 'success' | 'error' | 'info';
export type Toast = { id: number; tone: ToastTone; message: string };

const MAX_VISIBLE = 4;
const DURATION_MS: Record<ToastTone, number> = { success: 4000, info: 4000, error: 6000 };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): Toast[] {
  return toasts;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function show(tone: ToastTone, message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, tone, message }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS[tone]);
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
};
