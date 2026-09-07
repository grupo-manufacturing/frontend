'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../../components/landing/Navbar';
import { ShopProduct, ColorVariation } from '../../lib/types';
import { getProductById, createRazorpayOrder, verifyPayment, reportPaymentFailed } from '../../lib/api';

const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) => (
  <div className="group">
    <label className="font-nav block text-[10px] font-bold uppercase tracking-[0.14em] text-[#1C8FD7] mb-1.5">
      {label}{optional && <span className="text-foreground/40 ml-1 font-normal normal-case tracking-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

const inputCls = "font-body w-full px-4 py-3 bg-surface border border-brand/10 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-[#1C8FD7] focus:ring-1 focus:ring-[#1C8FD7]/20";

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
      <div className="h-screen overflow-hidden bg-surface flex flex-col">
        <Navbar variant="dark" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md px-4">
            <div className="h-8 bg-brand/10 w-1/3" />
            <div className="h-4 bg-brand/10 w-2/3" />
            <div className="h-40 bg-brand/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto px-4 pt-32 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-brand/15 bg-brand/5 mb-6">
            <svg className="w-8 h-8 text-[#1C8FD7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Product not found</h1>
          <p className="font-body text-foreground/50 mb-6">Please return to the shop and try again.</p>
          <Link href="/shop" className="font-nav inline-flex items-center gap-2 px-6 py-3 bg-[#1C8FD7] text-[#0b1220] text-[10px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors sm:text-[11px]">
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return <CheckoutForm product={product} searchParams={searchParams} />;
}

function CheckoutForm({ product, searchParams }: { product: ShopProduct; searchParams: ReturnType<typeof useSearchParams> }) {
  const quantity = Number(searchParams.get('quantity')) || 10;
  const tierLabel = searchParams.get('tier') || 'Standard';
  const tier = product.bulkPricing.find((t) => t.label === tierLabel) || product.bulkPricing[0];
  const isRFQ = tier.isRFQ === true;
  const totalCost = isRFQ ? 0 : tier.unitPrice * quantity;
  const tierShipping: Record<string, number> = { Standard: 1500, Silver: 2000, Gold: 4500 };
  const shippingCost = tierShipping[tierLabel] ?? 1500;
  const finalTotal = totalCost + shippingCost;

  const [variations, setVariations] = useState<ColorVariation[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`checkout_${product.id}`);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.variations)) setVariations(data.variations);
      }
    } catch { /* ignore parse errors */ }
  }, [product.id]);

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
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');

  const buildPayload = () => ({
    productId: product.id,
    variations,
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

  const openRazorpayCheckout = (razorpayOrderId: string, amount: number, keyId: string, orderId: string) => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      setSubmitError('Payment gateway failed to load. Please refresh and try again.');
      setSubmitting(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency: 'INR',
      name: 'Grupo',
      description: `${product.name} — ${quantity} units (${tierLabel})`,
      order_id: razorpayOrderId,
      prefill: { name: fullName.trim(), email: email.trim(), contact: phone.trim() },
      theme: { color: '#1C8FD7' },
      handler: async (response) => {
        try {
          const result = await verifyPayment({
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          sessionStorage.removeItem(`checkout_${product.id}`);
          setOrderNumber(result.order.orderNumber);
          setSubmitted(true);
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('expired')) {
            setSubmitError('Your order expired. Please click "Pay" again to create a new order.');
          } else {
            setVerificationFailed(msg || 'Payment verification failed. If money was deducted, it will be refunded automatically within 5-7 business days. Please contact support for assistance.');
          }
        } finally {
          setSubmitting(false);
        }
      },
      modal: {
        ondismiss: () => {
          if (!submitted) {
            reportPaymentFailed(orderId).catch(() => {});
            setPaymentFailed(true);
          }
          setSubmitting(false);
        },
      },
    });

    rzp.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setPaymentFailed(false);
    setVerificationFailed('');

    try {
      const result = await createRazorpayOrder(buildPayload());
      setCurrentOrderId(result.orderId);
      openRazorpayCheckout(result.razorpayOrderId, result.amount, result.keyId, result.orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Too many')) {
        setSubmitError('You\'re submitting too fast. Please wait a minute and try again.');
      } else {
        setSubmitError(msg || 'Failed to initiate payment. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setPaymentFailed(false);
    setVerificationFailed('');
    setSubmitError('');
    setCurrentOrderId('');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar variant="dark" />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <div className="bg-surface border border-brand/10 p-10 sm:p-14 text-center max-w-md w-full">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-[#1C8FD7]/10 animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-[#1C8FD7] flex items-center justify-center">
                <svg className="w-9 h-9 text-[#0b1220]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3 tracking-tight">Payment Successful!</h1>
            <p className="font-body text-foreground/50 leading-relaxed mb-2">
              Thanks, <span className="font-semibold text-foreground/70">{fullName}</span>. Your order for{' '}
              <span className="font-semibold text-[#1C8FD7]">{product.name}</span> is confirmed and paid.
            </p>
            {orderNumber && (
              <p className="font-nav text-sm font-semibold text-[#1C8FD7] mb-2">
                Order #{orderNumber}
              </p>
            )}
            <p className="font-body text-xs text-foreground/40 mb-3">Amount paid: ₹{finalTotal.toLocaleString('en-IN')}</p>
            <p className="font-body text-sm text-foreground/40 mb-10">You&apos;ll receive order updates on WhatsApp shortly.</p>
            <Link href="/shop" className="font-nav inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C8FD7] text-[#0b1220] text-[10px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors sm:text-[11px]">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (verificationFailed) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar variant="dark" />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <div className="bg-surface border border-amber-200 p-10 sm:p-14 text-center max-w-md w-full">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="relative w-20 h-20 bg-amber-500 flex items-center justify-center">
                <svg className="w-9 h-9 text-[#0b1220]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3 tracking-tight">Verification Failed</h1>
            <p className="font-body text-foreground/50 leading-relaxed mb-2">{verificationFailed}</p>
            <div className="bg-amber-50 border border-amber-200 p-4 mb-8 text-left">
              <p className="font-nav text-[10px] uppercase tracking-[0.14em] text-amber-800 font-semibold mb-1">What happens next?</p>
              <p className="font-body text-xs text-amber-700 leading-relaxed">
                If money was deducted from your account, it will be refunded automatically within 5–7 business days. If you need immediate assistance, please contact our support team.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="font-nav inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1C8FD7] text-[#0b1220] text-[10px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors sm:text-[11px]"
              >
                Try Again
              </button>
              <Link href="/shop" className="font-nav inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-brand/15 text-foreground/60 text-[10px] uppercase tracking-[0.14em] hover:border-[#1C8FD7] hover:text-[#1C8FD7] transition-colors sm:text-[11px]">
                Back to Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar variant="dark" />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <div className="bg-surface border border-red-100 p-10 sm:p-14 text-center max-w-md w-full">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="relative w-20 h-20 bg-red-500 flex items-center justify-center">
                <svg className="w-9 h-9 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3 tracking-tight">Payment Cancelled</h1>
            <p className="font-body text-foreground/50 leading-relaxed mb-2">
              Your payment was not completed. No amount has been charged.
            </p>
            <p className="font-body text-sm text-foreground/40 mb-10">You can retry the payment or go back to the shop.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="font-nav inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1C8FD7] text-[#0b1220] text-[10px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors sm:text-[11px]"
              >
                Try Again
              </button>
              <Link href="/shop" className="font-nav inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-brand/15 text-foreground/60 text-[10px] uppercase tracking-[0.14em] hover:border-[#1C8FD7] hover:text-[#1C8FD7] transition-colors sm:text-[11px]">
                Back to Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-surface flex flex-col">
      <Navbar variant="dark" />

      {/* Decorative top bar */}
      <div className="h-1 bg-[#1C8FD7]" />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-12 pt-20 pb-4 flex flex-col">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-black uppercase tracking-[-0.02em] text-foreground">Checkout</h1>
          <p className="font-body text-foreground/40 mt-0.5 text-sm">Review your order and complete your details below.</p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* LEFT — Form (3/5) */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-brand/10 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-[#1C8FD7] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#0b1220]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="font-heading text-lg font-bold text-foreground">Your Information</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" className={inputCls} />
                  </Field>
                  <Field label="Email">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div className="flex flex-wrap gap-4 pt-3 border-t border-brand/10">
                  {[['🔒', 'Secure & Encrypted'], ['⚡', 'Fast Processing'], ['📦', 'Tracked Delivery']].map(([icon, text]) => (
                    <span key={text} className="font-nav flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-foreground/40">{icon} {text}</span>
                  ))}
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 p-3 font-body text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                {isRFQ ? (
                  <a
                    href={`https://wa.me/917671062042?text=${encodeURIComponent(`Hello, I am interested in buying the ${product.name}'s 500+ units!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-nav w-full py-3 bg-amber-500 text-[#0b1220] text-[11px] uppercase tracking-[0.14em] hover:bg-amber-600 hover:text-surface transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Request for Quotation
                  </a>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="font-nav w-full py-3.5 bg-[#1C8FD7] text-[#0b1220] text-[11px] uppercase tracking-[0.14em] hover:bg-[#1678B5] hover:text-surface transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Initiating Payment...
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Pay ₹{finalTotal.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-normal opacity-70 tracking-normal normal-case">UPI / Cards / Net Banking / Wallets</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT — Order Summary (2/5) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Product Card */}
            <div className="bg-surface border border-brand/10 p-5 sm:p-6">
              <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-[#1C8FD7] mb-3">Order Summary</p>

              <div className="flex gap-3 items-start">
                <div className="relative w-16 h-16 overflow-hidden flex-shrink-0 bg-brand/5 border border-brand/10">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground text-sm leading-tight">{product.name}</h3>
                  <p className="font-body text-xs text-foreground/40 mt-0.5">{quantity} units</p>
                  <span className="font-nav inline-block mt-1.5 px-2 py-0.5 bg-[#1C8FD7]/10 text-[#1C8FD7] text-[10px] font-bold uppercase tracking-[0.12em]">{tier.label}</span>
                </div>
              </div>

              {/* Variation breakdown */}
              {variations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40">Variations</p>
                  {variations.map((v) => (
                    <div key={v.color} className="font-body text-xs">
                      <span className="font-semibold text-foreground/70">{v.color}</span>
                      <span className="text-foreground/40 ml-1">
                        — {v.sizes.map((s) => `${s.size} ×${s.qty}`).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Line items */}
              <div className="mt-4 space-y-2 text-sm">
                {isRFQ ? (
                  <div className="font-body flex justify-between text-foreground/50">
                    <span>{quantity} units</span>
                    <span className="font-medium text-amber-600">Quote Required</span>
                  </div>
                ) : (
                  <>
                    <div className="font-body flex justify-between text-foreground/50">
                      <span>{quantity} units × ₹{tier.unitPrice?.toLocaleString('en-IN') ?? '—'}</span>
                      <span className="font-medium text-foreground/70">₹{totalCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="font-body flex justify-between text-foreground/40 text-xs">
                      <span>Shipping</span>
                      <span>₹{shippingCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-px bg-brand/10 my-0.5" />
                    <div className="flex justify-between items-center">
                      <span className="font-nav text-[10px] uppercase tracking-[0.14em] font-bold text-foreground">Total</span>
                      <span className="font-heading text-lg font-black text-[#1C8FD7]">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment methods card */}
            {!isRFQ && (
              <div className="bg-surface border border-brand/10 p-5 sm:p-6">
                <p className="font-nav text-[10px] font-bold uppercase tracking-[0.14em] text-[#1C8FD7] mb-3">Accepted Payment Methods</p>
                <div className="flex flex-wrap gap-2.5">
                  {['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallets'].map((m) => (
                    <span key={m} className="font-nav px-2.5 py-1 border border-brand/10 text-[10px] uppercase tracking-[0.12em] text-foreground/50">{m}</span>
                  ))}
                </div>
                <p className="font-body text-[10px] text-foreground/40 mt-2.5 flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Secured by Razorpay. Your payment info is never stored on our servers.
                </p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
