'use client';

import { useState } from 'react';
import { X, Trash2, AlertOctagon } from 'lucide-react';

interface DeleteSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaName: string;
}

export function DeleteSiswaModal({ isOpen, onClose, siswaName }: DeleteSiswaModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    setIsDeleting(true);
    // Simulate delete delay
    setTimeout(() => {
      setIsDeleting(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm sm:items-center sm:p-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-lg sm:rounded-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Hapus Data Siswa</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
              <AlertOctagon size={32} />
            </div>
            <div>
              <p className="text-foreground text-sm leading-relaxed mb-2">
                Anda yakin ingin menghapus seluruh data dan riwayat aktivitas milik <span className="font-bold">"{siswaName}"</span>?
              </p>
              <p className="text-xs text-rose-500 font-medium px-4 py-2 bg-rose-500/10 rounded-lg">
                Peringatan: Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Ketik "HAPUS" untuk konfirmasi
            </label>
            <input 
              type="text"
              placeholder="HAPUS"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm text-center font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== 'HAPUS'}
            className="px-4 py-2.5 text-sm font-medium text-white bg-rose-500 rounded-lg shadow-sm hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Hapus Permanen
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
