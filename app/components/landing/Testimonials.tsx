'use client';

import { useEffect, useState } from 'react';
import Reveal from './Reveal';

const TESTIMONIALS = [
  {
    quote:
      'Working with Grupo has been excellent experience. They are attentive, have very good communication and have delivered garments to me which are faultless quality. I am looking forward to placing my next order with them.',
    brand: 'SPACE WOMEN',
    country: 'United Kingdom',
  },
  {
    quote:
      'We’ve been working with Grupo for the past three years, and our experience has been consistently positive. They are particularly strong in handling bulk production and export orders, with reliable timelines and excellent attention to quality. From manufacturing and quality control to documentation and export coordination, the Grupo team manages the entire process smoothly. Our products have consistently been delivered to the expected standards, even on larger-volume orders. We highly recommend Grupo to brands and businesses looking for a dependable manufacturing and export partner from India.',
    brand: 'MAKE A SCENE',
    country: 'United Kingdom',
  },
  {
    quote:
      'When we started our fashion brand, we initially planned to manufacture in China. However, concerns around communication, logistics, coordination, and managing production remotely made us explore alternatives. That’s when we decided to work with Grupo in India, and it turned out to be the right decision for us. It has now been three years of working with Grupo, and they have become a reliable manufacturing partner for our brand. From product development and production to quality control and timely delivery, their team handles the process professionally and communicates clearly throughout. We’re very happy with the quality of their work and look forward to continuing our partnership with Grupo.',
    brand: 'MALCRIADO',
    country: 'USA',
  },
  {
    quote:
      'We first came across Grupo at a manufacturing event in Dubai. We were initially cautious, so we started by developing a few samples with them. The sample quality was excellent and gave us the confidence to move forward with our first bulk order. It has now been over two years of working with Grupo, and they have become a trusted manufacturing partner for us. Their team is particularly strong when it comes to handling export orders, from production and quality control to documentation, coordination, and timely shipment. Communication has been smooth throughout, and they have consistently delivered to our expectations. We’re happy to continue working with Grupo for our upcoming collections and bulk requirements.',
    brand: 'TESSERACT',
    country: 'UAE',
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, index]);

  const goTo = (next: number) => {
    setIndex(((next % TESTIMONIALS.length) + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <section
      id="testimonials"
      className="relative scroll-mt-20 overflow-hidden bg-surface py-20 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 45% 40% at 50% 100%, rgba(28,143,215,0.08), transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="up">
          <div className="max-w-2xl">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7] sm:text-xs">
              Social Proof
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Testimonials.
              <span className="mt-1 block text-[#1C8FD7]">Trusted by Global Buyers.</span>
            </h2>
            <p className="font-body mt-5 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Real feedback from brands who manufacture with Grupo across markets, categories, and
              order sizes.
            </p>
          </div>
        </Reveal>

        <Reveal from="up" delay={0.12}>
          <div className="mt-12 sm:mt-16">
            <div className="overflow-hidden border-t border-[#1C8FD7]/30 pt-8 sm:pt-10">
              <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {TESTIMONIALS.map((item, i) => (
                  <blockquote
                    key={item.brand}
                    className="w-full shrink-0 px-0"
                    aria-hidden={i !== index}
                  >
                    <div className="mx-auto max-w-4xl">
                      <p className="font-heading text-5xl font-black leading-none text-[#1C8FD7]/35 sm:text-6xl">
                        “
                      </p>
                      <p className="font-body mt-2 text-lg leading-relaxed text-foreground/80 sm:text-xl sm:leading-relaxed">
                        {item.quote}
                      </p>
                      <footer className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-foreground/10 pt-5">
                        <div>
                          <cite className="font-heading not-italic text-base font-bold uppercase tracking-wide text-foreground sm:text-lg">
                            {item.brand}
                          </cite>
                          <p className="font-nav mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground/50">
                            {item.country}
                          </p>
                        </div>
                        <p className="font-nav text-[11px] uppercase tracking-[0.16em] text-foreground/35">
                          {String(i + 1).padStart(2, '0')} /{' '}
                          {String(TESTIMONIALS.length).padStart(2, '0')}
                        </p>
                      </footer>
                    </div>
                  </blockquote>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {TESTIMONIALS.map((item, i) => (
                  <button
                    key={item.brand}
                    type="button"
                    aria-label={`Show testimonial from ${item.brand}`}
                    onClick={() => goTo(i)}
                    className={`h-1.5 transition-all duration-300 ${
                      i === index
                        ? 'w-10 bg-[#1C8FD7]'
                        : 'w-6 bg-foreground/10 hover:bg-foreground/25'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => goTo(index - 1)}
                  className="font-nav inline-flex h-10 w-10 items-center justify-center border border-brand/20 text-[#1C8FD7] transition-colors hover:border-[#1C8FD7] hover:bg-[#1C8FD7] hover:text-surface"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => goTo(index + 1)}
                  className="font-nav inline-flex h-10 w-10 items-center justify-center border border-brand/20 text-[#1C8FD7] transition-colors hover:border-[#1C8FD7] hover:bg-[#1C8FD7] hover:text-surface"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
