'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import apiService from '../lib/apiService';
import type { Buyer, Manufacturer, Order, AIDesign } from './types';
import { formatDate } from './utils';
import Overview from './components/Overview';
import Users from './components/Users';
import Orders from './components/Orders';
import AIDesigns from './components/AIDesigns';
import Login from './components/Login';
import { useToast } from '../components/Toast';

type AdminStep = 'login' | 'dashboard';
type AdminView = 'overview' | 'users' | 'orders' | 'ai-designs';

const VIEW_TABS: Array<{ id: AdminView; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Key metrics across buyers and manufacturers' },
  { id: 'users', label: 'Users', description: 'Manage buyers and manufacturers' },
  { id: 'orders', label: 'Orders', description: 'View and filter all orders by status' },
  { id: 'ai-designs', label: 'AI Designs', description: 'View all AI-generated designs created by buyers' }
];

export default function AdminPortal() {
  const toast = useToast();
  const [step, setStep] = useState<AdminStep>('login');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [aiDesigns, setAiDesigns] = useState<AIDesign[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (storedToken) {
        // Verify token is valid by attempting a lightweight API call
        try {
          // Try to fetch buyers as a way to verify admin token is valid
          await apiService.getAllBuyers({ limit: 1 });
          // Token is valid, proceed to dashboard
          setStep('dashboard');
        } catch (error: any) {
          // Token is invalid or expired
          console.error('Admin token validation failed:', error);
          // Clear invalid token
          apiService.removeToken('admin');
          setStep('login');
        }
      } else {
        setStep('login');
      }
      setIsCheckingAuth(false);
    };
    
    void checkAuth();
  }, []);

  useEffect(() => {
    // Only load data if we're on dashboard and not still checking auth
    if (step === 'dashboard' && !isCheckingAuth) {
      void loadData();
    }
  }, [step, isCheckingAuth]);

  useEffect(() => {
    // Only load view-specific data if we're on dashboard and not still checking auth
    if (step === 'dashboard' && !isCheckingAuth) {
      if (activeView === 'overview') {
        void loadOrders();
        void loadAIDesigns(); // Load AI designs with responses for revenue calculation
      }
      if (activeView === 'orders') {
        void loadOrders();
        void loadAIDesigns(); // Load AI designs with responses for AI Orders tab
      }
      if (activeView === 'ai-designs') {
        void loadAIDesigns();
      }
    }
  }, [activeView, step, isCheckingAuth]);

  const loadData = async () => {
    setIsLoadingData(true);
    setErrorMessage('');
    try {
      const [buyersRes, manufacturersRes] = await Promise.all([
        apiService.getAllBuyers({ sortBy: 'created_at', sortOrder: 'desc' }),
        apiService.getAllManufacturers({ sortBy: 'created_at', sortOrder: 'desc' })
      ]);

      setBuyers(buyersRes.data?.buyers || []);
      setManufacturers(manufacturersRes.data?.manufacturers || []);
      setLastUpdated(new Date().toISOString());
    } catch (error: any) {
      console.error('Failed to load admin data:', error);
      // If token is invalid, redirect to login
      if (error?.message?.includes('Invalid admin token') || error?.message?.includes('Access denied') || error?.message?.includes('expired') || error?.message?.includes('session')) {
        apiService.removeToken('admin');
        setStep('login');
        setErrorMessage('');
      } else {
        setErrorMessage('Unable to fetch latest data. Please try again.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadOrders = async () => {
    setIsLoadingData(true);
    setErrorMessage('');
    try {
      const filters: any = { sortBy: 'created_at', sortOrder: 'desc' };
      const ordersRes = await apiService.getOrders(filters);
      setOrders(ordersRes.data || []);
      setLastUpdated(new Date().toISOString());
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      // If token is invalid, redirect to login
      if (error?.message?.includes('Invalid admin token') || error?.message?.includes('Access denied') || error?.message?.includes('expired') || error?.message?.includes('session')) {
        apiService.removeToken('admin');
        setStep('login');
        setErrorMessage('');
      } else {
        setErrorMessage('Unable to fetch orders. Please try again.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAIDesigns = async () => {
    setIsLoadingData(true);
    setErrorMessage('');
    try {
      const filters: any = { include_responses: true };
      const aiDesignsRes = await apiService.getAIDesigns(filters);
      setAiDesigns(aiDesignsRes.data || []);
      setLastUpdated(new Date().toISOString());
    } catch (error: any) {
      console.error('Failed to load AI designs:', error);
      // If token is invalid, redirect to login
      if (error?.message?.includes('Invalid admin token') || error?.message?.includes('Access denied') || error?.message?.includes('expired') || error?.message?.includes('session')) {
        apiService.removeToken('admin');
        setStep('login');
        setErrorMessage('');
      } else {
        setErrorMessage('Unable to fetch AI designs. Please try again.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };


  const handleLoginSuccess = async () => {
    setStep('dashboard');
    await loadData();
  };

  const handleLogout = () => {
    // Show logout toast
    toast.info('Logging out...');
    
    // Only remove admin token, don't clear buyer/manufacturer tokens
    apiService.removeToken('admin');
    setActiveView('overview');
    setStep('login');
    
    // Show success toast after logout
    setTimeout(() => {
      toast.success('Logged out successfully. See you soon!');
    }, 200);
  };

  const isOverview = activeView === 'overview';
  const isUsersView = activeView === 'users';
  const isOrdersView = activeView === 'orders';
  const isAIDesignsView = activeView === 'ai-designs';

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-[#22a2f2]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v6h-6" />
          </svg>
          <p className="text-sm font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} isCheckingAuth={isCheckingAuth} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#22a2f2]/20 bg-[#22a2f2]/10">
              <Image src="/groupo-logo.png" alt="Grupo" width={28} height={28} className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Groupo Admin Console</p>
              <p className="text-xs text-slate-500">Manage buyers, manufacturers, and onboarding</p>
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

      <nav className="border-b border-slate-200 bg-white">
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
            onClick={() => {
              if (activeView === 'orders') {
                void loadOrders();
              } else if (activeView === 'ai-designs') {
                void loadAIDesigns();
              } else {
                void loadData();
              }
            }}
            disabled={isLoadingData}
            className="my-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${isLoadingData ? 'animate-spin text-[#22a2f2]' : 'text-slate-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
              <path d="M21 3v6h-6" />
            </svg>
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

        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <svg
                className="h-8 w-8 animate-spin text-[#22a2f2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
                <path d="M21 3v6h-6" />
              </svg>
              <p className="text-sm font-medium text-slate-600">Loading data...</p>
            </div>
          </div>
        )}

        {!isLoadingData && lastUpdated && (
          <p className="mb-6 text-xs text-slate-400">
            Last updated {formatDate(lastUpdated)} •{' '}
            {new Date(lastUpdated).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}

        {!isLoadingData && isOverview && (
          <Overview
            buyers={buyers}
            manufacturers={manufacturers}
            orders={orders}
            aiDesigns={aiDesigns}
            isLoadingData={isLoadingData}
            lastUpdated={lastUpdated}
          />
        )}

        {!isLoadingData && isOrdersView && (
          <Orders
            orders={orders}
            aiDesigns={aiDesigns}
            isLoadingData={isLoadingData}
            lastUpdated={lastUpdated}
          />
        )}

        {!isLoadingData && isUsersView && (
          <Users
            buyers={buyers}
            manufacturers={manufacturers}
            isLoadingData={isLoadingData}
            lastUpdated={lastUpdated}
            onError={setErrorMessage}
            onReload={loadData}
          />
        )}

        {!isLoadingData && isAIDesignsView && (
          <AIDesigns
            aiDesigns={aiDesigns}
            isLoadingData={isLoadingData}
            lastUpdated={lastUpdated}
            onDelete={loadAIDesigns}
          />
        )}

      </main>
    </div>
  );
}

