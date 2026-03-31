'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const LOCATIONS = {
  uk:     { cx: 480, cy: 148, label: 'UK',    flag: '🇬🇧', color: '#22a2f2' },
  usa:    { cx: 220, cy: 185, label: 'USA',   flag: '🇺🇸', color: '#06b6d4' },
  dubai:  { cx: 618, cy: 218, label: 'Dubai', flag: '🇦🇪', color: '#8b5cf6' },
  india:  { cx: 672, cy: 248, label: 'India', flag: '🇮🇳', color: '#22a2f2' },
  eu:     { cx: 510, cy: 138, label: 'EU',    flag: '🇪🇺', color: '#06b6d4' },
};

// Curved arc path between two points (negative curvature = arc upward)
function arcPath(x1: number, y1: number, x2: number, y2: number, bend = -0.25) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - bend * dy;
  const cy = my + bend * dx;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

const ROUTES = [
  { from: 'usa',   to: 'uk',    delay: 0,   duration: 3.5, color: '#22a2f2' },
  { from: 'uk',    to: 'dubai', delay: 1.2, duration: 3.2, color: '#06b6d4' },
  { from: 'dubai', to: 'india', delay: 2.1, duration: 2.4, color: '#8b5cf6' },
  { from: 'usa',   to: 'india', delay: 0.6, duration: 4.2, color: '#22a2f2' },
  { from: 'eu',    to: 'usa',   delay: 1.8, duration: 3.8, color: '#06b6d4' },
];

