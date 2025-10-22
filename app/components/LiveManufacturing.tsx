'use client';

import { useEffect, useState } from 'react';

const LiveManufacturing = () => {
  const [liveTransactions, setLiveTransactions] = useState(2);
  
  // Simulate live transaction updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTransactions(prev => (prev === 5 ? 1 : prev + 1));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const routes = [
    { from: 'Karachi', to: 'Sydney', delay: 0, color: 'blue', position: 'top-1/2 left-1/4', translateX: '-1/2', translateY: '0' },
    { from: 'Dhaka', to: 'Sydney', delay: 2, color: 'cyan', position: 'top-2/3 right-1/4', translateX: '1/4', translateY: '0' },
    { from: 'Mumbai', to: 'London', delay: 4, color: 'purple', position: 'top-1/3 left-1/3', translateX: '-1/4', translateY: '0' },
    { from: 'Shanghai', to: 'New York', delay: 6, color: 'green', position: 'bottom-1/3 right-1/3', translateX: '1/3', translateY: '0' },
    { from: 'Tokyo', to: 'Berlin', delay: 8, color: 'pink', position: 'top-1/4 right-1/2', translateX: '0', translateY: '0' },
  ];

  const stats = [
    {
      value: '10,000+',
      label: 'Products Manufactured',
      gradient: 'from-blue-500/20 to-purple-500/20',
      border: 'border-blue-500/30',
    },
    {
      value: '50+',
      label: 'Global Manufacturers',
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
    },
    {
      value: '95%',
      label: 'Success Rate',
      gradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
    },
    {
      value: '24/7',
      label: 'Support Available',
      gradient: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Live Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-white font-medium text-sm">Live Global Network</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-16">
          Manufacturing Happening Right Now
        </h2>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - World Map Visualization */}
          <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            {/* World Map SVG */}
            <div className="relative aspect-video flex items-center justify-center">
              {/* Simplified World Map */}
              <svg viewBox="0 0 800 400" className="w-full h-full opacity-20">
                <path
                  d="M100,150 Q150,100 200,120 T300,150 L350,180 Q400,200 450,180 T550,170 L600,160 Q650,150 700,170"
                  stroke="#60A5FA"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                />
                <circle cx="150" cy="200" r="4" fill="#60A5FA" />
                <circle cx="300" cy="180" r="4" fill="#60A5FA" />
                <circle cx="450" cy="220" r="4" fill="#60A5FA" />
                <circle cx="600" cy="190" r="4" fill="#60A5FA" />
              </svg>

              {/* Live Transaction Counter */}
              <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-4 min-w-[140px]">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-1">{liveTransactions}</div>
                  <div className="text-xs text-gray-600 font-medium">Live Transactions</div>
                </div>
              </div>

              {/* Route Pills */}
              {routes.map((route, index) => (
                <div 
                  key={index}
                  className={`absolute ${route.position} transform -translate-x-${route.translateX} -translate-y-${route.translateY}`}
                >
                  <div 
                    className="bg-white rounded-full px-3 py-1.5 shadow-lg"
                    style={{ 
                      animation: `fadeInOut 10s ease-in-out ${route.delay}s infinite`
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                      <div className={`w-2 h-2 bg-${route.color}-500 rounded-full animate-pulse`}></div>
                      <span className="font-medium text-gray-700">{route.from} → {route.to}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-white font-medium">Manufacturers</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white font-medium">Buyers</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-white font-medium">Active Orders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-sm rounded-2xl p-6 border ${stat.border} hover:scale-105 transition-transform duration-300 shadow-lg`}
              >
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
    </section>
  );
};

export default LiveManufacturing;

