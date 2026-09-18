'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useIsDemo } from '@/hooks/useIsDemo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/crm';

export default function ForgotPasswordPage() {
  const isDemo = useIsDemo();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (isDemo) {
      setError('Fitur reset password dinonaktifkan pada akun demo.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      if (res.data.status === 'ok') {
        setMessage(res.data.message || 'Instruksi reset password telah dikirimkan.');
      } else {
        setError(res.data.message || 'Gagal mengirim instruksi reset password.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background decorative orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            {isDemo ? (
              <ShieldAlert className="w-7 h-7 text-amber-500 shrink-0" />
            ) : (
              <Lock className="w-7 h-7 shrink-0" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isDemo ? 'Mode Demo Aktif' : 'Lupa Password'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isDemo
              ? 'Proteksi Keamanan Akses Bersama'
              : 'Masukkan email untuk mereset password'}
          </p>
        </div>

        {/* Card Content */}
        <div className="bg-card border rounded-2xl p-6 shadow-2xl shadow-black/40">
          {isDemo ? (
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-left leading-relaxed">
                <strong>Pemberitahuan Demo NexaMOS:</strong>
                <p className="mt-1 text-muted-foreground">
                  Fitur <strong>Lupa Password</strong> dinonaktifkan pada Versi Demo (<code>demo.nexamos.cloud</code>) demi menjaga stabilitas akses publik bagi semua penguji.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border text-xs text-left text-foreground">
                <span className="font-semibold block mb-1">Kredensial Demo Tersedia:</span>
                <p className="text-muted-foreground">
                  Username: <code className="text-primary font-mono font-semibold">admin</code><br />
                  Password: <code className="text-primary font-mono font-semibold">admin123</code>
                </p>
              </div>

              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold 
                           hover:opacity-90 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Kembali ke Halaman Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Alamat Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-input border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="Masukkan email Anda"
                />
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}
              
              {message && (
                <div className="px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold 
                           hover:opacity-90 active:scale-95 transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg mt-1"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengirim...
                  </span>
                ) : 'Kirim Instruksi Reset'}
              </button>
              
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-primary hover:underline font-medium">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} NexaMOS · Sistem CRM Internal
        </p>
      </div>
    </div>
  );
}
