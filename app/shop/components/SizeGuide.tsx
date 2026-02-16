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
        className="inline-flex items-center gap-1.5 text-sm text-[#22a2f2] hover:text-[#1b8bd0] font-medium transition-colors"
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Size Guide</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isBottom ? 'Bottom wear' : 'Top wear'} measurements
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close size guide"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Unit toggle */}
            <div className="flex items-center gap-1 p-5 pb-0">
              <span className="text-xs text-gray-500 mr-2">Unit:</span>
              <button
                onClick={() => setUnit('in')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  unit === 'in'
                    ? 'bg-[#22a2f2] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  unit === 'cm'
                    ? 'bg-[#22a2f2] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                CM
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-5">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">
                        Size
                      </th>
                      {isBottom ? (
                        <>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Waist</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Hip</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Length</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Inseam</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Chest</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Length</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Shoulder</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <tr key={row.size} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.size}</td>
                        {isBottom ? (
                          <>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.waist)}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.hip)}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.length)}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.inseam)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.chest)}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.length)}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{toCm(row.shoulder)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Measurement tip */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-[#22a2f2] font-medium mb-1">How to Measure</p>
                <p className="text-xs text-gray-600 leading-relaxed">
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
