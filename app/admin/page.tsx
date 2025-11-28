'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import apiService from '../lib/apiService';

type AdminStep = 'login' | 'dashboard';
type AdminView = 'overview' | 'users' | 'designs' | 'orders';
type UserType = 'buyers' | 'manufacturers';
type OrderStatusFilter = 'all' | 'accepted' | 'rejected' | 'submitted';

interface Manufacturer {
  id: number;
  phone_number: string;
  unit_name?: string;
  business_name?: string;
  business_type?: string;
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
  created_at: string;
}

interface Order {
  id: string;
  requirement: {
    requirement_text: string;
    quantity?: number;
    product_type?: string;
    buyer: {
      full_name?: string;
      phone_number: string;
    };
  };
  manufacturer: {
    unit_name?: string;
    phone_number: string;
    location?: string;
  };
  quoted_price: number;
  price_per_unit: number;
  delivery_time: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Design {
  id: string;
  product_name: string;
  image_url?: string;
  product_category?: string;
  description?: string;
  price_1_50?: number;
  price_51_100?: number;
  price_101_200?: number;
  min_quantity?: number;
  tags?: string[];
  manufacturer_profiles?: {
    unit_name?: string;
    phone_number?: string;
  };
  created_at: string;
  updated_at?: string;
}

const VIEW_TABS: Array<{ id: AdminView; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Key metrics across buyers and manufacturers' },
  { id: 'users', label: 'Users', description: 'Manage buyers and manufacturers' },
  { id: 'designs', label: 'Designs', description: 'View and manage all product designs' },
  { id: 'orders', label: 'Orders', description: 'View and filter all orders by status' }
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<AdminStep>('login');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [userType, setUserType] = useState<UserType>('buyers');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingDesignId, setDeletingDesignId] = useState<string | null>(null);

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
        setSearchQuery('');
        void loadOrders();
        void loadDesigns();
      }
      if (activeView === 'orders') {
        void loadOrders();
      }
      if (activeView === 'designs') {
        void loadDesigns();
      }
    }
  }, [activeView, orderStatusFilter, step, isCheckingAuth]);

  useEffect(() => {
    if (activeView === 'users') {
      setSearchQuery('');
    }
  }, [activeView, userType]);

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
      if (orderStatusFilter !== 'all') {
        filters.status = orderStatusFilter;
      }
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

  const loadDesigns = async () => {
    setIsLoadingData(true);
    setErrorMessage('');
    try {
      const designsRes = await apiService.getDesigns();
      setDesigns(designsRes.data?.designs || []);
      setLastUpdated(new Date().toISOString());
    } catch (error: any) {
      console.error('Failed to load designs:', error);
      // If token is invalid, redirect to login
      if (error?.message?.includes('Invalid admin token') || error?.message?.includes('Access denied') || error?.message?.includes('expired') || error?.message?.includes('session')) {
        apiService.removeToken('admin');
        setStep('login');
        setErrorMessage('');
      } else {
        setErrorMessage('Unable to fetch designs. Please try again.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setErrorMessage('');

    try {
      const response = await apiService.adminLogin(username, password);
      const token = response.data?.token;
      if (token) {
        // Store admin token using the tokenType parameter to avoid overwriting groupo_token
        apiService.setToken(token, 'admin');
        setStep('dashboard');
        await loadData();
      }
    } catch (error: any) {
      console.error('Failed to login:', error);
      setErrorMessage(error?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    // Only remove admin token, don't clear buyer/manufacturer tokens
    apiService.removeToken('admin');
    setUsername('');
    setPassword('');
    setActiveView('overview');
    setUserType('buyers');
    setStep('login');
  };

  const handleUpdateVerificationStatus = async (manufacturerId: string, newStatus: string) => {
    setUpdatingStatusId(manufacturerId);
    setErrorMessage('');
    
    try {
      await apiService.updateManufacturerVerificationStatus(manufacturerId, newStatus);
      // Reload data to get updated status
      await loadData();
    } catch (error: any) {
      console.error('Failed to update verification status:', error);
      setErrorMessage(error?.message || 'Failed to update verification status. Please try again.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    setDeletingDesignId(designId);
    setErrorMessage('');
    
    try {
      await apiService.deleteDesign(designId);
      // Reload designs to reflect the deletion
      await loadDesigns();
    } catch (error: any) {
      console.error('Failed to delete design:', error);
      setErrorMessage(error?.message || 'Failed to delete design. Please try again.');
    } finally {
      setDeletingDesignId(null);
    }
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

  const verifiedManufacturers = useMemo(
    () => manufacturers.filter((manufacturer) => manufacturer.verified),
    [manufacturers]
  );

  const onboardingCompleteManufacturers = useMemo(
    () => manufacturers.filter((manufacturer) => manufacturer.onboarding_completed),
    [manufacturers]
  );

  // Calculate revenue metrics from accepted orders
  const acceptedOrders = useMemo(
    () => orders.filter((order) => order.status === 'accepted'),
    [orders]
  );

  const totalRevenue = useMemo(() => {
    return acceptedOrders.reduce((sum, order) => {
      return sum + (order.quoted_price || 0);
    }, 0);
  }, [acceptedOrders]);

  const averageOrderValue = useMemo(() => {
    if (acceptedOrders.length === 0) return 0;
    return totalRevenue / acceptedOrders.length;
  }, [totalRevenue, acceptedOrders.length]);

  // Calculate top buyer and top manufacturer
  const topBuyer = useMemo(() => {
    const buyerTotals = new Map<string, { name: string; phone: string; total: number; quantities: number[]; orderCount: number }>();
    
    acceptedOrders.forEach((order) => {
      const buyerId = order.requirement?.buyer?.phone_number || '';
      const buyerName = order.requirement?.buyer?.full_name || 'Unknown Buyer';
      const existing = buyerTotals.get(buyerId);
      const currentTotal = existing?.total || 0;
      const quantities = existing?.quantities || [];
      const orderCount = existing?.orderCount || 0;
      
      // Track quantity if available
      if (order.requirement?.quantity) {
        quantities.push(order.requirement.quantity);
      }
      
      buyerTotals.set(buyerId, {
        name: buyerName,
        phone: buyerId,
        total: currentTotal + (order.quoted_price || 0),
        quantities: quantities,
        orderCount: orderCount + 1
      });
    });

    let top = { name: 'N/A', phone: '', total: 0, avgProductsQuoted: 0 };
    buyerTotals.forEach((buyer) => {
      if (buyer.total > top.total) {
        // Calculate average products quoted: sum of quantities / total accepted orders
        let avgProductsQuoted = 0;
        if (buyer.quantities.length > 0 && buyer.orderCount > 0) {
          const sumQuantities = buyer.quantities.reduce((acc, qty) => acc + qty, 0);
          avgProductsQuoted = sumQuantities / buyer.orderCount;
        }
        
        top = {
          name: buyer.name,
          phone: buyer.phone,
          total: buyer.total,
          avgProductsQuoted: avgProductsQuoted
        };
      }
    });

    return top;
  }, [acceptedOrders]);

  // Calculate design metrics
  const totalDesigns = useMemo(() => designs.length, [designs]);

  const topDesignCategory = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    
    designs.forEach((design) => {
      const category = design.product_category || 'Uncategorized';
      const count = categoryCounts.get(category) || 0;
      categoryCounts.set(category, count + 1);
    });

    let topCategory = 'N/A';
    let maxCount = 0;
    
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    });

    return { category: topCategory, count: maxCount };
  }, [designs]);

  const mostValuableDesigner = useMemo(() => {
    const manufacturerCounts = new Map<string, { name: string; phone: string; count: number }>();
    
    designs.forEach((design) => {
      const manufacturerId = design.manufacturer_profiles?.phone_number || '';
      const manufacturerName = design.manufacturer_profiles?.unit_name || 'Unknown Manufacturer';
      const existing = manufacturerCounts.get(manufacturerId);
      
      manufacturerCounts.set(manufacturerId, {
        name: manufacturerName,
        phone: manufacturerId,
        count: (existing?.count || 0) + 1
      });
    });

    let top = { name: 'N/A', phone: '', count: 0 };
    manufacturerCounts.forEach((manufacturer) => {
      if (manufacturer.count > top.count) {
        top = manufacturer;
      }
    });

    return top;
  }, [designs]);

  const topManufacturer = useMemo(() => {
    const manufacturerTotals = new Map<string, { name: string; phone: string; total: number; deliveryTimes: string[]; orderCount: number }>();
    
    acceptedOrders.forEach((order) => {
      const manufacturerId = order.manufacturer?.phone_number || '';
      const manufacturerName = order.manufacturer?.unit_name || 'Unknown Manufacturer';
      const existing = manufacturerTotals.get(manufacturerId);
      const currentTotal = existing?.total || 0;
      const deliveryTimes = existing?.deliveryTimes || [];
      const orderCount = existing?.orderCount || 0;
      
      if (order.delivery_time) {
        deliveryTimes.push(order.delivery_time);
      }
      
      manufacturerTotals.set(manufacturerId, {
        name: manufacturerName,
        phone: manufacturerId,
        total: currentTotal + (order.quoted_price || 0),
        deliveryTimes: deliveryTimes,
        orderCount: orderCount + 1
      });
    });

    let top = { name: 'N/A', phone: '', total: 0, avgDeliveryTime: 'N/A' };
    manufacturerTotals.forEach((manufacturer) => {
      if (manufacturer.total > top.total) {
        // Calculate average delivery time: sum all delivery times and divide by count
        let avgDeliveryTime = 'N/A';
        if (manufacturer.deliveryTimes.length > 0) {
          // Extract numeric values from delivery time strings
          const numericValues = manufacturer.deliveryTimes.map((time) => {
            const match = time.match(/(\d+)/);
            return match ? parseFloat(match[1]) : 0;
          }).filter((num) => num > 0);
          
          if (numericValues.length > 0) {
            // Sum all numeric values
            const sum = numericValues.reduce((acc, val) => acc + val, 0);
            
            // Divide by total number of accepted orders (count of delivery times)
            const average = sum / numericValues.length;
            
            // Get the unit from the first delivery time (assuming all have same unit)
            // Match pattern like "19 days", "20 days", etc.
            const unitMatch = manufacturer.deliveryTimes[0]?.match(/\d+\s+([a-zA-Z]+)/);
            const unit = unitMatch && unitMatch[1] ? unitMatch[1].trim() : 'days';
            
            // Format with one decimal place if needed
            const roundedAverage = average % 1 === 0 ? average : average.toFixed(1);
            avgDeliveryTime = `${roundedAverage} ${unit}`;
          }
        }
        
        top = {
          name: manufacturer.name,
          phone: manufacturer.phone,
          total: manufacturer.total,
          avgDeliveryTime: avgDeliveryTime
        };
      }
    });

    return top;
  }, [acceptedOrders]);

  const isOverview = activeView === 'overview';
  const isUsersView = activeView === 'users';
  const isDesignsView = activeView === 'designs';
  const isOrdersView = activeView === 'orders';
  const isShowingBuyers = userType === 'buyers';
  const isShowingManufacturers = userType === 'manufacturers';

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter((order) =>
      (order.requirement?.buyer?.full_name || '').toLowerCase().includes(q) ||
      (order.manufacturer?.unit_name || '').toLowerCase().includes(q) ||
      (order.requirement?.requirement_text || '').toLowerCase().includes(q) ||
      (order.requirement?.buyer?.phone_number || '').includes(searchQuery) ||
      (order.manufacturer?.phone_number || '').includes(searchQuery)
    );
  }, [orders, searchQuery]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'submitted':
        return 'Pending';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

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
                Enter your username and password to access the admin portal.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-white shadow-md rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-username" className="text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !username.trim() || !password.trim()}
              className="w-full rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0] disabled:cursor-not-allowed disabled:bg-[#22a2f2]/50"
            >
              {isLoggingIn ? 'Signing In…' : 'Sign In'}
            </button>
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
              } else if (activeView === 'designs') {
                void loadDesigns();
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
          <div className="space-y-8">
            <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyers</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{buyers.length}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manufacturers</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{manufacturers.length}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Revenue</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Order Value</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  ₹{averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Buyer</p>
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {topBuyer.name}
                  </p>
                  {topBuyer.phone && (
                    <p className="text-sm text-slate-500">{topBuyer.phone}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Order Value</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        ₹{topBuyer.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Avg. Products Quoted</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {topBuyer.avgProductsQuoted > 0 
                          ? topBuyer.avgProductsQuoted % 1 === 0 
                            ? topBuyer.avgProductsQuoted 
                            : topBuyer.avgProductsQuoted.toFixed(1)
                          : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Manufacturer</p>
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {topManufacturer.name}
                  </p>
                  {topManufacturer.phone && (
                    <p className="text-sm text-slate-500">{topManufacturer.phone}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Order Value</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        ₹{topManufacturer.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Avg. Delivery Time</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {topManufacturer.avgDeliveryTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total No of Designs</p>
                <p className="flex-1 flex items-center text-2xl font-semibold text-slate-900">{totalDesigns}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Design Category</p>
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {topDesignCategory.category}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">No of Designs</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {topDesignCategory.count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Most Valuable Designer</p>
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {mostValuableDesigner.name}
                  </p>
                  {mostValuableDesigner.phone && (
                    <p className="text-sm text-slate-500">{mostValuableDesigner.phone}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">No of Designs</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {mostValuableDesigner.count}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {!isLoadingData && isOrdersView && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
                <p className="text-sm text-slate-500">
                  View and filter all orders by status (Accepted, Rejected, Pending).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Total orders:{' '}
                  <span className="font-semibold text-slate-800">{orders.length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
                  Filter by status:
                </label>
                <select
                  id="status-filter"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                >
                  <option value="all">All Orders</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="submitted">Pending</option>
                </select>
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
                  placeholder="Search orders by buyer, manufacturer, or requirement"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Requirement
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Buyer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Manufacturer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Quote
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Delivery Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                        {orders.length === 0
                          ? `No ${orderStatusFilter !== 'all' ? getStatusLabel(orderStatusFilter).toLowerCase() : ''} orders found.`
                          : 'No orders match your search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 max-w-xs">
                            {order.requirement?.requirement_text
                              ? order.requirement.requirement_text.length > 60
                                ? `${order.requirement.requirement_text.substring(0, 60)}...`
                                : order.requirement.requirement_text
                              : '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {order.requirement?.quantity && (
                              <span>Qty: {order.requirement.quantity.toLocaleString()}</span>
                            )}
                            {order.requirement?.product_type && (
                              <span className="ml-2">Type: {order.requirement.product_type}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {order.requirement?.buyer?.full_name || 'Not provided'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.requirement?.buyer?.phone_number || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {order.manufacturer?.unit_name || 'Not provided'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.manufacturer?.location || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            ₹{order.quoted_price?.toLocaleString('en-IN') || '—'}
                          </div>
                          <div className="text-xs text-slate-500">
                            ₹{order.price_per_unit?.toLocaleString('en-IN') || '—'} per unit
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {order.delivery_time || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(order.status || '')}`}>
                            {getStatusLabel(order.status || '')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(order.updated_at || order.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoadingData && isUsersView && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">User Directory</h1>
                <p className="text-sm text-slate-500">
                  View and manage all registered buyers and manufacturers.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Total records:{' '}
                  <span className="font-semibold text-slate-800">
                    {isShowingBuyers ? buyers.length : manufacturers.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setUserType('buyers')}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      isShowingBuyers
                        ? 'bg-[#22a2f2] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Buyers
                  </button>
                  <button
                    onClick={() => setUserType('manufacturers')}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      isShowingManufacturers
                        ? 'bg-[#22a2f2] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Manufacturers
                  </button>
                </div>
              </div>
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
                  placeholder={`Search ${isShowingBuyers ? 'buyers' : 'manufacturers'} by name or phone`}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      {isShowingBuyers ? 'Buyer' : 'Manufacturer'}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Contact
                    </th>
                    {isShowingManufacturers && (
                      <>
                        <th scope="col" className="px-4 py-3 text-left font-semibold">
                          Onboarding
                        </th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold">
                          Verification
                        </th>
                      </>
                    )}
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {isShowingBuyers &&
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
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(buyer.created_at)}</td>
                      </tr>
                    ))}
                  {isShowingManufacturers &&
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
                        </td>
                        <td className="px-4 py-3">
                          {renderBadge(
                            manufacturer.onboarding_completed ? 'Completed' : 'Pending',
                            manufacturer.onboarding_completed ? 'info' : 'neutral'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={manufacturer.verification_status || 'pending'}
                              onChange={(e) => handleUpdateVerificationStatus(String(manufacturer.id), e.target.value)}
                              disabled={updatingStatusId === String(manufacturer.id)}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="pending">Pending</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                            {updatingStatusId === String(manufacturer.id) && (
                              <svg
                                className="h-4 w-4 animate-spin text-[#22a2f2]"
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
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(manufacturer.created_at)}
                        </td>
                      </tr>
                    ))}
                  {(isShowingBuyers && filteredBuyers.length === 0) ||
                  (isShowingManufacturers && filteredManufacturers.length === 0) ? (
                    <tr>
                      <td colSpan={isShowingBuyers ? 3 : 5} className="px-4 py-6 text-center text-sm text-slate-500">
                        No records found for your current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoadingData && isDesignsView && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Designs Directory</h1>
                <p className="text-sm text-slate-500">
                  View and manage all product designs in the platform.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Total designs:{' '}
                  <span className="font-semibold text-slate-800">{designs.length}</span>
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
                  placeholder="Search designs by name, category, or manufacturer"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Design
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Manufacturer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Pricing
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Created
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {designs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No designs found.
                      </td>
                    </tr>
                  ) : (
                    designs
                      .filter((design) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          (design.product_name || '').toLowerCase().includes(q) ||
                          (design.product_category || '').toLowerCase().includes(q) ||
                          (design.manufacturer_profiles?.unit_name || '').toLowerCase().includes(q) ||
                          (design.description || '').toLowerCase().includes(q)
                        );
                      })
                      .map((design) => (
                        <tr key={design.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {design.image_url && (
                                <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                  <img
                                    src={design.image_url}
                                    alt={design.product_name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-slate-900">
                                  {design.product_name || 'Unnamed Design'}
                                </div>
                                {design.description && (
                                  <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                                    {design.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {design.product_category ? (
                              renderBadge(design.product_category, 'info')
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium text-slate-700">
                              {design.manufacturer_profiles?.unit_name || '—'}
                            </div>
                            {design.manufacturer_profiles?.phone_number && (
                              <div className="text-xs text-slate-500">
                                {design.manufacturer_profiles.phone_number}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              {design.price_1_50 && (
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 w-fit">
                                  1-50: ₹{design.price_1_50.toLocaleString('en-IN')}
                                </span>
                              )}
                              {design.price_51_100 && (
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 w-fit">
                                  51-100: ₹{design.price_51_100.toLocaleString('en-IN')}
                                </span>
                              )}
                              {design.price_101_200 && (
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-600 w-fit">
                                  101-200: ₹{design.price_101_200.toLocaleString('en-IN')}
                                </span>
                              )}
                              {!design.price_1_50 && !design.price_51_100 && !design.price_101_200 && (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(design.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteDesign(design.id)}
                              disabled={deletingDesignId === design.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Delete design"
                            >
                              {deletingDesignId === design.id ? (
                                <>
                                  <svg
                                    className="h-3 w-3 animate-spin"
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
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    <path d="M10 11v6M14 11v6" />
                                  </svg>
                                  Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

