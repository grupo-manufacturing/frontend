'use client';

import { adminLogin, adminSession } from './api';
import LoginScreen from './LoginScreen';
import PortalShell, { useSessionToken, type NavItem } from './PortalShell';
import { ICONS } from './ui';

export const useAdminToken = useSessionToken;

const NAV: NavItem[] = [
  { href: '/admin/rfqs', label: 'RFQs' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/manufacturers', label: 'Manufacturers' },
  { href: '/admin/analytics', label: 'Analytics' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      session={adminSession}
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
