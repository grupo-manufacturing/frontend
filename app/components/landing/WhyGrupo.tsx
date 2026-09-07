'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

const REASONS = [
  {
    number: '01',
    title: 'Manufacturing-First',
    description: 'Built around production rather than retail.',
  },
  {
    number: '02',
    title: 'Custom Development',
    description: 'Develop products based on buyer requirements.',
  },
  {
    number: '03',
    title: 'Bulk Production',
    description: 'Designed for commercial quantities and repeat orders.',
  },
  {
    number: '04',
    title: 'Global Sourcing',
    description: 'Supporting international buyers sourcing from India.',
  },
  {
    number: '05',
    title: 'Quality Focus',
    description: 'Clear specifications and quality checks throughout production.',
  },
  {
    number: '06',
    title: 'Export Ready',
    description: 'Built to serve international markets.',
  },
];

export default function WhyGrupo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = REASONS[index];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % REASONS.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [active, paused]);

  return (
    <section
      ref={sectionRef}
      id="why-grupo"
      className="relative scroll-mt-20 overflow-hidden bg-surface py-20 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 45% at 90% 15%, rgba(28, 143, 215, 0.12), transparent 60%),
            radial-gradient(ellipse 40% 40% at 10% 85%, rgba(28, 143, 215, 0.08), transparent 65%)
          `,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="up">
          <div className="max-w-3xl">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7] sm:text-xs">
              The Difference
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Why International Buyers
              <span className="mt-1 block text-[#1C8FD7]">Work With Grupo.</span>
            </h2>
          </div>
        </Reveal>

        <div
          className="mt-14 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12"
          style={{
            opacity: active ? 1 : 0,
            transform: active ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Reason selector */}
          <div className="lg:col-span-5">
            <ul className="space-y-1">
              {REASONS.map((reason, i) => {
                const selected = i === index;
                return (
                  <li key={reason.number}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      onMouseEnter={() => setIndex(i)}
                      className={`group flex w-full items-center gap-4 px-3 py-3 text-left transition-all duration-400 sm:px-4 sm:py-3.5 ${
                        selected
                          ? 'bg-[#1C8FD7] text-surface'
                          : 'bg-transparent text-foreground/55 hover:bg-[#1C8FD7]/8 hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`font-nav text-lg font-semibold tracking-[0.06em] sm:text-xl ${
                          selected ? 'text-surface' : 'text-[#1C8FD7]'
                        }`}
                      >
                        {reason.number}
                      </span>
                      <span
                        className={`font-heading text-sm font-semibold uppercase tracking-[-0.01em] sm:text-base ${
                          selected ? 'text-surface' : 'text-foreground/80'
                        }`}
                      >
                        {reason.title}
                      </span>
                      <span
                        className={`ml-auto font-nav text-xs transition-transform duration-300 ${
                          selected ? 'translate-x-0 opacity-100' : 'translate-x-[-6px] opacity-0'
                        }`}
                        aria-hidden
                      >
                        →
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Progress ticks */}
            <div className="mt-6 flex gap-2 px-1">
              {REASONS.map((reason, i) => (
                <button
                  key={reason.number}
                  type="button"
                  aria-label={`Show reason ${reason.number}`}
                  onClick={() => setIndex(i)}
                  className={`h-1 flex-1 transition-all duration-500 ${
                    i === index ? 'bg-[#1C8FD7]' : 'bg-foreground/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Spotlight stage */}
          <div className="relative lg:col-span-7">
            <div className="relative min-h-[320px] overflow-hidden border border-[#1C8FD7]/15 bg-[#0a0f14] p-8 sm:min-h-[380px] sm:p-10 lg:p-12">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#1C8FD7]/20 blur-3xl transition-all duration-700"
                style={{ opacity: active ? 1 : 0 }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#1C8FD7]/10 blur-3xl"
                aria-hidden
              />

              <div key={current.number} className="relative animate-[why-stage-in_0.55s_cubic-bezier(0.22,1,0.36,1)_both]">
                <p
                  className="font-heading text-[7rem] font-black leading-none tracking-[-0.07em] text-transparent sm:text-[9rem]"
                  style={{ WebkitTextStroke: '2px #1C8FD7' }}
                >
                  {current.number}
                </p>

                <div className="mt-2 max-w-lg">
                  <p className="font-nav text-[11px] uppercase tracking-[0.2em] text-[#1C8FD7]">
                    Reason {current.number}
                  </p>
                  <h3 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-surface sm:text-4xl">
                    {current.title}
                  </h3>
                  <p className="font-body mt-4 text-base leading-relaxed text-surface/70 sm:text-lg sm:leading-8">
                    {current.description}
                  </p>
                </div>
              </div>

              {/* Corner index */}
              <p className="font-nav absolute bottom-6 right-6 text-[10px] uppercase tracking-[0.18em] text-surface/35 sm:bottom-8 sm:right-8">
                {String(index + 1).padStart(2, '0')} / 06
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
