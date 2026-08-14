'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Edit2 } from 'lucide-react';
import { TINGKAT_OPTIONS } from '@/lib/constants/sekolah';
import { type MockSekolah } from '@/lib/mock/sekolah';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sekolah: MockSekolah;
}

const FIELD_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

export function EditSekolahModal({ isOpen, onClose, onSuccess, sekolah }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    namaSekolah: '',
    tingkat: '',
    kecamatan: '',
    alamat: '',
    statusAktif: '',
    jumlahSiswaKelas12: 0,
  });

  useEffect(() => {
    if (isOpen && sekolah) {
      setForm({
        namaSekolah: sekolah.nama,
        tingkat: sekolah.tingkat,
        kecamatan: sekolah.kecamatan,
        alamat: sekolah.alamat || '',
        statusAktif: sekolah.statusAktif || '',
        jumlahSiswaKelas12: sekolah.jumlahSiswaKelas12 || 0,
      });
    }
  }, [isOpen, sekolah]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'jumlahSiswaKelas12' ? parseInt(value) || 0 : value
    }));
  };

  const isValid = form.namaSekolah.trim() && form.tingkat && form.kecamatan.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      // TODO: ganti dengan apiClient.put(`/api/sekolah/${sekolah.id}`, { ... }) saat API siap
      await new Promise(r => setTimeout(r, 600));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Gagal menyimpan perubahan sekolah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh] overflow-y-auto scrollbar-thin">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <Edit2 size={15} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-foreground">Edit Data Sekolah</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form id="editSekolahForm" onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Nama Sekolah */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nama Sekolah <span className="text-rose-400">*</span>
            </label>
            <input
              required
              name="namaSekolah"
              value={form.namaSekolah}
              onChange={handleChange}
              className={FIELD_CLASS}
            />
          </div>

          {/* Tingkat + Kecamatan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Jenjang <span className="text-rose-400">*</span>
              </label>
              <select
                required
                name="tingkat"
                value={form.tingkat}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option value="">— Pilih —</option>
                {TINGKAT_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Kecamatan <span className="text-rose-400">*</span>
              </label>
              <input
                required
                name="kecamatan"
                value={form.kecamatan}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Alamat</label>
            <textarea
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              rows={3}
              className={FIELD_CLASS}
            />
          </div>

          {/* Status Aktif + Jumlah Siswa */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status Aktif</label>
              <select
                name="statusAktif"
                value={form.statusAktif}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option value="">Belum Diketahui</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Siswa Kelas 12</label>
              <input
                type="number"
                name="jumlahSiswaKelas12"
                value={form.jumlahSiswaKelas12 || ''}
                onChange={handleChange}
                min="0"
                className={FIELD_CLASS}
              />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-5 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="editSekolahForm"
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
