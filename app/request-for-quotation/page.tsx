import type { Metadata } from 'next';
import Navbar from '../components/landing/Navbar';
import Reveal from '../components/landing/Reveal';
import RfqForm from './RfqForm';

export const metadata: Metadata = {
  title: 'Request for Quotation | Grupo',
  description: 'Tell Grupo what you want to manufacture and get a quotation for your apparel order.',
};

export default function RfqPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 45% at 85% 0%, rgba(28, 143, 215, 0.14), transparent 65%),
            radial-gradient(ellipse 45% 40% at 0% 100%, rgba(28, 143, 215, 0.08), transparent 70%)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(28,143,215,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(28,143,215,0.07) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
        aria-hidden
      />

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
