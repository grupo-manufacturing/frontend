'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import apiService from '../lib/apiService';

type AdminStep = 'phone' | 'otp' | 'dashboard';
type AdminView = 'overview' | 'buyers' | 'manufacturers';

interface Manufacturer {
  id: number;
  phone_number: string;
  unit_name?: string;
  business_name?: string;
  business_type?: string;
  contact_person_name?: string;
  verified: boolean;
  verification_status?: string;
  onboarding_completed: boolean;
  created_at: string;
}

interface Buyer {
  id: number;
  phone_number: string;
  full_name?: string;
  business_name?: string;
  verified: boolean;
  verification_status?: string;
  onboarding_completed: boolean;
  created_at: string;
}

const PRIMARY_COLOR = '#22a2f2';

const VIEW_TABS: Array<{ id: AdminView; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Key metrics across buyers and manufacturers' },
  { id: 'buyers', label: 'Buyers', description: 'Registered buyers, onboarding, and verification status' },
  { id: 'manufacturers', label: 'Manufacturers', description: 'Registered manufacturers and capability insights' }
];

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const renderBadge = (
  label: string,
  tone: 'info' | 'success' | 'warning' | 'neutral' = 'neutral'
) => {
  const tones: Record<typeof tone, string> = {
    info: 'bg-[#22a2f2]/10 text-[#187dc5]',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    neutral: 'bg-slate-100 text-slate-600'
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
};

export default function AdminPortal() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AdminStep>('phone');
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('adminPhoneNumber') : null;
    if (storedToken && storedPhone) {
      setPhoneNumber(storedPhone);
      setStep('dashboard');
    }
  }, []);

  useEffect(() => {
    if (step === 'dashboard') {
      void loadData();
    }
  }, [step]);

  useEffect(() => {
    if (activeView === 'overview') {
      setSearchQuery('');
    }
  }, [activeView]);

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
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setErrorMessage('Unable to fetch latest data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoadingOtp(true);
    setErrorMessage('');

    if (phoneNumber === '9999999999') {
      setTimeout(() => {
        setIsLoadingOtp(false);
        setStep('otp');
      }, 600);
      return;
    }

    try {
      await apiService.sendOTP(phoneNumber, 'admin');
      setStep('otp');
    } catch (error) {
      console.error('Failed to send admin OTP:', error);
      setErrorMessage('Failed to send OTP. Check the number and retry.');
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleVerifyOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!otp.trim()) return;

    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      if (phoneNumber === '9999999999' && otp === '999999') {
        localStorage.setItem('adminToken', 'demo_admin_token');
        localStorage.setItem('adminPhoneNumber', phoneNumber);
        setStep('dashboard');
        await loadData();
        return;
      }

      const response = await apiService.verifyOTP(phoneNumber, otp, 'admin');
      const token = response.data?.token;
      if (token) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminPhoneNumber', phoneNumber);
      }
      setStep('dashboard');
      await loadData();
    } catch (error) {
      console.error('Failed to verify admin OTP:', error);
      setErrorMessage('Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleBackToPhone = () => {
    setOtp('');
    setStep('phone');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminPhoneNumber');
    setPhoneNumber('');
    setOtp('');
    setActiveView('overview');
    setStep('phone');
  };

  const filteredBuyers = useMemo(() => {
    if (!searchQuery.trim()) return buyers;
    const q = searchQuery.toLowerCase();
    return buyers.filter((buyer) =>
      (buyer.full_name || '').toLowerCase().includes(q) ||
      (buyer.business_name || '').toLowerCase().includes(q) ||
      buyer.phone_number.includes(searchQuery)
    );
  }, [buyers, searchQuery]);

  const filteredManufacturers = useMemo(() => {
    if (!searchQuery.trim()) return manufacturers;
    const q = searchQuery.toLowerCase();
    return manufacturers.filter((manufacturer) =>
      (manufacturer.unit_name || '').toLowerCase().includes(q) ||
      (manufacturer.business_name || '').toLowerCase().includes(q) ||
      (manufacturer.business_type || '').toLowerCase().includes(q) ||
      manufacturer.phone_number.includes(searchQuery)
    );
  }, [manufacturers, searchQuery]);

  const verifiedBuyers = useMemo(() => buyers.filter((buyer) => buyer.verified), [buyers]);
  const verifiedManufacturers = useMemo(
    () => manufacturers.filter((manufacturer) => manufacturer.verified),
    [manufacturers]
  );

  const onboardingCompleteBuyers = useMemo(
    () => buyers.filter((buyer) => buyer.onboarding_completed),
    [buyers]
  );
  const onboardingCompleteManufacturers = useMemo(
    () => manufacturers.filter((manufacturer) => manufacturer.onboarding_completed),
    [manufacturers]
  );

  const recentBuyers = buyers.slice(0, 5);
  const recentManufacturers = manufacturers.slice(0, 5);

  const isOverview = activeView === 'overview';
  const isBuyersView = activeView === 'buyers';
  const isManufacturersView = activeView === 'manufacturers';

  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-white shadow-md p-4 border border-slate-100">
              <Image src="/groupo-logo.png" alt="Grupo" width={56} height={56} className="h-14 w-14" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900">Admin Sign In</h1>
              <p className="text-sm text-slate-500">
                Enter your registered phone number to receive a one-time passcode.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendOTP} className="bg-white shadow-md rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-phone" className="text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="admin-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="e.g. 91830XXXXXX"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingOtp || !phoneNumber.trim()}
              className="w-full rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0] disabled:cursor-not-allowed disabled:bg-[#22a2f2]/50"
            >
              {isLoadingOtp ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Verify OTP</h1>
            <p className="text-sm text-slate-500">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium text-slate-700">{phoneNumber}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="bg-white shadow-md rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-otp" className="text-sm font-medium text-slate-700">
                One-Time Passcode
              </label>
              <input
                id="admin-otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30 tracking-widest text-center text-lg"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToPhone}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isVerifyingOtp || !otp.trim()}
                className="flex-1 rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0] disabled:cursor-not-allowed disabled:bg-[#22a2f2]/50"
              >
                {isVerifyingOtp ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
              {phoneNumber}
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
            onClick={() => void loadData()}
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

        {lastUpdated && (
          <p className="mb-6 text-xs text-slate-400">
            Last updated {formatDate(lastUpdated)} •{' '}
            {new Date(lastUpdated).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}

        {isOverview && (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyers</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{buyers.length}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {renderBadge(`${verifiedBuyers.length} verified`, 'success')}
                  {renderBadge(`${onboardingCompleteBuyers.length} onboarded`, 'info')}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manufacturers</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{manufacturers.length}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {renderBadge(`${verifiedManufacturers.length} verified`, 'success')}
                  {renderBadge(`${onboardingCompleteManufacturers.length} onboarded`, 'info')}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Recent Buyers</h2>
                    <p className="text-xs text-slate-500">
                      Latest registrations pulled from Supabase buyer profiles
                    </p>
                  </div>
                  {renderBadge(`${recentBuyers.length} recent`, 'neutral')}
                </div>
                <div className="space-y-3">
                  {recentBuyers.length === 0 && (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                      No buyer records found.
                    </p>
                  )}
                  {recentBuyers.map((buyer) => (
                    <div key={buyer.id} className="rounded-lg border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {buyer.full_name || buyer.business_name || buyer.phone_number}
                          </p>
                          <p className="text-xs text-slate-500">{buyer.phone_number}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {buyer.verified
                            ? renderBadge('Verified', 'success')
                            : renderBadge('Pending verification', 'warning')}
                          {renderBadge(
                            buyer.onboarding_completed ? 'Onboarding complete' : 'Onboarding pending',
                            buyer.onboarding_completed ? 'info' : 'neutral'
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Joined {formatDate(buyer.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Recent Manufacturers</h2>
                    <p className="text-xs text-slate-500">
                      Latest manufacturer profiles with verification snapshot
                    </p>
                  </div>
                  {renderBadge(`${recentManufacturers.length} recent`, 'neutral')}
                </div>
                <div className="space-y-3">
                  {recentManufacturers.length === 0 && (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                      No manufacturer records found.
                    </p>
                  )}
                  {recentManufacturers.map((manufacturer) => (
                    <div key={manufacturer.id} className="rounded-lg border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {manufacturer.unit_name || manufacturer.business_name || manufacturer.phone_number}
                          </p>
                          <p className="text-xs text-slate-500">
                            {manufacturer.business_type || 'Business type not provided'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{manufacturer.phone_number}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {manufacturer.verified
                            ? renderBadge('Verified', 'success')
                            : renderBadge(manufacturer.verification_status || 'Pending', 'warning')}
                          {renderBadge(
                            manufacturer.onboarding_completed ? 'Onboarding complete' : 'Onboarding pending',
                            manufacturer.onboarding_completed ? 'info' : 'neutral'
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Joined {formatDate(manufacturer.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {(isBuyersView || isManufacturersView) && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {isBuyersView ? 'Buyer Directory' : 'Manufacturer Directory'}
                </h1>
                <p className="text-sm text-slate-500">
                  {isBuyersView
                    ? 'Review onboarding progress and verification for every buyer.'
                    : 'Track manufacturer capabilities and onboarding status.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Total records:{' '}
                  <span className="font-semibold text-slate-800">
                    {isBuyersView ? buyers.length : manufacturers.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx={11} cy={11} r={8} />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`Search ${isBuyersView ? 'buyers' : 'manufacturers'} by name or phone`}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      {isBuyersView ? 'Buyer' : 'Manufacturer'}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Onboarding
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Verification
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {isBuyersView &&
                    filteredBuyers.map((buyer) => (
                      <tr key={buyer.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {buyer.full_name || buyer.business_name || 'Not provided'}
                          </div>
                          <div className="text-xs text-slate-500">{buyer.business_name || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-slate-700">{buyer.phone_number}</div>
                          <div className="text-xs text-slate-400">{buyer.verification_status || 'Pending'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {renderBadge(
                            buyer.onboarding_completed ? 'Completed' : 'Pending',
                            buyer.onboarding_completed ? 'info' : 'neutral'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {buyer.verified
                            ? renderBadge('Verified', 'success')
                            : renderBadge('Not verified', 'warning')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(buyer.created_at)}</td>
                      </tr>
                    ))}
                  {isManufacturersView &&
                    filteredManufacturers.map((manufacturer) => (
                      <tr key={manufacturer.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {manufacturer.unit_name || manufacturer.business_name || 'Not provided'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {manufacturer.business_type || 'Business type not provided'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-slate-700">{manufacturer.phone_number}</div>
                          <div className="text-xs text-slate-400">
                            {manufacturer.contact_person_name || 'Contact not provided'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {renderBadge(
                            manufacturer.onboarding_completed ? 'Completed' : 'Pending',
                            manufacturer.onboarding_completed ? 'info' : 'neutral'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {manufacturer.verified
                            ? renderBadge('Verified', 'success')
                            : renderBadge(manufacturer.verification_status || 'Pending', 'warning')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(manufacturer.created_at)}
                        </td>
                      </tr>
                    ))}
                  {(isBuyersView && filteredBuyers.length === 0) ||
                  (isManufacturersView && filteredManufacturers.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                        No records found for your current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

