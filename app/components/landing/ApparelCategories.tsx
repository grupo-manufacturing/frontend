const ApparelCategories = () => {
  const categories = [
    'T-shirt',
    'Acid Wash T-shirts',
    'Polos',
    'Jerseys',
    'Hoodies',
    'Acid Wash Hoodies',
    "Jogger's",
    'Jeans',
    'Bowling Shirts',
    'Plain Shirts',
    'Shorts',
    'Denim Jackets',
    'Leather Jackets',
  ];

  const accentClasses = [
    'border-blue-200/80',
    'border-violet-200/80',
    'border-emerald-200/80',
    'border-orange-200/80',
  ];

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
            {categories.map((category, index) => (
              <div
                key={category}
                className={`group rounded-2xl border p-4 bg-white ${accentClasses[index % accentClasses.length]} hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white text-gray-700 shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M8 10h8M8 14h5m-7 6h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold leading-snug">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApparelCategories;
