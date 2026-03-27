'use client';

const GlobalExports = () => {
  const destinations = [
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'United States', flag: '🇺🇸' },
    { name: 'Dubai', flag: '🇦🇪' },
    { name: 'UAE', flag: '🇦🇪' },
    { name: 'Europe', flag: '🇪🇺' },
    { name: 'Middle East', flag: '🌏' }
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background accent elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-20 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-full opacity-20 blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-full px-4 py-2.5 shadow-lg hover:shadow-xl transition-shadow">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1 13-1 3m4-3 1 3m-6-3h8m-8 0a9 9 0 119 0m-9 0H3" />
            </svg>
            <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Global Export Capability</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-5 leading-tight">
          <span className="text-gray-900">Built for Global Buyers.</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Trusted Across Borders.</span>
        </h2>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-gray-700 text-center max-w-4xl mx-auto mb-12 leading-relaxed">
          Grupo now supports export-ready manufacturing and dispatch to international markets, including the UK, US, and Dubai, with a process designed for reliability and confidence.
        </p>

        {/* Destinations */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl mx-auto">
          {destinations.map((destination) => (
            <span
              key={destination.name}
              className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm border border-indigo-200 px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md hover:shadow-lg hover:bg-white transition-all duration-300"
            >
              {destination.flag} {destination.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GlobalExports;
