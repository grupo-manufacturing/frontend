'use client';

import Image from 'next/image';

const Testimonials = () => {
  // Array of testimonial images from the testimonials folder
  const testimonialImages = [
    '/testimonials/testi1.jpg',
    '/testimonials/testi2.jpg',
    '/testimonials/testi3.jpg',
    '/testimonials/testi4.jpg',
    '/testimonials/testi5.jpg',
    '/testimonials/testi6.jpg',
    '/testimonials/testi7.jpg',
    '/testimonials/testi8.jpg',
    '/testimonials/testi9.jpg',
    '/testimonials/testi10.jpg',
    '/testimonials/testi11.jpg',
    '/testimonials/testi12.jpg',
  ];
  
  // Create 16 placeholder slots for images (4x4 grid)
  const gridItems = Array.from({ length: 16 }, (_, i) => i);
  
  // Center positions in a 4x4 grid (positions 5, 6, 9, 10 in 0-indexed)
  const centerPositions = [5, 6, 9, 10];
  const isCenter = (index: number) => centerPositions.includes(index);
  
  // Map grid index to testimonial image index, skipping center positions
  // Grid positions: 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
  // Center positions (5,6,9,10) are skipped
  // Image positions: 0,1,2,3,4,null,null,7,8,null,null,11,12,13,14,15
  const getImageIndex = (gridIndex: number): number | null => {
    if (isCenter(gridIndex)) return null;
    
    // Count how many center positions come before this index
    let skipped = 0;
    for (let i = 0; i < gridIndex; i++) {
      if (isCenter(i)) skipped++;
    }
    
    return gridIndex - skipped;
  };

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm text-blue-600 font-semibold">Follow Us</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          Follow Our Journey
        </h2>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
          See our latest updates and success stories on Instagram
        </p>

        {/* 4x4 Grid Container */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {gridItems.map((index) => {
              if (isCenter(index)) {
                // Show Instagram icon only in the first center position (position 5)
                if (index === 5) {
                  return (
                    <a
                      key={index}
                      href="https://www.instagram.com/thegrupoapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 row-span-2 aspect-square bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center group hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        {/* Instagram Icon */}
                        <svg
                          className="w-12 h-12 sm:w-16 sm:h-16 text-white group-hover:scale-110 transition-transform duration-300"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        {/* Instagram Handle */}
                        <span className="text-white font-semibold text-sm sm:text-base">@thegrupoapp</span>
                      </div>
                    </a>
                  );
                }
                // Hide the other 3 center positions (they're covered by the 2x2 Instagram icon)
                return null;
              }
              
              // Regular image
              const imageIndex = getImageIndex(index);
              if (imageIndex === null || imageIndex >= testimonialImages.length) {
                return null;
              }
              
              return (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden group hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-xl"
                >
                  <Image
                    src={testimonialImages[imageIndex]}
                    alt={`Testimonial ${imageIndex + 1}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

