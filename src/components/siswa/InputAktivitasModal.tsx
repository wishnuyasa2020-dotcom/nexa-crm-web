'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';

interface InputAktivitasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InputAktivitasModal({ isOpen, onClose }: InputAktivitasModalProps) {
  const [jenis, setJenis] = useState('');
  const [status, setStatus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 sm:p-5 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground">Input Aktivitas Baru</DialogTitle>
        </DialogHeader>

        {/* Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="p-3 mb-2 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-primary font-medium">
              💡 Tip: Setiap aktivitas akan otomatis memperbarui Status dan Next Action siswa berdasarkan rule Peta Alur.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Jenis Aktivitas</label>
            <select 
              value={jenis}
              onChange={e => setJenis(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Pilih Jenis</option>
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
              <option value="">Pilih Status</option>
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
            <p className="text-[11px] text-muted-foreground">Kapan sistem harus mengingatkan Anda lagi?</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Catatan / Keterangan Tambahan</label>
            <textarea 
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Contoh: Siswa minta dihubungi besok sore karena sedang sekolah."
              rows={4}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-end gap-3 sm:justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-white gradient-primary rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Simpan Aktivitas
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
