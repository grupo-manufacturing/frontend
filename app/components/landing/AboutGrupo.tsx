'use client';

import Image from 'next/image';
import Reveal from './Reveal';

const STORY = [
  `In 2021, Ajith was a student in Germany trying to launch a fashion brand with Indian craftsmanship. Months of WhatsApp leads, silent factories, and 500-piece MOQs made it clear: the problem wasn't capacity — it was access, trust, and infrastructure.`,
  `He returned to India and founded Grupo in December 2023 — a manufacturing operating system for global fashion brands. Today, brands across the UK, US, and UAE get accurate quotes, real-time production tracking, direct communication, and QC verification before goods ship.`,
  `The student who couldn't find a factory built the platform so no one else has to look.`,
];

export default function AboutGrupo() {
  return (
    <section id="about" className="relative scroll-mt-20 overflow-hidden bg-surface py-16 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 45% at 15% 20%, rgba(28, 143, 215, 0.1), transparent 65%),
            radial-gradient(ellipse 40% 40% at 90% 70%, rgba(28, 143, 215, 0.07), transparent 70%)
          `,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <Reveal from="up">
              <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand sm:text-xs">
                About Grupo
              </p>
              <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl">
                The Man Behind
                <span className="mt-1 block text-brand">the Grupo.</span>
              </h2>
              <p className="font-body mt-4 max-w-xl text-base leading-relaxed text-foreground/70">
                From a sourcing struggle in Germany to a platform helping global brands manufacture in
                India with confidence.
              </p>
            </Reveal>

            <Reveal from="up" delay={0.12}>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-y border-brand/10 py-4">
                <div>
                  <p className="font-nav text-[10px] uppercase tracking-[0.18em] text-brand">Founded</p>
                  <p className="font-subheading mt-1 text-sm text-foreground">December 2023</p>
                </div>
                <div>
                  <p className="font-nav text-[10px] uppercase tracking-[0.18em] text-brand">Markets</p>
                  <p className="font-subheading mt-1 text-sm text-foreground">UK · US · UAE · Beyond</p>
                </div>
                <div>
                  <p className="font-nav text-[10px] uppercase tracking-[0.18em] text-brand">Founder</p>
                  <p className="font-subheading mt-1 text-sm text-foreground">Ajith</p>
                </div>
              </div>
            </Reveal>

            <div className="mt-6 space-y-4">
              {STORY.map((paragraph, i) => (
                <Reveal key={paragraph.slice(0, 40)} from="up" delay={0.18 + i * 0.1}>
                  <p className="font-body text-sm leading-7 text-foreground/75 sm:text-base sm:leading-7">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5">
            <Reveal from="right" delay={0.2} duration={1}>
              <figure className="mx-auto w-full max-w-sm lg:ml-auto lg:mr-0 lg:max-w-md">
                <div className="relative aspect-[3/4] overflow-hidden border border-brand/20 bg-brand/5 shadow-[0_24px_80px_rgba(28,143,215,0.15)] transition-transform duration-700 hover:scale-[1.02]">
                  <Image
                    src="/Ajith.jpeg"
                    alt="Portrait of Ajith, founder of Grupo"
                    fill
                    sizes="(max-width: 1024px) 384px, 448px"
                    className="object-cover object-top animate-[about-portrait-float_6s_ease-in-out_infinite]"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
                    aria-hidden
                  />
                </div>
                <figcaption className="mt-4 border-l-2 border-brand pl-4">
                  <p className="font-heading text-xl font-semibold text-foreground">Ajith</p>
                  <p className="font-nav mt-1 text-[11px] uppercase tracking-[0.16em] text-brand">
                    Founder, Grupo
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          </aside>
        </div>
      </div>
    </section>
  );
}
