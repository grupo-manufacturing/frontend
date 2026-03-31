'use client';

import { useState } from 'react';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

interface LoginProps {
  onLoginSuccess: () => void;
  isCheckingAuth?: boolean;
}

export default function Login({ onLoginSuccess, isCheckingAuth = false }: LoginProps) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setErrorMessage('');

    try {
      const response = await apiService.adminLogin(username, password);
      const token = response.data?.token;
      if (token) {
        // Store admin token using the tokenType parameter to avoid overwriting groupo_token
        apiService.setToken(token, 'admin');
        toast.success('Login successful! Welcome back.');
        onLoginSuccess();
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Invalid credentials. Please try again.');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-[#22a2f2]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v6h-6" />
          </svg>
          <p className="text-sm font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        .poppins-font {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center space-y-2">
            <h1 className="poppins-font text-3xl font-bold text-[#22a2f2]">Grupo</h1>
            <p className="text-2xl font-semibold text-slate-900 mt-4">Admin Sign In</p>
            <p className="text-sm text-slate-500">
              Enter your username and password to access the admin portal.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-white shadow-md rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-username" className="text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || !username.trim() || !password.trim()}
            className="w-full rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0] disabled:cursor-not-allowed disabled:bg-[#22a2f2]/50"
          >
            {isLoggingIn ? 'Signing In…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

