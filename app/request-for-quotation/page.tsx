import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '../components/landing/Navbar';
import Reveal from '../components/landing/Reveal';
import RfqForm from './RfqForm';

export const metadata: Metadata = {
  title: 'Request for Quotation | Grupo',
  description: 'Tell Grupo what you want to manufacture and get a quotation for your apparel order.',
};

const COLLAGE_COLUMNS = [
  ['t-shirt.jpg', 'denim-jackets.webp', 'hoodies.jpg', 'polos.webp'],
  ['leather-jackets.webp', 'acid-wash-t-shirt.jpg', 'joggers.webp', 'plain-shirts.jpg'],
  ['jerseys.webp', 'acid-wash-hoodie.webp', 'bowling-shirts.webp', 'jeans.jpg'],
  ['polos.webp', 'shorts.jpg', 'leather-jackets.webp', 't-shirt.jpg'],
  ['denim-jackets.webp', 'plain-shirts.jpg', 'acid-wash-t-shirt.jpg', 'hoodies.jpg'],
];

function ClothingCollage() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -inset-x-[15%] -top-[20%] -bottom-[20%] flex -rotate-[8deg] gap-4 sm:gap-6">
        {COLLAGE_COLUMNS.map((column, i) => (
          <div
            key={i}
            className={`flex-1 ${i >= 3 ? 'hidden md:block' : ''}`}
            style={{ marginTop: i % 2 ? '-6rem' : 0 }}
          >
            <div
              className="rfq-collage-column flex flex-col gap-4 sm:gap-6"
              style={
                {
                  '--rfq-collage-duration': `${80 + i * 12}s`,
                  '--rfq-collage-direction': i % 2 ? 'reverse' : 'normal',
                } as CSSProperties
              }
            >
              {[...column, ...column].map((file, j) => (
                <div key={j} className="relative aspect-[3/4] w-full overflow-hidden bg-brand/5">
                  <Image
                    src={`/Categories/${file}`}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 20vw, 34vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-surface/80" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 55% 70% at 50% 55%, rgba(254, 255, 255, 0.9), transparent 75%),
            radial-gradient(ellipse 60% 45% at 85% 0%, rgba(28, 143, 215, 0.16), transparent 65%),
            radial-gradient(ellipse 45% 40% at 0% 100%, rgba(28, 143, 215, 0.1), transparent 70%)
          `,
        }}
      />
    </div>
  );
}

export default function RfqPage() {
  return (
    <div className="hide-scrollbars relative min-h-screen overflow-hidden bg-surface text-foreground">
      <ClothingCollage />

      <Navbar />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
        <Reveal from="up" duration={0.7}>
          <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand sm:text-xs">Custom Manufacturing</p>
          <h1 className="font-heading mt-3 mb-10 text-4xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-5xl">
            Request for Quotation<span className="text-brand">.</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.1} duration={0.8}>
          <RfqForm />
        </Reveal>
      </main>
    </div>
  );
}
