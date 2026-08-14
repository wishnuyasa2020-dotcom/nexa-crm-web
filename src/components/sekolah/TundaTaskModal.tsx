'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDate: string, alasan: string) => void;
  taskTitle: string;
}

export function TundaTaskModal({ isOpen, onClose, onSuccess, taskTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [tanggalBaru, setTanggalBaru] = useState('');
  const [alasanTunda, setAlasanTunda] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalBaru) return;

    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    onSuccess(tanggalBaru, alasanTunda);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border flex flex-col">
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tanggal Baru <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalBaru}
              onChange={(e) => setTanggalBaru(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Alasan Tunda (Opsional)</label>
            <textarea
              rows={3}
              value={alasanTunda}
              onChange={(e) => setAlasanTunda(e.target.value)}
              placeholder="Kenapa agenda ini ditunda?"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!tanggalBaru || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
