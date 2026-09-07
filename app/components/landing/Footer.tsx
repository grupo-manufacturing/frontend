'use client';

import Link from 'next/link';

const exploreLinks = [
  { name: 'About', href: '/#about' },
  { name: 'Products', href: '/#products' },
  { name: 'Our Process', href: '/#process' },
  { name: 'Wholesale Shop', href: '/shop' },
];

const legalLinks = [
  { name: 'Terms & Conditions', href: '/terms-and-conditions' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Refund Policy', href: '/refund-policy' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0a0f14] text-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 60% at 0% 100%, rgba(28, 143, 215, 0.22), transparent 55%),
            radial-gradient(ellipse 40% 50% at 100% 0%, rgba(28, 143, 215, 0.12), transparent 50%)
          `,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 py-12 sm:grid-cols-3 sm:gap-12 lg:grid-cols-12 lg:py-14">
          <div className="col-span-2 sm:col-span-3 lg:col-span-3">
            <Link href="/" className="inline-block" aria-label="Grupo home">
              <span className="font-brand text-3xl font-bold leading-none text-[#1C8FD7]">Grupo</span>
            </Link>
            <p className="font-nav mt-3 text-[11px] uppercase tracking-[0.18em] text-surface/45">
              Global Manufacturing Network
            </p>
          </div>

          <div className="lg:col-span-3">
            <p className="font-nav text-[10px] uppercase tracking-[0.2em] text-[#1C8FD7]">Explore</p>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-surface/65 transition-colors duration-200 hover:text-surface"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="font-nav text-[10px] uppercase tracking-[0.2em] text-[#1C8FD7]">Legal</p>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-surface/65 transition-colors duration-200 hover:text-surface"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <p className="font-nav text-[10px] uppercase tracking-[0.2em] text-[#1C8FD7]">Markets</p>
            <p className="font-nav mt-4 text-xs uppercase tracking-[0.16em] text-surface/70">
              GB · US · AE · EU
            </p>
            <p className="font-body mt-3 max-w-xs text-sm leading-relaxed text-surface/50">
              Manufactured in India. Delivered to globally reputed buyers worldwide.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-surface/10 py-6 sm:flex-row sm:items-center">
          <p className="font-body text-xs text-surface/45">
            © {new Date().getFullYear()} Grupo. All rights reserved.
          </p>
          <p className="font-nav text-[10px] uppercase tracking-[0.16em] text-surface/35">
            Built for global brands
          </p>
        </div>
      </div>
    </footer>
  );
}
