'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { wakeOmsBackend } from '../request-for-quotation/api';
import type { Session } from './session';
import Toaster from './Toaster';
import { Icon, ICONS } from './ui';

export type NavItem = { href: string; label: string };

const TokenContext = createContext<string | null>(null);

/** The signed-in session's token, for pages rendered inside a PortalShell. */
export function useSessionToken(): string {
  const token = useContext(TokenContext);
  if (!token) throw new Error('useSessionToken must be used inside PortalShell');
  return token;
}

/** Shows the login screen until the session has a token, then the header, navigation and page. */
export default function PortalShell({
  session,
  badge,
  nav,
  login,
  headerExtra,
  children,
}: {
  session: Session;
  badge: string;
  nav: NavItem[];
  login: React.ReactNode;
  /** Rendered next to the logout button, inside the session. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const token = useSyncExternalStore(session.subscribe, session.getToken, () => undefined);
  const pathname = usePathname();

  useEffect(() => {
    wakeOmsBackend();
  }, []);

  return (
    <>
      {token === undefined ? (
        <div className="min-h-screen bg-zinc-50" />
      ) : token ? (
        <TokenContext.Provider value={token}>
          <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
            <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur">
              <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-2.5" aria-label="Grupo home">
                    <Image src="/logo.jpg" alt="Grupo" width={32} height={32} priority className="h-8 w-8 rounded-lg" />
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">{badge}</span>
                  </Link>
                  <nav className="flex items-center gap-1" aria-label={`${badge} sections`}>
                    {nav.map((item) => {
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  {headerExtra}
                  <button
                    type="button"
                    onClick={session.logout}
                    aria-label="Log out"
                    title="Log out"
                    className="grid h-9 w-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Icon d={ICONS.logout} className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
            </header>

            {children}
          </div>
        </TokenContext.Provider>
      ) : (
        login
      )}
      <Toaster />
    </>
  );
}
