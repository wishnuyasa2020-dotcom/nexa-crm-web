'use client';

import { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportSiswaModal({ isOpen, onClose }: ImportSiswaModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCro, setSelectedCro] = useState('');

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm sm:items-center sm:p-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-lg sm:rounded-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Import Massal (Excel)</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Import Berhasil!</p>
                <p className="text-sm text-muted-foreground">150 data siswa berhasil ditambahkan.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Penugasan (Assign To) <span className="text-rose-500">*</span>
                </label>
                <select 
                  required
                  value={selectedCro}
                  onChange={e => setSelectedCro(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">-- Pilih Penanggung Jawab (CRO) --</option>
                  <option value="Budi Santoso">Budi Santoso</option>
                  <option value="Siti Aminah">Siti Aminah</option>
                  <option value="Agus Setiawan">Agus Setiawan</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Seluruh siswa di file ini akan otomatis ditugaskan ke CRO yang dipilih.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 border border-border rounded-xl mt-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Template_Siswa.xlsx</p>
                    <p className="text-xs text-muted-foreground">Download template format excel</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-primary hover:underline px-3 py-1.5 bg-primary/10 rounded-md">
                  Download
                </button>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-secondary/20 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-secondary group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <Upload size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Klik untuk upload atau drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  XLS, XLSX up to 10MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-end gap-3">
            <button 
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleUpload}
              disabled={isUploading || !selectedCro}
              className="px-4 py-2.5 text-sm font-medium text-white gradient-primary rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengunggah...
                </>
              ) : (
                'Mulai Import'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
