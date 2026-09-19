'use client';

import { useState } from 'react';
import { X, Copy, Check, Info, ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { creditBillingApi, CreditBalanceData } from '@/lib/creditBillingApi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface TopupCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balanceData: CreditBalanceData | null;
}

export default function TopupCreditModal({ isOpen, onClose, onSuccess, balanceData }: TopupCreditModalProps) {
  const { t } = useTranslation();
  const isFirstTopup = balanceData ? balanceData.is_first_topup : true;
  const minAmount = isFirstTopup ? 500000 : 200000;

  const [amount, setAmount] = useState<number>(minAmount);
  const [transferRef, setTransferRef] = useState('');
  const [transferProof, setTransferProof] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('5005414521810767');
    setCopied(true);
    toast.success(t('settings.accountCopiedToast'));
    setTimeout(() => setCopied(false), 2000);
  };

  const presetAmounts = isFirstTopup
    ? [500000, 1000000, 2000000, 5000000]
    : [200000, 500000, 1000000, 2000000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount < minAmount) {
      toast.error(
        t('settings.topupMinAmountToast')
          .replace('{min}', `Rp ${minAmount.toLocaleString('id-ID')}`)
          .replace('{type}', isFirstTopup ? t('settings.firstTopupType') : t('settings.nextTopupType'))
      );
      return;
    }

    if (!transferRef.trim()) {
      toast.error(t('settings.senderRefRequiredToast'));
      return;
    }

    try {
      setIsSubmitting(true);
      await creditBillingApi.submitTopupRequest({
        amount: Number(amount),
        transfer_ref: transferRef.trim(),
        transfer_proof: transferProof.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(t('settings.topupSuccessToast'));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings.topupFailedToast');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              💰
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">{t('settings.topupModalTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('settings.topupModalSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Card Rekening Tujuan */}
          <div className="p-4 rounded-xl border bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>{t('settings.destAccountSectionTitle')}</span>
              <span className="text-primary font-bold">{t('settings.destAccountOfficialBadge')}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-card border">
              <div>
                <div className="text-xs font-semibold text-muted-foreground">{t('settings.bankDestLabel')}</div>
                <div className="font-bold text-foreground text-sm">ATMB PLUS</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t('settings.accountHolderOfficial')}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="font-mono text-sm sm:text-base font-bold text-primary tracking-wider">
                  5005414521810767
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  title={t('settings.copyAccountTooltip')}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <span>
                {t('settings.topupInstructionNotice')}
              </span>
            </div>
          </div>

          {/* Nominal Pilihan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>{t('settings.topupAmountLabel')}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {t('settings.minPrefix')} Rp {minAmount.toLocaleString('id-ID')}
              </span>
            </label>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetAmounts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    amount === p
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Rp {(p / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>

            {/* Input Custom Amount */}
            <div className="relative mt-2">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">Rp</span>
              <input
                type="number"
                min={minAmount}
                step={50000}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary font-bold text-foreground"
                placeholder={`Contoh: ${minAmount}`}
                required
              />
            </div>

            {isFirstTopup && (
              <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>
                  {t('settings.firstTopupNotice')}
                </span>
              </p>
            )}
          </div>

          {/* Referensi / Nama Pengirim */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {t('settings.senderRefLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary text-foreground"
              placeholder={t('settings.senderRefPlaceholder')}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.senderRefHelp')}
            </p>
          </div>

          {/* Link / Bukti Transfer */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {t('settings.transferProofUrlLabel')} <span className="text-muted-foreground font-normal">{t('settings.optionalBadge')}</span>
            </label>
            <input
              type="url"
              value={transferProof}
              onChange={(e) => setTransferProof(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary text-foreground"
              placeholder={t('settings.transferProofPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.transferProofHelp')}
            </p>
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {t('settings.notesLabel')} <span className="text-muted-foreground font-normal">{t('settings.optionalBadge')}</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary text-foreground resize-none"
              placeholder={t('settings.notesPlaceholder')}
            />
          </div>

          {/* Alert Proteksi Keamanan */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-600">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-semibold">{t('settings.ledgerIsolationTitle')}</strong>
              {t('settings.ledgerIsolationDesc')}
            </div>
          </div>

          {/* Footer Tombol */}
          <div className="pt-3 border-t flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              {t('settings.cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{t('settings.processingBtn')}</span>
                </>
              ) : (
                <>
                  <span>{t('settings.submitTopupBtn')}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
