'use client';

import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

type Country = { code: CountryCode; name: string; dialCode: string };

function buildCountries(): Country[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  return getCountries()
    .map((code) => ({ code, name: names.of(code) ?? code, dialCode: `+${getCountryCallingCode(code)}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Windows doesn't render flag emojis, so flags are small images instead.
function Flag({ code }: { code: CountryCode }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="font-nav flex h-[15px] w-5 flex-shrink-0 items-center justify-center bg-brand/10 text-[8px] text-brand">
        {code}
      </span>
    );
  }
  return (
    <Image
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      width={20}
      height={15}
      unoptimized
      onError={() => setFailed(true)}
      className="h-[15px] w-5 flex-shrink-0 object-cover shadow-[0_0_0_1px_rgba(11,18,32,0.08)]"
    />
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query) : -1;
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <strong className="font-semibold text-foreground">{text.slice(index, index + query.length)}</strong>
      {text.slice(index + query.length)}
    </>
  );
}

type PhoneInputProps = {
  id: string;
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  number: string;
  onNumberChange: (number: string) => void;
};

export default function PhoneInput({ id, country, onCountryChange, number, onNumberChange }: PhoneInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const countries = useMemo(() => buildCountries(), []);

  const normalisedQuery = query.trim().toLowerCase().replace(/^\+/, '');
  const filtered = useMemo(() => {
    if (!normalisedQuery) return countries;
    const matches = countries.filter(
      (c) =>
        c.name.toLowerCase().includes(normalisedQuery) ||
        c.code.toLowerCase() === normalisedQuery ||
        c.dialCode.slice(1).startsWith(normalisedQuery),
    );
    const startsWith = (c: Country) => c.name.toLowerCase().startsWith(normalisedQuery);
    return [...matches.filter(startsWith), ...matches.filter((c) => !startsWith(c))];
  }, [countries, normalisedQuery]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openMenu = () => {
    setQuery('');
    setActive(Math.max(0, countries.findIndex((c) => c.code === country)));
    setOpen(true);
  };

  const selectCountry = (code: CountryCode) => {
    onCountryChange(code);
    setOpen(false);
    numberRef.current?.focus();
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) selectCountry(filtered[active].code);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  const onNumberInput = (value: string) => {
    // Pasting a full international number (e.g. +44 7911 123456) switches the country automatically.
    if (value.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed?.country) {
        onCountryChange(parsed.country);
        onNumberChange(parsed.nationalNumber);
        return;
      }
    }
    onNumberChange(value.replace(/[^\d\s\-()+]/g, ''));
  };

  const dialCode = `+${getCountryCallingCode(country)}`;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex h-12 border border-brand/15 bg-[#f7fbfe] transition-all duration-200 focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_0_0_4px_rgba(28,143,215,0.12)] hover:border-brand/35">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openMenu())}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code ${dialCode}`}
          className="flex flex-shrink-0 items-center gap-2 border-r border-brand/15 pl-3.5 pr-3 outline-none transition-colors hover:bg-brand/[0.05] focus-visible:bg-brand/[0.08]"
        >
          <Flag code={country} />
          <span className="font-body text-sm text-foreground">{dialCode}</span>
          <svg className={`h-3.5 w-3.5 text-brand/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <input
          ref={numberRef}
          id={id}
          type="tel"
          required
          maxLength={20}
          autoComplete="tel-national"
          value={number}
          onChange={(e) => onNumberInput(e.target.value)}
          placeholder={country === 'IN' ? '98765 43210' : 'Phone number'}
          className="font-body h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-gray-400 outline-none"
        />
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 border border-brand/15 bg-surface shadow-[0_20px_50px_-20px_rgba(11,18,32,0.35)]">
          <div className="relative border-b border-brand/10">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={filtered[active] ? `${listId}-${filtered[active].code}` : undefined}
              aria-label="Search country or code"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search country or code"
              className="font-body h-11 w-full bg-transparent pl-10 pr-4 text-sm text-foreground placeholder:text-gray-400 outline-none"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="font-body px-4 py-6 text-center text-sm text-foreground/45">No countries found</li>
            )}
            {filtered.map((c, i) => {
              const selected = c.code === country;
              return (
                <li
                  key={c.code}
                  id={`${listId}-${c.code}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCountry(c.code)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors ${i === active ? 'bg-brand/[0.07]' : ''}`}
                >
                  <Flag code={c.code} />
                  <span className={`font-body flex-1 truncate text-sm ${selected ? 'font-semibold text-foreground' : 'text-foreground/75'}`}>
                    <Highlight text={c.name} query={normalisedQuery} />
                  </span>
                  <span className="font-nav text-xs text-foreground/45">{c.dialCode}</span>
                  {selected && (
                    <svg className="h-4 w-4 flex-shrink-0 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
