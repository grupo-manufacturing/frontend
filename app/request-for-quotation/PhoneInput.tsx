'use client';

import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

type Country = { code: CountryCode; name: string; dialCode: string };

const STYLES = {
  site: {
    flagFallback: 'font-nav bg-brand/10 text-brand',
    flag: 'shadow-[0_0_0_1px_rgba(11,18,32,0.08)]',
    highlight: 'font-semibold text-foreground',
    box: 'flex h-12 border border-brand/15 bg-[#f7fbfe] transition-all duration-200 focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_0_0_4px_rgba(28,143,215,0.12)] hover:border-brand/35',
    button: 'border-r border-brand/15 pl-3.5 pr-3 hover:bg-brand/[0.05] focus-visible:bg-brand/[0.08]',
    dial: 'font-body text-sm text-foreground',
    chevron: 'text-brand/60',
    input: 'font-body px-3.5 text-sm text-foreground placeholder:text-gray-400',
    menu: 'mt-2 border border-brand/15 bg-surface shadow-[0_20px_50px_-20px_rgba(11,18,32,0.35)]',
    searchWrap: 'border-b border-brand/10',
    searchIcon: 'text-brand/50',
    searchInput: 'font-body h-11 text-sm text-foreground placeholder:text-gray-400',
    empty: 'font-body text-foreground/45',
    itemActive: 'bg-brand/[0.07]',
    name: 'font-body',
    nameSelected: 'font-semibold text-foreground',
    nameIdle: 'text-foreground/75',
    itemDial: 'font-nav text-xs text-foreground/45',
    check: 'text-brand',
  },
  admin: {
    flagFallback: 'rounded-sm bg-zinc-100 text-zinc-500',
    flag: 'rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]',
    highlight: 'font-semibold text-zinc-900',
    box: 'flex h-10 rounded-lg border border-zinc-200 bg-white shadow-sm transition focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-900/5',
    button: 'rounded-l-lg border-r border-zinc-200 pl-3 pr-2.5 hover:bg-zinc-50 focus-visible:bg-zinc-50',
    dial: 'admin-mono text-sm text-zinc-900',
    chevron: 'text-zinc-400',
    input: 'admin-mono rounded-r-lg px-3 text-sm text-zinc-900 placeholder:text-zinc-400',
    menu: 'mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl',
    searchWrap: 'border-b border-zinc-100',
    searchIcon: 'text-zinc-400',
    searchInput: 'h-10 text-sm text-zinc-900 placeholder:text-zinc-400',
    empty: 'text-zinc-400',
    itemActive: 'bg-zinc-100',
    name: '',
    nameSelected: 'font-medium text-zinc-900',
    nameIdle: 'text-zinc-600',
    itemDial: 'admin-mono text-xs text-zinc-400',
    check: 'text-zinc-900',
  },
};

type Variant = keyof typeof STYLES;

function buildCountries(): Country[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  return getCountries()
    .map((code) => ({ code, name: names.of(code) ?? code, dialCode: `+${getCountryCallingCode(code)}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function Flag({ code, variant }: { code: CountryCode; variant: Variant }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`flex h-[15px] w-5 flex-shrink-0 items-center justify-center text-[8px] ${STYLES[variant].flagFallback}`}>
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
      className={`h-[15px] w-5 flex-shrink-0 object-cover ${STYLES[variant].flag}`}
    />
  );
}

function Highlight({ text, query, variant }: { text: string; query: string; variant: Variant }) {
  const index = query ? text.toLowerCase().indexOf(query) : -1;
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <strong className={STYLES[variant].highlight}>{text.slice(index, index + query.length)}</strong>
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
  variant?: Variant;
};

export default function PhoneInput({ id, country, onCountryChange, number, onNumberChange, variant = 'site' }: PhoneInputProps) {
  const s = STYLES[variant];
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
      e.stopPropagation();
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
      <div className={s.box}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openMenu())}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code ${dialCode}`}
          className={`flex flex-shrink-0 items-center gap-2 outline-none transition-colors ${s.button}`}
        >
          <Flag code={country} variant={variant} />
          <span className={s.dial}>{dialCode}</span>
          <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${s.chevron} ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
          className={`h-full min-w-0 flex-1 bg-transparent outline-none ${s.input}`}
        />
      </div>

      {open && (
        <div className={`absolute inset-x-0 top-full z-30 ${s.menu}`}>
          <div className={`relative ${s.searchWrap}`}>
            <svg className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${s.searchIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
              className={`w-full bg-transparent pl-10 pr-4 outline-none ${s.searchInput}`}
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && <li className={`px-4 py-6 text-center text-sm ${s.empty}`}>No countries found</li>}
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
                  className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors ${i === active ? s.itemActive : ''}`}
                >
                  <Flag code={c.code} variant={variant} />
                  <span className={`flex-1 truncate text-sm ${s.name} ${selected ? s.nameSelected : s.nameIdle}`}>
                    <Highlight text={c.name} query={normalisedQuery} variant={variant} />
                  </span>
                  <span className={s.itemDial}>{c.dialCode}</span>
                  {selected && (
                    <svg className={`h-4 w-4 flex-shrink-0 ${s.check}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
