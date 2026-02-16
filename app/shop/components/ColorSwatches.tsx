'use client';

/* ── Color name → hex mapping ───────────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  White: '#FFFFFF',
  Black: '#1a1a1a',
  Navy: '#1e3a5f',
  Gray: '#808080',
  Red: '#dc2626',
  Blue: '#2563eb',
  Maroon: '#7f1d1d',
  Olive: '#556b2f',
  'Light Blue': '#93c5fd',
  Khaki: '#c3b091',
};

interface ColorSwatchesProps {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
}

export default function ColorSwatches({ colors, selected, onChange }: ColorSwatchesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-gray-700">Color</label>
        <span className="text-sm text-gray-500">{selected}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const hex = COLOR_MAP[color] ?? '#cccccc';
          const isSelected = selected === color;
          const isLight = ['White', 'Khaki', 'Light Blue'].includes(color);

          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`relative w-10 h-10 rounded-full transition-all focus:outline-none ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-[#22a2f2] scale-110'
                  : 'ring-1 ring-gray-200 hover:ring-gray-400 hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
              aria-label={`Select ${color}`}
              aria-pressed={isSelected}
              title={color}
            >
              {/* Checkmark for selected */}
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className={`w-5 h-5 ${isLight ? 'text-gray-800' : 'text-white'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}

              {/* Border for white/light swatches */}
              {isLight && !isSelected && (
                <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-gray-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
