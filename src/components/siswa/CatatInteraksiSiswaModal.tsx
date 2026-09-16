'use client';

import { useState } from 'react';
import { X, MessageCircle, Phone, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import type { InteractionOutcome, InteractionChannel, LogInteraksiPayload } from '@/lib/types/siswa.types';
import { getChannelConfig } from '@/lib/constants/channel';

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

const CHANNEL_OPTIONS: { value: InteractionChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'WhatsApp',      label: 'WhatsApp',       icon: <MessageCircle size={14} /> },
  { value: 'Telepon',       label: 'Telepon',         icon: <Phone size={14} /> },
  { value: 'Visit Langsung',label: 'Visit Langsung',  icon: <MapPin size={14} /> },
];

const OUTCOME_OPTIONS: { value: InteractionOutcome; label: string; group: string }[] = [
  { value: 'Connected',           label: 'Connected (Terhubung)',           group: 'Kontak' },
  { value: 'No Response',         label: 'No Response (Tidak Respon)',      group: 'Kontak' },
  { value: 'Information Delivered',label:'Information Delivered',           group: 'Progres' },
  { value: 'Interest Observed',   label: 'Interest Observed (Minat Terlihat)',group:'Progres' },
  { value: 'Objection Identified',label: 'Objection Identified (Ada Keberatan)', group:'Progres' },
  { value: 'Next Action Agreed',  label: 'Next Action Agreed',              group: 'Progres' },
  { value: 'Commitment Proposed', label: 'Commitment Proposed',             group: 'Komitmen' },
  { value: 'Commitment Confirmed',label: 'Commitment Confirmed (Komit!)',   group: 'Komitmen' },
];

export function CatatInteraksiSiswaModal({
  isOpen, onClose, onSuccess, siswaId, siswaName,
  sourceChannel, sourceDetail, kebutuhanLayanan
}: CatatInteraksiSiswaModalProps) {
  const [channel,    setChannel]    = useState<InteractionChannel>('WhatsApp');
  const [outcome,    setOutcome]    = useState<InteractionOutcome | ''>('');
  const [catatan,    setCatatan]    = useState('');
  const [nextAction, setNextAction] = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const channelMeta = getChannelConfig(sourceChannel);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outcome) { setError('Outcome wajib dipilih.'); return; }
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
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan interaksi.';
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

  // Group outcomes
  const groups = Array.from(new Set(OUTCOME_OPTIONS.map(o => o.group)));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="font-semibold text-foreground text-sm">➕ Catat Interaksi</h2>
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
            <label className="block text-xs font-medium text-muted-foreground mb-2">Channel *</label>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map(ch => (
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
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Outcome / Hasil *</label>
            <select
              value={outcome}
              onChange={e => setOutcome(e.target.value as InteractionOutcome)}
              className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            >
              <option value="">Pilih outcome...</option>
              {groups.map(group => (
                <optgroup key={group} label={group}>
                  {OUTCOME_OPTIONS.filter(o => o.group === group).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Next Action & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Next Action</label>
              <input
                type="text"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="Misal: Follow Up WA"
                className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jadwal Follow Up</label>
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
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan Fakta</label>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
              placeholder="Catat fakta dari interaksi ini (bukan asumsi)..."
              className="w-full px-3 py-2.5 bg-secondary border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
          </div>

          {/* Notice */}
          <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 border">
            ⚠️ Log ini tidak otomatis mengubah Commercial State. Gunakan <strong>Isi Assessment FNAR</strong> jika siswa siap dikualifikasi.
          </p>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !outcome}
              className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Simpan Interaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
