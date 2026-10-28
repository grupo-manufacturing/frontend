'use client';

import { useEffect, useState } from 'react';
import LoginScreen from '../admin/LoginScreen';
import PortalShell, { useSessionToken, type NavItem } from '../admin/PortalShell';
import { ICONS } from '../admin/ui';
import { expireManufacturerSession, fetchMe, ManufacturerAuthError, manufacturerLogin, manufacturerSession } from './api';

export const useManufacturerToken = useSessionToken;

const NAV: NavItem[] = [{ href: '/manufacturer/orders', label: 'Orders' }];

/** Shows who is signed in; also checks the session is still valid (e.g. the account was made inactive). */
function AccountName() {
  const token = useSessionToken();
  const [companyName, setCompanyName] = useState<string | null>(null);

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
  }, [token]);

  if (!companyName) return null;
  return <span className="hidden max-w-[260px] truncate text-sm font-medium text-zinc-700 sm:block">{companyName}</span>;
}

export default function ManufacturerShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      session={manufacturerSession}
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
