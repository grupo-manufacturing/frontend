'use client';

import { useEffect, useState } from 'react';

const LiveManufacturing = () => {
  const [visibleChips, setVisibleChips] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // All destination chips
  const allDestinations = [
    // Top-left corner
    { name: 'Vancouver', x: 8, y: 12 },
    // Top area
    { name: 'London', x: 48, y: 10 },
    { name: 'Moscow', x: 60, y: 8 },
    // Top-right corner
    { name: 'Tokyo', x: 90, y: 15 },
    // Left edge - top
    { name: 'New York', x: 12, y: 30 },
    // Left edge - middle
    { name: 'Mexico City', x: 10, y: 50 },
    // Left edge - bottom
    { name: 'Lima', x: 15, y: 70 },
    // Bottom-left corner
    { name: 'São Paulo', x: 25, y: 85 },
    // Bottom area
    { name: 'Johannesburg', x: 55, y: 82 },
    // Bottom-right corner
    { name: 'Sydney', x: 88, y: 80 },
    // Right edge - top
    { name: 'Seoul', x: 85, y: 28 },
    // Right edge - middle
    { name: 'Manila', x: 82, y: 52 },
    // Right edge - bottom
    { name: 'Jakarta', x: 75, y: 68 },
    // Center-left
    { name: 'Dubai', x: 58, y: 35 },
    // Center
    { name: 'Cairo', x: 55, y: 45 },
    // Center-right
    { name: 'Singapore', x: 68, y: 58 },
    // Middle-top
    { name: 'Berlin', x: 52, y: 20 },
    // Middle-bottom
    { name: 'Bangkok', x: 65, y: 48 },
    // Scattered positions
    { name: 'Karachi', x: 62, y: 32 },
    { name: 'Delhi', x: 65, y: 38 },
  ];

  // Filter destinations for mobile (show only 10 on mobile)
  const destinations = isMobile ? allDestinations.slice(0, 10) : allDestinations;

  // Animate chips appearing one after another
  useEffect(() => {
    // Reset visible chips when destinations change (mobile/desktop switch)
    setVisibleChips(0);
    
    const interval = setInterval(() => {
      setVisibleChips(prev => {
        if (prev >= destinations.length) {
          // Reset after all chips are shown
          return 0;
        }
        return prev + 1;
      });
    }, 400); // Show one chip every 400ms

    return () => clearInterval(interval);
  }, [isMobile]);


  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Live Badge */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-white font-medium text-xs sm:text-sm">Live Global Network</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white text-center mb-8 sm:mb-12 lg:mb-16 px-4">
          Manufacturing Happening Right Now
        </h2>

        <div className="max-w-5xl mx-auto">
          {/* World Map Visualization - Full Width */}
          <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
            {/* World Map SVG */}
            <div className="relative aspect-video flex items-center justify-center">
              <svg viewBox="0 0 800 400" className="w-full h-full opacity-20">
                {/* Background map (optional) */}
                <path
                  d="M100,150 Q150,100 200,120 T300,150 L350,180 Q400,200 450,180 T550,170 L600,160 Q650,150 700,170"
                  stroke="#60A5FA"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Destination Chips */}
              {destinations.map((dest, index) => {
                const isVisible = index < visibleChips;

                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                    style={{
                      left: `${dest.x}%`,
                      top: `${dest.y}%`,
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible 
                        ? 'translate(-50%, -50%) scale(1)' 
                        : 'translate(-50%, -50%) scale(0)',
                    }}
                  >
                    <div className="bg-white rounded-full px-3 py-1.5 sm:px-6 sm:py-3 shadow-lg border-2 border-[#22a2f2]">
                      <span className="text-xs sm:text-base font-semibold text-gray-800 whitespace-nowrap">
                        {dest.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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

