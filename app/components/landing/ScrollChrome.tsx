'use client';

import { useEffect, useState } from 'react';

export default function ScrollChrome() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const next = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      setProgress(next);
      setShowTop(scrollTop > 420);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full bg-transparent"
        aria-hidden
      >
        <div
          className="h-full origin-left bg-[#1C8FD7] shadow-[0_0_12px_rgba(28,143,215,0.65)] transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-[60] inline-flex h-11 w-11 items-center justify-center border border-[#1C8FD7]/40 bg-[#0a0f14]/90 text-[#1C8FD7] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:border-[#1C8FD7] hover:bg-[#1C8FD7] hover:text-[#0b1220] sm:bottom-8 sm:right-8 ${
          showTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
