'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { ShopProduct, ColorVariation } from '../lib/types';
import { getManufacturers, getProductById, getProducts } from '../lib/api';
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
      <div className="min-h-screen bg-surface">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square bg-brand/10 animate-pulse" />
            <div className="border border-brand/10 bg-surface p-6 sm:p-8 space-y-4">
              <div className="h-4 bg-brand/10 w-1/4 animate-pulse" />
              <div className="h-8 bg-brand/10 w-3/4 animate-pulse" />
              <div className="h-4 bg-brand/10 w-full animate-pulse" />
              <div className="h-4 bg-brand/10 w-2/3 animate-pulse" />
              <div className="grid grid-cols-2 gap-3 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-brand/10 animate-pulse" />
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
      <div className="min-h-screen bg-surface">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="border border-brand/10 bg-surface p-8 text-center">
            <h1 className="font-heading text-2xl font-semibold text-foreground">Product not found</h1>
            <p className="font-body text-foreground/60 mt-2">Please return to the shop and try again.</p>
            <Link
              href="/shop"
              className="font-nav inline-block mt-4 px-5 py-2.5 bg-[#1C8FD7] text-[#0b1220] text-[10px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors sm:text-[11px]"
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
  const [manufacturerName, setManufacturerName] = useState<string>('');

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

  useEffect(() => {
    let cancelled = false;

    async function loadManufacturerName() {
      if (!product.manufacturerId) {
        setManufacturerName('');
        return;
      }

      try {
        const manufacturers = await getManufacturers();
        if (cancelled) return;
        const manufacturer = manufacturers.find((m) => m.id === product.manufacturerId);
        setManufacturerName(manufacturer?.name || '');
      } catch {
        if (!cancelled) setManufacturerName('');
      }
    }

    loadManufacturerName();

    return () => {
      cancelled = true;
    };
  }, [product.manufacturerId]);

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
    <div className="min-h-screen bg-surface">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <nav className="font-nav flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-foreground/45 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#1C8FD7] transition-colors">Home</Link>
          <svg className="w-3.5 h-3.5 text-foreground/25" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href="/shop" className="hover:text-[#1C8FD7] transition-colors">Shop</Link>
          <svg className="w-3.5 h-3.5 text-foreground/25" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-foreground font-medium truncate max-w-[200px] normal-case tracking-normal">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ImageGallery images={product.images} productName={product.name} inStock={product.inStock} />

          <div className="border border-brand/10 bg-surface p-6 sm:p-8">
            <p className="font-nav text-[10px] font-semibold text-[#1C8FD7] uppercase tracking-[0.18em]">{product.category}</p>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-[-0.01em] text-foreground mt-2">{product.name}</h1>
            <p className="font-body text-foreground/60 mt-3 leading-relaxed">{product.description}</p>

            {product.manufacturingTime > 0 && (
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 bg-brand/5 border border-brand/10 px-3 py-2">
                <div className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#1C8FD7] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="font-body text-sm text-foreground/70">
                    Manufacturing Time: <span className="font-semibold text-foreground">{product.manufacturingTime} days</span>
                  </span>
                </div>
                {product.sizeChartUrl && (
                  <>
                    <span className="text-brand/30">|</span>
                    <a
                      href={product.sizeChartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-nav text-[10px] uppercase tracking-[0.14em] text-[#1C8FD7] hover:text-[#1678B5] hover:underline"
                    >
                      View Size Chart
                    </a>
                  </>
                )}
              </div>
            )}

            {manufacturerName && (
              <div className="mt-2">
                <span className="font-body text-sm text-foreground/60">
                  Manufacturer:{' '}
                  <span className="font-semibold text-foreground">{manufacturerName}</span>
                </span>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {/* ── Bulk Pricing Tiers ── */}
              <div>
                <h2 className="font-nav text-[10px] uppercase tracking-[0.14em] text-foreground/70 mb-3">Bulk Pricing</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.bulkPricing.map((tier) => {
                    const isActive = activeTier?.label === tier.label;
                    const isRFQ = tier.isRFQ === true;
                    return (
                      <div
                        key={tier.label}
                        className={`p-4 border transition-all duration-200 ${
                          isActive
                            ? isRFQ ? 'border-amber-400 bg-amber-50' : 'border-[#1C8FD7] bg-brand/5'
                            : 'border-brand/10 bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={`font-heading font-semibold ${isActive ? (isRFQ ? 'text-amber-600' : 'text-[#1C8FD7]') : 'text-foreground'}`}>
                              {tier.label}
                            </span>
                            {isRFQ && <span className="font-nav text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 uppercase tracking-wide">RFQ</span>}
                          </span>
                          {isRFQ
                            ? <span className="font-nav text-[10px] uppercase tracking-[0.14em] text-amber-600">Custom Quote</span>
                            : <span className="font-body text-sm font-semibold text-foreground">&#8377;{tier.unitPrice}/unit</span>}
                        </div>
                        <p className="font-body text-xs text-foreground/45 mt-1">{tier.range}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Quantity Input ── */}
              <QuantityInput value={quantity} onChange={setQuantity} />

              {/* ── Variation Accordion (Color → Sizes) ── */}
              {isQuantityValid && !isDiamond && product.colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <label className="font-nav block text-[10px] uppercase tracking-[0.14em] text-foreground/70">Select Variations</label>
                      <SizeGuide category={product.category} sizes={product.sizes} />
                    </div>
                    <span className={`font-nav text-[10px] uppercase tracking-[0.14em] ${allAllocated ? 'text-green-600' : 'text-foreground/40'}`}>
                      {totalAllocated}/{quantity} allocated
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-brand/10 mb-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${allAllocated ? 'bg-green-500' : 'bg-[#1C8FD7]'}`}
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
                        <div key={color} className={`border overflow-hidden transition-colors ${isOpen ? 'border-[#1C8FD7]' : 'border-brand/10'}`}>
                          {/* Color header row */}
                          <button
                            type="button"
                            onClick={() => handleColorClick(color)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? 'bg-brand/5' : 'bg-surface hover:bg-brand/5'}`}
                          >
                            <span
                              className={`w-5 h-5 flex-shrink-0 border ${isDark ? 'border-foreground/40' : 'border-brand/15'}`}
                              style={{ backgroundColor: hex }}
                            />
                            <span className="font-body flex-1 text-sm font-medium text-foreground">{color}</span>
                            {sub > 0 && (
                              <span className="font-nav flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-green-600 bg-green-50 px-2 py-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                {sub} units
                              </span>
                            )}
                            <svg
                              className={`w-4 h-4 text-foreground/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>

                          {/* Expanded: size inputs */}
                          {isOpen && (
                            <div className="border-t border-brand/10 bg-brand/5 px-4 py-3">
                              <p className="font-nav text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.14em] mb-2">
                                How many of each size for {color}?
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {product.sizes.map((size) => {
                                  const val = variations[color]?.[size] ?? 0;
                                  const display = val === 0 ? '' : String(val);
                                  return (
                                    <div key={size} className="flex items-center gap-2 bg-surface border border-brand/10 px-3 py-2">
                                      <span className="font-nav text-[10px] uppercase tracking-[0.12em] text-foreground/60 w-10">{size}</span>
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
                                        className="font-body w-full text-sm font-bold text-foreground text-center py-1 border-0 bg-transparent outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {sub > 0 && (
                                <p className="font-body text-xs text-foreground/45 mt-2 text-right">
                                  {color} subtotal: <span className="font-semibold text-foreground/70">{sub} units</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalAllocated > 0 && !allAllocated && (
                    <p className="font-body text-xs text-amber-600 mt-2">
                      {quantity - totalAllocated} more unit{quantity - totalAllocated !== 1 ? 's' : ''} to allocate
                    </p>
                  )}
                </div>
              )}

              {/* ── Diamond Tier Info ── */}
              {isDiamond && (
                <div className="bg-amber-50 border border-amber-200 p-4 space-y-2">
                  <div className="font-nav flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-medium text-amber-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    Diamond Tier — Custom Pricing
                  </div>
                  <p className="font-body text-xs text-amber-600">
                    Orders of {quantity} units qualify for our Diamond tier with custom bulk pricing.
                    Request a quotation to get the best rate for your order.
                  </p>
                </div>
              )}

              {/* ── CTA Button ── */}
              {!product.inStock ? (
                <button disabled className="font-nav block w-full text-center px-4 py-3.5 border border-foreground/10 text-foreground/35 text-[11px] uppercase tracking-[0.14em] cursor-not-allowed">
                  Currently Out of Stock
                </button>
              ) : isDiamond ? (
                <a
                  href={`https://wa.me/917671062042?text=${encodeURIComponent(`Hello, I am interested in buying the ${product.name}'s 500+ units!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-nav flex items-center justify-center gap-2 w-full text-center px-4 py-3.5 bg-amber-500 text-[#0b1220] text-[11px] uppercase tracking-[0.14em] hover:bg-amber-600 hover:text-surface transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Request for Quotation
                </a>
              ) : !canProceed ? (
                <button disabled className="font-nav block w-full text-center px-4 py-3.5 border border-foreground/10 text-foreground/35 text-[11px] uppercase tracking-[0.14em] cursor-not-allowed">
                  {!isQuantityValid ? 'Enter min. 10 units to proceed' : 'Allocate all units to proceed'}
                </button>
              ) : (
                <Link
                  href={`/shop/${product.id}/checkout?quantity=${quantity}&tier=${encodeURIComponent(activeTier?.label ?? 'Standard')}`}
                  onClick={handleProceed}
                  className="font-nav block w-full text-center px-4 py-3.5 bg-[#1C8FD7] text-[#0b1220] text-[11px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors"
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
              <h2 className="font-heading text-xl font-semibold uppercase tracking-[-0.01em] text-foreground">More Like This</h2>
              <Link href="/shop" className="font-nav text-[10px] uppercase tracking-[0.14em] text-[#1C8FD7] hover:text-[#1678B5]">View all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/shop/${item.id}`} className="group border border-brand/10 bg-surface overflow-hidden hover:border-brand/35 transition-all duration-300">
                  <div className="relative aspect-square bg-brand/5">
                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  </div>
                  <div className="p-4 border-t border-brand/10">
                    <p className="font-nav text-[10px] font-medium text-[#1C8FD7] uppercase tracking-[0.18em]">{item.category}</p>
                    <h3 className="font-heading text-base font-semibold uppercase tracking-[-0.01em] text-foreground mt-1 group-hover:text-[#1C8FD7] transition-colors">{item.name}</h3>
                    <p className="font-body text-sm text-foreground/45 mt-1">From &#8377;{item.bulkPricing[0]?.unitPrice}/unit</p>
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
