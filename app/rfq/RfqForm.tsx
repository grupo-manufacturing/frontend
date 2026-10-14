'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { RFQ_MIN_QUANTITY, RFQ_PRODUCTS, RfqSubmitError, submitRfq, wakeOmsBackend, type RfqProduct } from './api';
import PhoneInput from './PhoneInput';

type ItemRow = { id: number; product: RfqProduct | ''; quantity: string };

const ICONS = {
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  brand: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
} as const;

const Icon = ({ name, className = 'h-4 w-4' }: { name: keyof typeof ICONS; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={ICONS[name]} />
  </svg>
);

const inputCls =
  'font-body h-12 w-full border border-brand/15 bg-[#f7fbfe] pl-11 pr-4 text-sm text-foreground placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-brand/35 focus:border-brand focus:bg-surface focus:shadow-[0_0_0_4px_rgba(28,143,215,0.12)]';

function Field({ label, optional, htmlFor, icon, children }: { label: string; optional?: boolean; htmlFor: string; icon?: keyof typeof ICONS; children: React.ReactNode }) {
  return (
    <div className="group">
      <label htmlFor={htmlFor} className="font-nav mb-2 flex items-center text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/70">
        {label}
        {optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-foreground/40">(optional)</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand/45 transition-colors group-focus-within:text-brand">
            <Icon name={icon} />
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <span className="font-nav flex h-9 w-9 flex-shrink-0 items-center justify-center bg-brand text-[11px] font-semibold text-[#0b1220]">
        {step}
      </span>
      <div>
        <h2 className="font-heading text-lg font-bold uppercase tracking-[-0.01em] text-foreground">{title}</h2>
        <p className="font-body mt-0.5 text-sm text-foreground/50">{description}</p>
      </div>
    </div>
  );
}

export default function RfqForm() {
  const nextItemId = useRef(1);
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('IN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [techPackUrl, setTechPackUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ id: 0, product: '', quantity: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [rfqNumber, setRfqNumber] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    wakeOmsBackend();
  }, []);

  const updateItem = (id: number, patch: Partial<Omit<ItemRow, 'id'>>) =>
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addItem = () => setItems((rows) => [...rows, { id: nextItemId.current++, product: '', quantity: '' }]);

  const removeItem = (id: number) => setItems((rows) => rows.filter((row) => row.id !== id));

  const resetForm = () => {
    setName('');
    setBrandName('');
    setEmail('');
    setPhoneNumber('');
    setLocation('');
    setTechPackUrl('');
    setItems([{ id: nextItemId.current++, product: '', quantity: '' }]);
    setRfqNumber(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDetails([]);

    const parsedPhone = parsePhoneNumberFromString(phoneNumber, phoneCountry);
    if (!parsedPhone?.isValid()) {
      setError(`Please enter a valid phone number for +${getCountryCallingCode(phoneCountry)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const number = await submitRfq({
        name: name.trim(),
        brandName: brandName.trim(),
        email: email.trim(),
        phone: parsedPhone.number,
        location: location.trim(),
        techPackUrl: techPackUrl.trim() || undefined,
        items: items.map((row) => ({ product: row.product as RfqProduct, quantity: Number(row.quantity) })),
        website,
      });
      setRfqNumber(number);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof RfqSubmitError) {
        setError(err.message);
        setErrorDetails(err.details);
      } else {
        setError('Could not reach our server. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative overflow-hidden border border-brand/10 bg-surface px-6 py-12 text-center shadow-[0_24px_80px_-32px_rgba(11,18,32,0.25)] sm:px-12 sm:py-16">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden />
        <div className="relative mx-auto mb-8 h-20 w-20">
          <div className="absolute inset-0 animate-ping bg-brand/15" />
          <div className="relative flex h-20 w-20 items-center justify-center bg-brand">
            <svg className="h-9 w-9 text-[#0b1220]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand">Request Received</p>
        <h2 className="font-heading mt-2 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl">
          Thank you, {name.trim().split(' ')[0]}.
        </h2>
        <p className="font-body mx-auto mt-4 max-w-md leading-relaxed text-foreground/60">
          Our team will review your requirements and get back to you with a quotation.
        </p>
        {rfqNumber && (
          <div className="mx-auto mt-8 inline-flex flex-col items-center border border-dashed border-brand/40 bg-brand/[0.04] px-8 py-4">
            <span className="font-nav text-[10px] uppercase tracking-[0.18em] text-foreground/50">Your reference</span>
            <span className="font-heading mt-1 text-2xl font-black tracking-tight text-brand">{rfqNumber}</span>
          </div>
        )}
        <p className="font-body mt-4 text-sm text-foreground/40">Please keep this reference for any follow-ups.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="font-nav inline-flex items-center justify-center bg-brand px-8 py-3.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1678B5] hover:text-surface hover:shadow-[0_12px_40px_rgba(28,143,215,0.35)] sm:text-[11px]"
          >
            Back to Home
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="font-nav inline-flex items-center justify-center border border-brand/20 px-8 py-3.5 text-[10px] uppercase tracking-[0.14em] text-foreground/70 transition-colors hover:border-brand hover:text-brand sm:text-[11px]"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  const chosenProducts = new Set(items.map((row) => row.product).filter(Boolean));
  const totalUnits = items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const selectedCount = items.filter((row) => row.product).length;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden border border-brand/10 bg-surface shadow-[0_24px_80px_-32px_rgba(11,18,32,0.25)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden />

      <div className="px-6 pt-10 pb-8 sm:px-10">
        <SectionHeader step="01" title="About You" description="So we know who to send the quotation to." />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Your Name" htmlFor="rfq-name" icon="user">
            <input id="rfq-name" type="text" required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" className={inputCls} />
          </Field>
          <Field label="Brand Name" htmlFor="rfq-brand" icon="brand">
            <input id="rfq-brand" type="text" required maxLength={100} autoComplete="organization" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Desi Threads" className={inputCls} />
          </Field>
          <Field label="Email" htmlFor="rfq-email" icon="mail">
            <input id="rfq-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@desithreads.in" className={inputCls} />
          </Field>
          <Field label="Phone" htmlFor="rfq-phone">
            <PhoneInput id="rfq-phone" country={phoneCountry} onCountryChange={setPhoneCountry} number={phoneNumber} onNumberChange={setPhoneNumber} />
          </Field>
        </div>
      </div>

      <div className="border-t border-brand/10 px-6 py-8 sm:px-10">
        <SectionHeader step="02" title="Products" description={`Add every product you need, minimum ${RFQ_MIN_QUANTITY} units each.`} />

        <div className="space-y-3">
          {items.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-[2.5rem_1fr_2.75rem] items-center gap-3 border border-brand/10 bg-surface p-3 transition-colors focus-within:border-brand/40 hover:border-brand/25 sm:grid-cols-[2.5rem_1fr_10rem_2.75rem]"
            >
              <span className="font-nav flex h-10 w-10 items-center justify-center bg-brand/10 text-[11px] font-semibold text-brand">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="relative">
                <select
                  aria-label={`Product ${index + 1}`}
                  required
                  value={row.product}
                  onChange={(e) => updateItem(row.id, { product: e.target.value as RfqProduct })}
                  className={`font-body h-11 w-full cursor-pointer appearance-none border border-brand/15 bg-[#f7fbfe] pl-4 pr-10 text-sm outline-none transition-all duration-200 hover:border-brand/35 focus:border-brand focus:bg-surface focus:shadow-[0_0_0_4px_rgba(28,143,215,0.12)] ${row.product ? 'text-foreground' : 'text-gray-400'}`}
                >
                  <option value="" disabled>Select a product</option>
                  {RFQ_PRODUCTS.filter((product) => product === row.product || !chosenProducts.has(product)).map((product) => (
                    <option key={product} value={product} className="text-foreground">{product}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div className="relative col-start-2 sm:col-start-3 sm:row-start-1">
                <input
                  aria-label={`Quantity for product ${index + 1}`}
                  type="number"
                  required
                  min={RFQ_MIN_QUANTITY}
                  step={1}
                  inputMode="numeric"
                  value={row.quantity}
                  onChange={(e) => updateItem(row.id, { quantity: e.target.value })}
                  placeholder={`Min ${RFQ_MIN_QUANTITY}`}
                  className="font-body h-11 w-full border border-brand/15 bg-[#f7fbfe] pl-4 pr-14 text-sm text-foreground placeholder:text-gray-400 outline-none transition-all duration-200 [appearance:textfield] hover:border-brand/35 focus:border-brand focus:bg-surface focus:shadow-[0_0_0_4px_rgba(28,143,215,0.12)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="font-nav pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.12em] text-foreground/40">
                  Units
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeItem(row.id)}
                disabled={items.length === 1}
                aria-label={`Remove product ${index + 1}`}
                className="col-start-3 row-start-1 flex h-11 w-11 items-center justify-center text-foreground/30 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-0 sm:col-start-4"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {items.length < RFQ_PRODUCTS.length && (
          <button
            type="button"
            onClick={addItem}
            className="font-nav mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-brand/30 py-3.5 text-[10px] uppercase tracking-[0.16em] text-brand transition-colors hover:border-brand hover:bg-brand/[0.04] sm:text-[11px]"
          >
            <span className="text-base leading-none">+</span> Add another product
          </button>
        )}

        {totalUnits > 0 && (
          <div className="mt-4 flex items-center justify-between bg-brand/[0.05] px-4 py-3">
            <span className="font-nav text-[10px] uppercase tracking-[0.16em] text-foreground/50">
              {selectedCount} {selectedCount === 1 ? 'product' : 'products'}
            </span>
            <span className="font-heading text-sm font-bold text-foreground">
              {totalUnits.toLocaleString('en-IN')} <span className="font-nav text-[10px] font-normal uppercase tracking-[0.14em] text-foreground/50">units total</span>
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-brand/10 px-6 py-8 sm:px-10">
        <SectionHeader step="03" title="Details" description="Where you are, and your tech pack if you have one." />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Location" htmlFor="rfq-location" icon="pin">
            <input id="rfq-location" type="text" required maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Jaipur, Rajasthan" className={inputCls} />
          </Field>
          <Field label="Tech Pack Link" optional htmlFor="rfq-techpack" icon="link">
            <input id="rfq-techpack" type="url" maxLength={2048} value={techPackUrl} onChange={(e) => setTechPackUrl(e.target.value)} placeholder="https://drive.google.com/..." className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Honeypot: hidden from people, filled in by bots; the backend silently drops those submissions. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="rfq-website">Website</label>
        <input id="rfq-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="border-t border-brand/10 bg-brand/[0.03] px-6 py-6 sm:px-10">
        {error && (
          <div className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 font-body text-sm text-red-700" role="alert">
            <p className="font-semibold">{error}</p>
            {errorDetails.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                {errorDetails.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs leading-relaxed text-foreground/45 sm:max-w-xs">
            By submitting, you agree to our{' '}
            <Link href="/terms-and-conditions" className="underline underline-offset-2 hover:text-brand">Terms</Link> and{' '}
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-brand">Privacy Policy</Link>.
            This is not a binding order.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="font-nav group inline-flex items-center justify-center gap-2 bg-brand px-8 py-4 text-[11px] uppercase tracking-[0.16em] text-[#0b1220] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1678B5] hover:text-surface hover:shadow-[0_12px_40px_rgba(28,143,215,0.35)] disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Request
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
