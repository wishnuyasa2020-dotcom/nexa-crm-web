'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JENIS_AKTIVITAS_EKSTRA } from '@/lib/constants/sekolah';
import type { MockSekolah } from '@/lib/mock/sekolah';
import Cookies from 'js-cookie';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sekolah: MockSekolah;
  onSuccess: () => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

function today() {
  return new Date().toISOString().slice(0, 10);
}

const CRO_LIST = ['Budi Santoso', 'Sari Dewi', 'Andi Pratama']; // Mock CRO list

export function AktivitasEkstraModal({ isOpen, onClose, sekolah, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [myName, setMyName] = useState('');

  const [jenisAktivitas, setJenisAktivitas] = useState<string>('');
  const [tanggalRencana, setTanggalRencana] = useState(today());
  const [pjAktivitas, setPjAktivitas] = useState('');
  const [tujuan, setTujuan] = useState('');

  const canAccessEkstra = ['Sudah Sosialisasi', 'Lead Captured'].includes(sekolah.status);

  useEffect(() => {
    if (isOpen) {
      try {
        const userStr = Cookies.get('nexa_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const mgr = ['Manager', 'Admin'].includes(user.role ?? '');
          setIsManager(mgr);
          setMyName(user.nama ?? user.username ?? '');
          // CRO: paksa PJ = nama sendiri
          if (!mgr) setPjAktivitas(user.nama ?? user.username ?? '');
          else setPjAktivitas('');
        }
      } catch {}
      setJenisAktivitas('');
      setTanggalRencana(today());
      setTujuan('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = jenisAktivitas && tanggalRencana && pjAktivitas && tujuan.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      // TODO: apiClient.post(`/api/sekolah/${sekolah.id}/aktivitas-ekstra`, { ... })
      await new Promise(r => setTimeout(r, 600));
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Gagal menyimpan aktivitas ekstra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">➕ Aktivitas Ekstra</h2>
            <p className="text-xs text-muted-foreground">{sekolah.nama}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Guard: status tidak memenuhi */}
        {!canAccessEkstra ? (
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Tidak Tersedia</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Aktivitas Ekstra hanya tersedia untuk sekolah dengan status <strong>Sudah Sosialisasi</strong> atau <strong>Lead Captured</strong>.
                </p>
                <p className="text-xs mt-1 opacity-70">Status saat ini: {sekolah.status}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <>
            <form id="aktivitasEkstraForm" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">

              {/* Jenis Aktivitas — Radio */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Jenis Aktivitas *</label>
                <div className="grid grid-cols-3 gap-2">
                  {JENIS_AKTIVITAS_EKSTRA.map(jenis => (
                    <label
                      key={jenis}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all text-center',
                        jenisAktivitas === jenis
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/20 hover:bg-secondary/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="jenisEkstra"
                        value={jenis}
                        checked={jenisAktivitas === jenis}
                        onChange={() => setJenisAktivitas(jenis)}
                        className="sr-only"
                      />
                      <span className="text-lg">
                        {jenis === 'WhatsApp PIC' ? '💬' : jenis === 'Telepon PIC' ? '📞' : '🤝'}
                      </span>
                      <span className="text-[11px] font-medium leading-tight">{jenis}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tanggal Rencana + PJ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Rencana *</label>
                  <input
                    required
                    type="date"
                    value={tanggalRencana}
                    min={today()}
                    onChange={e => setTanggalRencana(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">PJ Aktivitas *</label>
                  {isManager ? (
                    <select
                      required
                      value={pjAktivitas}
                      onChange={e => setPjAktivitas(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">— Pilih CRO —</option>
                      {CRO_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <div className={cn(INPUT_CLASS, 'bg-secondary/20 opacity-70 cursor-not-allowed')}>
                      🔒 {myName || pjAktivitas}
                    </div>
                  )}
                </div>
              </div>

              {/* Tujuan / Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Tujuan / Catatan * <span className="text-rose-400">— Wajib diisi</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={tujuan}
                  onChange={e => setTujuan(e.target.value)}
                  placeholder="Tujuan aktivitas ekstra ini..."
                  className={cn(INPUT_CLASS, 'resize-none')}
                />
              </div>

              {/* Info: tidak mengubah status */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-primary/60" />
                <span>Aktivitas Ekstra <strong className="text-foreground">tidak mengubah</strong> status CRM sekolah.</span>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-border flex justify-end gap-3 flex-shrink-0">
              <button onClick={onClose} type="button" className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                Batal
              </button>
              <button
                type="submit"
                form="aktivitasEkstraForm"
                disabled={loading || !isValid}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Simpan Rencana
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
