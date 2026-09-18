'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SekolahDetail } from '@/lib/types/sekolah.types';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sekolah: SekolahDetail;
  onSuccess: () => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

export function ReassignCROModal({ isOpen, onClose, sekolah, onSuccess }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [croBaru, setCroBaru] = useState('');
  const [alasan, setAlasan] = useState('');
  const [croList, setCroList] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCroBaru('');
      setAlasan('');
      import('@/lib/api/sekolah.api').then(api => api.getCROList().then(setCroList).catch(console.error));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const croOptions = croList.filter(c => c !== sekolah.pjCro);
  const isValid = croBaru && croBaru !== sekolah.pjCro;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const { reassignCRO } = await import('@/lib/api/sekolah.api');
      await reassignCRO(sekolah.id, croBaru, alasan || undefined);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Gagal reassign CRO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <UserCheck size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{t('sekolah.modalReassignTitle')}</h2>
              <p className="text-xs text-muted-foreground">{sekolah.nama}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form id="reassignForm" onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* PJ Saat Ini */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('sekolah.currentCroLabel')}</label>
            <div className={cn(INPUT_CLASS, 'bg-secondary/20 opacity-70 cursor-not-allowed flex items-center gap-2')}>
              👤 {sekolah.pjCro}
            </div>
          </div>

          {/* PJ Baru */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t('sekolah.newCroLabel')}
            </label>
            <select
              required
              value={croBaru}
              onChange={e => setCroBaru(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">{t('sekolah.selectNewCro')}</option>
              {croOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Alasan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t('sekolah.reassignReasonLabel')}
            </label>
            <input
              value={alasan}
              onChange={e => setAlasan(e.target.value)}
              placeholder={t('sekolah.reassignReasonPlaceholder')}
              className={INPUT_CLASS}
            />
          </div>

          {/* Info */}
          {croBaru && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <p>Yang akan diupdate:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>PJ di <span className="text-foreground">sekolah_periode</span> (period aktif)</li>
                <li>PJ di <span className="text-foreground">weekly_planning</span> yang masih planned</li>
                <li>PJ di <span className="text-foreground">aktivitas_ekstra</span> yang masih direncanakan</li>
              </ul>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 pt-0 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer">
            {t('sekolah.cancelBtn')}
          </button>
          <button
            type="submit"
            form="reassignForm"
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {t('sekolah.saveReassignBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
