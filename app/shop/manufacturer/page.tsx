'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ShopProduct, ShopOrder } from '../lib/types';
import {
  getManufacturerProducts,
  getManufacturerOrders,
  manufacturerLogin,
} from '../lib/api';
import Overview from '../admin/components/Overview';
import Products from '../admin/components/Products';
import Orders from '../admin/components/Orders';

type Step = 'login' | 'dashboard';
type View = 'overview' | 'products' | 'orders';

type ManufacturerSession = {
  id: string;
  name: string;
};

const VIEW_TABS: Array<{ id: View; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Your store metrics' },
  { id: 'products', label: 'My Products', description: 'Manage your products' },
  { id: 'orders', label: 'My Orders', description: 'Manage your orders' },
];

export default function ManufacturerDashboardPage() {
  const [step, setStep] = useState<Step>('login');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState<View>('overview');
  const [session, setSession] = useState<ManufacturerSession | null>(null);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('shopManufacturerSession') : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ManufacturerSession;
        if (parsed.id && parsed.name) {
          setSession(parsed);
          setStep('dashboard');
        } else {
          setStep('login');
        }
      } catch {
        setStep('login');
      }
    } else {
      setStep('login');
    }
    setIsCheckingAuth(false);
  }, []);

  const loadAllData = async (manufacturerId = session?.id) => {
    if (!manufacturerId) return;
    setIsLoadingData(true);
    setErrorMessage('');
    try {
      const [productsRes, ordersRes] = await Promise.all([
        getManufacturerProducts(manufacturerId, { limit: 100 }),
        getManufacturerOrders(manufacturerId, { limit: 100 }),
      ]);
      setProducts(productsRes.products);
      setOrders(ordersRes.orders);
    } catch (err) {
      console.error('Failed to load manufacturer dashboard data:', err);
      setErrorMessage('Unable to fetch data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (step === 'dashboard' && session?.id) {
      void loadAllData(session.id);
    }
  }, [step, session?.id]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const phone = String(form.get('phone') || '').trim();
    const password = String(form.get('password') || '').trim();
    if (!phone || !password) return;

    setErrorMessage('');
    setIsLoadingData(true);
    try {
      const manufacturer = await manufacturerLogin({ phone, password });
      const nextSession = { id: manufacturer.id, name: manufacturer.name };
      localStorage.setItem('shopManufacturerSession', JSON.stringify(nextSession));
      setSession(nextSession);
      setStep('dashboard');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shopManufacturerSession');
    setSession(null);
    setStep('login');
    setActiveView('overview');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="font-body text-sm text-foreground/50">Loading...</div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="border border-brand/10 bg-surface p-4">
              <Image src="/groupo-logo.svg" alt="Grupo" width={56} height={56} className="h-14 w-14" unoptimized />
            </div>
            <div className="text-center space-y-2">
              <p className="font-brand text-2xl font-bold text-[#1C8FD7]">Grupo</p>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Manufacturer Dashboard</h1>
              <p className="font-body text-sm text-foreground/50">Sign in to manage your products and orders.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-surface border border-brand/10 p-6 space-y-4">
            <div className="space-y-2">
              <label className="font-nav text-[10px] uppercase tracking-[0.14em] text-foreground/70">Phone Number</label>
              <input
                type="text"
                name="phone"
                className="font-body w-full border border-brand/10 px-3 py-2 text-foreground focus:border-[#1C8FD7] focus:outline-none focus:ring-1 focus:ring-[#1C8FD7]/20"
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <label className="font-nav text-[10px] uppercase tracking-[0.14em] text-foreground/70">Password</label>
              <input
                type="password"
                name="password"
                className="font-body w-full border border-brand/10 px-3 py-2 text-foreground focus:border-[#1C8FD7] focus:outline-none focus:ring-1 focus:ring-[#1C8FD7]/20"
                placeholder="Password"
              />
            </div>

            {errorMessage && (
              <div className="border border-rose-200 bg-rose-50 px-3 py-2 font-body text-sm text-rose-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingData}
              className="font-nav w-full bg-[#1C8FD7] px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition hover:bg-[#1678B5] hover:text-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingData ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-brand/10 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-brand/20 bg-brand/10">
              <Image src="/groupo-logo.svg" alt="Grupo" width={28} height={28} className="h-7 w-7" unoptimized />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">{session?.name}</p>
              <p className="font-nav text-[10px] uppercase tracking-[0.14em] text-foreground/50">Manufacturer Console</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="font-nav border border-brand/15 bg-surface px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground/60 transition hover:border-[#1C8FD7] hover:text-[#1C8FD7]"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="sticky top-[73px] z-40 border-b border-brand/10 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 sm:px-6">
          {VIEW_TABS.map((tab) => {
            const isActive = tab.id === activeView;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`relative flex flex-col gap-1 px-4 py-3 text-left transition ${
                  isActive ? 'text-[#1678B5]' : 'text-foreground/50 hover:text-foreground/70'
                }`}
              >
                {isActive && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#1C8FD7]" />}
                <span className="font-nav text-[11px] uppercase tracking-[0.14em] font-semibold">{tab.label}</span>
                <span className="font-body text-xs text-foreground/40">{tab.description}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={() => void loadAllData()}
            disabled={isLoadingData}
            className="my-2 font-nav inline-flex items-center gap-2 border border-brand/15 bg-surface px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground/60 transition hover:border-[#1C8FD7] hover:text-[#1C8FD7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {errorMessage}
          </div>
        )}

        {isLoadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-slate-500">Loading data...</div>
          </div>
        ) : (
          <>
            {activeView === 'overview' && <Overview products={products} orders={orders} />}
            {activeView === 'products' && session?.id && (
              <Products products={products} onReload={() => void loadAllData()} manufacturerId={session.id} />
            )}
            {activeView === 'orders' && session?.id && (
              <Orders orders={orders} onReload={() => void loadAllData()} manufacturerId={session.id} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
