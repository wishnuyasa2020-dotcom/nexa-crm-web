'use client';

import { useState, useEffect } from 'react';
import { 
  X, Zap, Check, Sparkles, Shield, Users, School, ArrowRight,
  RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import { subscriptionApi, TierPlan } from '@/lib/subscriptionApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t, lang } = useTranslation();
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

  const getBadgeLabel = (badge: string) => {
    if (lang === 'en') {
      if (badge === 'Paling Populer') return 'Most Popular';
      if (badge === 'Terbaik untuk Skala') return 'Best for Scale';
    }
    return badge;
  };

  const getDescription = (tier: string, defaultDesc: string) => {
    if (lang === 'en') {
      if (tier === 'PRO') return 'Perfect for growing organizations with active CRO teams';
      if (tier === 'BUSINESS') return 'For established organizations with high student volume & large CRO team';
      if (tier === 'ENTERPRISE') return 'Unlimited solution for national multi-branch organization networks';
    }
    return defaultDesc;
  };

  const getFeatureLabel = (feature: string): string => {
    if (lang === 'id') return feature;
    const map: Record<string, string> = {
      // PRO
      'Batas Siswa: 1.000 / bln (12.000 / thn)': 'Student Limit: 1,000 / mo (12,000 / yr)',
      'Batas Sekolah: 20 / bln (240 / thn)': 'School Limit: 20 / mo (240 / yr)',
      '1 Admin, 1 Manager, 1 Chief CRO, 2 CRO': '1 Admin, 1 Manager, 1 Chief CRO, 2 CROs',
      'Integrasi WhatsApp Official Cloud API (BYOW)': 'Official WhatsApp Cloud API Integration (BYOW)',
      'Smart Routing WhatsApp & Fallback Teks': 'WhatsApp Smart Routing & Text Fallback',
      'Auto-Nurturing & Snooze Campaign Bot': 'Auto-Nurturing & Snooze Campaign Bot',
      'Integrasi Google Calendar (Home Visit / Konseling)': 'Google Calendar Integration (Home Visit / Counseling)',
      'Support Prioritas & Panduan Setup': 'Priority Support & Setup Guide',
      // BUSINESS
      'Batas Siswa: 2.500 / bln (30.000 / thn)': 'Student Limit: 2,500 / mo (30,000 / yr)',
      'Batas Sekolah: 41 / bln (500 / thn)': 'School Limit: 41 / mo (500 / yr)',
      '1 Admin, 1 Manager, 3 Chief CRO, 10 CRO': '1 Admin, 1 Manager, 3 Chief CRO, 10 CROs',
      'Semua fitur Tier Pro': 'All Pro Tier features included',
      'Add-on Seat CRO tersedia': 'CRO Seat Add-on available',
      'Export & Import Data Excel Massal': 'Bulk Excel Data Export & Import',
      'Funnel Velocity & Conversion Denominator Analytics': 'Funnel Velocity & Conversion Denominator Analytics',
      'Prioritas Antrean Broadcast WhatsApp': 'WhatsApp Broadcast Queue Priority',
      // ENTERPRISE
      'Batas Siswa: 8.333 / bln (100.000 / thn)': 'Student Limit: 8,333 / mo (100,000 / yr)',
      'Batas Sekolah: 166 / bln (2.000 / thn)': 'School Limit: 166 / mo (2,000 / yr)',
      '1 Admin, 3 Manager, 5 Chief CRO, 30 CRO': '1 Admin, 3 Manager, 5 Chief CRO, 30 CROs',
      'Semua fitur Tier Business': 'All Business Tier features included',
      'Opsi White-Label (Brand Custom LPK)': 'White-Label Option (Custom Branding)',
      'Dedicated Account Manager 24/7': 'Dedicated 24/7 Account Manager',
      'Jaminan Uptime SLA 99.9%': '99.9% Uptime SLA Guarantee',
      'Kustomisasi integrasi sistem internal': 'Custom internal system integrations',
    };
    return map[feature] || feature;
  };

  const TIER_USD_PRICING: Record<string, { MONTHLY: number; YEARLY: number }> = {
    PRO: { MONTHLY: 32, YEARLY: 320 },
    BUSINESS: { MONTHLY: 99, YEARLY: 990 },
    ENTERPRISE: { MONTHLY: 260, YEARLY: 2600 },
  };

  const formatPrice = (tier: string, idrPrice: number, cycle: 'MONTHLY' | 'YEARLY'): string => {
    if (lang === 'en') {
      const usd = TIER_USD_PRICING[tier]?.[cycle] ?? Math.round(idrPrice / 16000);
      return `$${usd.toLocaleString('en-US')}`;
    }
    return `Rp ${idrPrice.toLocaleString('id-ID')}`;
  };

  const getDiscountLabel = (discount: string | null | undefined): string | null => {
    if (!discount) return null;
    if (lang === 'id') return discount;
    if (discount.includes('Hemat 2 Bulan')) return 'Save 2 Months ($64)';
    if (discount.includes('3 Juta') || discount.includes('3 Million')) return 'Save $198';
    if (discount.includes('8 Juta') || discount.includes('8 Million')) return 'Save $520';
    return discount;
  };

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
            toast.success(lang === 'en' ? 'Payment successful! Activating new tier...' : 'Pembayaran berhasil! Mengaktifkan tier baru...');
            setLoading(false);
            setSuccessData({ tier, invoiceId: res.invoiceId });
            if (onUpgradeSuccess) onUpgradeSuccess();
          },
          onPending: () => {
            toast.info(lang === 'en' ? 'Waiting for payment completion.' : 'Menunggu penyelesaian pembayaran.');
            setPendingInvoiceId(res.invoiceId);
            setLoading(false);
          },
          onError: (err) => {
            console.error('Midtrans Snap error:', err);
            toast.error(lang === 'en' ? 'Payment failed or cancelled.' : 'Pembayaran gagal atau dibatalkan.');
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
      const errorMsg = err instanceof Error ? err.message : (lang === 'en' ? 'An error occurred while processing transaction.' : 'Terjadi kesalahan saat memproses transaksi.');
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
        toast.success(lang === 'en' ? 'Payment confirmed! Your tier has been upgraded.' : 'Pembayaran terkonfirmasi! Tier Anda telah di-upgrade.');
        setSuccessData({ tier: selectedTier || 'PRO', invoiceId: pendingInvoiceId });
        setPendingInvoiceId(null);
        if (onUpgradeSuccess) onUpgradeSuccess();
      } else {
        toast.info(lang === 'en' ? `Transaction status: ${res.transactionStatus}. Please complete payment.` : `Status transaksi: ${res.transactionStatus}. Silakan selesaikan pembayaran.`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : (lang === 'en' ? 'Failed to check status.' : 'Gagal memeriksa status.');
      toast.error(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-8 flex justify-center items-start w-full">
      <div className="bg-card border rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8 relative min-w-0">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-6 md:p-8 border-b bg-secondary/30 relative shrink-0 min-w-0 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 p-1.5 sm:p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
            aria-label={t('tierModal.closeModal')}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2 pr-8 sm:pr-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center text-white shadow-md shadow-primary/25 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block leading-tight mb-0.5 sm:mb-0">
                {t('tierModal.badge')}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-tight wrap-break-word">
                {t('tierModal.title')}
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {t('tierModal.subtitle')}
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-4 sm:mt-6 flex flex-col items-start sm:items-start w-full min-w-0">
            {/* Mobile Swipe & Click Hint */}
            <div className="flex items-center justify-between w-full max-w-sm text-2xs text-muted-foreground sm:hidden mb-1.5 px-0.5">
              <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span>{lang === 'id' ? 'Pilih Siklus (Geser & Klik):' : 'Select Cycle (Swipe & Tap):'}</span>
              </span>
              <span className="text-primary text-2xs font-bold flex items-center gap-0.5 uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0">
                <span>{lang === 'id' ? 'Geser' : 'Swipe'}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="relative max-w-full overflow-hidden w-full sm:w-auto">
              <div className="bg-secondary/80 p-1.5 rounded-xl flex items-center gap-1.5 border max-w-full overflow-x-auto scrollbar-thin touch-pan-x">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={cn(
                    'px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-switcher-mobile sm:text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 select-none active:scale-95',
                    billingCycle === 'MONTHLY'
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-primary/30 font-bold'
                      : 'bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/70'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0 transition-colors',
                      billingCycle === 'MONTHLY' ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted-foreground/40'
                    )}
                  />
                  <span>{t('tierModal.monthly')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('YEARLY')}
                  className={cn(
                    'px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-switcher-mobile sm:text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 select-none active:scale-95',
                    billingCycle === 'YEARLY'
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-primary/30 font-bold'
                      : 'bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/70'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0 transition-colors',
                      billingCycle === 'YEARLY' ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted-foreground/40'
                    )}
                  />
                  <span>{t('tierModal.yearly')}</span>
                  <span className="bg-emerald-500/15 text-emerald-600 text-switcher-mobile sm:text-2xs px-1.5 py-0.5 rounded-full font-bold">
                    {t('tierModal.saveUpTo')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Screen Banner */}
        {successData && (
          <div className="p-6 sm:p-8 text-center bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2">{t('tierModal.successTitle')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-4 sm:mb-6 leading-relaxed">
              {t('tierModal.successDesc')} <span className="font-bold text-foreground">Tier {successData.tier}</span>. {t('tierModal.successUpdated')}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl gradient-primary text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              {t('tierModal.backDashboard')}
            </button>
          </div>
        )}

        {/* Pending Verification Notice */}
        {pendingInvoiceId && !successData && (
          <div className="p-3 sm:p-4 mx-4 sm:mx-6 mt-4 sm:mt-6 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('tierModal.pendingTitle')}</p>
                <p className="text-muted-foreground">{t('tierModal.invoiceId')} <span className="font-mono text-foreground">{pendingInvoiceId}</span></p>
              </div>
            </div>
            <button
              onClick={handleCheckStatus}
              disabled={isVerifying}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} className={cn(isVerifying && 'animate-spin')} />
              <span>{isVerifying ? t('tierModal.checkingStatus') : t('tierModal.checkStatusNow')}</span>
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-4 sm:p-6 md:p-8 pt-6 sm:pt-8 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 min-w-0">
            {plans.map((p) => {
              const isCurrent = (currentTier || '').toUpperCase() === p.tier;
              const pricing = p.pricing[billingCycle];
              const limits = p.limits[billingCycle];
              const isBusiness = p.tier === 'BUSINESS';
              const isEnterprise = p.tier === 'ENTERPRISE';

              return (
                <div
                  key={p.tier}
                  className={cn(
                    'rounded-xl sm:rounded-2xl border p-4 sm:p-6 flex flex-col justify-between transition-all duration-200 relative min-w-0',
                    isCurrent 
                      ? 'bg-secondary/40 border-muted-foreground/30 ring-1 ring-muted-foreground/20' 
                      : isBusiness
                        ? 'bg-card border-primary/40 shadow-xl shadow-primary/5 ring-1 ring-primary/30'
                        : 'bg-card hover:border-border/80 shadow-xs'
                  )}
                >
                  {/* Badge */}
                  {p.badge && (
                    <div className="absolute -top-3 left-4 sm:left-6 z-10">
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-primary text-white shadow-sm shadow-primary/30">
                        {getBadgeLabel(p.badge)}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0">
                    {/* Header Plan */}
                    <div className="mb-3 sm:mb-4 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center justify-between">
                        <span className="truncate">{p.name}</span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold border shrink-0">
                            {t('tierModal.activeBadge')}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed wrap-break-word">{getDescription(p.tier, p.description)}</p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-secondary/50 border min-w-0">
                      <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                        <span className="text-xl sm:text-2xl font-extrabold text-foreground truncate">
                          {formatPrice(p.tier, pricing.price, billingCycle)}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {billingCycle === 'YEARLY' ? t('tierModal.perYear') : t('tierModal.perMonth')}
                        </span>
                      </div>
                      {pricing.discount && (
                        <p className="text-xs text-emerald-600 font-bold mt-0.5 truncate">
                          {getDiscountLabel(pricing.discount)}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground min-w-0">
                        <Clock size={11} className="text-primary shrink-0" />
                        <span className="truncate">{t('tierModal.lockedPeriod')} <strong>{pricing.periodDays} {t('tierModal.days')}</strong></span>
                      </div>
                    </div>

                    {/* Quota Highlights */}
                    <div className="space-y-2 mb-4 sm:mb-6 text-xs min-w-0">
                      <div className="flex items-center gap-2 text-foreground font-medium min-w-0">
                        <Users size={13} className="text-violet-500 shrink-0" />
                        <span className="truncate">{t('tierModal.limitStudents')} <strong>{limits.limit_siswa.toLocaleString('id-ID')}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium min-w-0">
                        <School size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate">{t('tierModal.limitSchools')} <strong>{limits.limit_sekolah.toLocaleString('id-ID')}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium min-w-0">
                        <Shield size={13} className="text-pink-500 shrink-0" />
                        <span className="truncate">{t('tierModal.croTeam')} <strong>{p.roles.max_cro} {t('tierModal.croAccounts')}</strong></span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-1.5 sm:space-y-2 border-t pt-3 sm:pt-4 min-w-0">
                      <p className="text-xs font-bold text-foreground">{t('tierModal.featuresTitle')}</p>
                      {p.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-1.5 sm:gap-2 text-xs text-muted-foreground leading-snug min-w-0">
                          <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="min-w-0 wrap-break-word">{getFeatureLabel(feat)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t min-w-0">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 sm:py-2.5 rounded-xl border text-xs font-bold text-muted-foreground bg-secondary/50 cursor-not-allowed"
                      >
                        {t('tierModal.currentPlan')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(p.tier)}
                        disabled={loading}
                        className={cn(
                          'w-full py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50',
                          isBusiness || isEnterprise
                            ? 'gradient-primary text-white hover:opacity-90 shadow-primary/20'
                            : 'bg-primary text-white hover:bg-primary/90'
                        )}
                      >
                        <Zap size={13} />
                        <span className="truncate">
                          {loading && selectedTier === p.tier
                            ? t('tierModal.preparingPayment')
                            : `${t('tierModal.selectPlan')} ${p.name}`}
                        </span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security / Trust Footer */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 bg-secondary/20 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2.5 sm:gap-2 text-center sm:text-left min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start min-w-0">
            <Shield size={13} className="text-emerald-500 shrink-0" />
            <span className="leading-snug">{t('tierModal.securityNotice')} <strong>Midtrans</strong>.</span>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-xs font-medium text-foreground/80 min-w-0">
            <span className="px-1.5 py-0.5 bg-secondary/50 rounded shrink-0">{t('tierModal.paymentQris')}</span>
            <span className="px-1.5 py-0.5 bg-secondary/50 rounded shrink-0">{t('tierModal.paymentVa')}</span>
            <span className="px-1.5 py-0.5 bg-secondary/50 rounded shrink-0">{t('tierModal.paymentCc')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
