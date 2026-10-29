'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { OMS_API_URL } from '../request-for-quotation/api';
import type { OrderStatus, PaymentParty, RfqStatus } from './api';
import { toast } from './toast';

export type PortalRole = 'admin' | 'manufacturer';

export type Actor = { role: 'admin' } | { role: 'manufacturer'; name: string } | { role: 'customer' };

export type RealtimeEvent = (
  | { type: 'rfq.created'; rfqNumber: string; brandName: string }
  | { type: 'rfq.status_changed'; rfqId: string; status: RfqStatus }
  | { type: 'order.created'; orderId: string; orderNumber: string; rfqId: string }
  | { type: 'order.status_changed'; orderId: string; orderNumber: string; status: OrderStatus }
  | { type: 'order.payment_added'; orderId: string; orderNumber: string; party: PaymentParty; amount: number }
  | { type: 'manufacturer.created'; manufacturerId: string }
  | { type: 'manufacturer.updated'; manufacturerId: string }
  | { type: 'manufacturer.deleted'; manufacturerId: string }
  | { type: 'manufacturer.profile_updated'; manufacturerId: string; companyName: string }
) & { actor: Actor };

/** True for live signals about orders, plus resync. */
export const isOrderSignal = (signal: LiveSignal) => signal.type === 'resync' || signal.type.startsWith('order.');

/** A live event, or "resync" after a reconnect or a long absence from the tab, when events may have been missed. */
export type LiveSignal = RealtimeEvent | { type: 'resync' };

type Listener = (signal: LiveSignal) => void;

// Returning to a tab hidden for longer than this reloads its data, in case the connection silently dropped.
const RESYNC_AFTER_HIDDEN_MS = 30_000;
const RETRY_MS = 5_000;

const RealtimeContext = createContext<Set<Listener> | null>(null);

/** Keeps one live connection open for the signed-in session and hands its events to useRealtime listeners. */
export function RealtimeProvider({
  token,
  role,
  onUnauthorized,
  children,
}: {
  token: string;
  role: PortalRole;
  onUnauthorized: () => void;
  children: React.ReactNode;
}) {
  const [listeners] = useState(() => new Set<Listener>());

  useEffect(() => {
    const broadcast = (signal: LiveSignal) => listeners.forEach((listener) => listener(signal));
    const socket = io(OMS_API_URL, { auth: { token, role } });
    let connectedBefore = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | null = null;

    socket.on('connect', () => {
      if (connectedBefore) broadcast({ type: 'resync' });
      connectedBefore = true;
    });
    socket.on('event', broadcast);
    socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') {
        onUnauthorized();
        return;
      }
      // Rejections by the server aren't retried automatically; network errors are.
      if (!socket.active) retryTimer = setTimeout(() => socket.connect(), RETRY_MS);
    });
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') socket.connect();
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > RESYNC_AFTER_HIDDEN_MS) broadcast({ type: 'resync' });
      hiddenAt = null;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      socket.disconnect();
    };
  }, [token, role, onUnauthorized, listeners]);

  return <RealtimeContext.Provider value={listeners}>{children}</RealtimeContext.Provider>;
}

/** Calls listener with every live signal while the component is mounted. */
export function useRealtime(listener: Listener) {
  const listeners = useContext(RealtimeContext);
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  });

  useEffect(() => {
    if (!listeners) return;
    const forward: Listener = (signal) => listenerRef.current(signal);
    listeners.add(forward);
    return () => {
      listeners.delete(forward);
    };
  }, [listeners]);
}

/** Shows a toast for events made by someone other than the signed-in role. */
export function LiveToasts({ role, message }: { role: PortalRole; message: (event: RealtimeEvent) => string | null }) {
  useRealtime((signal) => {
    if (signal.type === 'resync' || signal.actor.role === role) return;
    const text = message(signal);
    if (text) toast.info(text);
  });
  return null;
}
