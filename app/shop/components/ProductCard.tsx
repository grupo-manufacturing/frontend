'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShopProduct } from '../data';

interface ProductCardProps {
  product: ShopProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const startingPrice = product.bulkPricing[0]?.unitPrice;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <span className="text-[10px] sm:text-xs font-medium text-[#22a2f2] uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mt-1 group-hover:text-[#22a2f2] transition-colors leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 mb-3">
          From <span className="font-semibold text-gray-900">&#8377;{startingPrice}</span>
          <span className="text-gray-400">/unit</span>
        </p>

        <div className="mt-auto">
          {product.inStock ? (
            <Link
              href={`/shop/${product.id}`}
              className="block w-full text-center px-3 py-2 sm:py-2.5 bg-[#22a2f2] text-white rounded-lg hover:bg-[#1b8bd0] transition-colors font-medium text-xs sm:text-sm"
            >
              View Product
            </Link>
          ) : (
            <button
              disabled
              className="block w-full text-center px-3 py-2 sm:py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-xs sm:text-sm cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