const Hero = () => {
  const [mounted, setMounted] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[45%_55%] gap-12 lg:items-stretch">

          {/* ── Left Content (unchanged) ── */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 mb-8">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium">Built for fast-moving apparel teams</span>
            </div>

            <div className="space-y-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Your Fashion Brands <span className="text-[#22a2f2]">Manufacturing Partner</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Grupo provides manufacturing for D2C Fashion Brands and Wholesalers globally with real-time collaboration, structured payments, and milestone tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Link href="/buyer-portal" className="bg-[#22a2f2] hover:bg-[#1c8fd7] text-white font-semibold px-8 py-3 rounded-lg border-2 border-[#22a2f2] transition-colors duration-200 text-center">
                  Request for Quotation
                </Link>
              </div>
            </div>
          </div>

          {/* ── Right Content — Real World Map ── */}
          <div className="relative flex flex-col h-full justify-center">
            <style>{`
              @keyframes pulse-ring {
                0%   { r: 8;  opacity: 0.9; }
                50%  { r: 13; opacity: 0.3; }
                100% { r: 8;  opacity: 0.9; }
              }
              @keyframes travel {
                0%   { offset-distance: 0%;   opacity: 0; }
                8%   { opacity: 1; }
                92%  { opacity: 1; }
                100% { offset-distance: 100%; opacity: 0; }
              }
              @keyframes routeDraw {
                to { stroke-dashoffset: 0; }
              }
              @keyframes fadeUp {
                from { opacity: 0; transform: translateY(12px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .map-wrap { animation: fadeUp 0.9s ease-out both; }
              .pulse-ring { animation: pulse-ring 2.2s ease-in-out infinite; }
              .traveller  { animation: travel 4s ease-in-out infinite; }
            `}</style>

            <div className="relative w-full rounded-2xl overflow-hidden map-wrap" style={{ aspectRatio: '16/9' }}>
              {/* Dark background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0a1a3a] to-[#060d1f]" />

              {/* Subtle grid */}
              <div className="absolute inset-0 opacity-[0.07]" style={{
                backgroundImage: 'linear-gradient(rgba(34,162,242,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,162,242,0.6) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }} />

              {/* Glow orbs */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="60 70 840 410"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="softglow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* ── Actual World Map (Natural Earth simplified) ── */}
                <g fill="#1a3a6b" stroke="#22a2f2" strokeWidth="0.4" opacity="0.55">
                  {/* North America */}
                  <path d="M60,80 L85,72 L110,68 L140,65 L160,70 L175,80 L185,95 L190,115 L195,130 L200,150 L205,170 L200,190 L190,210 L180,225 L170,235 L160,245 L150,255 L145,268 L155,275 L165,270 L170,265 L180,260 L185,270 L175,280 L165,290 L155,295 L145,300 L135,295 L125,290 L115,285 L105,280 L95,270 L85,258 L80,245 L78,230 L75,215 L70,200 L65,185 L60,170 L55,155 L52,140 L50,125 L52,110 L56,95 Z" />
                  {/* Greenland */}
                  <path d="M300,30 L330,25 L355,28 L370,40 L375,58 L365,70 L345,75 L320,72 L305,60 L298,45 Z" />
                  {/* South America */}
                  <path d="M165,295 L185,285 L205,280 L225,278 L240,282 L250,295 L255,315 L258,340 L255,365 L248,390 L238,415 L225,435 L210,450 L195,458 L180,455 L168,445 L160,428 L155,408 L152,385 L150,360 L150,335 L152,310 Z" />
                  {/* Europe */}
                  <path d="M455,80 L475,72 L495,70 L515,74 L530,82 L538,95 L535,108 L525,118 L512,125 L498,128 L485,125 L475,118 L468,108 L462,98 Z" />
                  {/* Scandinavia */}
                  <path d="M480,55 L492,45 L505,42 L518,48 L522,60 L515,72 L500,76 L486,72 L478,62 Z" />
                  {/* UK */}
                  <path d="M462,108 L472,104 L480,108 L482,118 L476,125 L466,122 L460,115 Z" />
                  {/* Africa */}
                  <path d="M490,180 L510,168 L535,162 L558,163 L578,170 L592,183 L600,200 L602,222 L598,245 L590,268 L578,290 L562,310 L545,328 L528,342 L512,350 L496,348 L482,338 L470,322 L462,302 L458,280 L458,258 L462,236 L470,215 L480,196 Z" />
                  {/* Middle East */}
                  <path d="M568,160 L590,152 L615,148 L635,152 L648,163 L650,178 L642,190 L625,196 L605,198 L588,193 L574,182 Z" />
                  {/* India */}
                  <path d="M638,195 L660,190 L678,192 L692,202 L698,218 L696,235 L688,252 L675,268 L660,278 L645,278 L633,268 L625,252 L622,234 L625,215 Z" />
                  {/* Southeast Asia */}
                  <path d="M720,185 L745,178 L768,178 L785,185 L792,198 L788,212 L772,220 L750,222 L730,218 L716,208 Z" />
                  {/* China */}
                  <path d="M695,128 L730,118 L768,115 L800,118 L825,128 L840,145 L842,165 L832,182 L812,192 L788,196 L762,194 L738,186 L718,174 L702,158 L695,142 Z" />
                  {/* Russia */}
                  <path d="M530,55 L580,42 L650,35 L720,32 L790,35 L845,45 L878,58 L895,75 L888,92 L862,102 L825,108 L782,110 L738,108 L694,104 L650,100 L605,98 L562,98 L528,95 L510,82 L518,66 Z" />
                  {/* Australia */}
                  <path d="M755,330 L790,320 L825,318 L858,322 L882,335 L895,355 L895,378 L882,398 L858,410 L825,415 L792,412 L762,400 L742,382 L735,360 L738,340 Z" />
                  {/* Japan */}
                  <path d="M838,148 L848,142 L858,145 L862,155 L856,165 L844,168 L836,160 Z" />
                </g>

                {/* ── Animated Routes ── */}
                {mounted && ROUTES.map((r, i) => {
                  const from = LOCATIONS[r.from as keyof typeof LOCATIONS];
                  const to   = LOCATIONS[r.to   as keyof typeof LOCATIONS];
                  const d    = arcPath(from.cx, from.cy, to.cx, to.cy, -0.3);
                  // approximate path length for dasharray
                  const dx = to.cx - from.cx, dy = to.cy - from.cy;
                  const approxLen = Math.sqrt(dx*dx + dy*dy) * 1.35 + 60;

                  return (
                    <g key={i}>
                      {/* Static faint route */}
                      <path d={d} fill="none" stroke={r.color} strokeWidth="0.8" opacity="0.18" strokeDasharray="4 4" />

                      {/* Animated draw-on line */}
                      <path
                        ref={el => { pathRefs.current[i] = el; }}
                        d={d}
                        fill="none"
                        stroke={r.color}
                        strokeWidth="1.6"
                        opacity="0.7"
                        strokeLinecap="round"
                        strokeDasharray={approxLen}
                        strokeDashoffset={approxLen}
                        filter="url(#glow)"
                        style={{
                          animation: `routeDraw ${r.duration}s ease-in-out ${r.delay}s infinite alternate`,
                        }}
                      />

                      {/* Travelling dot */}
                      <circle
                        r="4"
                        fill="#fbbf24"
                        filter="url(#glow)"
                        className="traveller"
                        style={{
                          offsetPath: `path("${d}")`,
                          animationDelay: `${r.delay + 0.4}s`,
                          animationDuration: `${r.duration + 0.8}s`,
                        } as React.CSSProperties}
                      />
                    </g>
                  );
                })}

                {/* ── Location Pins ── */}
                {Object.entries(LOCATIONS).map(([key, loc]) => (
                  <g key={key} filter="url(#softglow)">
                    {/* Pulse ring */}
                    <circle cx={loc.cx} cy={loc.cy} r="8" fill="none" stroke={loc.color} strokeWidth="1.5"
                      className="pulse-ring"
                      style={{ animationDelay: `${Math.random() * 1.5}s` }}
                    />
                    {/* Core dot */}
                    <circle cx={loc.cx} cy={loc.cy} r="5" fill={loc.color} opacity="0.95" />
                    <circle cx={loc.cx} cy={loc.cy} r="2.5" fill="#ffffff" opacity="0.9" />

                    {/* Label pill */}
                    <rect
                      x={loc.cx - 28} y={loc.cy - 30} width="56" height="18"
                      rx="9" ry="9"
                      fill="#0a1a3a" stroke={loc.color} strokeWidth="0.8" opacity="0.92"
                    />
                    <text
                      x={loc.cx} y={loc.cy - 17}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill={loc.color}
                      fontFamily="'Segoe UI', sans-serif"
                      letterSpacing="0.5"
                    >
                      {loc.flag} {loc.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* ── Stat Legend Cards (bottom-left) ── */}
              <div className="absolute bottom-3 left-3 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-[148px]">
                  <div className="w-7 h-7 rounded-lg bg-[#22a2f2]/20 border border-[#22a2f2]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#22a2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 leading-tight">Total Manufacturers</p>
                    <p className="text-sm font-bold text-white leading-tight">2,400+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-[148px]">
                  <div className="w-7 h-7 rounded-lg bg-[#06b6d4]/20 border border-[#06b6d4]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#06b6d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 leading-tight">Countries Served</p>
                    <p className="text-sm font-bold text-white leading-tight">38</p>
                  </div>
                </div>
              </div>

              {/* ── Stat Legend Cards (bottom-right) ── */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-2 items-end">
                <div className="flex items-center gap-2.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-[148px]">
                  <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 leading-tight">Orders Shipped</p>
                    <p className="text-sm font-bold text-white leading-tight">18,500+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-[148px]">
                  <div className="w-7 h-7 rounded-lg bg-[#22a2f2]/20 border border-[#22a2f2]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#22a2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 leading-tight">Avg. Satisfaction</p>
                    <p className="text-sm font-bold text-white leading-tight">4.8 / 5.0</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;