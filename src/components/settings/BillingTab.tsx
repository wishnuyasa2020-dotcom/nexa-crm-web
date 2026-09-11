'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, Zap, CheckCircle2, Clock, AlertTriangle, 
  Users, School, ShieldCheck, RefreshCw, FileText, ArrowUpRight 
} from 'lucide-react';
import { subscriptionApi, BillingOverviewData } from '@/lib/subscriptionApi';
import UpgradeTierModal from '@/components/subscription/UpgradeTierModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function BillingTab() {
  const [data, setData] = useState<BillingOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkingInvoiceId, setCheckingInvoiceId] = useState<string | null>(null);

  const loadBillingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getBillingOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load billing overview:', err);
      toast.error('Gagal memuat data langganan & faktur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  async function handleCheckInvoiceStatus(invoiceId: string) {
    try {
      setCheckingInvoiceId(invoiceId);
      const res = await subscriptionApi.checkStatus(invoiceId);
      if (res.isPaid) {
        toast.success('Pembayaran terkonfirmasi lunas! Kuota telah diperbarui.');
        loadBillingData();
      } else {
        toast.info(`Status faktur: ${res.transactionStatus}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memeriksa status transaksi.';
      toast.error(errorMsg);
    } finally {
      setCheckingInvoiceId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Memuat informasi langganan & faktur...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-card border rounded-2xl">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">Gagal memuat data langganan.</p>
        <button
          onClick={loadBillingData}
          className="mt-4 px-4 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const sub = data.subscription;
  const isFree = sub.tier.toUpperCase() === 'FREE';

  return (
    <div className="space-y-6">
      
      {/* ── Active Plan Card ── */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
                isFree ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                sub.tier.toUpperCase() === 'PRO' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                sub.tier.toUpperCase() === 'BUSINESS' ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' :
                'bg-amber-500/10 text-amber-600 border-amber-500/20'
              )}>
                Tier {sub.tier}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {sub.status}
              </span>
              {!isFree && sub.daysRemaining > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Clock size={12} className="text-primary" />
                  Sisa {sub.daysRemaining} hari lagi
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground">
              Langganan {sub.brandName} ({sub.billingCycle.toLowerCase()})
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {sub.currentPeriodStart && sub.currentPeriodEnd ? (
                <>Periode tagihan: <strong>{new Date(sub.currentPeriodStart).toLocaleDateString('id-ID')}</strong> s/d <strong>{new Date(sub.currentPeriodEnd).toLocaleDateString('id-ID')}</strong></>
              ) : (
                'Paket gratis tanpa batas waktu (kuota di-reset setiap 3 bulan).'
              )}
            </p>
          </div>

          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Zap size={14} />
            <span>Tingkatkan / Ubah Paket</span>
          </button>
        </div>

        {/* Quota Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          {/* Siswa */}
          <div className="p-4 rounded-xl bg-secondary/40 border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Users size={14} className="text-violet-500" /> Siswa Baru
              </span>
              <span className="text-muted-foreground">
                {sub.limits.siswa.used.toLocaleString('id-ID')} / {sub.limits.siswa.limit.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sub.limits.siswa.used / sub.limits.siswa.limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Sekolah */}
          <div className="p-4 rounded-xl bg-secondary/40 border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <School size={14} className="text-blue-500" /> Sekolah Baru
              </span>
              <span className="text-muted-foreground">
                {sub.limits.sekolah.used.toLocaleString('id-ID')} / {sub.limits.sekolah.limit.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sub.limits.sekolah.used / sub.limits.sekolah.limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* User CRO */}
          <div className="p-4 rounded-xl bg-secondary/40 border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck size={14} className="text-pink-500" /> Akun Tim
              </span>
              <span className="text-muted-foreground">
                {sub.limits.users.used} / {sub.limits.users.limit} user
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sub.limits.users.used / sub.limits.users.limit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Invoices History Table ── */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Riwayat Faktur & Pembayaran
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftar seluruh transaksi pembaruan kuota dan upgrade tier tenant
            </p>
          </div>
          <button
            onClick={loadBillingData}
            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Muat ulang riwayat"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {data.invoices.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            Belum ada riwayat faktur tagihan tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 font-semibold">Nomor Faktur</th>
                  <th className="pb-3 font-semibold">Paket</th>
                  <th className="pb-3 font-semibold">Tanggal</th>
                  <th className="pb-3 font-semibold">Nominal</th>
                  <th className="pb-3 font-semibold">Metode</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isUnpaid = inv.status === 'UNPAID';
                  const isCancelled = inv.status === 'CANCELLED';

                  return (
                    <tr key={inv.invoice_id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 font-mono font-medium text-foreground">
                        {inv.invoice_id}
                      </td>
                      <td className="py-3 font-semibold text-foreground">
                        {inv.plan_tier || 'FREE'} ({inv.billing_cycle || 'MONTHLY'})
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 font-semibold text-foreground">
                        Rp {Number(inv.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 uppercase text-muted-foreground font-mono">
                        {inv.payment_type || '-'}
                      </td>
                      <td className="py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                          isPaid && 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                          isUnpaid && 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
                          isCancelled && 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {isUnpaid ? (
                          <button
                            onClick={() => handleCheckInvoiceStatus(inv.invoice_id)}
                            disabled={checkingInvoiceId === inv.invoice_id}
                            className="px-2.5 py-1 rounded-lg bg-secondary text-primary font-semibold hover:bg-secondary/80 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={cn(checkingInvoiceId === inv.invoice_id && 'animate-spin')} />
                            <span>Cek Status</span>
                          </button>
                        ) : inv.invoice_url ? (
                          <a
                            href={inv.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>Lihat</span>
                            <ArrowUpRight size={12} />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade Tier Modal */}
      <UpgradeTierModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={sub.tier}
        onUpgradeSuccess={loadBillingData}
      />

    </div>
  );
}
