'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditAktivitasModalProps {
  isOpen: boolean;
  onClose: () => void;
  aktivitasId: string | null;
}

export function EditAktivitasModal({ isOpen, onClose, aktivitasId }: EditAktivitasModalProps) {
  const [jenis, setJenis] = useState('WhatsApp');
  const [status, setStatus] = useState('Prospek Aktif');
  const [catatan, setCatatan] = useState('Siswa sangat tertarik, tapi masih ragu masalah biaya. Minta dihubungi lagi lusa.');
  const [dueDate, setDueDate] = useState('2026-08-15');

  // In real implementation, fetch existing data based on aktivitasId when opened.
  useEffect(() => {
    if (isOpen && aktivitasId) {
      // Mock fetch
      console.log('Fetching aktivitas:', aktivitasId);
    }
  }, [isOpen, aktivitasId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm sm:items-center sm:p-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-lg sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Koreksi Aktivitas</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="p-3 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 font-medium">
              Perhatian: Koreksi log aktivitas ini digunakan hanya untuk kesalahan input. Mengubah status di sini akan melakukan override paksa ke Master Siswa.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Jenis Aktivitas</label>
            <select 
              value={jenis}
              onChange={e => setJenis(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telepon">Telepon</option>
              <option value="Home Visit">Home Visit</option>
              <option value="Konsultasi Offline">Konsultasi Offline</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Hasil / Status Tercapai</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Belum Respon">Belum Respon</option>
              <option value="Probing on Progress">Probing on Progress</option>
              <option value="Prospek Aktif">Prospek Aktif</option>
              <option value="Siap Daftar">Siap Daftar</option>
              <option value="Tidak Berminat">Tidak Berminat (Tidak Lanjut)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tanggal Next Action</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Catatan / Keterangan Tambahan</label>
            <textarea 
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-between gap-3">
          <button 
            onClick={onClose}
            className="px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            Hapus Log
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
