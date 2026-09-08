'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Reveal from './Reveal';

type Dest = { id: string; label: string; y: number; delay: number; duration: number };

const HUB_X = 130;
const HUB_Y = 260;
const DEST_X = 860;

const DESTINATIONS: Dest[] = [
  { id: 'usa', label: 'USA', y: 60, delay: 0, duration: 3.4 },
  { id: 'uk', label: 'UK', y: 180, delay: 0.5, duration: 3.4 },
  { id: 'europe', label: 'EUROPE', y: 300, delay: 1, duration: 3.4 },
  { id: 'uae', label: 'UAE', y: 420, delay: 1.5, duration: 3.4 },
];

const VIEW_W = 1000;
const VIEW_H = 480;

function linePath(x1: number, y1: number, x2: number, y2: number) {
  const cx = x1 + (x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

const labelFont = 'var(--font-ibm-plex-mono), ui-monospace, monospace';

export default function GlobalReach() {
  const reactId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setActive(true),
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
          <div className="relative mt-14 sm:mt-16 lg:mt-20">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-auto w-full"
              role="img"
              aria-label="Diagram showing shipments from India to USA, UK, Europe, and UAE"
            >
              <defs>
                <linearGradient id={`${reactId}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1C8FD7" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#1C8FD7" stopOpacity="0.9" />
                </linearGradient>
                <filter id={`${reactId}-glow`} x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* connecting lines */}
              {DESTINATIONS.map((d) => (
                <g key={`line-${d.id}`}>
                  <path
                    d={linePath(HUB_X, HUB_Y, DEST_X, d.y)}
                    fill="none"
                    stroke="#0b1220"
                    strokeOpacity="0.08"
                    strokeWidth="1.5"
                  />
                  {active && (
                    <circle r="4" fill="#1C8FD7" filter={`url(#${reactId}-glow)`}>
                      <animateMotion
                        dur={`${d.duration}s`}
                        begin={`${d.delay}s`}
                        repeatCount="indefinite"
                        path={linePath(HUB_X, HUB_Y, DEST_X, d.y)}
                      />
                    </circle>
                  )}
                </g>
              ))}

              {/* destination circles, stacked on the right */}
              {DESTINATIONS.map((d) => (
                <g key={d.id} transform={`translate(${DEST_X} ${d.y})`}>
                  {active && (
                    <circle r="8" fill="none" stroke="#1C8FD7" strokeOpacity="0.35">
                      <animate
                        attributeName="r"
                        values="8;22;8"
                        dur="2.6s"
                        begin={`${d.delay}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0;0.4"
                        dur="2.6s"
                        begin={`${d.delay}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle r="34" fill="#ffffff" stroke="#1C8FD7" strokeOpacity="0.25" strokeWidth="1.5" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0b1220"
                    fontSize="15"
                    fontWeight="700"
                    letterSpacing="0.06em"
                    style={{ fontFamily: labelFont }}
                  >
                    {d.label}
                  </text>
                </g>
              ))}

              {/* hub */}
              <g transform={`translate(${HUB_X} ${HUB_Y})`}>
                {active && (
                  <>
                    <circle r="46" fill="none" stroke="#1C8FD7" strokeOpacity="0.2" strokeWidth="1.5">
                      <animate attributeName="r" values="44;72;44" dur="3.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="3.2s" repeatCount="indefinite" />
                    </circle>
                    <circle r="46" fill="none" stroke="#1C8FD7" strokeOpacity="0.15" strokeWidth="1.5">
                      <animate attributeName="r" values="44;90;44" dur="3.2s" begin="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="3.2s" begin="0.8s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                <circle r="80" fill="#1C8FD7" fillOpacity="0.08" />
                <circle
                  r="68"
                  fill="#0b1220"
                  style={{ filter: 'drop-shadow(0 0 30px rgba(28,143,215,0.45))' }}
                />
                <text
                  y="-8"
                  textAnchor="middle"
                  fill="#ffffff"
                  fillOpacity="0.5"
                  fontSize="11"
                  fontWeight="500"
                  letterSpacing="0.2em"
                  style={{ fontFamily: labelFont }}
                >
                  ORIGIN
                </text>
                <text
                  y="16"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="20"
                  fontWeight="800"
                  letterSpacing="0.06em"
                  style={{ fontFamily: labelFont }}
                >
                  INDIA
                </text>
              </g>
            </svg>

            <p className="font-nav -mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/45 sm:text-left">
              Manufacturing HQ
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}