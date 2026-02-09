import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { SHOP_PRODUCTS } from './data';

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Grupo Store</h1>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {SHOP_PRODUCTS.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs font-medium text-[#22a2f2] uppercase tracking-wide">
                  {product.category}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mt-1 mb-3 group-hover:text-[#22a2f2] transition-colors leading-snug">
                  {product.name}
                </h3>

                {product.inStock && (
                  <Link
                    href={`/shop/${product.id}`}
                    className="block w-full text-center px-3 py-2 sm:py-2.5 bg-[#22a2f2] text-white rounded-lg hover:bg-[#1b8bd0] transition-colors font-medium text-xs sm:text-sm"
                  >
                    View Product
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
