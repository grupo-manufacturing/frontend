'use client';

import Image from 'next/image';

const ProductCategories = () => {
  const categories = [
    {
      title: 'T-Shirts & Tops',
      description: 'Premium cotton, custom prints, 500+ units',
      price: 'From $6/unit',
      image: '/hero1.jpeg',
    },
    {
      title: 'Denim & Jeans',
      description: 'Stretch denim, custom washes, 1000+ units',
      price: 'From $18/unit',
      image: '/hero2.jpeg',
    },
    {
      title: 'Hoodies',
      description: 'Premium fleece, custom designs, 500+ units',
      price: 'From $25/unit',
      image: '/hero3.jpg',
    },
    {
      title: 'Cargos & Sweatshirts',
      description: 'Comfortable fit, multiple colors, 1000+ units',
      price: 'From $22/unit',
      image: '/hero1.jpeg',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg 
              className="w-4 h-4 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
              />
            </svg>
            <span className="text-sm text-blue-600 font-semibold">Product Categories</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          Manufacture Anything
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
          From t-shirts to technical activewear, we connect you with specialized manufacturers
        </p>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Background Image */}
              <div className="relative aspect-[3/2]">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className="object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 text-white">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-200">
                    {category.description}
                  </p>
                </div>

                {/* Hover Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;

