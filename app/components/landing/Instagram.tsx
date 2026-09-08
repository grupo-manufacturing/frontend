'use client';

import Link from 'next/link';
import Reveal from './Reveal';

const INSTAGRAM_URL = 'https://instagram.com/grupoapp';

export default function Instagram() {
  return (
    <section id="instagram" className="relative scroll-mt-20 overflow-hidden bg-[#0a0f14] py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 45% at 20% 30%, rgba(28,143,215,0.2), transparent 60%),
            radial-gradient(ellipse 40% 40% at 85% 70%, rgba(28,143,215,0.12), transparent 65%)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30 animate-[hero-grid-drift_18s_linear_infinite]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(254,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(254,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal from="left" className="lg:col-span-7">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7] sm:text-xs">
              Stay Connected
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-surface sm:text-4xl md:text-5xl">
              Follow Grupo
              <span className="mt-1 block text-[#1C8FD7]">on Instagram.</span>
            </h2>
            <p className="font-body mt-5 max-w-xl text-base leading-relaxed text-surface/65 sm:text-lg">
              Behind-the-scenes production, new drops, factory floors, and brand stories — join the
              community shipping apparel worldwide.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-nav group inline-flex items-center justify-center bg-[#1C8FD7] px-5 py-3.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1678B5] hover:text-surface sm:text-[11px]"
              >
                Visit Instagram
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <p className="font-nav text-xs uppercase tracking-[0.16em] text-surface/45">
                @grupoapp
              </p>
            </div>
          </Reveal>

          <Reveal from="right" delay={0.15} className="lg:col-span-5">
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mx-auto flex aspect-square max-w-sm items-center justify-center border border-surface/15 bg-surface/[0.03] transition-all duration-500 hover:border-[#1C8FD7]/50 hover:bg-[#1C8FD7]/5 lg:ml-auto"
              aria-label="Open Grupo Instagram"
            >
              <div
                className="absolute inset-6 border border-[#1C8FD7]/25 transition-transform duration-500 group-hover:scale-95"
                aria-hidden
              />
              <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                <svg
                  className="h-14 w-14 text-[#1C8FD7] transition-transform duration-500 group-hover:scale-110 sm:h-16 sm:w-16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                <p className="font-heading text-2xl font-black uppercase tracking-[-0.02em] text-surface">
                  @grupoapp
                </p>
                <p className="font-nav text-[10px] uppercase tracking-[0.18em] text-surface/45">
                  Instagram
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
