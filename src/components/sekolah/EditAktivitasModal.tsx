'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Aktivitas } from '@/lib/types/sekolah.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  aktivitas: Aktivitas | null;
  isManager: boolean;
  userName: string;
  onSuccess: () => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EditAktivitasModal({
  isOpen,
  onClose,
  aktivitas,
  isManager,
  userName,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen && aktivitas) {
      setCatatan(aktivitas.catatan ?? '');
      setDueDate(aktivitas.dueDate ?? '');
    }
  }, [isOpen, aktivitas]);

  if (!isOpen || !aktivitas) return null;

  // Cek apakah masih dalam edit window
  const ageMin = (Date.now() - new Date(aktivitas.createdAt).getTime()) / 60000;
  const withinWindow = isManager ? ageMin <= 1440 : ageMin <= 60;

  if (!withinWindow) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertCircle size={20} />
            <h2 className="font-semibold">Waktu Edit Habis</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {isManager
              ? 'Manager hanya dapat mengedit aktivitas dalam 24 jam setelah dibuat.'
              : 'CRO hanya dapat mengedit aktivitas dalam 1 jam setelah dibuat.'}
          </p>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTerminal = !aktivitas.dueDate && !aktivitas.nextAction;
  // Backend doesn't support downgrade detection or edit yet
  const formValid = catatan.trim().length > 0 && (isTerminal || !!dueDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    alert('Edit aktivitas belum didukung oleh backend.');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Edit2 size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Edit Aktivitas</h2>
              <p className="text-xs text-muted-foreground">{aktivitas.jenisAktivitas} · {new Date(aktivitas.tanggal || aktivitas.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form id="editAktivitasForm" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">

          {/* Info readonly */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-xl text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Hasil Aktivitas</p>
              <p className="font-medium text-foreground text-xs">{aktivitas.hasilAktivitas}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Status Setelah</p>
              <p className="font-medium text-foreground text-xs">{aktivitas.statusSesudah}</p>
            </div>
          </div>



          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              Catatan *
            </label>
            <textarea
              required
              rows={4}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Catatan aktivitas..."
              className={cn(INPUT_CLASS, 'resize-none')}
            />
          </div>

          {/* Due Date */}
          {!isTerminal && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Due Date Next Action *
              </label>
              <input
                required
                type="date"
                value={dueDate}
                min={today()}
                onChange={e => setDueDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          )}

          {/* Edit window info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-amber-400/70" />
            <span>
              {isManager
                ? 'Manager dapat mengedit dalam 24 jam setelah aktivitas dibuat.'
                : 'CRO dapat mengedit dalam 1 jam setelah aktivitas dibuat.'}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="editAktivitasForm"
            disabled={loading || !formValid}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
