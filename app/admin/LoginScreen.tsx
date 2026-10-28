'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FieldIcon, ICONS, inputCls } from './ui';

export type LoginIdField = {
  label: string;
  type: 'text' | 'email';
  autoComplete: string;
  placeholder: string;
  icon: string;
};

export default function LoginScreen({
  subtitle,
  idField,
  footer,
  onLogin,
}: {
  subtitle: string;
  idField: LoginIdField;
  footer: string;
  onLogin: (id: string, password: string) => Promise<unknown>;
}) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin(id.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16 text-zinc-900 antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Grupo" width={56} height={56} priority className="h-14 w-14 rounded-2xl shadow-lg shadow-sky-500/20 ring-1 ring-black/5" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white/90 p-7 shadow-xl shadow-zinc-900/5 backdrop-blur"
        >
          <div className="space-y-1.5">
            <label htmlFor="login-id" className="text-sm font-medium text-zinc-700">
              {idField.label}
            </label>
            <div className="relative">
              <FieldIcon d={idField.icon} />
              <input
                id="login-id"
                type={idField.type}
                autoComplete={idField.autoComplete}
                autoFocus
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={idField.placeholder}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <div className="relative">
              <FieldIcon d={ICONS.lock} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`${inputCls} pl-9 pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-label="Signing in" />
            ) : (
              <>
                Sign in
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">{footer}</p>
      </div>
    </main>
  );
}
