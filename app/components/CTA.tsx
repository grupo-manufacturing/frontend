'use client';

import Image from 'next/image';

const CTA = () => {
  const stats = [
    {
      value: '10K+',
      label: 'Products Made',
    },
    {
      value: '50+',
      label: 'Countries',
    },
    {
      value: '95%',
      label: 'Success Rate',
    },
  ];

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero1.jpeg"
          alt="Manufacturing Background"
          fill
          className="object-cover"
          priority
        />
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm text-white font-semibold">Start Manufacturing Today</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-6 leading-tight">
          Ready to Transform Your Manufacturing?
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-blue-100 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
          Join thousands of businesses using Groupo to manufacture globally. Get instant quotes, connect with verified manufacturers, and scale your production.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <button className="group bg-white hover:bg-blue-50 text-blue-600 font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2">
            Get Started Now
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          
          <button className="bg-transparent hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg border-2 border-white/50 hover:border-white transition-all duration-200 backdrop-blur-sm">
            Join as Manufacturer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-blue-200 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
    </section>
  );
};

export default CTA;

