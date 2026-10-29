'use client';

import { adminLogin, adminSession } from './api';
import LoginScreen from './LoginScreen';
import { ORDER_STATUS_STYLES } from './orders/orderStatus';
import PortalShell, { useSessionToken, type NavItem } from './PortalShell';
import type { RealtimeEvent } from './realtime';
import { ICONS } from './ui';

export const useAdminToken = useSessionToken;

const NAV: NavItem[] = [
  { href: '/admin/rfqs', label: 'RFQs' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/manufacturers', label: 'Manufacturers' },
  { href: '/admin/analytics', label: 'Analytics' },
];

function liveToast(event: RealtimeEvent): string | null {
  switch (event.type) {
    case 'rfq.created':
      return `New RFQ ${event.rfqNumber} from ${event.brandName}`;
    case 'order.status_changed':
      return event.actor.role === 'manufacturer'
        ? `${event.orderNumber} marked ${ORDER_STATUS_STYLES[event.status].label} by ${event.actor.name}`
        : null;
    case 'manufacturer.profile_updated':
      return `${event.companyName} updated their profile`;
    default:
      return null;
  }
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      session={adminSession}
      role="admin"
      liveToast={liveToast}
      badge="Admin"
      nav={NAV}
      login={
        <LoginScreen
          subtitle="Sign in to the Grupo admin portal."
          idField={{ label: 'Username', type: 'text', autoComplete: 'username', placeholder: 'Enter your username', icon: ICONS.user }}
          footer="Restricted area · Authorised Grupo staff only"
          onLogin={adminLogin}
        />
      }
    >
      {children}
    </PortalShell>
  );
}
