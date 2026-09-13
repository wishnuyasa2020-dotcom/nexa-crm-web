'use client';

import { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, ChevronRight, CheckCircle2, AlertTriangle, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import apiClient from '@/lib/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SekolahRow {
  nama_sekolah: string;
  tingkat: string;
  kecamatan: string;
  alamat?: string;
}

interface ImportReport {
  total: number;
  siap: number;
  errors: Array<{ row: number; reason: string }>;
}

type Step = 1 | 2 | 3;

export function ImportMassalModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<SekolahRow[]>([]);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setApiError(null);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Nama Sekolah': 'SMK Negeri 1 Contoh', 'Tingkat': 'SMK', 'Kecamatan': 'Kec. Contoh', 'Alamat': 'Jl. Contoh No. 1' },
      { 'Nama Sekolah': 'SMA Negeri 2 Contoh', 'Tingkat': 'SMA', 'Kecamatan': 'Kec. Lain', 'Alamat': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Sekolah');
    XLSX.writeFile(wb, 'Template_Import_Sekolah.xlsx');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setApiError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

        const errors: Array<{ row: number; reason: string }> = [];
        const valid: SekolahRow[] = [];

        rows.forEach((row, idx) => {
          const namaSekolah = String(row['Nama Sekolah'] || row['nama_sekolah'] || '').trim();
          const tingkat = String(row['Tingkat'] || row['tingkat'] || '').trim();
          const kecamatan = String(row['Kecamatan'] || row['kecamatan'] || '').trim();

          if (!namaSekolah) {
            errors.push({ row: idx + 2, reason: 'Kolom "Nama Sekolah" wajib diisi' });
          } else if (!tingkat) {
            errors.push({ row: idx + 2, reason: `Baris ${idx + 2}: Kolom "Tingkat" wajib diisi` });
          } else if (!kecamatan) {
            errors.push({ row: idx + 2, reason: `Baris ${idx + 2}: Kolom "Kecamatan" wajib diisi` });
          } else {
            valid.push({
              nama_sekolah: namaSekolah,
              tingkat,
              kecamatan,
              alamat: String(row['Alamat'] || row['alamat'] || '').trim() || undefined,
            });
          }
        });

        setParsedData(valid);
        setReport({ total: rows.length, siap: valid.length, errors });
        setStep(2);
      } catch (err) {
        setApiError('Gagal membaca file Excel. Pastikan format file benar.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirm = async () => {
    if (!parsedData.length) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await apiClient.post('/api/v1/sekolah/batch', {
        dataBatch: parsedData,
      });
      if (res.data?.status === 'ok') {
        setSuccessCount(res.data.data?.successCount ?? parsedData.length);
        setStep(3);
      } else {
        setApiError(res.data?.message || 'Gagal mengimpor data sekolah.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setApiError(e?.response?.data?.message || e?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setReport(null);
    setApiError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-secondary/30">
          <div>
            <h2 className="font-bold text-foreground">Import Data Sekolah (Massal)</h2>
            <div className="flex items-center gap-2 mt-1 text-xs font-medium">
              <span className={cn(step >= 1 ? "text-primary" : "text-muted-foreground")}>① Upload</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className={cn(step >= 2 ? "text-primary" : "text-muted-foreground")}>② Preview</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className={cn(step >= 3 ? "text-primary" : "text-muted-foreground")}>③ Selesai</span>
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
              <div
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center bg-secondary/10 hover:bg-secondary/30 hover:border-primary/30 transition-all cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} className="text-primary" />
                </div>
                {file ? (
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Klik untuk pilih file Excel</p>
                    <p className="text-xs text-muted-foreground mt-1">Format: .xlsx, .xls, .csv</p>
                  </>
                )}
              </div>

              {apiError && (
                <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-500">
                  {apiError}
                </div>
              )}

              <div className="bg-secondary/50 rounded-xl p-4 text-xs space-y-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <Download size={14} />
                  <FileSpreadsheet size={14} /> Download Template Excel
                </button>
                <div className="grid grid-cols-4 gap-1 text-muted-foreground pt-2 border-t">
                  <span className="col-span-1">Kolom WAJIB:</span>
                  <span className="col-span-3 text-foreground">Nama Sekolah | Tingkat | Kecamatan</span>
                  <span className="col-span-1">Kolom Opsional:</span>
                  <span className="col-span-3 text-foreground">Alamat</span>
                  <span className="col-span-1">Limit:</span>
                  <span className="col-span-3 text-foreground">Maks. 500 baris per upload</span>
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
                  Upload &amp; Preview →
                </button>
              </div>
            </div>
          )}

          {step === 2 && report && (
            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-xl border p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  📊 Ringkasan Import
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Total baris di file</span>
                    <span className="font-medium">{report.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-emerald-500 font-medium">
                      <CheckCircle2 size={15} /> Siap diimport
                    </span>
                    <span className="font-bold text-emerald-500">{report.siap}</span>
                  </div>
                  {report.errors.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-amber-500">
                        <span className="flex items-center gap-2">
                          <AlertTriangle size={15} /> Baris bermasalah (akan dilewati)
                        </span>
                        <span className="font-bold">{report.errors.length}</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 pl-5 text-xs text-muted-foreground">
                        {report.errors.map((err, i) => (
                          <div key={i}>Baris {err.row}: {err.reason}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {apiError && (
                <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-500">
                  {apiError}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                  ← Kembali
                </button>
                <button
                  disabled={loading || report.siap === 0}
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Konfirmasi &amp; Import →
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
                {successCount} data sekolah berhasil ditambahkan ke database.
              </p>
              <button
                onClick={() => {
                  onSuccess();
                  resetAndClose();
                }}
                className="mt-4 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-all"
              >
                Tutup &amp; Muat Ulang Daftar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
