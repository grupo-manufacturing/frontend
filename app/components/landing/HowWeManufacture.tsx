'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Reveal from './Reveal';

const STEPS = [
  {
    number: '01',
    title: 'Requirement',
    description: 'Buyer shares product requirements, references, tech packs or images.',
  },
  {
    number: '02',
    title: 'Product Development',
    description: 'GRUPO works on fabrics, construction, measurements and product details.',
  },
  {
    number: '03',
    title: 'Sampling',
    description: 'Samples are developed for review and approval.',
  },
  {
    number: '04',
    title: 'Sourcing',
    description: 'Materials and trims are sourced according to the approved product.',
  },
  {
    number: '05',
    title: 'Bulk Production',
    description: 'Approved products move into manufacturing.',
  },
  {
    number: '06',
    title: 'QC & Export',
    description:
      'Production is checked against agreed specs, then finished goods are prepared for international shipment.',
  },
];

export default function HowWeManufacture() {
  const reactId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setFocus((prev) => (prev + 1) % STEPS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="relative scroll-mt-20 overflow-hidden bg-[#0a0f14] py-20 sm:py-28"
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 45% 35% at 15% 20%, rgba(28, 143, 215, 0.2), transparent 60%),
            radial-gradient(ellipse 40% 30% at 85% 75%, rgba(28, 143, 215, 0.12), transparent 65%)
          `,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="up">
          <div className="max-w-2xl">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7] sm:text-xs">
              Our Process
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-surface sm:text-4xl md:text-5xl">
              How We Manufacture.
              <span className="mt-1 block text-[#1C8FD7]">Six Steps. Zero Guesswork.</span>
            </h2>
            <p className="font-body mt-5 max-w-xl text-base leading-relaxed text-surface/65 sm:text-lg">
              A clear path from your brief to export-ready goods — structured, tracked, and built for
              global brands.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-16 sm:mt-20 lg:mt-24">
          {/* Organic ribbon path (desktop) */}
          <svg
            className="pointer-events-none absolute inset-y-8 left-1/2 hidden w-[min(42%,280px)] -translate-x-1/2 lg:block"
            viewBox="0 0 120 900"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${reactId}-ribbon`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1C8FD7" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#1C8FD7" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#1C8FD7" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M60 20
                 C 20 90, 100 150, 60 220
                 C 20 290, 100 350, 60 420
                 C 20 490, 100 550, 60 620
                 C 20 690, 100 750, 60 880"
              stroke={`url(#${reactId}-ribbon)`}
              strokeWidth="2"
              strokeDasharray="8 12"
              className={active ? 'animate-[process-ribbon_12s_linear_infinite]' : undefined}
              style={{ ['--map-dash' as string]: '400' }}
            />
            {active && (
              <circle r="5" fill="#1C8FD7">
                <animateMotion
                  dur="12s"
                  repeatCount="indefinite"
                  path="M60 20 C 20 90, 100 150, 60 220 C 20 290, 100 350, 60 420 C 20 490, 100 550, 60 620 C 20 690, 100 750, 60 880"
                />
              </circle>
            )}
          </svg>

          <ol className="relative space-y-10 sm:space-y-14 lg:space-y-16">
            {STEPS.map((step, i) => {
              const isFocus = focus === i;
              const flip = i % 2 === 1;

              return (
                <li
                  key={step.number}
                  className={`relative grid grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-16 ${
                    flip ? 'lg:[&>*:first-child]:order-2' : ''
                  }`}
                  onMouseEnter={() => setFocus(i)}
                  style={{
                    opacity: active ? 1 : 0,
                    transform: active
                      ? 'translateY(0)'
                      : `translateY(40px) translateX(${flip ? '24px' : '-24px'})`,
                    transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.1}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.1}s`,
                  }}
                >
                  {/* Giant number panel */}
                  <div
                    className={`relative flex items-center ${
                      flip ? 'lg:justify-start' : 'lg:justify-end'
                    }`}
                  >
                    <div
                      className={`relative select-none transition-all duration-500 ${
                        isFocus ? 'scale-105' : 'scale-100 opacity-80'
                      }`}
                    >
                      <span
                        className="font-heading block text-[6.5rem] font-black leading-none tracking-[-0.06em] text-transparent sm:text-[8rem] md:text-[9rem]"
                        style={{
                          WebkitTextStroke: isFocus ? '2px #1C8FD7' : '1.5px rgba(28,143,215,0.45)',
                        }}
                      >
                        {step.number}
                      </span>
                      <span
                        className={`pointer-events-none absolute inset-0 font-heading text-[6.5rem] font-black leading-none tracking-[-0.06em] sm:text-[8rem] md:text-[9rem] transition-opacity duration-500 ${
                          isFocus ? 'opacity-30' : 'opacity-0'
                        }`}
                        style={{
                          background: 'linear-gradient(180deg, #1C8FD7 0%, transparent 70%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                        }}
                        aria-hidden
                      >
                        {step.number}
                      </span>
                    </div>

                    {/* Orbit node at center seam */}
                    <span
                      className={`absolute top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full bg-[#1C8FD7] lg:block ${
                        flip ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
                      } ${isFocus ? 'shadow-[0_0_24px_rgba(28,143,215,0.9)] scale-125' : 'opacity-50'} transition-all duration-400`}
                      aria-hidden
                    />
                  </div>

                  {/* Copy panel */}
                  <div
                    className={`relative max-w-md transition-all duration-500 ${
                      flip ? 'lg:ml-0 lg:mr-auto' : 'lg:ml-auto lg:mr-0'
                    } ${isFocus ? 'translate-y-0 opacity-100' : 'opacity-70'}`}
                  >
                    <div
                      className={`absolute -inset-x-4 -inset-y-3 -z-10 transition-opacity duration-500 ${
                        isFocus ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        background:
                          'radial-gradient(ellipse at center, rgba(28,143,215,0.12), transparent 70%)',
                      }}
                      aria-hidden
                    />
                    <p className="font-nav text-[11px] uppercase tracking-[0.22em] text-[#1C8FD7]">
                      Step {step.number}
                    </p>
                    <h3 className="font-heading mt-2 text-2xl font-black uppercase tracking-[-0.02em] text-surface sm:text-3xl">
                      {step.title}
                    </h3>
                    <p className="font-body mt-3 text-base leading-relaxed text-surface/60 sm:text-lg sm:leading-8">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
