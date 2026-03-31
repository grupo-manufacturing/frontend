'use client';

import Link from 'next/link';

const WholesaleShop = () => {
  const features = [
    {
      title: 'Ready-Made Products',
      description: 'Browse pre-manufactured items ready to ship immediately.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m0 0l8-4m0 0l8 4m0 0v10l-8 4m0 0l-8-4m0 0v-10" />
        </svg>
      ),
    },
    {
      title: 'Instant Checkout',
      description: 'Add items to cart and complete purchase in minutes.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 5h12M10 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      ),
    },
    {
      title: 'Fast Shipping',
      description: 'Get your orders shipped within days, not weeks.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Bulk Pricing',
      description: 'Competitive wholesale rates on all bulk orders.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 5h12M10 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            <span className="text-sm text-blue-600 font-semibold">Direct Shopping</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          Not a Custom Order? <span className="text-[#22a2f2]">Shop Wholesale Directly</span>
        </h2>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
          Skip the RFQ process. Browse bulk-ready products, choose quantities, and checkout instantly. No manufacturing cycle, just direct inventory.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-[#22a2f2] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-12 border border-blue-200 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Ready to Shop?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our wholesale inventory, compare products, and place orders with just a few clicks.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-[#22a2f2] hover:bg-[#1c8fd7] text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Visit Wholesale Shop
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WholesaleShop;
