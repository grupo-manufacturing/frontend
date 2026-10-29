'use client';

import { useEffect, useState } from 'react';
import LoginScreen from '../admin/LoginScreen';
import { ORDER_STATUS_STYLES } from '../admin/orders/orderStatus';
import PortalShell, { useSessionToken, type NavItem } from '../admin/PortalShell';
import { useRealtime, type RealtimeEvent } from '../admin/realtime';
import { formatInr, ICONS } from '../admin/ui';
import { expireManufacturerSession, fetchMe, ManufacturerAuthError, manufacturerLogin, manufacturerSession } from './api';

export const useManufacturerToken = useSessionToken;

const NAV: NavItem[] = [
  { href: '/manufacturer/orders', label: 'Orders' },
  { href: '/manufacturer/profile', label: 'Profile' },
];

function AccountName() {
  const token = useSessionToken();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [checkKey, setCheckKey] = useState(0);

  useRealtime((signal) => {
    if (signal.type === 'resync' || signal.type === 'manufacturer.updated' || signal.type === 'manufacturer.deleted') {
      setCheckKey((key) => key + 1);
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchMe(token)
      .then((me) => {
        if (!cancelled) setCompanyName(me.companyName);
      })
      .catch((err) => {
        if (!cancelled && err instanceof ManufacturerAuthError) expireManufacturerSession();
      });
    return () => {
      cancelled = true;
    };
  }, [token, checkKey]);

  if (!companyName) return null;
  return <span className="hidden max-w-[260px] truncate text-sm font-medium text-zinc-700 sm:block">{companyName}</span>;
}

function liveToast(event: RealtimeEvent): string | null {
  switch (event.type) {
    case 'order.created':
      return `New order assigned: ${event.orderNumber}`;
    case 'order.status_changed':
      return `${event.orderNumber} moved to ${ORDER_STATUS_STYLES[event.status].label} by Grupo`;
    case 'order.payment_added':
      return `Grupo recorded a payment of ${formatInr(event.amount)} for ${event.orderNumber}`;
    default:
      return null;
  }
}

export default function ManufacturerShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      session={manufacturerSession}
      role="manufacturer"
      liveToast={liveToast}
      badge="Manufacturer"
      nav={NAV}
      headerExtra={<AccountName />}
      login={
        <LoginScreen
          subtitle="Sign in to the Grupo manufacturer portal."
          idField={{ label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'Enter your email', icon: ICONS.mail }}
          footer="For Grupo manufacturing partners · Contact Grupo for access"
          onLogin={manufacturerLogin}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
