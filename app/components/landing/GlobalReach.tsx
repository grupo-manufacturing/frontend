'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Reveal from './Reveal';

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  labelY?: number;
};

const HUB: Node = { id: 'india', label: 'INDIA', x: 860, y: 330, labelY: 28 };

const DESTINATIONS: Node[] = [
  { id: 'usa', label: 'USA', x: 130, y: 275, labelY: -22 },
  { id: 'uk', label: 'UK', x: 430, y: 145, labelY: -22 },
  { id: 'europe', label: 'EUROPE', x: 535, y: 235, labelY: -22 },
  { id: 'uae', label: 'UAE', x: 685, y: 305, labelY: -22 },
];

const ROUTES: Array<{ to: string; bend: number; delay: number; duration: number }> = [
  { to: 'usa', bend: -0.42, delay: 0, duration: 4.2 },
  { to: 'uk', bend: -0.38, delay: 0.35, duration: 3.4 },
  { to: 'europe', bend: -0.36, delay: 0.7, duration: 3.0 },
  { to: 'uae', bend: -0.48, delay: 1.05, duration: 2.4 },
];

function arcPath(x1: number, y1: number, x2: number, y2: number, bend = -0.35) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - bend * dy;
  const cy = my + bend * dx;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function nodeById(id: string) {
  return DESTINATIONS.find((n) => n.id === id)!;
}

const labelFont = 'var(--font-ibm-plex-mono), ui-monospace, monospace';

export default function GlobalReach() {
  const reactId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [pathLengths, setPathLengths] = useState<number[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          requestAnimationFrame(() => {
            setPathLengths(pathRefs.current.map((p) => (p ? p.getTotalLength() : 0)));
          });
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-surface py-20 sm:py-28">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="up">
          <div className="max-w-2xl">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-brand sm:text-xs">
              Worldwide Network
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Global Reach.
              <span className="mt-1 block text-brand">From India to the World.</span>
            </h2>
            <p className="font-body mt-5 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Manufactured in India. Delivered to globally reputed markets across the United States,
              United Kingdom, Europe, and the UAE.
            </p>
          </div>
        </Reveal>

        <Reveal from="scale" delay={0.15} duration={1}>
          <div className="relative mt-12 sm:mt-16 lg:mt-20">
            <div className="relative overflow-hidden border border-brand/10 bg-surface">
              <div
                className="pointer-events-none absolute inset-0 animate-[map-grid-pulse_8s_ease-in-out_infinite]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(11, 18, 32, 0.045) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(11, 18, 32, 0.045) 1px, transparent 1px)
                  `,
                  backgroundSize: '48px 48px',
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute right-[8%] top-[55%] h-56 w-56 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl sm:h-72 sm:w-72 animate-[map-glow-breathe_4.5s_ease-in-out_infinite]"
                aria-hidden
              />

              <svg
                viewBox="0 0 1000 520"
                className="relative z-10 h-auto w-full"
                role="img"
                aria-label="Network diagram showing connections from India to USA, UK, Europe, and UAE"
              >
                <defs>
                  <linearGradient id={`${reactId}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1C8FD7" stopOpacity="0.25" />
                    <stop offset="45%" stopColor="#1C8FD7" stopOpacity="1" />
                    <stop offset="100%" stopColor="#1C8FD7" stopOpacity="0.35" />
                  </linearGradient>
                  <filter id={`${reactId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {ROUTES.map((route, i) => {
                  const dest = nodeById(route.to);
                  const d = arcPath(HUB.x, HUB.y, dest.x, dest.y, route.bend);
                  const length = pathLengths[i] ?? 0;

                  return (
                    <g key={route.to}>
                      <path
                        d={d}
                        fill="none"
                        stroke="#1C8FD7"
                        strokeOpacity="0.28"
                        strokeWidth="1.75"
                        strokeDasharray="6 8"
                        strokeLinecap="round"
                      />
                      <path
                        ref={(el) => {
                          pathRefs.current[i] = el;
                        }}
                        d={d}
                        fill="none"
                        stroke={`url(#${reactId}-arc)`}
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeDasharray={length ? `${length * 0.18} ${length * 0.82}` : '10 40'}
                        style={
                          active && length
                            ? {
                                animation: `map-route-travel ${route.duration}s linear ${route.delay}s infinite`,
                                ['--map-dash' as string]: String(length),
                              }
                            : undefined
                        }
                      />
                      {active && (
                        <circle r="3.25" fill="#1C8FD7" filter={`url(#${reactId}-glow)`}>
                          <animateMotion
                            dur={`${route.duration}s`}
                            begin={`${route.delay}s`}
                            repeatCount="indefinite"
                            path={d}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {DESTINATIONS.map((node, i) => (
                  <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
                    {active && (
                      <circle r="6" fill="none" stroke="#1C8FD7" strokeOpacity="0.4">
                        <animate
                          attributeName="r"
                          values="5;16;5"
                          dur="2.6s"
                          begin={`${i * 0.28}s`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;0;0.5"
                          dur="2.6s"
                          begin={`${i * 0.28}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <circle r="5.5" fill="#1C8FD7" />
                    <circle r="2" fill="#FEFFFF" />
                    <text
                      y={node.labelY ?? -22}
                      textAnchor="middle"
                      fill="#0b1220"
                      fontSize="12"
                      fontWeight="500"
                      letterSpacing="0.16em"
                      style={{ fontFamily: labelFont }}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}

                <g transform={`translate(${HUB.x} ${HUB.y})`}>
                  {active && (
                    <>
                      <circle r="18" fill="none" stroke="#1C8FD7" strokeOpacity="0.22" strokeWidth="1">
                        <animate attributeName="r" values="16;34;16" dur="3.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.45;0;0.45" dur="3.2s" repeatCount="indefinite" />
                      </circle>
                      <circle r="26" fill="none" stroke="#1C8FD7" strokeOpacity="0.18" strokeWidth="1">
                        <animate attributeName="r" values="22;40;22" dur="3.2s" begin="0.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.35;0;0.35" dur="3.2s" begin="0.6s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                  <circle r="22" fill="none" stroke="#1C8FD7" strokeOpacity="0.35" strokeWidth="1.25" />
                  <circle r="15" fill="none" stroke="#1C8FD7" strokeOpacity="0.55" strokeWidth="1.25" />
                  <circle r="8" fill="#0b1220" />
                  <circle r="2.5" fill="#1C8FD7" />
                  <text
                    y={HUB.labelY ?? 28}
                    textAnchor="middle"
                    fill="#0b1220"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="0.18em"
                    style={{ fontFamily: labelFont }}
                  >
                    {HUB.label}
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand/10 pt-6">
              <p className="font-nav text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                Active export corridors
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 sm:gap-x-8">
                {['GB', 'US', 'AE', 'EU'].map((code, i) => (
                  <li
                    key={code}
                    className="font-nav text-xs uppercase tracking-[0.16em] text-brand transition-transform duration-300 hover:-translate-y-0.5"
                    style={{
                      animation: active
                        ? `hero-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.2 + i * 0.08}s both`
                        : undefined,
                    }}
                  >
                    {code}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
