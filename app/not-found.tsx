import Link from 'next/link';
import Navbar from './components/landing/Navbar';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0f14]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 55% 45% at 20% 20%, rgba(28,143,215,0.22), transparent 60%),
            radial-gradient(ellipse 40% 35% at 85% 75%, rgba(28,143,215,0.12), transparent 55%),
            linear-gradient(rgba(28,143,215,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28,143,215,0.08) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 56px 56px, 56px 56px',
        }}
        aria-hidden
      />

      <Navbar variant="dark" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-28 text-center sm:px-6">
        <p className="font-nav text-[11px] uppercase tracking-[0.2em] text-[#1C8FD7] sm:text-xs">
          Error 404
        </p>
        <h1 className="font-heading mt-4 text-6xl font-black uppercase tracking-[-0.03em] text-surface sm:text-7xl md:text-8xl">
          Lost
          <span className="mt-1 block text-[#1C8FD7]">in Production.</span>
        </h1>
        <p className="font-body mx-auto mt-6 max-w-md text-base leading-relaxed text-surface/70 sm:text-lg">
          This page doesn&apos;t exist — or it moved. Head back home or explore products to keep
          manufacturing on track.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="font-nav inline-flex items-center bg-[#1C8FD7] px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-surface transition-opacity hover:opacity-90"
          >
            Back Home
          </Link>
          <Link
            href="/shop"
            className="font-nav inline-flex items-center border border-surface/25 px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-surface transition-colors hover:border-[#1C8FD7] hover:text-[#1C8FD7]"
          >
            Explore Products →
          </Link>
        </div>
      </main>
    </div>
  );
}
