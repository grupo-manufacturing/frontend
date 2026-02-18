'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { ShopProduct, ColorVariation } from '../lib/types';
import { getProductById, getProducts } from '../lib/api';
import ImageGallery from '../components/ImageGallery';
import QuantityInput from '../components/QuantityInput';
import SizeGuide from '../components/SizeGuide';


export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id ?? '';

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError('');
    getProductById(productId)
      .then(setProduct)
      .catch(() => {
        setProduct(null);
        setError('Product not found');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="grid grid-cols-2 gap-3 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product || error) {
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

const COLOR_HEX: Record<string, string> = {
  White: '#FFFFFF', Black: '#000000', Navy: '#001F3F', Gray: '#808080',
  Red: '#E53E3E', Blue: '#3B82F6', Green: '#38A169', Yellow: '#ECC94B',
  Orange: '#ED8936', Pink: '#ED64A6', Purple: '#9F7AEA', Brown: '#8B4513',
  Beige: '#F5F5DC', Maroon: '#800000', Teal: '#319795', Olive: '#808000',
  Cream: '#FFFDD0', Charcoal: '#36454F', 'Sky Blue': '#87CEEB', Burgundy: '#800020',
};

function ProductDetails({ product }: { product: ShopProduct }) {
  const [quantity, setQuantity] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([]);
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  // Per-color-per-size quantities: { "White": { "S": 10, "M": 20 }, ... }
  const [variations, setVariations] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(
      product.colors.map((c) => [c, Object.fromEntries(product.sizes.map((s) => [s, 0]))])
    )
  );

  const colorSubtotals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const color of product.colors) {
      out[color] = Object.values(variations[color] ?? {}).reduce((a, b) => a + b, 0);
    }
    return out;
  }, [variations, product.colors]);

  const totalAllocated = useMemo(
    () => Object.values(colorSubtotals).reduce((a, b) => a + b, 0),
    [colorSubtotals]
  );

  const updateSizeQty = useCallback((color: string, size: string, val: number) => {
    setVariations((prev) => ({
      ...prev,
      [color]: { ...prev[color], [size]: val },
    }));
  }, []);

  useEffect(() => {
    getProducts({ category: product.category, limit: 4 })
      .then((res) => setRelatedProducts(res.products.filter((p) => p.id !== product.id).slice(0, 3)))
      .catch(() => setRelatedProducts([]));
  }, [product.category, product.id]);

  const activeTier = useMemo(() => {
    if (quantity < 10) return null;
    if (quantity >= 500) return product.bulkPricing[3];
    if (quantity >= 200) return product.bulkPricing[2];
    if (quantity >= 50) return product.bulkPricing[1];
    return product.bulkPricing[0];
  }, [quantity, product.bulkPricing]);

  const isDiamond = activeTier?.isRFQ === true;
  const isQuantityValid = quantity >= 10;
  const allAllocated = totalAllocated === quantity;
  const canProceed = isQuantityValid && allAllocated && !isDiamond;

  const handleProceed = () => {
    const payload: ColorVariation[] = product.colors
      .filter((c) => colorSubtotals[c] > 0)
      .map((color) => ({
        color,
        sizes: product.sizes
          .filter((s) => (variations[color]?.[s] ?? 0) > 0)
          .map((size) => ({ size, qty: variations[color][size] })),
      }));

    sessionStorage.setItem(`checkout_${product.id}`, JSON.stringify({ variations: payload }));
  };

  const handleColorClick = (color: string) => {
    setExpandedColor((prev) => (prev === color ? null : color));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
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
          <ImageGallery images={product.images} productName={product.name} inStock={product.inStock} />

          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[#22a2f2] uppercase tracking-wide">{product.category}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
            <p className="text-gray-600 mt-3 leading-relaxed">{product.description}</p>

            {product.manufacturingTime > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-[#22a2f2] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-sm text-gray-700">
                  Manufacturing Time: <span className="font-semibold text-gray-900">{product.manufacturingTime} days</span>
                </span>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {/* ── Bulk Pricing Tiers ── */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Bulk Pricing</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.bulkPricing.map((tier) => {
                    const isActive = activeTier?.label === tier.label;
                    const isRFQ = tier.isRFQ === true;
                    return (
                      <div
                        key={tier.label}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isActive
                            ? isRFQ ? 'border-amber-400 bg-amber-50 shadow-sm scale-[1.02]' : 'border-[#22a2f2] bg-blue-50 shadow-sm scale-[1.02]'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={`font-semibold ${isActive ? (isRFQ ? 'text-amber-600' : 'text-[#22a2f2]') : 'text-gray-900'}`}>
                              {tier.label}
                            </span>
                            {isRFQ && <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">RFQ</span>}
                          </span>
                          {isRFQ
                            ? <span className="text-xs font-medium text-amber-600">Custom Quote</span>
                            : <span className="text-sm font-semibold text-gray-900">&#8377;{tier.unitPrice}/unit</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{tier.range}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Quantity Input ── */}
              <QuantityInput value={quantity} onChange={setQuantity} />

              {/* ── Variation Accordion (Color → Sizes) ── */}
              {isQuantityValid && product.colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <label className="block text-sm font-semibold text-gray-700">Select Variations</label>
                      <SizeGuide category={product.category} sizes={product.sizes} />
                    </div>
                    <span className={`text-xs font-medium ${allAllocated ? 'text-green-600' : 'text-gray-400'}`}>
                      {totalAllocated}/{quantity} allocated
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${allAllocated ? 'bg-green-500' : 'bg-[#22a2f2]'}`}
                      style={{ width: `${Math.min((totalAllocated / quantity) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {product.colors.map((color) => {
                      const sub = colorSubtotals[color];
                      const isOpen = expandedColor === color;
                      const hex = COLOR_HEX[color] ?? '#ccc';
                      const isDark = ['Black', 'Navy', 'Maroon', 'Charcoal', 'Burgundy', 'Brown'].includes(color);

                      return (
                        <div key={color} className={`border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-[#22a2f2] shadow-sm' : 'border-gray-200'}`}>
                          {/* Color header row */}
                          <button
                            type="button"
                            onClick={() => handleColorClick(color)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex-shrink-0 border ${isDark ? 'border-gray-400' : 'border-gray-200'}`}
                              style={{ backgroundColor: hex }}
                            />
                            <span className="flex-1 text-sm font-medium text-gray-800">{color}</span>
                            {sub > 0 && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                {sub} units
                              </span>
                            )}
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>

                          {/* Expanded: size inputs */}
                          {isOpen && (
                            <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3">
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                How many of each size for {color}?
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {product.sizes.map((size) => {
                                  const val = variations[color]?.[size] ?? 0;
                                  const display = val === 0 ? '' : String(val);
                                  return (
                                    <div key={size} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
                                      <span className="text-xs font-medium text-gray-600 w-10">{size}</span>
                                      <input
                                        type="number"
                                        min={0}
                                        value={display}
                                        placeholder="0"
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          if (raw === '') { updateSizeQty(color, size, 0); return; }
                                          const n = parseInt(raw, 10);
                                          if (!isNaN(n) && n >= 0) updateSizeQty(color, size, n);
                                        }}
                                        className="w-full text-sm font-bold text-gray-900 text-center py-1 border-0 bg-transparent outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {sub > 0 && (
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                  {color} subtotal: <span className="font-semibold text-gray-700">{sub} units</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalAllocated > 0 && !allAllocated && (
                    <p className="text-xs text-amber-600 mt-2">
                      {quantity - totalAllocated} more unit{quantity - totalAllocated !== 1 ? 's' : ''} to allocate
                    </p>
                  )}
                </div>
              )}

              {/* ── Diamond Tier Info ── */}
              {isDiamond && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    Diamond Tier &mdash; Custom Pricing
                  </div>
                  <p className="text-xs text-amber-600">
                    Orders of {quantity} units qualify for our Diamond tier with custom bulk pricing.
                    Request a quotation to get the best rate for your order.
                  </p>
                </div>
              )}

              {/* ── CTA Button ── */}
              {!product.inStock ? (
                <button disabled className="block w-full text-center px-4 py-3.5 bg-gray-200 text-gray-500 rounded-xl font-semibold text-base cursor-not-allowed">
                  Currently Out of Stock
                </button>
              ) : isDiamond ? (
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center justify-center gap-2 w-full text-center px-4 py-3.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-semibold text-base shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Request for Quotation
                </a>
              ) : !canProceed ? (
                <button disabled className="block w-full text-center px-4 py-3.5 bg-gray-200 text-gray-500 rounded-xl font-semibold text-base cursor-not-allowed">
                  {!isQuantityValid ? 'Enter min. 10 units to proceed' : 'Allocate all units to proceed'}
                </button>
              ) : (
                <Link
                  href={`/shop/${product.id}/checkout?quantity=${quantity}&tier=${encodeURIComponent(activeTier?.label ?? 'Standard')}`}
                  onClick={handleProceed}
                  className="block w-full text-center px-4 py-3.5 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-colors font-semibold text-base shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── More Like This ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">More Like This</h2>
              <Link href="/shop" className="text-sm text-[#22a2f2] hover:text-[#1b8bd0]">View all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/shop/${item.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  <div className="relative aspect-square bg-gray-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-[#22a2f2] uppercase tracking-wide">{item.category}</p>
                    <h3 className="text-base font-semibold text-gray-900 mt-1 group-hover:text-[#22a2f2] transition-colors">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">From &#8377;{item.bulkPricing[0]?.unitPrice}/unit</p>
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
