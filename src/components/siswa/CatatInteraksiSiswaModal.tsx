'use client';

import { useState } from 'react';
import { X, MessageCircle, Phone, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import type { InteractionOutcome, InteractionChannel, LogInteraksiPayload } from '@/lib/types/siswa.types';
import { getChannelConfig } from '@/lib/constants/channel';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

interface CatatInteraksiSiswaModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess: () => void;
  siswaId:   string;
  siswaName: string;
  sourceChannel?: string;
  sourceDetail?: string;
  kebutuhanLayanan?: string;
}

const OUTCOME_OPTIONS: { value: InteractionOutcome; label: string; groupKey: 'groupContact' | 'groupProgress' | 'groupCommitment' }[] = [
  { value: 'Connected',           label: 'Connected (Terhubung)',           groupKey: 'groupContact' },
  { value: 'No Response',         label: 'No Response (Tidak Respon)',      groupKey: 'groupContact' },
  { value: 'Information Delivered',label:'Information Delivered',           groupKey: 'groupProgress' },
  { value: 'Interest Observed',   label: 'Interest Observed (Minat Terlihat)',groupKey:'groupProgress' },
  { value: 'Objection Identified',label: 'Objection Identified (Ada Keberatan)', groupKey:'groupProgress' },
  { value: 'Next Action Agreed',  label: 'Next Action Agreed',              groupKey: 'groupProgress' },
  { value: 'Commitment Proposed', label: 'Commitment Proposed',             groupKey: 'groupCommitment' },
  { value: 'Commitment Confirmed',label: 'Commitment Confirmed (Komit!)',   groupKey: 'groupCommitment' },
];

export function CatatInteraksiSiswaModal({
  isOpen, onClose, onSuccess, siswaId, siswaName,
  sourceChannel, sourceDetail, kebutuhanLayanan
}: CatatInteraksiSiswaModalProps) {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();

  const [channel,    setChannel]    = useState<InteractionChannel>('WhatsApp');
  const [outcome,    setOutcome]    = useState<InteractionOutcome | ''>('');
  const [catatan,    setCatatan]    = useState('');
  const [nextAction, setNextAction] = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const channelMeta = getChannelConfig(sourceChannel);

  const channelOptions: { value: InteractionChannel; label: string; icon: React.ReactNode }[] = [
    { value: 'WhatsApp',      label: t('interactionModal.channelWhatsapp'), icon: <MessageCircle size={14} /> },
    { value: 'Telepon',       label: t('interactionModal.channelPhone'),    icon: <Phone size={14} /> },
    { value: 'Visit Langsung',label: t('interactionModal.channelVisit'),    icon: <MapPin size={14} /> },
  ];

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outcome) { setError(t('interactionModal.outcomeRequired')); return; }
    setLoading(true); setError('');
    try {
      const payload: LogInteraksiPayload = {
        outcome: outcome as InteractionOutcome,
        channel,
        catatan:    catatan    || undefined,
        next_action: nextAction || undefined,
        due_date:   dueDate    || undefined,
      };
      await apiClient.post(`/api/v1/siswa/${siswaId}/interactions`, payload);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('interactionModal.saveFailed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setChannel('WhatsApp'); setOutcome(''); setCatatan('');
    setNextAction(''); setDueDate(''); setError('');
    onClose();
  }

  // Unique outcome groups
  const groups: Array<'groupContact' | 'groupProgress' | 'groupCommitment'> = ['groupContact', 'groupProgress', 'groupCommitment'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="font-semibold text-foreground text-sm">➕ {t('interactionModal.title')}</h2>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className="text-xs font-bold text-foreground truncate">{siswaName}</span>
              {sourceChannel && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                  channelMeta.badgeClass
                )}>
                  <span>{channelMeta.icon}</span>
                  <span>{channelMeta.label}</span>
                  {sourceDetail && <span className="opacity-80">({sourceDetail})</span>}
                </span>
              )}
              {kebutuhanLayanan && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <span>🎯</span>
                  <span className="truncate max-w-44">{kebutuhanLayanan}</span>
                </span>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Channel */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">{t('interactionModal.channelLabel')}</label>
            <div className="flex gap-2">
              {channelOptions.map(ch => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all',
                    channel === ch.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {ch.icon} {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('interactionModal.outcomeLabel')}</label>
            <select
              value={outcome}
              onChange={e => setOutcome(e.target.value as InteractionOutcome)}
              className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            >
              <option value="">{t('interactionModal.outcomePlaceholder')}</option>
              {groups.map(groupKey => (
                <optgroup key={groupKey} label={t(`interactionModal.${groupKey}`)}>
                  {OUTCOME_OPTIONS.filter(o => o.groupKey === groupKey).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Next Action & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('interactionModal.nextActionLabel')}</label>
              <input
                type="text"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder={isGeneral ? t('interactionModal.nextActionPlaceholderGeneral') : t('interactionModal.nextActionPlaceholder')}
                className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('interactionModal.dueDateLabel')}</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('interactionModal.notesLabel')}</label>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
              placeholder={t('interactionModal.notesPlaceholder')}
              className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
          </div>

          {/* Notice */}
          <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 border">
            ⚠️ {t('interactionModal.noticeWarning')} <strong>{t('interactionModal.noticeAction')}</strong> {isGeneral ? t('interactionModal.noticeSuffixGeneral') : t('interactionModal.noticeSuffixLpk')}
          </p>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('interactionModal.cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={loading || !outcome}
              className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? t('interactionModal.savingBtn') : t('interactionModal.saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
