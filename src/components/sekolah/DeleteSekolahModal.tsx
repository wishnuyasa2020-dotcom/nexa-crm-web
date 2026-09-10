'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, AlertCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SekolahDetail } from '@/lib/types/sekolah.types';

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
      alert(e?.response?.data?.message || 'Gagal menghapus sekolah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
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
                {isBlocked ? 'Tidak Bisa Dihapus' : 'Hapus Sekolah'}
              </h2>
              <p className="text-[11px] text-muted-foreground">{sekolah.nama}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isBlocked ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-sm space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} />
                Hard delete tidak diperbolehkan
              </p>
              <ul className="list-disc list-inside text-foreground/90 pl-1 space-y-1 text-xs">
                {hasAktivitas && <li>Sekolah memiliki {sekolah.aktivitas.length} riwayat aktivitas.</li>}
                {isIdentityCaptured && <li>Sekolah sudah berstatus Identity Captured.</li>}
                {hasActiveEkstra && <li>Masih ada aktivitas ekstra yang direncanakan.</li>}
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Gunakan alternatif:</p>
              <button 
                onClick={() => alert('Fitur Input Aktivitas: Set status ke Tidak Bisa Sosialisasi')}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 text-sm transition-colors flex items-center justify-between"
              >
                Set Status "Tidak Bisa Sosialisasi"
                <span className="text-muted-foreground text-xs">→</span>
              </button>
              <button 
                onClick={() => alert('Fitur Input Aktivitas: Set status ke Nonaktif / Tutup / Merger')}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 text-sm transition-colors flex items-center justify-between"
              >
                Set Status "Nonaktif / Tutup / Merger"
                <span className="text-muted-foreground text-xs">→</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form id="deleteForm" onSubmit={handleDelete} className="p-5 space-y-5">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm space-y-2 text-rose-500">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} /> Hapus Permanen
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Anda akan menghapus <strong className="font-semibold">{sekolah.nama}</strong>.<br/>
                Sekolah ini aman dihapus karena belum memiliki riwayat aktivitas. Data yang dihapus tidak bisa dikembalikan.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">
                Alasan Penghapusan <span className="text-rose-400">*</span>
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
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded-full border border-border peer-checked:border-rose-500 peer-checked:bg-rose-500 transition-colors"></div>
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity"></div>
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
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 outline-none transition-colors placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !isValid}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg shadow-md shadow-rose-500/20 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Ya, Hapus Permanen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
