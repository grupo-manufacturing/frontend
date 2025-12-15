'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Link from 'next/link';

type TabType = 'buyers' | 'manufacturers';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('buyers');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const buyerSteps = [
    {
      number: 1,
      title: 'Create Your Account & Profile',
      description: 'Sign up as a buyer and complete your profile with business details, preferences, and requirements.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      details: [
        'Quick registration with phone number',
        'Complete your business profile',
        'Set your manufacturing preferences',
        'Verify your account',
      ],
    },
    {
      number: 2,
      title: 'Submit Your Requirements',
      description: 'Use our quote calculator or custom form to specify product needs, quantities, materials, and delivery requirements.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      details: [
        'Fill out product specifications',
        'Upload design files',
        'Set quantity and timeline requirements',
        'Get instant price estimates',
      ],
    },
    {
      number: 3,
      title: 'Get Matched with Manufacturers',
      description: 'Our AI analyzes your requirements and matches you with verified manufacturers that best fit your needs.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      details: [
        'AI analyzes 100+ data points',
        'Receive top 3-5 manufacturer matches',
        'Compare profiles, ratings, and portfolios',
        'View past work and reviews',
      ],
    },
    {
      number: 4,
      title: 'Review Quotes & Negotiate',
      description: 'Review detailed quotes from matched manufacturers, compare pricing, and negotiate terms through our secure chat.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      details: [
        'Receive detailed quotes within hours',
        'Compare pricing and capabilities',
        'Real-time chat with manufacturers',
        'Share files and specifications securely',
      ],
    },
    {
      number: 5,
      title: 'Approve QC & Place Order',
      description: 'Review and approve mandatory QC videos before production. Place your order with secure payment processing.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      details: [
        'Review mandatory QC videos',
        'Approve quality before production',
        'Secure payment processing',
        'Order confirmation and tracking',
      ],
    },
    {
      number: 6,
      title: 'Track Production & Receive',
      description: 'Monitor your order progress in real-time, receive production updates, and track delivery until you receive your products.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      details: [
        'Real-time production tracking',
        'Receive progress updates',
        'Quality checks at every stage',
        'Track delivery and receive products',
      ],
    },
  ];

  const manufacturerSteps = [
    {
      number: 1,
      title: 'Register & Complete Profile',
      description: 'Sign up as a manufacturer and create a comprehensive profile showcasing your capabilities, facilities, and expertise.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      details: [
        'Register with business details',
        'Upload facility photos and certifications',
        'List your manufacturing capabilities',
        'Set up payment and shipping preferences',
      ],
    },
    {
      number: 2,
      title: 'Get Verified & Approved',
      description: 'Complete our verification process to become a trusted manufacturer on the platform.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      details: [
        'Submit business documents',
        'Facility verification',
        'Quality standards review',
        'Get verified badge',
      ],
    },
    {
      number: 3,
      title: 'Receive Buyer Matches',
      description: 'Our AI matches you with qualified buyers based on their requirements and your capabilities.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      details: [
        'Get matched with relevant buyers',
        'Review buyer requirements',
        'See order specifications',
        'Access buyer profiles and history',
      ],
    },
    {
      number: 4,
      title: 'Submit Quotes & Communicate',
      description: 'Review buyer requirements, prepare detailed quotes, and communicate directly through our secure chat platform.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      details: [
        'Prepare detailed quotes',
        'Set pricing and timelines',
        'Chat with buyers in real-time',
        'Answer questions and negotiate',
      ],
    },
    {
      number: 5,
      title: 'Receive Order & Create QC Video',
      description: 'Once buyer approves, receive the order and create a mandatory QC video showing your production setup and quality standards.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      details: [
        'Receive order confirmation',
        'Create mandatory QC video',
        'Show production setup and materials',
        'Get buyer approval to proceed',
      ],
    },
    {
      number: 6,
      title: 'Produce & Deliver',
      description: 'Manufacture the products according to specifications, provide production updates, and deliver quality products on time.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      details: [
        'Start production process',
        'Send progress updates to buyer',
        'Quality checks during production',
        'Package and ship completed order',
      ],
    },
  ];

  const currentSteps = activeTab === 'buyers' ? buyerSteps : manufacturerSteps;

  useEffect(() => {
    const observers = currentSteps.map((_, index) => {
      const ref = stepRefs.current[index];
      if (!ref) return null;

      // Use more lenient settings for mobile
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCompletedSteps((prev) => {
                if (!prev.includes(index)) {
                  return [...prev, index].sort((a, b) => a - b);
                }
                return prev;
              });
            }
          });
        },
        {
          threshold: isMobile ? 0.3 : 0.5,
          rootMargin: isMobile ? '-50px 0px -50px 0px' : '-100px 0px -100px 0px',
        }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => {
        if (observer) observer.disconnect();
      });
    };
  }, [activeTab, currentSteps.length]);

  // Reset completed steps when tab changes
  useEffect(() => {
    setCompletedSteps([]);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section with Tabs */}
      <section className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs sm:text-sm text-blue-600 font-semibold">How We Work</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              Step-by-Step Guide to{' '}
              <span className="text-[#22a2f2]">Using Our Platform</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              Learn how to use our AI-powered manufacturing platform based on your role
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8 sm:mb-12 px-4">
            <div className="w-full sm:w-auto inline-flex bg-gray-100 rounded-lg p-1 border-2 border-gray-200">
              <button
                onClick={() => setActiveTab('buyers')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-md font-semibold text-sm sm:text-base transition-all duration-200 ${
                  activeTab === 'buyers'
                    ? 'bg-[#22a2f2] text-white shadow-lg'
                    : 'text-gray-700 hover:text-[#22a2f2]'
                }`}
              >
                For Buyers
              </button>
              <button
                onClick={() => setActiveTab('manufacturers')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-md font-semibold text-sm sm:text-base transition-all duration-200 ${
                  activeTab === 'manufacturers'
                    ? 'bg-[#22a2f2] text-white shadow-lg'
                    : 'text-gray-700 hover:text-[#22a2f2]'
                }`}
              >
                For Manufacturers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section with Milestone Animation */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Vertical Timeline Line - Desktop */}
            <div className="hidden lg:block absolute left-8 top-0 bottom-0 w-1 bg-gray-200">
              <div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#22a2f2] to-blue-600 transition-all duration-1000 ease-out"
                style={{
                  height: completedSteps.length > 0 
                    ? `${(completedSteps.length / currentSteps.length) * 100}%` 
                    : '0%',
                }}
              />
            </div>

            {/* Mobile Timeline Line */}
            <div className="lg:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200">
              <div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#22a2f2] to-blue-600 transition-all duration-1000 ease-out"
                style={{
                  height: completedSteps.length > 0 
                    ? `${(completedSteps.length / currentSteps.length) * 100}%` 
                    : '0%',
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-8 sm:space-y-12 lg:space-y-16">
              {currentSteps.map((step, index) => {
                const isCompleted = completedSteps.includes(index);
                const isActive = completedSteps.length === index;

                return (
                  <div
                    key={index}
                    ref={(el) => { stepRefs.current[index] = el; }}
                    className="relative"
                  >
                    <div className="flex gap-4 sm:gap-6 lg:gap-8 items-start">
                      {/* Desktop Milestone Circle */}
                      <div className="hidden lg:flex flex-shrink-0 relative z-10">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-[#22a2f2] to-blue-600 scale-110 shadow-lg'
                              : isActive
                              ? 'bg-[#22a2f2] scale-105 shadow-md'
                              : 'bg-gray-200 scale-100'
                          }`}
                        >
                          {isCompleted ? (
                            <svg
                              className="w-8 h-8 text-white"
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
                          ) : (
                            <span className="text-2xl font-bold text-gray-600">
                              {step.number}
                            </span>
                          )}
                        </div>
                        {/* Pulse animation for active step */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-[#22a2f2] animate-ping opacity-75" />
                        )}
                      </div>

                      {/* Mobile Milestone Circle */}
                      <div className="lg:hidden flex-shrink-0 relative z-10">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-[#22a2f2] to-blue-600 shadow-md'
                              : isActive
                              ? 'bg-[#22a2f2] shadow-sm'
                              : 'bg-gray-200'
                          }`}
                        >
                          {isCompleted ? (
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
                          ) : (
                            <span className="text-base sm:text-lg font-bold text-gray-600">
                              {step.number}
                            </span>
                          )}
                        </div>
                        {/* Pulse animation for active step on mobile */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-[#22a2f2] animate-ping opacity-75" />
                        )}
                      </div>

                      {/* Step Content */}
                      <div
                        className={`flex-1 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border-2 transition-all duration-500 ${
                          isCompleted
                            ? 'border-[#22a2f2] shadow-lg'
                            : isActive
                            ? 'border-blue-300 shadow-md'
                            : 'border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4">
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                              isCompleted
                                ? 'bg-gradient-to-br from-[#22a2f2] to-blue-600 text-white'
                                : 'bg-blue-50 text-[#22a2f2]'
                            }`}
                          >
                            <div className="w-6 h-6 sm:w-8 sm:h-8">
                              {step.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                              {step.title}
                            </h2>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                          {step.details.map((detail, detailIndex) => (
                            <li
                              key={detailIndex}
                              className="flex items-start gap-2 sm:gap-3"
                            >
                              <svg
                                className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                                  isCompleted
                                    ? 'text-green-500'
                                    : 'text-gray-400'
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span
                                className={`text-sm sm:text-base transition-colors duration-300 ${
                                  isCompleted
                                    ? 'text-gray-700'
                                    : 'text-gray-600'
                                }`}
                              >
                                {detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#22a2f2] to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 px-2">
            Join thousands of {activeTab === 'buyers' ? 'buyers' : 'manufacturers'} already using our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {activeTab === 'buyers' ? (
              <Link
                href="/buyer-portal"
                className="bg-white hover:bg-gray-100 text-[#22a2f2] font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-center shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Start as Buyer
              </Link>
            ) : (
              <Link
                href="/manufacturer-portal"
                className="bg-white hover:bg-gray-100 text-[#22a2f2] font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-center shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Join as Manufacturer
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
