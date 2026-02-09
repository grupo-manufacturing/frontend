'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { SHOP_PRODUCTS } from '../data';

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id);
  const product = useMemo(
    () => SHOP_PRODUCTS.find((item) => item.id === productId),
    [productId]
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Product not found</h1>
            <p className="text-gray-600 mt-2">Please return to the shop and try again.</p>
            <Link
              href="/shop"
              className="inline-block mt-4 px-5 py-2.5 bg-[#22a2f2] text-white rounded-lg hover:bg-[#1b8bd0] transition-colors text-sm font-medium"
            >
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <ProductDetails product={product} />;
}

// Separated so hooks are always called (no early return before hooks)
function ProductDetails({ product }: { product: (typeof SHOP_PRODUCTS)[number] }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [quantity, setQuantity] = useState(10);

  // Auto-select tier based on quantity
  const activeTier = useMemo(() => {
    if (quantity >= 500) return product.bulkPricing[3];
    if (quantity >= 100) return product.bulkPricing[2];
    if (quantity >= 50) return product.bulkPricing[1];
    return product.bulkPricing[0];
  }, [quantity, product.bulkPricing]);

  const moreLikeThis = SHOP_PRODUCTS.filter(
    (item) => item.category === product.category && item.id !== product.id
  ).slice(0, 3);

  const images = product.images;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-xl shadow-sm overflow-hidden">
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    activeImage === index
                      ? 'ring-2 ring-[#22a2f2] shadow-md'
                      : 'ring-1 ring-gray-200 hover:ring-gray-300'
                  }`}
                >
                  <Image src={img} alt={`${product.name} view ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[#22a2f2] uppercase tracking-wide">
              {product.category}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              {product.name}
            </h1>
            <p className="text-gray-600 mt-3 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-8 space-y-6">
              {/* Bulk Pricing Tiers */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Bulk Pricing</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.bulkPricing.map((tier) => {
                    const isActive = activeTier.label === tier.label;
                    return (
                      <div
                        key={tier.label}
                        className={`p-4 rounded-lg border transition-colors ${
                          isActive
                            ? 'border-[#22a2f2] bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isActive ? 'text-[#22a2f2]' : 'text-gray-900'}`}>
                            {tier.label}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{tier.unitPrice}/unit
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{tier.range}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsColorOpen(!isColorOpen); setIsSizeOpen(false); }}
                    onBlur={() => setTimeout(() => setIsColorOpen(false), 200)}
                    className="appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                  >
                    <span className="text-black">{selectedColor}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isColorOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isColorOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="max-h-[180px] overflow-y-auto">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => { setSelectedColor(color); setIsColorOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedColor === color ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Size Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsSizeOpen(!isSizeOpen); setIsColorOpen(false); }}
                    onBlur={() => setTimeout(() => setIsSizeOpen(false), 200)}
                    className="appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between"
                  >
                    <span className="text-black">{selectedSize}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isSizeOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSizeOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="max-h-[180px] overflow-y-auto">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => { setSelectedSize(size); setIsSizeOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedSize === size ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Number of Units */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Units
                </label>
                <input
                  type="number"
                  min="10"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setQuantity(val < 1 ? 1 : val);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] transition-all"
                />
              </div>

              {/* Proceed to Checkout */}
              <Link
                href={`/shop/${product.id}/checkout?color=${encodeURIComponent(selectedColor)}&size=${encodeURIComponent(selectedSize)}&quantity=${quantity}&tier=${encodeURIComponent(activeTier.label)}`}
                className="block w-full text-center px-4 py-3.5 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-colors font-semibold text-base shadow-md hover:shadow-lg"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>

        {/* More Like This */}
        {moreLikeThis.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">More Like This</h2>
              <Link href="/shop" className="text-sm text-[#22a2f2] hover:text-[#1b8bd0]">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreLikeThis.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link href={`/shop/${item.id}`} className="block">
                    <div className="relative aspect-square bg-gray-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-medium text-[#22a2f2] uppercase tracking-wide">
                        {item.category}
                      </p>
                      <h3 className="text-base font-semibold text-gray-900 mt-1">
                        {item.name}
                      </h3>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
