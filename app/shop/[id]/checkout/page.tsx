'use client';

import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../../components/landing/Navbar';
import { SHOP_PRODUCTS } from '../../data';

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
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
      </div>
    );
  }

  return <CheckoutForm product={product} searchParams={searchParams} />;
}

function CheckoutForm({
  product,
  searchParams,
}: {
  product: (typeof SHOP_PRODUCTS)[number];
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const color = searchParams.get('color') || product.colors[0];
  const size = searchParams.get('size') || product.sizes[0];
  const quantity = Number(searchParams.get('quantity')) || 10;
  const tierLabel = searchParams.get('tier') || 'Standard';

  const tier = product.bulkPricing.find((t) => t.label === tierLabel) || product.bulkPricing[0];
  const totalCost = tier.unitPrice * quantity;

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now just show success — backend integration later
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
            <p className="text-gray-600 mb-8">
              Thank you, {fullName}. We&apos;ve received your order for <span className="font-semibold">{product.name}</span>. Our team will reach out to you shortly.
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-colors font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Order Summary — Horizontal Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Summary</h2>
          <div className="flex items-center gap-4">
            {/* Product Image */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {color} · Size {size}
              </p>
              <p className="text-xs text-[#22a2f2] font-medium mt-0.5">
                {tier.label} · {quantity} units
              </p>
            </div>

            {/* Pricing */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm text-gray-500">₹{totalCost.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400 mt-0.5">Shipping ₹299</p>
              <p className="text-lg font-bold text-gray-900 mt-1 border-t border-gray-100 pt-1">
                ₹{(totalCost + 299).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Information</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Two-column row: Full Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                />
              </div>
            </div>

            {/* Two-column row: Phone + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company / Brand Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company or brand name"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 transition-all"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Shipping Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full shipping address including pincode"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500 resize-none transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-4 py-3.5 bg-[#22a2f2] text-white rounded-xl hover:bg-[#1b8bd0] transition-all font-semibold text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Place Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
