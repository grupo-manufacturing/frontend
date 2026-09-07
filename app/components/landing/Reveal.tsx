'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  from?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
  once?: boolean;
};

const OFFSETS: Record<NonNullable<RevealProps['from']>, string> = {
  up: 'translate3d(0, 32px, 0)',
  down: 'translate3d(0, -24px, 0)',
  left: 'translate3d(-40px, 0, 0)',
  right: 'translate3d(40px, 0, 0)',
  scale: 'scale(0.94)',
  none: 'none',
};

export default function Reveal({
  children,
  className = '',
  delay = 0,
  duration = 0.85,
  from = 'up',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : OFFSETS[from],
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}s`,
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: `${delay}s`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
