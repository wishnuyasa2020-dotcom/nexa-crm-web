'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, CheckCircle2, Clock, AlertTriangle, 
  Smartphone, ShieldCheck, RefreshCw, XCircle, 
  Info, Sparkles, Building, ArrowRight, ShieldAlert, AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

export interface WhatsAppConfigData {
  tenantId: string;
  brandName: string;
  whatsappPhoneId: string | null;
  whatsappWabaId: string | null;
  whatsappNumber: string | null;
  whatsappDisplayName: string | null;
  whatsappStatus: 'NOT_CONFIGURED' | 'PENDING_PROVISIONING' | 'CONNECTED' | 'REJECTED';
  whatsappBusinessCategory: string | null;
  whatsappRequestedAt: string | null;
  whatsappConnectedAt: string | null;
  whatsappNotes: string | null;
}

export default function WhatsAppTab() {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
  const [data, setData] = useState<WhatsAppConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Lembaga Pelatihan Kerja (LPK)');
  const [checkFreshNumber, setCheckFreshNumber] = useState(false);
  const [checkDisplayNameCompliance, setCheckDisplayNameCompliance] = useState(false);
  const [notes, setNotes] = useState('');

  const loadWhatsappStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/settings/whatsapp');
      if (res.data?.status === 'ok') {
        setData(res.data.data);
        if (res.data.data.whatsappDisplayName) {
          setDisplayName(res.data.data.whatsappDisplayName);
        } else if (res.data.data.brandName) {
          setDisplayName(res.data.data.brandName);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load whatsapp config:', err);
      toast.error(t('settings.waLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadWhatsappStatus();
  }, [loadWhatsappStatus]);

  async function handleSubmitRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!checkFreshNumber) {
      toast.error(t('settings.agreeFreshNumberToast'));
      return;
    }
    if (!checkDisplayNameCompliance) {
      toast.error(t('settings.agreeDisplayNameToast'));
      return;
    }
    if (!whatsappNumber.trim()) {
      toast.error(t('settings.waNumberRequiredToast'));
      return;
    }
    if (!displayName.trim()) {
      toast.error(t('settings.displayNameRequiredToast'));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        displayName: displayName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        businessCategory,
        isFreshNumberDeclaration: true,
        notes: notes.trim(),
      };

      const res = await apiClient.post('/api/v1/settings/whatsapp/register', payload);
      if (res.data?.status === 'ok') {
        toast.success(res.data.message || t('settings.waRegisterSuccessToast'));
        setData(res.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('settings.waRegisterFailedToast');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect() {
    const confirm = window.confirm(
      t('settings.disconnectWaConfirm')
    );
    if (!confirm) return;

    try {
      setDisconnecting(true);
      const res = await apiClient.delete('/api/v1/settings/whatsapp/disconnect');
      if (res.data?.status === 'ok') {
        toast.success(t('settings.disconnectSuccessToast'));
        setData(res.data.data);
        setCheckFreshNumber(false);
        setCheckDisplayNameCompliance(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('settings.disconnectFailedToast');
      toast.error(msg);
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{t('settings.waTabLoading')}</p>
      </div>
    );
  }

  const status = data?.whatsappStatus || 'NOT_CONFIGURED';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">{t('settings.waTabTitle')}</h2>
                {status === 'CONNECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {t('settings.waStatusConnected')}
                  </span>
                )}
                {status === 'PENDING_PROVISIONING' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Clock size={12} />
                    {t('settings.waStatusPending')}
                  </span>
                )}
                {status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                    <XCircle size={12} />
                    {t('settings.waStatusRejected')}
                  </span>
                )}
                {status === 'NOT_CONFIGURED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                    {t('settings.waStatusNotConfigured')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-0.5 leading-relaxed">
                {t('settings.waTabSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
            <span className="text-xs text-muted-foreground sm:hidden">{t('settings.syncStatusLabel')}</span>
            <button
              onClick={loadWhatsappStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border rounded-lg hover:bg-muted/50 transition-colors shrink-0"
            >
              <RefreshCw size={13} />
              <span>{t('settings.refreshBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATE 1: REJECTED ALERT ── */}
      {status === 'REJECTED' && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-destructive">{t('settings.waRejectedTitle')}</p>
            <p className="text-muted-foreground leading-relaxed">
              {t('settings.waRejectedAdminNotes')} <span className="text-foreground font-medium">{data?.whatsappNotes || t('settings.waRejectedDefaultNotes')}</span>
            </p>
            <p className="text-muted-foreground">{t('settings.waRejectedRecheckPrompt')}</p>
          </div>
        </div>
      )}

      {/* ── STATE 2: CONNECTED (SUDAH AKTIF) ── */}
      {status === 'CONNECTED' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="border-0 sm:border bg-transparent sm:bg-card p-0 sm:p-6 shadow-none sm:shadow-sm rounded-none sm:rounded-2xl space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('settings.officialWaNumberLabel')}</span>
                <p className="text-base font-bold text-foreground font-mono">
                  {data?.whatsappNumber ? `+${data.whatsappNumber}` : t('settings.registeredNumberPlaceholder')}
                </p>
                <p className="text-xs text-muted-foreground">{t('settings.officialWaNumberHelp')}</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('settings.displayNameLabel')}</span>
                <p className="text-base font-bold text-foreground">
                  {data?.whatsappDisplayName || data?.brandName}
                </p>
                <p className="text-xs text-muted-foreground">{t('settings.displayNameHelp')}</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('settings.metaPhoneIdLabel')}</span>
                <p className="text-xs font-mono text-emerald-600 font-semibold truncate">
                  {data?.whatsappPhoneId || '-'}
                </p>
                <p className="text-xs text-muted-foreground">{t('settings.metaPhoneIdHelp')}</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('settings.connectedDateLabel')}</span>
                <p className="text-xs font-medium text-foreground">
                  {data?.whatsappConnectedAt ? new Date(data.whatsappConnectedAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'Aktif'}
                </p>
                <p className="text-xs text-emerald-600 font-medium">{t('settings.qualityRatingNotice')}</p>
              </div>
            </div>

            {/* Ready Modules Callout */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{t('settings.waModulesReadyTitle')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.waModulesReadyDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* BSUID Notice for Connected State */}
            <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/30 flex items-start gap-3">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{t('settings.bsuidNoticeTitle')}</strong> {isGeneral ? t('settings.bsuidNoticeDescGeneral') : t('settings.bsuidNoticeDescLpk')}
              </p>
            </div>

            {/* Danger Zone: Disconnect */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-destructive/20 bg-destructive/5 sm:border-0 sm:border-t sm:rounded-none sm:bg-transparent sm:pt-4 sm:p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground">{t('settings.disconnectWaTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.disconnectWaDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-destructive/30 bg-card sm:bg-transparent text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-center"
              >
                {disconnecting ? t('settings.disconnectingBtn') : t('settings.disconnectWaBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 3: PENDING PROVISIONING (DALAM PROSES) ── */}
      {status === 'PENDING_PROVISIONING' && (
        <div className="border-0 sm:border bg-transparent sm:bg-card p-0 sm:p-6 shadow-none sm:shadow-sm rounded-none sm:rounded-2xl space-y-4 sm:space-y-6">
          <div className="p-3.5 sm:p-0 rounded-xl border sm:border-0 bg-card sm:bg-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{t('settings.pendingReviewTitle')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('settings.pendingReviewDesc')}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={14} /> {t('settings.step1Title')}
              </span>
              <p className="text-xs font-medium text-foreground">{t('settings.step1Name')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.step1Desc')}</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <RefreshCw size={14} className="animate-spin" /> {t('settings.step2Title')}
              </span>
              <p className="text-xs font-medium text-foreground">{t('settings.step2Name')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.step2Desc')}</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-card sm:bg-muted/40 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{t('settings.step3Title')}</span>
              <p className="text-xs font-medium text-muted-foreground">{t('settings.step3Name')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.step3Desc')}</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-card sm:bg-muted/40 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{t('settings.step4Title')}</span>
              <p className="text-xs font-medium text-muted-foreground">{t('settings.step4Name')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.step4Desc')}</p>
            </div>
          </div>

          {/* Submitted Summary */}
          <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/20 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">{t('settings.submissionSummaryTitle')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">{t('settings.summaryWaNumber')}</span>
                <span className="font-semibold text-foreground font-mono">+{data?.whatsappNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t('settings.summaryDisplayName')}</span>
                <span className="font-semibold text-foreground">{data?.whatsappDisplayName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t('settings.summaryIndustry')}</span>
                <span className="font-semibold text-foreground">{data?.whatsappBusinessCategory || '-'}</span>
              </div>
            </div>
          </div>

          {/* Crucial OTP Instruction Alert */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground">{t('settings.otpAlertTitle')}</p>
              <p className="text-muted-foreground leading-relaxed">
                {t('settings.otpAlertDesc')}
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {disconnecting ? t('settings.cancelingBtn') : t('settings.cancelSubmissionBtn')}
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 4: NOT_CONFIGURED OR REJECTED (FORMULIR REGISTRASI) ── */}
      {(status === 'NOT_CONFIGURED' || status === 'REJECTED') && (
        <form onSubmit={handleSubmitRegister} className="border-0 sm:border bg-transparent sm:bg-card p-0 sm:p-6 shadow-none sm:shadow-sm rounded-none sm:rounded-2xl space-y-4 sm:space-y-6">
          <div className="p-3.5 sm:p-0 rounded-xl border sm:border-0 bg-card sm:bg-transparent flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">{t('settings.waRegFormTitle')}</h3>
          </div>

          {/* ── CALLOUT 1: REKOMENDASI MUTLAK NOMOR BARU (FRESH SIM) ── */}
          <div className="p-3.5 sm:p-4.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
              <Smartphone size={16} />
              <span>{t('settings.calloutFreshSimTitle')}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('settings.calloutFreshSimDesc')}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <strong className="text-foreground">{t('settings.calloutFreshSimBenefitTitle')}</strong> {t('settings.calloutFreshSimBenefitText')}
              </li>
              <li>
                <strong className="text-foreground">{t('settings.calloutOldSimTitle')}</strong> {t('settings.calloutOldSimText')}
              </li>
            </ul>
          </div>

          {/* ── CALLOUT 2: KESESUAIAN DISPLAY NAME DENGAN META POLICY ── */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <Building size={16} />
              <span>{t('settings.calloutDisplayNameTitle')}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('settings.calloutDisplayNameDesc')}
            </p>
          </div>

          {/* ── CALLOUT 3: KESIAPAN BSUID META 2026 ── */}
          <div className="p-3.5 sm:p-4 rounded-xl border bg-card sm:bg-muted/30 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{t('settings.calloutBsuidTitle')}</strong> {isGeneral ? t('settings.calloutBsuidDescGeneral') : t('settings.calloutBsuidDescLpk')}
            </p>
          </div>

          {/* Form Fields */}
          <div className="p-3.5 sm:p-0 rounded-xl border sm:border-0 bg-card sm:bg-transparent grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('settings.formDisplayNameLabel')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: LPK Derma Indonesia"
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">{t('settings.formDisplayNameHelp')}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('settings.formWaNumberLabel')} <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-semibold text-muted-foreground select-none">
                  +62
                </span>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="81234567890"
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('settings.formWaNumberHelp')}</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">{t('settings.formIndustryCategoryLabel')}</label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Lembaga Pelatihan Kerja (LPK)">{t('settings.categoryLpk')}</option>
                <option value="Sekolah / Perguruan Tinggi">{t('settings.categorySchool')}</option>
                <option value="Klinik & Kesehatan Estetika">{t('settings.categoryClinic')}</option>
                <option value="Konsultan & Jasa Profesional">{t('settings.categoryConsultant')}</option>
                <option value="Perdagangan & Retail">{t('settings.categoryRetail')}</option>
                <option value="Lainnya">{t('settings.categoryOther')}</option>
              </select>
            </div>
          </div>

          {/* Declarations (Mandatory Checkboxes) */}
          <div className="p-3.5 sm:p-0 rounded-xl border sm:border-0 bg-card sm:bg-transparent space-y-3 pt-3 sm:pt-2 sm:border-t">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={checkFreshNumber}
                onChange={(e) => setCheckFreshNumber(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground leading-relaxed">
                <strong className="text-emerald-600 font-semibold">{t('settings.requiredDeclarationBadge')}</strong> {t('settings.declarationFreshSim')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={checkDisplayNameCompliance}
                onChange={(e) => setCheckDisplayNameCompliance(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground leading-relaxed">
                <strong className="text-amber-600 font-semibold">{t('settings.requiredDeclarationBadge')}</strong> {t('settings.declarationDisplayName')}
              </span>
            </label>
          </div>

          <div className="pt-2 sm:pt-4 sm:border-t flex justify-end">
            <button
              type="submit"
              disabled={submitting || !checkFreshNumber || !checkDisplayNameCompliance}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('settings.submittingWaRegBtn')}
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  {t('settings.submitWaRegBtn')}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
