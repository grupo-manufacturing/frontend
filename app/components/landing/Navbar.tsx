'use client';

import Link from 'next/link';
import { useState } from 'react';

type NavbarProps = {
  variant?: 'light' | 'dark';
};

const REQUIREMENTS_FORM_URL =
  'https://docs.google.com/forms/d/114Qw4OD6VwlmHql6PTdf-xSGyFjTmrknXK8kMuQK7_4/viewform';

const Navbar = ({ variant = 'light' }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDark = variant === 'dark';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md animate-[nav-slide-down_0.7s_cubic-bezier(0.22,1,0.36,1)_both] ${
        isDark
          ? 'border-surface/10 bg-black/20'
          : 'border-brand/15 bg-surface/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-shrink-0 z-10">
            <Link href="/" className="inline-flex items-center" aria-label="Grupo home">
              <span className="font-brand text-3xl font-bold leading-none text-brand">
                Grupo
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 z-10">
            <Link
              href="/shop"
              className={`font-nav hidden sm:inline-flex items-center justify-center border px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] transition-colors duration-200 sm:text-[11px] ${
                isDark
                  ? 'border-surface/80 text-surface hover:border-brand hover:text-brand'
                  : 'border-foreground/25 text-foreground hover:border-brand hover:text-brand'
              }`}
            >
              Explore Products →
            </Link>
            <Link
              href={REQUIREMENTS_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-nav hidden sm:inline-flex items-center justify-center bg-brand px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-colors duration-200 hover:bg-[#1678B5] hover:text-surface sm:text-[11px]"
            >
              Request For Quotation →
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`sm:hidden inline-flex items-center justify-center p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand ${
                isDark
                  ? 'text-surface/85 hover:text-brand hover:bg-surface/10'
                  : 'text-foreground/80 hover:text-brand hover:bg-brand/5'
              }`}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className={`sm:hidden border-t ${
            isDark ? 'bg-[#0a0f14]/95 border-surface/10' : 'bg-surface border-brand/15'
          }`}
        >
          <div className="flex flex-col gap-2 px-4 py-3">
            <Link
              href="/shop"
              className={`font-nav inline-flex items-center justify-center border px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] ${
                isDark ? 'border-surface/80 text-surface' : 'border-foreground/25 text-foreground'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Explore Products →
            </Link>
            <Link
              href={REQUIREMENTS_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-nav inline-flex items-center justify-center bg-brand px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220]"
              onClick={() => setIsMenuOpen(false)}
            >
              Request For Quotation →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
