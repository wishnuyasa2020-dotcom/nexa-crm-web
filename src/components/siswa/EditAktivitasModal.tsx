'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface EditAktivitasModalProps {
  isOpen: boolean;
  onClose: () => void;
  aktivitasId: string | null;
  siswaId: string;
  onSuccess?: () => void;
}

// Hasil aktivitas yang valid sesuai HASIL_AKTIVITAS_SISWA
const HASIL_AKTIVITAS = [
  { value: 'Screening Belum Berhasil', label: 'Screening Belum Berhasil' },
  { value: 'Screening Dihentikan',     label: 'Screening Dihentikan 🔴' },
  { value: 'Probing on Progress',      label: 'Probing on Progress' },
  { value: 'Prospek Aktif',            label: 'Prospek Aktif' },
  { value: 'Konsultasi Dijadwalkan',   label: 'Konsultasi Dijadwalkan' },
  { value: 'Layak Home Visit',         label: 'Layak Home Visit' },
  { value: 'Home Visit Selesai',       label: 'Home Visit Selesai' },
  { value: 'Siap Daftar',              label: 'Siap Daftar' },
  { value: 'Berhasil Daftar',          label: 'Berhasil Daftar ✅' },
  { value: 'Ditunda',                  label: 'Ditunda' },
  { value: 'Tidak Berminat',           label: 'Tidak Berminat 🔴' },
  { value: 'Tdk Memenuhi Syarat',      label: 'Tdk Memenuhi Syarat 🔴' },
];

const IS_TERMINAL = new Set([
  'Screening Dihentikan',
  'Berhasil Daftar',
  'Tidak Berminat',
  'Tdk Memenuhi Syarat',
]);

export function EditAktivitasModal({ isOpen, onClose, aktivitasId, siswaId, onSuccess }: EditAktivitasModalProps) {
  const [jenis, setJenis] = useState('');
  const [status, setStatus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing data based on aktivitasId when opened.
  useEffect(() => {
    if (isOpen && aktivitasId && siswaId) {
      setFetching(true);
      setError('');
      // Kita pakai data dari list detail siswa, tapi bisa juga hit GET endpoint khusus kalau ada.
      // Untuk amannya, kita fetch ulang detail log ini jika ada endpoint, 
      // namun karena di backend belum ada GET /aktivitas/:logId,
      // kita harusnya nge-pass data initial dari parent.
      // Tapi untuk simplicity, kita reset saja formnya jika tidak ada initialData.
      // (Idealnya parent melempar full objek aktivitas yang mau diedit)
      
      // Karena kita gak punya GET khusus log, kita biarkan kosong dulu atau isi mock if needed
      // Atau fetch detail siswa dan filter lognya.
      apiClient.get(`/api/v1/siswa/${siswaId}`).then(res => {
         const logs = res.data?.data?.logs || [];
         const log = logs.find((l: any) => l.id == aktivitasId);
         if (log) {
           setJenis(log.jenis_aktivitas || '');
           setStatus(log.hasil_aktivitas || '');
           setCatatan(log.catatan || '');
           setDueDate(log.due_date ? log.due_date.substring(0, 10) : '');
         }
      }).catch(err => {
         console.error('Failed to fetch log', err);
      }).finally(() => {
         setFetching(false);
      });
    }
  }, [isOpen, aktivitasId, siswaId]);

  if (!isOpen) return null;
  
  const isTerminal = IS_TERMINAL.has(status);

  const handleSubmit = async () => {
    if (!jenis) return setError('Jenis aktivitas wajib diisi.');
    if (!status) return setError('Hasil aktivitas wajib diisi.');
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        jenis_aktivitas: jenis,
        hasil_aktivitas: status,
        due_date: isTerminal ? null : dueDate,
        catatan: catatan
      };
      
      await apiClient.patch(`/api/v1/siswa/${siswaId}/aktivitas/${aktivitasId}/koreksi`, payload);
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Gagal melakukan koreksi aktivitas.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm sm:items-center sm:p-0">
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
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 font-medium">
              Perhatian: Koreksi log aktivitas ini digunakan hanya untuk kesalahan input. Mengubah status di sini akan melakukan override paksa ke Master Siswa.
            </p>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            </div>
          )}

          {fetching ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <>
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
                  <option value="Zoom / Online Meeting">Zoom / Online Meeting</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Hasil / Status Tercapai</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Pilih status...</option>
                  {HASIL_AKTIVITAS.map(h => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>

              {!isTerminal && (
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
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Catatan / Keterangan Tambahan</label>
                <textarea 
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-end gap-3">
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || fetching}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
