'use client';

import { useState } from 'react';
import { Calendar, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import apiClient from '@/lib/apiClient';

// Hasil aktivitas yang valid sesuai HASIL_AKTIVITAS_SISWA di crm.siswa.service.js
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

// Hasil yang butuh alasan tidak lanjut (requiresAlasan di service)
const REQUIRES_ALASAN = new Set([
  'Screening Dihentikan',
  'Tidak Berminat',
  'Tdk Memenuhi Syarat',
]);

// Hasil terminal — due date tidak relevan
const IS_TERMINAL = new Set([
  'Screening Dihentikan',
  'Berhasil Daftar',
  'Tidak Berminat',
  'Tdk Memenuhi Syarat',
]);

interface InputAktivitasModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaId: string;
  siswaName?: string;
  onSuccess?: () => void;
}

const emptyForm = {
  jenis_aktivitas: '',
  tanggal: new Date().toISOString().split('T')[0],
  hasil_aktivitas: '',
  due_date: '',
  catatan: '',
  alasan_tidak_lanjut: '',
};

export function InputAktivitasModal({
  isOpen,
  onClose,
  siswaId,
  siswaName,
  onSuccess,
}: InputAktivitasModalProps) {
  const [form, setForm]       = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const isTerminal    = IS_TERMINAL.has(form.hasil_aktivitas);
  const needsAlasan   = REQUIRES_ALASAN.has(form.hasil_aktivitas);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Reset due_date jika pilih terminal
      if (name === 'hasil_aktivitas' && IS_TERMINAL.has(value)) {
        next.due_date = '';
      }
      // Reset alasan jika pindah ke hasil yang tidak butuh alasan
      if (name === 'hasil_aktivitas' && !REQUIRES_ALASAN.has(value)) {
        next.alasan_tidak_lanjut = '';
      }
      return next;
    });
    setError('');
  };

  const handleSubmit = async () => {
    // Validasi client-side
    if (!form.jenis_aktivitas) return setError('Jenis Aktivitas wajib dipilih.');
    if (!form.hasil_aktivitas) return setError('Hasil Aktivitas wajib dipilih.');
    if (!isTerminal && !form.due_date) return setError('Due Date Next Action wajib diisi.');
    if (needsAlasan && !form.alasan_tidak_lanjut.trim())
      return setError('Alasan Tidak Lanjut wajib diisi untuk hasil ini.');

    setLoading(true);
    setError('');
    try {
      const payload = {
        jenis_aktivitas:    form.jenis_aktivitas,
        tanggal:            form.tanggal,
        hasil_aktivitas:    form.hasil_aktivitas,
        due_date:           isTerminal ? null : form.due_date,
        catatan:            form.catatan.trim(),
        alasan_tidak_lanjut: needsAlasan ? form.alasan_tidak_lanjut.trim() : undefined,
      };

      await apiClient.post(`/api/v1/siswa/${siswaId}/aktivitas`, payload);

      // Reset dan tutup
      setForm(emptyForm);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Gagal menyimpan aktivitas. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(emptyForm);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 sm:p-5 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground">
            Input Aktivitas
            {siswaName && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                — {siswaName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-primary font-medium">
              💡 Setiap aktivitas akan otomatis memperbarui Status dan Next Action siswa sesuai Peta Alur CRM.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            </div>
          )}

          {/* Row: Jenis + Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Jenis Aktivitas <span className="text-rose-500">*</span>
              </label>
              <select
                name="jenis_aktivitas"
                value={form.jenis_aktivitas}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Pilih Jenis</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telepon">Telepon</option>
                <option value="Home Visit">Home Visit</option>
                <option value="Zoom / Online Meeting">Zoom / Online Meeting</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tanggal Aktivitas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  name="tanggal"
                  value={form.tanggal}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Hasil Aktivitas */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Hasil Aktivitas <span className="text-rose-500">*</span>
            </label>
            <select
              name="hasil_aktivitas"
              value={form.hasil_aktivitas}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Pilih hasil aktivitas...</option>
              {HASIL_AKTIVITAS.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          {/* Due Date — disembunyikan jika terminal */}
          {!isTerminal && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Due Date Next Action <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Kapan sistem harus mengingatkan kamu lagi?</p>
            </div>
          )}

          {/* Alasan Tidak Lanjut — conditional */}
          {needsAlasan && (
            <div className="space-y-1.5 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
              <label className="text-sm font-semibold text-rose-600">
                ⚠ Alasan Tidak Lanjut <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="alasan_tidak_lanjut"
                value={form.alasan_tidak_lanjut}
                onChange={handleChange}
                placeholder="Contoh: Tidak pernah merespons setelah 5x follow-up."
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-rose-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
              />
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Catatan</label>
            <textarea
              name="catatan"
              value={form.catatan}
              onChange={handleChange}
              placeholder="Contoh: Siswa minta dihubungi besok sore karena sedang sekolah."
              rows={3}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-end gap-3 sm:justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white gradient-primary rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Menyimpan...' : 'Simpan Aktivitas'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
