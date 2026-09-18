'use client';

import { useState } from 'react';
import { X, GraduationCap, Loader2, Sparkles, Award, HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import type { RelationshipLevel } from '@/lib/types/siswa.types';

interface GraduationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siswaId: string;
  siswaName: string;
}

export function GraduationModal({
  isOpen,
  onClose,
  onSuccess,
  siswaId,
  siswaName
}: GraduationModalProps) {
  const [catatan, setCatatan] = useState('');
  const [relationshipLevel, setRelationshipLevel] = useState<RelationshipLevel>('STANDARD');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put(`/api/v1/siswa/${siswaId}`, {
        status_sesudah: 'Alumni',
        jenis_aktivitas: 'Kelulusan / Selesai Pelatihan',
        hasil_aktivitas: 'Core Relationship Completed',
        catatan: catatan.trim() || 'Siswa telah menyelesaikan program pelatihan / penempatan kerja secara resmi.',
        next_action: 'Relasi Alumni / Referral Program',
        relationship_level: relationshipLevel
      });

      toast.success(`${siswaName} berhasil ditandai sebagai Alumni (Post-Customer)!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses kelulusan siswa.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Tandai Lulus / Alumni</h2>
              <p className="text-xs text-muted-foreground">Transisi Lifecycle: Customer ➔ Post-Customer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <Sparkles size={14} /> Konfirmasi Penyelesaian Layanan Inti
            </p>
            Siswa <strong>{siswaName}</strong> telah menyelesaikan kontrak pelatihan/penempatan kerja. Status komersial akan bertransisi ke <strong>POST_CUSTOMER (Alumni)</strong> dan entitas tetap tersimpan di universe relasi NexaMOS.
          </div>

          {/* Dimensi Kualitas Perilaku Hubungan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kualitas Hubungan / Advocacy Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRelationshipLevel('STANDARD')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  relationshipLevel === 'STANDARD'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Award size={14} className="mb-1" />
                <p className="font-bold">Standard</p>
                <p className="text-xs opacity-80 text-muted-foreground">Alumni umum</p>
              </button>

              <button
                type="button"
                onClick={() => setRelationshipLevel('LOYAL')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  relationshipLevel === 'LOYAL'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                <HeartHandshake size={14} className="mb-1" />
                <p className="font-bold">Loyal</p>
                <p className="text-xs opacity-80 text-muted-foreground">Hubungan erat</p>
              </button>

              <button
                type="button"
                onClick={() => setRelationshipLevel('ADVOCATE')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  relationshipLevel === 'ADVOCATE'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 ring-1 ring-purple-500'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Sparkles size={14} className="mb-1" />
                <p className="font-bold">Advocate</p>
                <p className="text-xs opacity-80 text-muted-foreground">Rekomender aktif</p>
              </button>
            </div>
          </div>

          {/* Catatan / Keterangan Kelulusan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Catatan Kelulusan / Penempatan
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Contoh: Lulus sertifikasi JLPT N3, siap terbang keberangkatan batch November..."
              className="w-full px-3 py-2 bg-secondary/50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <GraduationCap size={14} />
                  <span>Konfirmasi Alumni</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
