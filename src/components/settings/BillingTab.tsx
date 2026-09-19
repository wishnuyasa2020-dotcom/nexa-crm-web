'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Zap, Clock, AlertTriangle, 
  Users, School, ShieldCheck, RefreshCw, FileText, ArrowUpRight 
} from 'lucide-react';
import { subscriptionApi, BillingOverviewData } from '@/lib/subscriptionApi';
import UpgradeTierModal from '@/components/subscription/UpgradeTierModal';
import WhatsAppCreditCard from './WhatsAppCreditCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

export default function BillingTab() {
  const { t, lang } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
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
      toast.error(t('settings.billingLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  async function handleCheckInvoiceStatus(invoiceId: string) {
    try {
      setCheckingInvoiceId(invoiceId);
      const res = await subscriptionApi.checkStatus(invoiceId);
      if (res.isPaid) {
        toast.success(t('settings.invoicePaidSuccess'));
        loadBillingData();
      } else {
        toast.info(t('settings.invoiceStatusNotice').replace('{status}', res.transactionStatus));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t('settings.invoiceCheckFailed');
      toast.error(errorMsg);
    } finally {
      setCheckingInvoiceId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{t('settings.billingLoading')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-card border rounded-2xl">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">{t('settings.billingLoadFailedTitle')}</p>
        <button
          onClick={loadBillingData}
          className="mt-4 px-4 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          {t('settings.retryBtn')}
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
                {t('settings.tierPrefix')} {sub.tier}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {sub.status}
              </span>
              {!isFree && sub.daysRemaining > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Clock size={12} className="text-primary" />
                  {t('settings.daysRemainingText').replace('{days}', String(sub.daysRemaining))}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground">
              {sub.brandName} ({sub.billingCycle.toLowerCase()})
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {sub.currentPeriodStart && sub.currentPeriodEnd ? (
                <>
                  {t('settings.billingPeriodLabel')}{' '}
                  <strong>{new Date(sub.currentPeriodStart).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}</strong> s/d{' '}
                  <strong>{new Date(sub.currentPeriodEnd).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}</strong>
                </>
              ) : (
                t('settings.freeTierNotice')
              )}
            </p>
          </div>

          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Zap size={14} />
            <span>{t('settings.upgradeTierBtn')}</span>
          </button>
        </div>

        {/* Quota Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          {/* Siswa / Kontak */}
          <div className="p-4 rounded-xl bg-secondary/40 border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Users size={14} className="text-violet-500" />
                {isGeneral ? t('settings.quotaNewStudentsGeneral') : t('settings.quotaNewStudentsLpk')}
              </span>
              <span className="text-muted-foreground">
                {sub.limits.siswa.used.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')} / {sub.limits.siswa.limit.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sub.limits.siswa.used / sub.limits.siswa.limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Sekolah / Mitra */}
          <div className="p-4 rounded-xl bg-secondary/40 border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <School size={14} className="text-blue-500" />
                {isGeneral ? t('settings.quotaNewSchoolsGeneral') : t('settings.quotaNewSchoolsLpk')}
              </span>
              <span className="text-muted-foreground">
                {sub.limits.sekolah.used.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')} / {sub.limits.sekolah.limit.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sub.limits.sekolah.used / sub.limits.sekolah.limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* User CRO / Tim */}
          <div className="p-4 rounded-xl bg-secondary/40 border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck size={14} className="text-pink-500" /> {t('settings.quotaTeamAccounts')}
              </span>
              <span className="text-muted-foreground">
                {sub.limits.users.used} / {sub.limits.users.limit} {t('settings.userUnit')}
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

      {/* ── WhatsApp Credit Messaging (Meta API) ── */}
      <WhatsAppCreditCard />

      {/* ── Invoices History Table ── */}
      <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              {t('settings.invoicesHistoryTitle')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('settings.invoicesHistorySubtitle')}
            </p>
          </div>
          <button
            onClick={loadBillingData}
            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t('settings.reloadHistoryTooltip')}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {data.invoices.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            {t('settings.emptyInvoices')}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin pb-1">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold min-w-44 sm:min-w-36">{t('settings.thInvoiceNumber')}</th>
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold min-w-40 sm:min-w-32">{t('settings.thPlan')}</th>
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold min-w-28">{t('settings.thDate')}</th>
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold min-w-32">{t('settings.thAmount')}</th>
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold min-w-28">{t('settings.thMethod')}</th>
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold min-w-24">{t('settings.thStatus')}</th>
                  <th className="pb-3 px-3.5 sm:px-3 font-semibold text-right min-w-28">{t('settings.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isUnpaid = inv.status === 'UNPAID';
                  const isCancelled = inv.status === 'CANCELLED';

                  return (
                    <tr key={inv.invoice_id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-3.5 sm:px-3 font-mono font-medium text-foreground">
                        {inv.invoice_id}
                      </td>
                      <td className="py-3 px-3.5 sm:px-3 font-semibold text-foreground">
                        {inv.plan_tier || 'FREE'} ({inv.billing_cycle || 'MONTHLY'})
                      </td>
                      <td className="py-3 px-3.5 sm:px-3 text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}
                      </td>
                      <td className="py-3 px-3.5 sm:px-3 font-semibold text-foreground">
                        Rp {Number(inv.amount).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
                      </td>
                      <td className="py-3 px-3.5 sm:px-3 uppercase text-muted-foreground font-mono">
                        {inv.payment_type || '-'}
                      </td>
                      <td className="py-3 px-3.5 sm:px-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                          isPaid && 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                          isUnpaid && 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
                          isCancelled && 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 sm:px-3 text-right">
                        {isUnpaid ? (
                          <button
                            onClick={() => handleCheckInvoiceStatus(inv.invoice_id)}
                            disabled={checkingInvoiceId === inv.invoice_id}
                            className="px-2.5 py-1 rounded-lg bg-secondary text-primary font-semibold hover:bg-secondary/80 transition-colors inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RefreshCw size={12} className={cn(checkingInvoiceId === inv.invoice_id && 'animate-spin')} />
                            <span>{t('settings.checkStatusBtn')}</span>
                          </button>
                        ) : inv.invoice_url ? (
                          <a
                            href={inv.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>{t('settings.viewInvoiceLink')}</span>
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
