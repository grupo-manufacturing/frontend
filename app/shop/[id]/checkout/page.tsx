'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../../components/landing/Navbar';
import { ShopProduct } from '../../lib/types';
import { getProductById, placeOrder } from '../../lib/api';

const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) => (
  <div className="group">
    <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-1.5">
      {label}{optional && <span className="text-gray-400 ml-1 font-normal normal-case tracking-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-blue-50/40 border border-blue-100 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:bg-white focus:border-[#22a2f2] focus:ring-2 focus:ring-[#22a2f2]/10";

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const productId = params?.id ?? '';

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getProductById(productId)
      .then(setProduct)
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md px-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-32 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-6">
            <svg className="w-8 h-8 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-500 mb-6">Please return to the shop and try again.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-colors font-semibold text-sm">
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return <CheckoutForm product={product} searchParams={searchParams} />;
}

function CheckoutForm({ product, searchParams }: { product: ShopProduct; searchParams: ReturnType<typeof useSearchParams> }) {
  const color = searchParams.get('color') || product.colors[0];
  const size = searchParams.get('size') || product.sizes[0];
  const quantity = Number(searchParams.get('quantity')) || 10;
  const tierLabel = searchParams.get('tier') || 'Standard';
  const tier = product.bulkPricing.find((t) => t.label === tierLabel) || product.bulkPricing[0];
  const isRFQ = tier.isRFQ === true;
  const totalCost = isRFQ ? 0 : tier.unitPrice * quantity;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await placeOrder({
        productId: product.id,
        color,
        size,
        quantity,
        tier: tierLabel,
        customer: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim() || undefined,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
      });
      setOrderNumber(result.order.orderNumber);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 p-10 sm:p-14 text-center max-w-md w-full border border-blue-50">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-full animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#22a2f2] to-[#1b8bd0] rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">You&apos;re all set!</h1>
            <p className="text-gray-500 leading-relaxed mb-2">
              Thanks, <span className="font-semibold text-gray-700">{fullName}</span>. Your order for{' '}
              <span className="font-semibold text-[#22a2f2]">{product.name}</span> is confirmed.
            </p>
            {orderNumber && (
              <p className="text-sm font-semibold text-[#22a2f2] mb-2">
                Order #{orderNumber}
              </p>
            )}
            <p className="text-sm text-gray-400 mb-10">Our team will be in touch shortly to process your order.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#22a2f2] text-white rounded-2xl hover:bg-[#1b8bd0] transition-all font-semibold shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 duration-200">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      <Navbar />

      {/* Decorative top bar */}
      <div className="h-1 bg-gradient-to-r from-[#22a2f2] via-blue-300 to-[#22a2f2]" />

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4 flex flex-col">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Review your order and complete your details below.</p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

          {/* LEFT — Form (3/5) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm shadow-blue-100 border border-blue-50/80 p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#22a2f2] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">Your Information</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Full Name">
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" className={inputCls} />
                  </Field>
                  <Field label="Email">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Phone Number">
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  </Field>
                  <Field label="Company / Brand" optional>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your brand name" className={inputCls} />
                  </Field>
                </div>

                <Field label="Shipping Address">
                  <textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House/flat no., building, street, area" rows={2} className={`${inputCls} resize-none`} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <Field label="City">
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className={inputCls} />
                  </Field>
                  <Field label="State">
                    <input type="text" required value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" className={inputCls} />
                  </Field>
                  <Field label="Pincode">
                    <input type="text" required inputMode="numeric" pattern="[0-9]{6}" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="400001" className={inputCls} />
                  </Field>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-4 pt-3 border-t border-blue-50">
                  {[['🔒', 'Secure & Encrypted'], ['⚡', 'Fast Processing'], ['📦', 'Tracked Delivery']].map(([icon, text]) => (
                    <span key={text} className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">{icon} {text}</span>
                  ))}
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#22a2f2] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[#1b8bd0] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Place Order
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT — Order Summary (2/5) */}
          <div className="lg:col-span-2 space-y-3">

            {/* Product Card */}
            <div className="bg-white rounded-2xl shadow-sm shadow-blue-100 border border-blue-50/80 p-4 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-3">Order Summary</p>

              <div className="flex gap-3 items-start">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-blue-50">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{color} · Size {size}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#22a2f2]/10 text-[#22a2f2] text-[11px] font-bold rounded-md">{tier.label}</span>
                </div>
              </div>

              {/* Line items */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>{quantity} units × ₹{tier.unitPrice?.toLocaleString('en-IN') ?? '—'}</span>
                  <span className="font-medium text-gray-700">₹{totalCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Shipping</span>
                  <span>₹299</span>
                </div>
                <div className="h-px bg-blue-50 my-0.5" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">Total</span>
                  <span className="text-lg font-black text-[#22a2f2]">₹{(totalCost + 299).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Help card */}
            <div className="bg-[#22a2f2]/5 rounded-xl border border-[#22a2f2]/10 p-3 flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#22a2f2]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-[#22a2f2] mb-0.5">Need help?</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">Our team reviews every order personally and will reach out if anything needs clarification.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
