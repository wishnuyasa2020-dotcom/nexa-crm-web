'use client';

import { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, ChevronRight, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export function ImportMassalModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock report data
  const report = {
    total: 120,
    siap: 98,
    skipExact: 15,
    skipNama: 7
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    // Simulate upload & preview generation
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);
    // Simulate import
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep(3);
  };

  const resetAndClose = () => {
    setStep(1);
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
          <div>
            <h2 className="font-bold text-foreground">Import Data Sekolah (Massal)</h2>
            <div className="flex items-center gap-2 mt-1 text-xs font-medium">
              <span className={cn(step >= 1 ? "text-primary" : "text-muted-foreground")}>① Upload</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className={cn(step >= 2 ? "text-primary" : "text-muted-foreground")}>② Preview</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className={cn(step >= 3 ? "text-primary" : "text-muted-foreground")}>③ Konfirmasi</span>
            </div>
          </div>
          <button onClick={resetAndClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-secondary/10 hover:bg-secondary/30 hover:border-primary/30 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} className="text-primary" />
                </div>
                {file ? (
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Drag & drop file Excel</p>
                    <p className="text-xs text-muted-foreground mt-1">atau klik untuk pilih file</p>
                  </>
                )}
              </div>

              <div className="bg-secondary/50 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-primary cursor-pointer hover:underline">
                  <FileSpreadsheet size={14} /> Download Template Excel
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 text-muted-foreground pt-2 border-t border-border/50">
                  <span>Kolom WAJIB:</span> <span className="text-foreground">Nama Sekolah | Tingkat | Kecamatan</span>
                  <span>Kolom Opsional:</span> <span className="text-foreground">Alamat</span>
                  <span>Limit:</span> <span className="text-foreground">Maks. 500 baris per upload</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={resetAndClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                  Batal
                </button>
                <button
                  disabled={!file || loading}
                  onClick={handleUpload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Upload & Preview →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-xl border border-border p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  📊 Ringkasan Import
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Total baris di file</span>
                    <span className="font-medium">{report.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-emerald-500 font-medium">
                      <CheckCircle2 size={15} /> Siap diimport
                    </span>
                    <span className="font-bold text-emerald-500">{report.siap}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-500">
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={15} /> Skip — duplikat exact
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{report.skipExact}</span>
                      <button className="text-[10px] uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors">Detail ▾</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-amber-500">
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={15} /> Skip — nama sama
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{report.skipNama}</span>
                      <button className="text-[10px] uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors">Detail ▾</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                  ← Kembali
                </button>
                <button
                  disabled={loading}
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Konfirmasi & Import →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Import Berhasil!</h3>
              <p className="text-sm text-muted-foreground max-w-64">
                {report.siap} data sekolah berhasil ditambahkan ke database.
              </p>
              <button
                onClick={() => {
                  onSuccess();
                  resetAndClose();
                }}
                className="mt-4 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-all"
              >
                Tutup & Muat Ulang Daftar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
