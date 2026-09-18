'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Sparkles, GraduationCap, Building2 } from 'lucide-react';
import { useIsDemo } from '@/hooks/useIsDemo';
import { useAuthStore } from '@/store/useAuthStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/crm';

function LoginContent() {
  const router = useRouter();
  const isDemo = useIsDemo();
  const searchParams = useSearchParams();

  const paramType = searchParams.get('type') || searchParams.get('sector');
  const initialSector: 'lpk' | 'general' = paramType === 'general' ? 'general' : 'lpk';

  const [selectedSector, setSelectedSector] = useState<'lpk' | 'general'>(initialSector);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleQuickFillDemo() {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: { username: string; password: string; tenant_type?: string } = {
        username,
        password,
      };
      if (isDemo) {
        payload.tenant_type = selectedSector;
      }

      const res = await axios.post(`${API_BASE}/auth/login`, payload);
      if (res.data.status === 'ok') {
        const { token, user } = res.data.data;
        if (isDemo) {
          user.tenant_type = selectedSector;
        }
        Cookies.set('nexa_token', token, { expires: 1 });
        Cookies.set('nexa_user', JSON.stringify(user), { expires: 1 });
        useAuthStore.getState().setAuth(token, user);
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 py-6 relative overflow-x-hidden">
      {/* Background decorative orbs safely contained */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col justify-center">
        {/* Logo / Brand */}
        <div className="text-center mb-3 sm:mb-5">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-1">
            <Image
              src="/logo-nexa-02.png"
              alt="NexaMOS CRM"
              width={96}
              height={96}
              priority
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Sign in to your operational dashboard</p>

          {isDemo && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>NexaMOS Demo Mode</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Simulasi CRM interaktif · Reset setiap <strong>Minggu 21:00 WIB</strong>
              </span>
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="bg-card border rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-2xl shadow-black/40">
          {/* Demo Sector Selection */}
          {isDemo && (
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Pilih Simulasi Industri:
                </span>
                <span className="text-xs font-medium text-amber-500">
                  {selectedSector === 'lpk' ? 'Ontologi LPK' : 'Ontologi Bisnis'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Option 1: LPK */}
                <button
                  type="button"
                  onClick={() => setSelectedSector('lpk')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedSector === 'lpk'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-border bg-card/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 shrink-0" />
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedSector === 'lpk' ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/40'
                    }`}>
                      {selectedSector === 'lpk' && <div className="w-1.5 h-1.5 rounded-full bg-background shrink-0" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">LPK & Vokasi</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">Siswa · Sekolah · Alumni</p>
                  </div>
                </button>

                {/* Option 2: General Business */}
                <button
                  type="button"
                  onClick={() => setSelectedSector('general')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedSector === 'general'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-border bg-card/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 shrink-0" />
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedSector === 'general' ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/40'
                    }`}>
                      {selectedSector === 'general' && <div className="w-1.5 h-1.5 rounded-full bg-background shrink-0" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Bisnis & Jasa</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">Kontak · Klien · Pelanggan</p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="w-full mt-2 py-1.5 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>⚡ Gunakan Akun Demo (Auto-fill)</span>
              </button>
            </div>
          )}

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
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                {isDemo ? (
                  <span className="text-xs text-muted-foreground/70 italic select-none">
                    Reset password dinonaktifkan pada akun demo
                  </span>
                ) : (
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot Password?
                  </Link>
                )}
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

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
