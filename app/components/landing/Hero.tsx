'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const Hero = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[45%_55%] gap-12 lg:items-stretch">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            {/* Badge */}
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
                Built for fast-moving apparel teams
              </span>
            </div>

            {/* Content Section - Aligned with Image */}
            <div className="space-y-8">
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                From <span className="text-[#22a2f2]">Product Idea to Production</span>, in One Platform
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Grupo connects buyers and manufacturers with real-time collaboration, structured payments, and milestone tracking. We export globally.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Link href="/buyer-portal" className="bg-[#22a2f2] hover:bg-[#1c8fd7] text-white font-semibold px-8 py-3 rounded-lg border-2 border-[#22a2f2] transition-colors duration-200 text-center">
                  Start as Buyer
                </Link>
                <Link href="/manufacturer-portal" className="bg-white hover:bg-gray-50 text-[#22a2f2] font-semibold px-8 py-3 rounded-lg border-2 border-[#22a2f2] transition-colors duration-200 text-center">
                  Join as Manufacturer
                </Link>
              </div>
            </div>
          </div>

          {/* Right Content - Image Grid */}
          <div className="relative flex flex-col h-full">
            <div className="flex-1 min-h-96">
              {/* Large Image */}
              <div 
                className="relative rounded-2xl overflow-hidden shadow-xl group h-full w-full cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Manufacturing Image */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                  <Image
                    src="/hero1.png"
                    alt="Live Manufacturing"
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Buying Image */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  <Image
                    src="/hero2.png"
                    alt="Live Buying"
                    fill
                    className="object-cover"
                  />
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

