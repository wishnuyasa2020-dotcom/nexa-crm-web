'use client';

import { useState, useEffect } from 'react';
import { 
  X, Zap, Check, Sparkles, Shield, Users, School, ArrowRight,
  RefreshCw, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { subscriptionApi, TierPlan } from '@/lib/subscriptionApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string, 
        callbacks: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface UpgradeTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onUpgradeSuccess?: () => void;
}

export default function UpgradeTierModal({
  isOpen,
  onClose,
  currentTier = 'FREE',
  onUpgradeSuccess,
}: UpgradeTierModalProps) {
  const [plans, setPlans] = useState<TierPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successData, setSuccessData] = useState<{ tier: string; invoiceId: string } | null>(null);

  // Load plans from API
  useEffect(() => {
    if (isOpen) {
      setSuccessData(null);
      setPendingInvoiceId(null);
      subscriptionApi.getPlans()
        .then(data => setPlans(data))
        .catch(err => console.error('Failed to load plans:', err));

      // Inject Midtrans Snap script dynamically
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-sample';
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      const scriptUrl = isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

      if (!document.getElementById('midtrans-snap-script')) {
        const script = document.createElement('script');
        script.id = 'midtrans-snap-script';
        script.src = scriptUrl;
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSelectPlan(tier: 'PRO' | 'BUSINESS' | 'ENTERPRISE') {
    try {
      setLoading(true);
      setSelectedTier(tier);

      // 1. Minta snap token dari backend
      const res = await subscriptionApi.createTransaction(tier, billingCycle);

      // 2. Buka popup Midtrans Snap
      if (window.snap && res.token) {
        window.snap.pay(res.token, {
          onSuccess: async () => {
            toast.success('Pembayaran berhasil! Mengaktifkan tier baru...');
            setLoading(false);
            setSuccessData({ tier, invoiceId: res.invoiceId });
            if (onUpgradeSuccess) onUpgradeSuccess();
          },
          onPending: () => {
            toast.info('Menunggu penyelesaian pembayaran.');
            setPendingInvoiceId(res.invoiceId);
            setLoading(false);
          },
          onError: (err) => {
            console.error('Midtrans Snap error:', err);
            toast.error('Pembayaran gagal atau dibatalkan.');
            setLoading(false);
          },
          onClose: () => {
            // User menutup modal snap sebelum bayar
            setPendingInvoiceId(res.invoiceId);
            setLoading(false);
          },
        });
      } else if (res.redirectUrl) {
        // Fallback jika window.snap belum ready
        window.open(res.redirectUrl, '_blank');
        setPendingInvoiceId(res.invoiceId);
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error('Create transaction error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses transaksi.';
      toast.error(errorMsg);
      setLoading(false);
    }
  }

  async function handleCheckStatus() {
    if (!pendingInvoiceId) return;
    try {
      setIsVerifying(true);
      const res = await subscriptionApi.checkStatus(pendingInvoiceId);

      if (res.isPaid) {
        toast.success('Pembayaran terkonfirmasi! Tier Anda telah di-upgrade.');
        setSuccessData({ tier: selectedTier || 'PRO', invoiceId: pendingInvoiceId });
        setPendingInvoiceId(null);
        if (onUpgradeSuccess) onUpgradeSuccess();
      } else {
        toast.info(`Status transaksi: ${res.transactionStatus}. Silakan selesaikan pembayaran.`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memeriksa status.';
      toast.error(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
      <div className="bg-card border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8 relative">
        
        {/* Header Modal */}
        <div className="p-6 md:p-8 border-b bg-secondary/30 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-md shadow-primary/25">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Nexa CRM Tier Upgrade</span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Tingkatkan Kapasitas LPK Anda</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pilih paket yang sesuai untuk memperluas kuota siswa, sekolah, dan jumlah akun CRO. Transaksi diproses aman & otomatis via Midtrans.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-6 flex items-center justify-center sm:justify-start">
            <div className="bg-secondary p-1 rounded-xl flex items-center gap-1 border">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  billingCycle === 'MONTHLY'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Bulanan (30 Hari)
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  billingCycle === 'YEARLY'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>Tahunan (365 Hari)</span>
                <span className="bg-emerald-500/15 text-emerald-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  Hemat s/d 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Screen Banner */}
        {successData && (
          <div className="p-8 text-center bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Selamat! Upgrade Berhasil</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Tenant Anda sekarang resmi berada di <span className="font-bold text-foreground">Tier {successData.tier}</span>. Semua kuota dan fitur telah otomatis diperbarui.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}

        {/* Pending Verification Notice */}
        {pendingInvoiceId && !successData && (
          <div className="p-4 mx-6 mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="font-bold text-foreground">Menunggu Konfirmasi Pembayaran</p>
                <p className="text-muted-foreground">Invoice ID: <span className="font-mono text-foreground">{pendingInvoiceId}</span></p>
              </div>
            </div>
            <button
              onClick={handleCheckStatus}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold flex items-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw size={14} className={cn(isVerifying && 'animate-spin')} />
              <span>{isVerifying ? 'Memeriksa...' : 'Cek Status Sekarang'}</span>
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent = (currentTier || '').toUpperCase() === p.tier;
              const pricing = p.pricing[billingCycle];
              const limits = p.limits[billingCycle];
              const isPro = p.tier === 'PRO';
              const isBusiness = p.tier === 'BUSINESS';
              const isEnterprise = p.tier === 'ENTERPRISE';

              return (
                <div
                  key={p.tier}
                  className={cn(
                    'rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 relative',
                    isCurrent 
                      ? 'bg-secondary/40 border-muted-foreground/30 ring-1 ring-muted-foreground/20' 
                      : isBusiness
                        ? 'bg-card border-primary/40 shadow-xl shadow-primary/5 ring-1 ring-primary/30'
                        : 'bg-card border-border hover:border-border/80 shadow-sm'
                  )}
                >
                  {/* Badge */}
                  {p.badge && (
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-primary text-white shadow-sm shadow-primary/30">
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header Plan */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-foreground flex items-center justify-between">
                        {p.name}
                        {isCurrent && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold border">
                            Aktif
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6 p-4 rounded-xl bg-secondary/50 border">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-foreground">
                          Rp {(pricing.price).toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {billingCycle === 'YEARLY' ? 'tahun' : 'bulan'}
                        </span>
                      </div>
                      {pricing.discount && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">
                          {pricing.discount}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Clock size={12} className="text-primary" />
                        <span>Masa aktif terkunci: <strong>{pricing.periodDays} hari</strong></span>
                      </div>
                    </div>

                    {/* Quota Highlights */}
                    <div className="space-y-2.5 mb-6 text-xs">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Users size={14} className="text-violet-500 shrink-0" />
                        <span>Batas Siswa: <strong>{limits.limit_siswa.toLocaleString('id-ID')}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <School size={14} className="text-blue-500 shrink-0" />
                        <span>Batas Sekolah: <strong>{limits.limit_sekolah.toLocaleString('id-ID')}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Shield size={14} className="text-pink-500 shrink-0" />
                        <span>Tim CRO: <strong>{p.roles.max_cro} Akun CRO</strong></span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-xs font-bold text-foreground">Fitur Unggulan:</p>
                      {p.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-8 pt-4 border-t">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl border text-xs font-bold text-muted-foreground bg-secondary/50 cursor-not-allowed"
                      >
                        Paket Aktif Saat Ini
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(p.tier)}
                        disabled={loading}
                        className={cn(
                          'w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50',
                          isBusiness || isEnterprise
                            ? 'gradient-primary text-white hover:opacity-90 shadow-primary/20'
                            : 'bg-primary text-white hover:bg-primary/90'
                        )}
                      >
                        <Zap size={14} />
                        <span>
                          {loading && selectedTier === p.tier
                            ? 'Menyiapkan Midtrans...'
                            : `Pilih ${p.name}`}
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security / Trust Footer */}
        <div className="px-8 py-4 bg-secondary/20 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-500" />
            <span>Pembayaran aman dienkripsi SSL & bersertifikasi Bank Indonesia via <strong>Midtrans</strong>.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span>QRIS (GoPay/OVO/Dana)</span>
            <span>Virtual Account BCA/Mandiri/BNI/BRI</span>
            <span>Kartu Kredit</span>
          </div>
        </div>

      </div>
    </div>
  );
}
