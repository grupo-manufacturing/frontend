'use client';

import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';

const REQUIREMENTS_FORM_URL =
  'https://docs.google.com/forms/d/114Qw4OD6VwlmHql6PTdf-xSGyFjTmrknXK8kMuQK7_4/viewform';

const PRODUCTS = [
  { name: 'T-Shirts', image: '/Categories/t-shirt.jpg' },
  { name: 'Shirts', image: '/Categories/plain-shirts.jpg' },
  { name: 'Polos', image: '/Categories/polos.webp' },
  { name: 'Leather Jackets', image: '/Categories/leather-jackets.webp' },
  { name: 'Acid Wash', image: '/Categories/acid-wash-t-shirt.jpg' },
  { name: 'Denim Jackets', image: '/Categories/denim-jackets.webp' },
  { name: 'Joggers', image: '/Categories/joggers.webp' },
  {
    name: "Women's Tops",
    image:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Pet Clothing',
    image:
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80',
  },
];

export default function ProductRange() {
  return (
    <section id="products" className="relative scroll-mt-20 overflow-hidden bg-surface py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 55% 40% at 80% 10%, rgba(28, 143, 215, 0.1), transparent 65%),
            radial-gradient(ellipse 40% 35% at 10% 90%, rgba(28, 143, 215, 0.06), transparent 70%)
          `,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="up">
          <div className="max-w-2xl">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand sm:text-xs">
              What We Make
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Product Range.
              <span className="mt-1 block text-brand">Built for Every Brief.</span>
            </h2>
            <p className="font-body mt-5 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              From everyday essentials to statement outerwear manufacture the styles your brand
              needs, at scale, through Grupo.
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:mt-16">
          {PRODUCTS.map((product, i) => (
            <li key={product.name}>
              <Reveal from="up" delay={0.06 * i} duration={0.75}>
                <article className="group relative aspect-[4/5] overflow-hidden bg-brand/5">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/80"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="font-nav text-[10px] uppercase tracking-[0.2em] text-brand">
                      Category
                    </p>
                    <h3 className="font-heading mt-1 text-xl font-semibold uppercase tracking-[-0.01em] text-surface sm:text-2xl">
                      {product.name}
                    </h3>
                    <span className="mt-3 block h-px w-0 bg-brand transition-all duration-500 group-hover:w-16" />
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal from="up" delay={0.15}>
          <div className="mt-14 flex flex-col items-start justify-between gap-6 border border-brand/15 bg-brand/[0.04] px-6 py-8 sm:mt-16 sm:flex-row sm:items-center sm:px-8 sm:py-10">
            <div className="max-w-xl">
              <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand">
                Custom Manufacturing
              </p>
              <h3 className="font-heading mt-2 text-2xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-3xl">
                Your product isn&apos;t listed?
              </h3>
              <p className="font-body mt-3 text-base leading-relaxed text-foreground/70">
                Send us the requirement we&apos;ll match you with the right manufacturing capacity
                for your style, quantity, and market.
              </p>
            </div>
            <Link
              href={REQUIREMENTS_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-nav group inline-flex shrink-0 items-center justify-center bg-brand px-5 py-3.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1678B5] hover:text-surface hover:shadow-[0_12px_40px_rgba(28,143,215,0.35)] sm:px-6 sm:text-[11px]"
            >
              Request For Quotation
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
