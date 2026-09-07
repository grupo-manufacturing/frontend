'use client';

import { useState, useEffect } from 'react';

interface SizeGuideProps {
  category: string;
  sizes: string[];
}

type MeasurementRow = {
  size: string;
  chest?: string;
  length?: string;
  shoulder?: string;
  waist?: string;
  hip?: string;
  inseam?: string;
};

/* ── Size data by category ──────────────────────────────────────────── */
const TOP_MEASUREMENTS: Record<string, MeasurementRow> = {
  S: { size: 'S', chest: '36"', length: '27"', shoulder: '16.5"' },
  M: { size: 'M', chest: '38"', length: '28"', shoulder: '17.5"' },
  L: { size: 'L', chest: '40"', length: '29"', shoulder: '18.5"' },
  XL: { size: 'XL', chest: '42"', length: '30"', shoulder: '19.5"' },
  XXL: { size: 'XXL', chest: '44"', length: '31"', shoulder: '20.5"' },
};

const BOTTOM_MEASUREMENTS: Record<string, MeasurementRow> = {
  S: { size: 'S', waist: '28"', hip: '36"', length: '40"', inseam: '30"' },
  M: { size: 'M', waist: '30"', hip: '38"', length: '41"', inseam: '31"' },
  L: { size: 'L', waist: '32"', hip: '40"', length: '42"', inseam: '32"' },
  XL: { size: 'XL', waist: '34"', hip: '42"', length: '43"', inseam: '32"' },
  XXL: { size: 'XXL', waist: '36"', hip: '44"', length: '44"', inseam: '33"' },
};

const BOTTOM_CATEGORIES = ['Pants', 'Shorts'];

export default function SizeGuide({ category, sizes }: SizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  const isBottom = BOTTOM_CATEGORIES.includes(category);
  const measurementSource = isBottom ? BOTTOM_MEASUREMENTS : TOP_MEASUREMENTS;
  const rows = sizes.map((s) => measurementSource[s]).filter(Boolean);

  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Convert inches string to cm */
  function toCm(val?: string) {
    if (!val) return '–';
    if (unit === 'in') return val;
    const num = parseFloat(val);
    return isNaN(num) ? val : `${Math.round(num * 2.54)} cm`;
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="font-nav inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[#1C8FD7] hover:text-[#1678B5] transition-colors"
        aria-label="Open size guide"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Size Guide
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-surface border border-brand/10 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand/10">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">Size Guide</h2>
                <p className="font-body text-xs text-foreground/50 mt-0.5">
                  {isBottom ? 'Bottom wear' : 'Top wear'} measurements
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-foreground/40 hover:text-foreground/70 hover:bg-brand/5 transition-colors"
                aria-label="Close size guide"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Unit toggle */}
            <div className="flex items-center gap-1 p-5 pb-0">
              <span className="font-nav text-[10px] uppercase tracking-[0.12em] text-foreground/50 mr-2">Unit:</span>
              <button
                onClick={() => setUnit('in')}
                className={`font-nav px-3 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                  unit === 'in'
                    ? 'bg-[#1C8FD7] text-[#0b1220]'
                    : 'bg-brand/5 text-foreground/60 hover:bg-brand/10'
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`font-nav px-3 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                  unit === 'cm'
                    ? 'bg-[#1C8FD7] text-[#0b1220]'
                    : 'bg-brand/5 text-foreground/60 hover:bg-brand/10'
                }`}
              >
                CM
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-5">
              <div className="border border-brand/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand/5">
                      <th className="font-nav px-4 py-3 text-left font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">
                        Size
                      </th>
                      {isBottom ? (
                        <>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Waist</th>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Hip</th>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Length</th>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Inseam</th>
                        </>
                      ) : (
                        <>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Chest</th>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Length</th>
                          <th className="font-nav px-4 py-3 text-center font-semibold text-foreground/70 text-[10px] uppercase tracking-[0.14em]">Shoulder</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand/10">
                    {rows.map((row) => (
                      <tr key={row.size} className="hover:bg-brand/5 transition-colors">
                        <td className="font-body px-4 py-3 font-medium text-foreground">{row.size}</td>
                        {isBottom ? (
                          <>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.waist)}</td>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.hip)}</td>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.length)}</td>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.inseam)}</td>
                          </>
                        ) : (
                          <>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.chest)}</td>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.length)}</td>
                            <td className="font-body px-4 py-3 text-center text-foreground/60">{toCm(row.shoulder)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Measurement tip */}
              <div className="mt-4 p-3 bg-brand/5 border border-brand/10">
                <p className="font-nav text-[10px] uppercase tracking-[0.14em] text-[#1C8FD7] font-medium mb-1">How to Measure</p>
                <p className="font-body text-xs text-foreground/60 leading-relaxed">
                  {isBottom
                    ? 'Waist: Measure around your natural waistline. Hip: Measure around the fullest part of your hips. Inseam: Measure from the crotch seam to the ankle.'
                    : 'Chest: Measure around the fullest part of your chest. Length: Measure from the top of the shoulder to the hem. Shoulder: Measure from seam to seam across the back.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
