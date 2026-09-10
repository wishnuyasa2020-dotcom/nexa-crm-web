'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import type { FNARResult, AssessmentFNARPayload } from '@/lib/types/siswa.types';

interface AssessmentFNARModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess: (result: { allPass: boolean; anyFail: boolean; commercialState: string }) => void;
  siswaId:   string;
  siswaName: string;
}

interface FNARDimension {
  key:         keyof Pick<AssessmentFNARPayload, 'fit' | 'need' | 'ability' | 'readiness'>;
  catatanKey:  keyof Pick<AssessmentFNARPayload, 'catatan_fit' | 'catatan_need' | 'catatan_ability' | 'catatan_readiness'>;
  label:       string;
  description: string;
  isHardGate:  boolean;
}

const FNAR_DIMENSIONS: FNARDimension[] = [
  {
    key: 'fit', catatanKey: 'catatan_fit',
    label: '1. FIT',
    description: 'Kesesuaian Demografis & Kriteria (Usia, Pendidikan, Fisik)',
    isHardGate: true,
  },
  {
    key: 'need', catatanKey: 'catatan_need',
    label: '2. NEED',
    description: 'Kebutuhan & Motivasi Kuat (Alasan ingin berangkat)',
    isHardGate: false,
  },
  {
    key: 'ability', catatanKey: 'catatan_ability',
    label: '3. ABILITY',
    description: 'Kemampuan Fisik & Finansial (Tidak ada riwayat medis berat)',
    isHardGate: true,
  },
  {
    key: 'readiness', catatanKey: 'catatan_readiness',
    label: '4. READINESS',
    description: 'Kesiapan Orang Tua & Waktu (Ada persetujuan keluarga)',
    isHardGate: false,
  },
];

type FNARState = {
  fit: FNARResult;
  need: FNARResult;
  ability: FNARResult;
  readiness: FNARResult;
  catatan_fit: string;
  catatan_need: string;
  catatan_ability: string;
  catatan_readiness: string;
};

const DEFAULT_STATE: FNARState = {
  fit: 'pending', need: 'pending', ability: 'pending', readiness: 'pending',
  catatan_fit: '', catatan_need: '', catatan_ability: '', catatan_readiness: '',
};

function ResultIcon({ value }: { value: FNARResult }) {
  if (value === 'pass') return <CheckCircle size={16} className="text-emerald-400" />;
  if (value === 'fail') return <XCircle size={16} className="text-rose-400" />;
  return <Clock size={16} className="text-muted-foreground" />;
}

export function AssessmentFNARModal({
  isOpen, onClose, onSuccess, siswaId, siswaName
}: AssessmentFNARModalProps) {
  const [form,    setForm]    = useState<FNARState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!isOpen) return null;

  const allAnswered = FNAR_DIMENSIONS.every(d => form[d.key] !== 'pending');
  const allPass     = FNAR_DIMENSIONS.every(d => form[d.key] === 'pass');
  const anyHardFail = FNAR_DIMENSIONS.filter(d => d.isHardGate).some(d => form[d.key] === 'fail');

  function setDimension(key: keyof Pick<FNARState, 'fit' | 'need' | 'ability' | 'readiness'>, value: FNARResult) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  function setCatatan(key: keyof Pick<FNARState, 'catatan_fit' | 'catatan_need' | 'catatan_ability' | 'catatan_readiness'>, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered) { setError('Semua dimensi FNAR wajib diisi.'); return; }
    setLoading(true); setError('');
    try {
      const payload: AssessmentFNARPayload = { ...form };
      const res = await apiClient.post(`/api/v1/siswa/${siswaId}/assessments`, payload);
      onSuccess(res.data.data);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan assessment.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(DEFAULT_STATE); setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground text-sm">📝 Assessment Kualifikasi (FNAR)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{siswaName}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
              💡 Berikan bukti objektif untuk setiap dimensi. Sistem akan menentukan transisi status secara otomatis.
              <strong className="text-foreground"> 🔒 FIT & ABILITY adalah Hard Gate</strong> — tidak bisa dinego.
            </p>

            {FNAR_DIMENSIONS.map(dim => (
              <div key={dim.key} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {dim.label}
                      {dim.isHardGate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                          Hard Gate
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{dim.description}</p>
                  </div>
                  <ResultIcon value={form[dim.key]} />
                </div>

                {/* Radio buttons */}
                <div className="flex gap-2">
                  {(['pass', 'fail'] as FNARResult[]).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDimension(dim.key, v)}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-xs font-medium transition-all',
                        form[dim.key] === v && v === 'pass' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' :
                        form[dim.key] === v && v === 'fail' ? 'border-rose-500 bg-rose-500/15 text-rose-400' :
                        'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {v === 'pass' ? '✅ Sesuai / Lulus' : '❌ Tidak Sesuai'}
                    </button>
                  ))}
                </div>

                {/* Catatan */}
                <textarea
                  value={form[dim.catatanKey]}
                  onChange={e => setCatatan(dim.catatanKey, e.target.value)}
                  rows={2}
                  placeholder={`Bukti / catatan untuk dimensi ${dim.label}...`}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Preview hasil */}
          {allAnswered && (
            <div className={cn(
              'mx-5 mb-3 px-4 py-3 rounded-xl border text-sm font-medium',
              allPass ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
              anyHardFail ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            )}>
              {allPass ? '🎯 Semua dimensi lulus → Status berubah ke PROSPECT' :
               anyHardFail ? '🔴 Hard Gate gagal → Status berubah ke DISQUALIFIED' :
               '⏳ Beberapa dimensi belum terpenuhi → Tetap di status saat ini'}
            </div>
          )}

          {error && <p className="mx-5 text-xs text-rose-400 mb-2">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 p-5 pt-0">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !allAnswered}
              className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
