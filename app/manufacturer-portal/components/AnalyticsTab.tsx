'use client';

import { useState, useEffect } from 'react';
import apiService from '../../lib/apiService';

type AnalyticsTabType = 'revenue-trends' | 'order-distribution';

export default function AnalyticsTab() {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTabType>('revenue-trends');
  
  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    potentialRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    acceptedCount: 0,
    pendingCount: 0,
    negotiatingCount: 0,
    rejectedCount: 0,
    totalRequirementsCount: 0
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [revenueTrendsData, setRevenueTrendsData] = useState<Array<{month: string, count: number, revenue: number}>>([]);
  
  // Orders states
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Fetch Analytics Data
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    
    try {
      // Fetch all requirements
      const requirementsResponse = await apiService.getRequirements();
      
      if (!requirementsResponse.success || !requirementsResponse.data) {
        setAnalyticsData({
          totalRevenue: 0,
          potentialRevenue: 0,
          avgOrderValue: 0,
          conversionRate: 0,
          acceptedCount: 0,
          pendingCount: 0,
          negotiatingCount: 0,
          rejectedCount: 0,
          totalRequirementsCount: 0
        });
        return;
      }

      const allRequirements = requirementsResponse.data;
      const totalRequirementsCount = allRequirements.length;

      // Fetch manufacturer's responses
      const myResponsesResult = await apiService.getMyRequirementResponses();
      const myResponses = myResponsesResult.success ? myResponsesResult.data : [];

      // Create a map of requirement_id to response
      const responseMap = new Map();
      myResponses.forEach((resp: any) => {
        responseMap.set(resp.requirement_id, resp);
      });

      // Calculate metrics
      let totalRevenue = 0;
      let potentialRevenue = 0;
      let acceptedCount = 0;
      let pendingCount = 0;
      let negotiatingCount = 0;
      let rejectedCount = 0;

      // Monthly revenue trends data
      const monthlyData: {[key: string]: {count: number, revenue: number, label: string}} = {};

      // Process each requirement
      allRequirements.forEach((req: any) => {
        const response = responseMap.get(req.id);
        if (response) {
          // Requirement has a response from manufacturer
          const status = (response.status || response.response_status || '').toLowerCase().trim();
          const quotedPrice = parseFloat(response.quoted_price) || 0;

          if (status === 'accepted') {
            totalRevenue += quotedPrice;
            acceptedCount++;
            
            // Group by month for revenue trends
            const responseDate = new Date(response.created_at || response.updated_at || Date.now());
            const monthKey = `${responseDate.getFullYear()}-${String(responseDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = responseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { count: 0, revenue: 0, label: monthLabel };
            }
            monthlyData[monthKey].count++;
            monthlyData[monthKey].revenue += quotedPrice;
          } else if (status === 'negotiating') {
            potentialRevenue += quotedPrice;
            negotiatingCount++;
          } else if (status === 'rejected') {
            rejectedCount++;
          }
        } else {
          // No response yet - this is a "New" requirement (Pending)
          pendingCount++;
        }
      });

      // Convert monthly data to array and sort by month
      const trendsArray = Object.entries(monthlyData)
        .map(([key, data]) => ({
          month: data.label,
          count: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => {
          // Sort by date
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });
      
      setRevenueTrendsData(trendsArray);

      // Calculate average order value
      const avgOrderValue = acceptedCount > 0 ? totalRevenue / acceptedCount : 0;

      // Calculate conversion rate
      const conversionRate = totalRequirementsCount > 0 
        ? (acceptedCount / totalRequirementsCount) * 100 
        : 0;

      setAnalyticsData({
        totalRevenue,
        potentialRevenue,
        avgOrderValue,
        conversionRate,
        acceptedCount,
        pendingCount,
        negotiatingCount,
        rejectedCount,
        totalRequirementsCount
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalyticsData({
        totalRevenue: 0,
        potentialRevenue: 0,
        avgOrderValue: 0,
        conversionRate: 0,
        acceptedCount: 0,
        pendingCount: 0,
        negotiatingCount: 0,
        rejectedCount: 0,
        totalRequirementsCount: 0
      });
      setRevenueTrendsData([]);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await apiService.getManufacturerOrders({});
      if (response.success && response.data) {
        setOrders(response.data || []);
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch analytics and orders on mount
  useEffect(() => {
    fetchAnalytics();
    fetchOrders();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm6 0V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m6 0a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
            </svg>
            <span>Analytics overview</span>
          </div>
          <h1 className="text-3xl font-bold text-black">Performance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor revenue, conversion, and order health at a glance.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#22a2f2]/10 border border-[#22a2f2]/20 text-[#22a2f2] rounded-xl text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
          </svg>
          Live metrics update as orders progress
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        {/* Total Revenue Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                {isLoadingAnalytics ? '...' : analyticsData.acceptedCount > 0 ? 'Active' : '—'}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-black mb-1">
                {isLoadingAnalytics ? '...' : `₹${analyticsData.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </p>
            </div>
          </div>
        </div>

        {/* Potential Revenue Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                {isLoadingAnalytics ? '...' : analyticsData.pendingCount + analyticsData.negotiatingCount > 0 ? 'Pending' : '—'}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Potential Revenue</p>
              <p className="text-3xl font-bold text-black mb-1">
                {isLoadingAnalytics ? '...' : `₹${analyticsData.potentialRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </p>
            </div>
          </div>
        </div>

        {/* Avg Order Value Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                Avg
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Avg Order Value</p>
              <p className="text-3xl font-bold text-black mb-1">
                {isLoadingAnalytics ? '...' : `₹${analyticsData.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm group-hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div className="px-2 py-1 bg-[#22a2f2]/10 border border-[#22a2f2]/30 rounded-lg text-xs font-medium text-[#22a2f2]">
                Rate
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-black mb-1">
                {isLoadingAnalytics ? '...' : `${analyticsData.conversionRate.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="relative overflow-hidden animate-fade-in-up animation-delay-200">
        <div className="absolute inset-0 rounded-2xl opacity-0"></div>
        <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#22a2f2]/15 text-[#22a2f2] rounded-xl border border-[#22a2f2]/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">Order Status Overview</h3>
              <p className="text-sm text-gray-600">Distribution of your orders by status</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {(() => {
              const totalCount = analyticsData.acceptedCount + analyticsData.pendingCount + analyticsData.negotiatingCount + analyticsData.rejectedCount;
              const acceptedPercentage = totalCount > 0 ? (analyticsData.acceptedCount / totalCount) * 100 : 0;
              const pendingPercentage = totalCount > 0 ? (analyticsData.pendingCount / totalCount) * 100 : 0;
              const negotiatingPercentage = totalCount > 0 ? (analyticsData.negotiatingCount / totalCount) * 100 : 0;
              const rejectedPercentage = totalCount > 0 ? (analyticsData.rejectedCount / totalCount) * 100 : 0;

              // Calculate angles for pie chart (starting from top, going clockwise)
              const radius = 80;
              const centerX = 100;
              const centerY = 100;
              let currentAngle = -90; // Start from top (-90 degrees)

              const createArc = (percentage: number, color: string) => {
                if (percentage === 0) return null;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle = endAngle;

                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;

                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);

                const largeArcFlag = angle > 180 ? 1 : 0;

                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');

                return { pathData, color };
              };

              const arcs = [
                createArc(acceptedPercentage, '#22a2f2'),
                createArc(pendingPercentage, '#fbbf24'),
                createArc(negotiatingPercentage, '#3b82f6'),
                createArc(rejectedPercentage, '#ef4444')
              ].filter(Boolean);

              return (
                <>
                  {/* Pie Chart */}
                  <div className="flex-shrink-0">
                    {isLoadingAnalytics ? (
                      <div className="w-64 h-64 flex items-center justify-center">
                        <svg className="animate-spin w-12 h-12 text-[#22a2f2]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : totalCount === 0 ? (
                      <div className="w-64 h-64 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-32 rounded-full border-4 border-gray-200 mx-auto mb-4 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No data</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                          {arcs.map((arc: any, index: number) => (
                            <path
                              key={index}
                              d={arc.pathData}
                              fill={arc.color}
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all duration-500 hover:opacity-80"
                            />
                          ))}
                          {/* Center circle for donut effect */}
                          <circle
                            cx={centerX}
                            cy={centerY}
                            r="50"
                            fill="white"
                            className="drop-shadow-sm"
                          />
                          {/* Total count in center */}
                          <text
                            x={centerX}
                            y={centerY - 5}
                            textAnchor="middle"
                            className="text-2xl font-bold fill-gray-900"
                            transform={`rotate(90 ${centerX} ${centerY})`}
                          >
                            {totalCount}
                          </text>
                          <text
                            x={centerX}
                            y={centerY + 15}
                            textAnchor="middle"
                            className="text-xs fill-gray-600"
                            transform={`rotate(90 ${centerX} ${centerY})`}
                          >
                            Total
                          </text>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {/* Accepted Orders */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[#22a2f2]/5 border border-[#22a2f2]/20 hover:bg-[#22a2f2]/10 transition-all">
                      <div className="w-4 h-4 rounded-full bg-[#22a2f2] flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-black text-sm">Accepted</span>
                          <span className="text-sm font-semibold text-[#22a2f2] whitespace-nowrap">
                            {isLoadingAnalytics ? '...' : `${analyticsData.acceptedCount} (${acceptedPercentage.toFixed(1)}%)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-all">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-black text-sm">Pending</span>
                          <span className="text-sm font-semibold text-yellow-700 whitespace-nowrap">
                            {isLoadingAnalytics ? '...' : `${analyticsData.pendingCount} (${pendingPercentage.toFixed(1)}%)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Negotiating Orders */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all">
                      <div className="w-4 h-4 rounded-full bg-blue-600 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-black text-sm">Negotiating</span>
                          <span className="text-sm font-semibold text-blue-700 whitespace-nowrap">
                            {isLoadingAnalytics ? '...' : `${analyticsData.negotiatingCount} (${negotiatingPercentage.toFixed(1)}%)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rejected Orders */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-all">
                      <div className="w-4 h-4 rounded-full bg-red-600 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-black text-sm">Rejected</span>
                          <span className="text-sm font-semibold text-red-700 whitespace-nowrap">
                            {isLoadingAnalytics ? '...' : `${analyticsData.rejectedCount} (${rejectedPercentage.toFixed(1)}%)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="relative overflow-hidden animate-fade-in-up animation-delay-300">
        <div className="absolute inset-0 rounded-2xl opacity-0"></div>
        <div className="relative bg-white rounded-2xl border border-[#22a2f2]/30 shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-[#22a2f2]/20">
            <nav className="flex space-x-2 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveAnalyticsTab('revenue-trends')}
                className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all rounded-xl ${
                  activeAnalyticsTab === 'revenue-trends'
                    ? 'text-[#22a2f2] bg-[#22a2f2]/10'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeAnalyticsTab === 'revenue-trends' && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#22a2f2] rounded-full"></div>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Revenue Trends
              </button>
              <button
                onClick={() => setActiveAnalyticsTab('order-distribution')}
                className={`relative flex items-center gap-2 py-4 px-4 font-medium text-sm whitespace-nowrap transition-all rounded-xl ${
                  activeAnalyticsTab === 'order-distribution'
                    ? 'text-[#22a2f2] bg-[#22a2f2]/10'
                    : 'text-gray-500 hover:text-[#22a2f2]'
                }`}
              >
                {activeAnalyticsTab === 'order-distribution' && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#22a2f2] rounded-full"></div>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Order Distribution
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeAnalyticsTab === 'revenue-trends' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black mb-2">Accepted Orders vs Month</h3>
                  <p className="text-sm text-gray-600">Track your accepted orders over time</p>
                </div>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <svg className="animate-spin w-12 h-12 text-[#22a2f2] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500">Loading chart data...</p>
                    </div>
                  </div>
                ) : revenueTrendsData.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
                        <div className="relative bg-white rounded-2xl p-8 mb-4 border border-[#22a2f2]/30">
                          <svg className="w-16 h-16 text-[#22a2f2] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-600 mb-2">No revenue data yet</p>
                      <p className="text-sm text-gray-500">Accept orders to start tracking revenue</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Bar Chart */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-end justify-between gap-2 h-64">
                        {revenueTrendsData.map((data, index) => {
                          const maxCount = Math.max(...revenueTrendsData.map(d => d.count), 1);
                          const barHeight = (data.count / maxCount) * 100;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                              <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                                <div
                                  className="w-full bg-[#22a2f2] rounded-t-lg hover:bg-[#1b8bd0] transition-all duration-300 cursor-pointer group relative"
                                  style={{ height: `${barHeight}%`, minHeight: '4px' }}
                                  title={`${data.count} orders - ₹${data.revenue.toLocaleString('en-IN')}`}
                                >
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    {data.count} orders
                                    <br />
                                    ₹{data.revenue.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs font-medium text-gray-600 text-center mt-2">
                                {data.month}
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                {data.count} {data.count === 1 ? 'order' : 'orders'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#22a2f2]/5 rounded-xl p-4 border border-[#22a2f2]/20">
                        <p className="text-sm text-gray-600 mb-1">Total Months</p>
                        <p className="text-2xl font-bold text-[#22a2f2]">{revenueTrendsData.length}</p>
                      </div>
                      <div className="bg-[#22a2f2]/5 rounded-xl p-4 border border-[#22a2f2]/20">
                        <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-[#22a2f2]">{revenueTrendsData.reduce((sum, d) => sum + d.count, 0)}</p>
                      </div>
                      <div className="bg-[#22a2f2]/5 rounded-xl p-4 border border-[#22a2f2]/20">
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-[#22a2f2]">₹{revenueTrendsData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeAnalyticsTab === 'order-distribution' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black mb-2">Design Orders</h3>
                  <p className="text-sm text-gray-600">View and manage all your design orders</p>
                </div>
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <svg className="animate-spin w-12 h-12 text-[#22a2f2] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
                        <div className="relative bg-white rounded-2xl p-8 mb-4 border border-[#22a2f2]/30">
                          <svg className="w-16 h-16 text-[#22a2f2] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-600 mb-2">No orders yet</p>
                      <p className="text-sm text-gray-500">Receive orders to start tracking distribution</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order: any) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                      >
                        {/* Product Image */}
                        {order.design?.image_url && (
                          <div className="relative h-48 overflow-hidden bg-gray-100">
                            <img
                              src={order.design.image_url}
                              alt={order.design.product_name || 'Product'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 right-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Order Details */}
                        <div className="p-5">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {order.design?.product_name || 'Product'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Buyer: {order.buyer?.full_name || order.buyer?.phone_number || 'Unknown'}
                          </p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium text-gray-900">{order.quantity}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Price/Unit:</span>
                              <span className="font-medium text-gray-900">₹{order.price_per_unit}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                              <span className="text-gray-900 font-semibold">Total:</span>
                              <span className="font-bold text-[#22a2f2] text-lg">₹{order.total_price}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 mb-4">
                            {new Date(order.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                            {/* Status Change Buttons */}
                            {order.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await apiService.updateOrderStatus(order.id, 'confirmed');
                                    fetchOrders();
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to update order status');
                                  }
                                }}
                                className="w-full px-4 py-2 bg-[#22a2f2] text-white rounded-lg font-medium hover:bg-[#1b8bd0] transition-colors text-sm"
                              >
                                Confirm Order
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await apiService.updateOrderStatus(order.id, 'shipped');
                                    fetchOrders();
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to update order status');
                                  }
                                }}
                                className="w-full px-4 py-2 bg-[#22a2f2] text-white rounded-lg font-medium hover:bg-[#1b8bd0] transition-colors text-sm"
                              >
                                Mark as Shipped
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await apiService.updateOrderStatus(order.id, 'delivered');
                                    fetchOrders();
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to update order status');
                                  }
                                }}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                              >
                                Mark as Delivered
                              </button>
                            )}
                            
                            {/* Print Invoice Button - Available for all statuses */}
                            <button
                              onClick={() => {
                                // Open invoice in new tab as PDF
                                window.open(`/invoice/${order.id}`, '_blank');
                              }}
                              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

