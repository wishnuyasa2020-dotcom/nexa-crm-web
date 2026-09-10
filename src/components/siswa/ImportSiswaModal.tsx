'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import apiClient from '@/lib/apiClient';

interface ImportSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportSiswaModal({ isOpen, onClose }: ImportSiswaModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [selectedCro, setSelectedCro] = useState('unassigned');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Ahmad Fauzi',
        'ID Sekolah': 'SMK-01',
        'No WA': '081234567890',
        'Kelas': '12 TKJ 1',
        'Minat Awal': 'Ya',
        'Rencana Lulus': 'Kerja',
        'Consent WA': 'Ya',
        'BSUID': ''
      },
      {
        'Nama Lengkap': 'Dewi Lestari',
        'ID Sekolah': 'SMK-01',
        'No WA': '089876543210',
        'Kelas': '12 RPL 2',
        'Minat Awal': 'Ragu',
        'Rencana Lulus': 'Kuliah',
        'Consent WA': 'Ya',
        'BSUID': ''
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          throw new Error('File Excel kosong.');
        }

        // Mapping to match backend expectations
        const mappedData = data.map((row: any) => ({
          nama_lengkap: row['Nama Lengkap'] || row.nama_lengkap || row['Nama'] || row.nama,
          id_sekolah: row['ID Sekolah'] || row.id_sekolah || row['Sekolah'] || row.sekolah,
          no_wa: row['No WA'] || row.no_wa || row['WhatsApp'] || row['Nomor WA'] || row.phone,
          bsuid: row['BSUID'] || row.bsuid,
          kelas: row['Kelas'] || row.kelas,
          minat_awal: row['Minat Awal'] || row.minat_awal || 'Ya',
          rencana_lulus: row['Rencana Lulus'] || row.rencana_lulus || 'Kerja',
          consent_wa: row['Consent WA'] !== undefined 
            ? (row['Consent WA'] === true || String(row['Consent WA']).toLowerCase() === 'ya' || String(row['Consent WA']).toLowerCase() === 'true')
            : true,
        }));

        const res = await apiClient.post('/api/v1/siswa/batch', {
          dataBatch: mappedData,
          croName: selectedCro === 'unassigned' ? null : selectedCro
        });

        if (res.data?.status === 'ok') {
          setSuccessCount(res.data.data.successCount);
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            onClose();
          }, 3000);
        }
      } catch (err: any) {
        console.error('Import error:', err);
        alert(err.response?.data?.message || err.message || 'Gagal memproses file Excel.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-center sm:p-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-lg sm:rounded-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Import Massal (Excel)</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Import Berhasil!</p>
                <p className="text-sm text-muted-foreground">{successCount} data siswa berhasil ditambahkan.</p>
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
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="unassigned">-- Tanpa CRO (Antrian Bebas / Unassigned) --</option>
                  <option value="Budi Santoso">Budi Santoso</option>
                  <option value="Siti Aminah">Siti Aminah</option>
                  <option value="Agus Setiawan">Agus Setiawan</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Pilih CRO penanggung jawab atau masukkan ke antrian bebas untuk diklaim nanti.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 border border-border rounded-xl mt-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Template_Siswa.xlsx</p>
                    <p className="text-xs text-muted-foreground">Format Excel resmi Nexa Intake</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-semibold text-primary hover:underline px-3 py-1.5 bg-primary/10 rounded-md transition-colors"
                >
                  Download
                </button>
              </div>

              <div 
                onClick={handleBoxClick}
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-secondary/40 transition-colors cursor-pointer group"
              >
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                <div className="w-12 h-12 bg-secondary group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                  {isUploading ? (
                    <Loader2 size={20} className="text-primary animate-spin" />
                  ) : (
                    <Upload size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {isUploading ? 'Sedang memproses...' : 'Klik untuk upload file Excel'}
                </p>
                <p className="text-xs text-muted-foreground">
                  XLS, XLSX up to 10MB
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
