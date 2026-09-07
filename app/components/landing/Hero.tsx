'use client';

import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=2400&q=80';

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#0a0f14]">
      <Image
        src={HERO_IMAGE}
        alt="Apparel manufacturing factory floor"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center animate-[hero-kenburns_22s_ease-in-out_infinite_alternate]"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/35"
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/25" aria-hidden />

      <div
        className="absolute inset-0 opacity-30 animate-[hero-grid-drift_18s_linear_infinite]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28, 143, 215, 0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28, 143, 215, 0.22) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
        aria-hidden
      />

      {/* Accent light sweep */}
      <div
        className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-brand/10 to-transparent animate-[hero-sweep_7s_ease-in-out_infinite]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Reveal from="up" delay={0.05}>
            <h1 className="font-heading font-black text-[2.35rem] leading-[1.05] tracking-[-0.02em] uppercase sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              <span className="block text-surface">Apparel Manufacturing</span>
              <span className="mt-1 block text-brand sm:mt-2">Built for Global Brands.</span>
            </h1>
            <span className="mt-5 block h-px w-24 origin-left bg-brand animate-[hero-line-draw_1s_ease-out_0.45s_both]" />
          </Reveal>

          <Reveal from="up" delay={0.18}>
            <p className="font-body mt-6 max-w-xl text-base leading-relaxed text-surface/90 sm:mt-8 sm:text-lg">
              From product development to bulk production and export, GRUPO helps international
              brands source and manufacture quality apparel at scale.
            </p>
          </Reveal>

          <Reveal from="up" delay={0.3}>
            <div className="mt-8 sm:mt-10">
              <Link
                href="/shop"
                className="font-nav group inline-flex items-center justify-center border border-surface/90 bg-transparent px-5 py-3.5 text-[10px] uppercase tracking-[0.14em] text-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-[#0b1220] hover:shadow-[0_12px_40px_rgba(28,143,215,0.35)] sm:px-6 sm:text-[11px]"
              >
                Explore Products
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
