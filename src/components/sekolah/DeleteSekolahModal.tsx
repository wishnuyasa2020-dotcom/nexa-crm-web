'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, AlertCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SekolahDetail } from '@/lib/types/sekolah.types';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sekolah: SekolahDetail;
  onSuccess: () => void;
}

const ALASAN_OPTIONS = [
  'Duplikat data',
  'Salah input nama / tingkat / kecamatan',
  'Lainnya'
] as const;

export function DeleteSekolahModal({ isOpen, onClose, sekolah, onSuccess }: Props) {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
  const [loading, setLoading] = useState(false);
  const [alasan, setAlasan] = useState<string>('');
  const [catatanAlasan, setCatatanAlasan] = useState('');

  // Guard Logic checks
  const hasAktivitas = sekolah.aktivitas.length > 0;
  const isIdentityCaptured = ['Identity Captured', 'Lead Captured'].includes(sekolah.status);
  const hasActiveEkstra = sekolah.aktivitasEkstra.some(ae => ae.statusAktivitas === 'Direncanakan');
  
  // Note: we don't have weekly_planning mock yet, so we just check extra activities for now
  const isBlocked = hasAktivitas || isIdentityCaptured || hasActiveEkstra;

  useEffect(() => {
    if (isOpen) {
      setAlasan('');
      setCatatanAlasan('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = alasan && (alasan !== 'Lainnya' || catatanAlasan.trim().length > 0);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    setLoading(true);
    try {
      const { hapusSekolah } = await import('@/lib/api/sekolah.api');
      const finalAlasan = alasan === 'Lainnya' ? catatanAlasan : alasan;
      await hapusSekolah(sekolah.id, finalAlasan);
      onSuccess(); // should redirect to /sekolah list after success
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isBlocked ? "bg-rose-500/10" : "bg-rose-500/20"
            )}>
              {isBlocked ? (
                <Ban size={15} className="text-rose-500" />
              ) : (
                <Trash2 size={15} className="text-rose-500" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {isBlocked 
                  ? t('sekolah.deleteBlockedTitle')
                  : (isGeneral ? t('sekolah.modalDeletePartnerTitle') : t('sekolah.modalDeleteSchoolTitle'))}
              </h2>
              <p className="text-xs text-muted-foreground">{sekolah.nama}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isBlocked ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-sm space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} />
                {t('sekolah.deleteBlockedTitle')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('sekolah.deleteBlockedDesc')}
              </p>
              <ul className="list-disc list-inside text-foreground/90 pl-1 space-y-1 text-xs">
                {hasAktivitas && <li>{sekolah.aktivitas.length} {t('sekolah.entriesCount')}.</li>}
                {isIdentityCaptured && <li>Status: {sekolah.status}.</li>}
                {hasActiveEkstra && <li>{t('sekolah.extraActivityBtn')} {t('sekolah.extraStatusPlanned')}.</li>}
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                {t('sekolah.cancelBtn')}
              </button>
            </div>
          </div>
        ) : (
          <form id="deleteForm" onSubmit={handleDelete} className="p-5 space-y-5">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm space-y-2 text-rose-500">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} /> {t('sekolah.confirmDeleteBtn')}
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {isGeneral ? t('sekolah.deletePartnerWarning') : t('sekolah.deleteSchoolWarning')}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">
                {t('sekolah.deleteReasonLabel')}
              </label>
              <div className="space-y-2">
                {ALASAN_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="radio" 
                        name="alasanDelete" 
                        value={opt}
                        checked={alasan === opt}
                        onChange={(e) => setAlasan(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        alasan === opt ? "border-rose-500 bg-rose-500" : "border-muted-foreground/40"
                      )}>
                        {alasan === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-foreground group-hover:text-rose-400 transition-colors">{opt}</span>
                  </label>
                ))}
              </div>
              
              {alasan === 'Lainnya' && (
                <div className="pt-1">
                  <input
                    required
                    type="text"
                    value={catatanAlasan}
                    onChange={(e) => setCatatanAlasan(e.target.value)}
                    placeholder="Tuliskan alasan spesifik..."
                    className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 outline-none transition-colors placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              >
                {t('sekolah.cancelBtn')}
              </button>
              <button
                type="submit"
                disabled={loading || !isValid}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg shadow-md shadow-rose-500/20 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t('sekolah.confirmDeleteBtn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
