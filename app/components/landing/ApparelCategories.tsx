'use client';

import { useState } from 'react';

const ApparelCategories = () => {
  const categories = [
    {
      title: 'T-shirt',
      description: 'Everyday essentials in solids, graphics, and oversized fits.',
      imagePath: '/Categories/t-shirt.jpg',
    },
    {
      title: 'Acid Wash T-shirts',
      description: 'Vintage-inspired acid wash styles for modern streetwear drops.',
      imagePath: '/Categories/acid-wash-t-shirt.jpg',
    },
    {
      title: 'Polos',
      description: 'Smart-casual polos for uniforms, retail, and premium collections.',
      imagePath: '/Categories/polos.webp',
    },
    {
      title: 'Jerseys',
      description: 'Athletic and lifestyle jersey products with team-ready looks.',
      imagePath: '/Categories/jerseys.webp',
    },
    {
      title: 'Hoodies',
      description: 'Core hoodie silhouettes from lightweight to heavyweight fleece.',
      imagePath: '/Categories/hoodies.jpg',
    },
    {
      title: 'Acid Wash Hoodies',
      description: 'Statement hoodies with washed textures and oversized profiles.',
      imagePath: '/Categories/acid-wash-hoodie.webp',
    },
    {
      title: "Jogger's",
      description: 'Comfort-led joggers for activewear, loungewear, and streetwear.',
      imagePath: '/Categories/joggers.webp',
    },
    {
      title: 'Jeans',
      description: 'Denim fits across classic, tapered, and relaxed styles.',
      imagePath: '/Categories/jeans.jpg',
    },
    {
      title: 'Bowling Shirts',
      description: 'Retro bowling silhouettes with resort and casual styling.',
      imagePath: '/Categories/bowling-shirts.webp',
    },
    {
      title: 'Plain Shirts',
      description: 'Minimal plain shirts suitable for formal and smart-casual wear.',
      imagePath: '/Categories/plain-shirts.jpg',
    },
    {
      title: 'Shorts',
      description: 'Seasonal and all-weather shorts across utility and athletic cuts.',
      imagePath: '/Categories/shorts.jpg',
    },
    {
      title: 'Denim Jackets',
      description: 'Layering staples in classic and fashion-forward denim treatments.',
      imagePath: '/Categories/denim-jackets.webp',
    },
    {
      title: 'Leather Jackets',
      description: 'Premium leather outerwear with timeless and edgy styling.',
      imagePath: '/Categories/leather-jackets.webp',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = categories.length;

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-blue-100 shadow-sm p-6 sm:p-8 lg:p-10 bg-white">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm text-blue-600 font-semibold">Product Categories</span>
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
            Categories We Serve
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-8">
            Built for modern apparel teams across core and specialty product lines.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <span className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
              13 Categories
            </span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              Bulk Ready
            </span>
            <span className="text-xs sm:text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5">
              Streetwear to Premium
            </span>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {categories.map((category, index) => (
                  <div key={category.title} className="w-full shrink-0 p-4 sm:p-6">
                    <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
                      <div className="w-full h-64 sm:h-72 rounded-2xl bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center px-4 text-center">
                        {category.imagePath ? (
                          <img
                            src={category.imagePath}
                            alt={category.title}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <>
                            <span className="text-sm font-semibold text-gray-600">Image Placeholder</span>
                            <span className="text-xs text-gray-500 mt-2">
                              Set `imagePath` in this category object
                            </span>
                          </>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-2">
                          Category {index + 1} of {totalSlides}
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                          {category.title}
                        </h3>
                        <p className="text-base text-gray-600 leading-relaxed">{category.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={goToPrev}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                aria-label="Previous category"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {categories.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to category ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      activeIndex === index ? 'w-8 bg-blue-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goToNext}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                aria-label="Next category"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApparelCategories;
