'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ShopProduct, ShopOrder } from '../lib/types';
import { getProducts, getOrders } from '../lib/api';
import Login from './components/Login';
import Overview from './components/Overview';
import Products from './components/Products';
import Orders from './components/Orders';

type Step = 'login' | 'dashboard';
type View = 'overview' | 'products' | 'orders';

const VIEW_TABS: Array<{ id: View; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Key metrics & recent activity' },
  { id: 'products', label: 'Products', description: 'Manage product catalogue' },
  { id: 'orders', label: 'Orders', description: 'View and manage orders' },
];

export default function ShopAdminPage() {
  const [step, setStep] = useState<Step>('login');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState<View>('overview');

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  /* ── Auth check on mount ───────────────────────────────────────────── */
  useEffect(() => {
    const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('shopAdminAuth') : null;
    if (storedAuth === 'true') {
      setStep('dashboard');
    } else {
      setStep('login');
    }
    setIsCheckingAuth(false);
  }, []);

  /* ── Load data when on dashboard ───────────────────────────────────── */
  useEffect(() => {
    if (step === 'dashboard' && !isCheckingAuth) {
      void loadAllData();
    }
  }, [step, isCheckingAuth]);

  const loadAllData = async () => {
    setIsLoadingData(true);
    setErrorMessage('');
    try {
      const [productsRes, ordersRes] = await Promise.all([
        getProducts({ limit: 100 }),
        getOrders({ limit: 100 }),
      ]);
      setProducts(productsRes.products);
      setOrders(ordersRes.orders);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load shop admin data:', err);
      setErrorMessage('Unable to fetch data. Make sure the shop backend is running.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoginSuccess = () => {
    setStep('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('shopAdminAuth');
    setStep('login');
    setActiveView('overview');
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ── Loading state while checking auth ─────────────────────────────── */
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-[#22a2f2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v6h-6" />
          </svg>
          <p className="text-sm font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  /* ── Login screen ──────────────────────────────────────────────────── */
  if (step === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  /* ── Dashboard ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#22a2f2]/20 bg-[#22a2f2]/10">
              <Image src="/groupo-logo.png" alt="Grupo" width={28} height={28} className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Shop Admin Console</p>
              <p className="text-xs text-slate-500">Manage products &amp; orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:flex">
              Admin
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      <nav className="sticky top-[73px] z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 sm:px-6">
          {VIEW_TABS.map((tab) => {
            const isActive = tab.id === activeView;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`relative flex flex-col gap-1 px-4 py-3 text-left transition ${
                  isActive ? 'text-[#147ac2]' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-[#22a2f2]" />
                )}
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="text-xs text-slate-400">{tab.description}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={() => void loadAllData()}
            disabled={isLoadingData}
            className="my-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${isLoadingData ? 'animate-spin text-[#22a2f2]' : 'text-slate-400'}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
              <path d="M21 3v6h-6" />
            </svg>
            Refresh
          </button>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {errorMessage}
          </div>
        )}

        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <svg className="h-8 w-8 animate-spin text-[#22a2f2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
                <path d="M21 3v6h-6" />
              </svg>
              <p className="text-sm font-medium text-slate-600">Loading data...</p>
            </div>
          </div>
        )}

        {!isLoadingData && lastUpdated && (
          <p className="mb-6 text-xs text-slate-400">
            Last updated {formatDate(lastUpdated)} &middot; {formatTime(lastUpdated)}
          </p>
        )}

        {!isLoadingData && activeView === 'overview' && (
          <Overview products={products} orders={orders} />
        )}

        {!isLoadingData && activeView === 'products' && (
          <Products products={products} onReload={loadAllData} />
        )}

        {!isLoadingData && activeView === 'orders' && (
          <Orders orders={orders} onReload={loadAllData} />
        )}
      </main>
    </div>
  );
}
