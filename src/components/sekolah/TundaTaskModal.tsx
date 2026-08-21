'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDate: string, alasan: string) => void;
  taskTitle: string;
  /** ID task (id_sekolah / id_siswa / id_siswa_nama / id_aktifitas_ekstra) */
  taskId?: string;
  /** Tipe entitas untuk hit endpoint yang benar */
  taskTipe?: 'sekolah' | 'siswa' | 'homevisit' | 'aktifitas_ekstra';
}

export function TundaTaskModal({ isOpen, onClose, onSuccess, taskTitle, taskId, taskTipe }: Props) {
  const [loading, setLoading]         = useState(false);
  const [tanggalBaru, setTanggalBaru] = useState('');
  const [alasanTunda, setAlasanTunda] = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [done, setDone]               = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalBaru) return;
    if (!alasanTunda.trim()) {
      setError('Alasan penundaan wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (taskId && taskTipe) {
        // Hit endpoint reschedule real
        await apiClient.post(`/tasks/${taskId}/reschedule`, {
          tipe:    taskTipe,
          newDate: tanggalBaru,
          alasan:  alasanTunda.trim(),
        });
      }
      setDone(true);
      setTimeout(() => {
        onSuccess(tanggalBaru, alasanTunda);
        setDone(false);
        setTanggalBaru('');
        setAlasanTunda('');
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan perubahan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Tanggal minimal = besok
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Tunda Agenda</h2>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{taskTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tanggal Baru <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={tanggalBaru}
              onChange={(e) => setTanggalBaru(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Alasan Tunda <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={alasanTunda}
              onChange={(e) => { setAlasanTunda(e.target.value); setError(null); }}
              placeholder="Kenapa agenda ini ditunda?"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!tanggalBaru || !alasanTunda.trim() || loading || done}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {done ? (
                <><CheckCircle2 size={14} /> Tersimpan!</>
              ) : loading ? (
                <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
