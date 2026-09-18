'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/crm';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      if (res.data.status === 'ok') {
        const { token, user } = res.data.data;
        Cookies.set('nexa_token', token, { expires: 1 });
        Cookies.set('nexa_user', JSON.stringify(user), { expires: 1 });
        router.push('/dashboard');
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Login failed. Please check your username & password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-2">
      {/* Background decorative orbs safely contained */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-150 h-96 sm:h-150 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-auto my-auto flex flex-col justify-center">
        {/* Logo / Brand */}
        <div className="text-center mb-3 sm:mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 mb-1 sm:mb-2">
            <Image
              src="/logo-nexa-02.png"
              alt="NexaMOS CRM"
              width={112}
              height={112}
              priority
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Sign in to your operational dashboard</p>
          <div className="mt-1.5 sm:mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
            <span>💡</span>
            <span className="hidden sm:inline">Demo data automatically resets every <strong>Sunday at 21:00 WIB</strong></span>
            <span className="sm:hidden">Demo resets every <strong>Sun 21:00 WIB</strong></span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-2xl shadow-black/40">
          <form onSubmit={handleLogin} className="space-y-2.5 sm:space-y-4">
            <div className="space-y-1 sm:space-y-1.5">
              <label htmlFor="username" className="text-xs sm:text-sm font-medium text-foreground">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-3 py-1.5 sm:py-2.5 rounded-lg bg-input border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="Enter your username or email"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-3 pr-9 sm:pr-10 py-1.5 sm:py-2.5 rounded-lg bg-input border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 z-10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="px-2.5 py-1.5 sm:py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-2.5 rounded-lg gradient-primary text-white text-xs sm:text-sm font-semibold 
                         hover:opacity-90 active:scale-95 transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-primary/25 glow-primary mt-0.5 sm:mt-1"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2.5 sm:mt-5">
          © {new Date().getFullYear()} NexaMOS · Internal CRM System
        </p>
      </div>
    </div>
  );
}
