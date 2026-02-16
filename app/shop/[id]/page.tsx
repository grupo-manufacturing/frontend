'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { SHOP_PRODUCTS } from '../data';
import ImageGallery from '../components/ImageGallery';
import ColorSwatches from '../components/ColorSwatches';
import QuantityInput from '../components/QuantityInput';
import SizeGuide from '../components/SizeGuide';
import ShareButton from '../components/ShareButton';

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

function ProductDetails({ product }: { product: (typeof SHOP_PRODUCTS)[number] }) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(10);

  // Auto-select tier based on quantity
  const activeTier = useMemo(() => {
    if (quantity >= 500) return product.bulkPricing[3];
    if (quantity >= 100) return product.bulkPricing[2];
    if (quantity >= 50) return product.bulkPricing[1];
    return product.bulkPricing[0];
  }, [quantity, product.bulkPricing]);

  const totalPrice = activeTier.unitPrice * quantity;

  const moreLikeThis = SHOP_PRODUCTS.filter(
    (item) => item.category === product.category && item.id !== product.id
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#22a2f2] transition-colors">Home</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href="/shop" className="hover:text-[#22a2f2] transition-colors">Shop</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Image Gallery with Zoom + Fullscreen ──────────────────── */}
          <ImageGallery
            images={product.images}
            productName={product.name}
            inStock={product.inStock}
          />

          {/* ── Product Details ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            {/* Category + Share */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#22a2f2] uppercase tracking-wide">
                  {product.category}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {product.name}
                </h1>
              </div>
              <ShareButton productName={product.name} productId={product.id} />
            </div>

            <p className="text-gray-600 mt-3 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-8 space-y-6">
              {/* ── Bulk Pricing Tiers ────────────────────────────────── */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Bulk Pricing</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.bulkPricing.map((tier) => {
                    const isActive = activeTier.label === tier.label;
                    return (
                      <div
                        key={tier.label}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isActive
                            ? 'border-[#22a2f2] bg-blue-50 shadow-sm scale-[1.02]'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isActive ? 'text-[#22a2f2]' : 'text-gray-900'}`}>
                            {tier.label}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            &#8377;{tier.unitPrice}/unit
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{tier.range}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Color Swatches ────────────────────────────────────── */}
              <ColorSwatches
                colors={product.colors}
                selected={selectedColor}
                onChange={setSelectedColor}
              />

              {/* ── Size Selector + Size Guide ───────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Size</label>
                  <SizeGuide category={product.category} sizes={product.sizes} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        selectedSize === size
                          ? 'border-[#22a2f2] bg-[#22a2f2]/10 text-[#22a2f2] ring-1 ring-[#22a2f2]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Quantity Input (validated) ────────────────────────── */}
              <QuantityInput value={quantity} onChange={setQuantity} />

              {/* ── Price Summary ─────────────────────────────────────── */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{quantity} units &times; &#8377;{activeTier.unitPrice}</span>
                  <span className="font-medium text-gray-900">&#8377;{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Tier</span>
                  <span className="font-medium text-[#22a2f2]">{activeTier.label}</span>
                </div>
              </div>

              {/* ── Proceed to Checkout ───────────────────────────────── */}
              {product.inStock ? (
                <Link
                  href={`/shop/${product.id}/checkout?color=${encodeURIComponent(selectedColor)}&size=${encodeURIComponent(selectedSize)}&quantity=${quantity}&tier=${encodeURIComponent(activeTier.label)}`}
                  className="block w-full text-center px-4 py-3.5 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-colors font-semibold text-base shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout &mdash; &#8377;{totalPrice.toLocaleString('en-IN')}
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full text-center px-4 py-3.5 bg-gray-200 text-gray-500 rounded-xl font-semibold text-base cursor-not-allowed"
                >
                  Currently Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── More Like This ─────────────────────────────────────────── */}
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
                <Link
                  key={item.id}
                  href={`/shop/${item.id}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-[#22a2f2] uppercase tracking-wide">
                      {item.category}
                    </p>
                    <h3 className="text-base font-semibold text-gray-900 mt-1 group-hover:text-[#22a2f2] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      From &#8377;{item.bulkPricing[0]?.unitPrice}/unit
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
