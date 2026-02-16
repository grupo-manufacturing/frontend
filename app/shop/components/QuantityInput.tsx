'use client';

import { useState, useEffect, useCallback } from 'react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

const MIN_ORDER = 10;

export default function QuantityInput({
  value,
  onChange,
  min = MIN_ORDER,
  step = 10,
}: QuantityInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [error, setError] = useState('');

  /* Keep display in sync when value changes externally */
  useEffect(() => {
    setDisplayValue(String(value));
  }, [value]);

  const validate = useCallback(
    (raw: string): { valid: boolean; num: number; message: string } => {
      const trimmed = raw.trim();

      if (trimmed === '') {
        return { valid: false, num: 0, message: '' };
      }

      // Reject decimals
      if (trimmed.includes('.') || trimmed.includes(',')) {
        return { valid: false, num: 0, message: 'Whole numbers only' };
      }

      const num = Number(trimmed);

      if (isNaN(num)) {
        return { valid: false, num: 0, message: 'Enter a valid number' };
      }

      if (num <= 0) {
        return { valid: false, num: 0, message: 'Must be a positive number' };
      }

      if (num < min) {
        return { valid: false, num, message: `Minimum order is ${min} units` };
      }

      return { valid: true, num, message: '' };
    },
    [min]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setDisplayValue(raw);

    const result = validate(raw);
    setError(result.message);
    if (result.valid) {
      onChange(result.num);
    }
  }

  function handleBlur() {
    const result = validate(displayValue);
    if (!result.valid) {
      const corrected = Math.max(min, result.num || min);
      setDisplayValue(String(corrected));
      onChange(corrected);
      setError('');
    }
  }

  function increment() {
    const next = Math.max(min, value + step);
    onChange(next);
    setError('');
  }

  function decrement() {
    const next = Math.max(min, value - step);
    onChange(next);
    setError('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-700">
          Number of Units
        </label>
        <span className="text-xs text-gray-400">Min. {min} units</span>
      </div>

      <div className="flex items-stretch">
        {/* Decrement */}
        <button
          onClick={decrement}
          disabled={value <= min}
          className="px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-xl border border-r-0 border-gray-200 transition-colors text-gray-600 font-medium text-lg"
          aria-label="Decrease quantity"
        >
          &minus;
        </button>

        {/* Input */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full text-center px-4 py-3 border-y border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#22a2f2] transition-all text-base font-medium ${
            error ? 'border-red-300 focus:ring-red-400' : ''
          }`}
          aria-label="Quantity"
          aria-invalid={!!error}
          aria-describedby={error ? 'qty-error' : undefined}
        />

        {/* Increment */}
        <button
          onClick={increment}
          className="px-4 bg-gray-100 hover:bg-gray-200 rounded-r-xl border border-l-0 border-gray-200 transition-colors text-gray-600 font-medium text-lg"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p id="qty-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
