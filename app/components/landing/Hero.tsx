'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const Hero = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:items-stretch">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 mb-8">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg 
                  className="w-3 h-3 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                Trusted by 1000+ Brands Worldwide
              </span>
            </div>

            {/* Content Section - Aligned with Image */}
            <div className="space-y-8">
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                One-Stop <span className="text-[#22a2f2]">Manufacturing Partner For Clothing Brand</span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                AI-powered manufacturing OS that matches your designs to the right factory and delivers production with speed and reliability.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/manufacturer-portal" className="bg-[#22a2f2] hover:bg-transparent text-white hover:text-[#22a2f2] font-semibold px-8 py-3 rounded-lg border-2 border-[#22a2f2] transition-all duration-200 text-center">
                  Join as Manufacturer
                </Link>
                
                <Link href="/buyer-portal" className="bg-[#22a2f2] hover:bg-transparent text-white hover:text-[#22a2f2] font-semibold px-8 py-3 rounded-lg border-2 border-[#22a2f2] transition-all duration-200 text-center">
                  Join as Buyer
                </Link>
              </div>
            </div>
          </div>

          {/* Right Content - Image Grid */}
          <div className="relative lg:pt-[4.5rem] flex flex-col h-full">
            <div className="flex-1 min-h-0">
              {/* Large Image */}
              <div 
                className="relative rounded-2xl overflow-hidden shadow-xl group h-full cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="absolute inset-0">
                  {/* Manufacturing Image */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <Image
                      src="/hero1.jpeg"
                      alt="Live Manufacturing"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Buying Image */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <Image
                      src="/hero2.jpeg"
                      alt="Live Buying"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white p-8 transition-all duration-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        {isHovered ? (
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        )}
                      </div>
                      <div className="inline-block bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full text-sm font-semibold mb-2">
                        {isHovered ? 'Live Buying' : 'Live Manufacturing'}
                      </div>
                      <p className="text-sm font-medium">
                        {isHovered ? '10000+ Buyers Worldwide' : '50+ Factories Worldwide'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements for Visual Interest */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

