'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Edit2 } from 'lucide-react';
import { TINGKAT_OPTIONS } from '@/lib/constants/sekolah';
import type { SekolahDetail } from '@/lib/types/sekolah.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sekolah: SekolahDetail;
}

const FIELD_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

export function EditSekolahModal({ isOpen, onClose, onSuccess, sekolah }: Props) {
  const [loading, setLoading] = useState(false);
  const [kotaList, setKotaList] = useState<{id: number, kota: string}[]>([]);
  const [kecamatanList, setKecamatanList] = useState<{id: number, kecamatan: string, kota_id: number}[]>([]);

  const [form, setForm] = useState({
    namaSekolah: '',
    tingkat: '',
    kota: '',
    kecamatan: '',
    alamat: '',
    statusAktif: '',
    jumlahSiswaKelas12: 0,
  });

  // Fetch Master Kota & Kecamatan
  useEffect(() => {
    if (isOpen) {
      import('@/lib/apiClient').then(({ default: apiClient }) => {
        Promise.all([
          apiClient.get('/api/v1/settings/kota'),
          apiClient.get('/api/v1/settings/kecamatan')
        ]).then(([kotaRes, kecRes]) => {
          setKotaList(kotaRes.data?.data || []);
          setKecamatanList(kecRes.data?.data || []);
        }).catch(err => console.error('Failed to load master data', err));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && sekolah) {
      // Find kota based on sekolah's kecamatan
      let initialKota = '';
      if (kecamatanList.length > 0 && kotaList.length > 0) {
        const kecMatch = kecamatanList.find(k => k.kecamatan === sekolah.kecamatan);
        if (kecMatch) {
          const kotaMatch = kotaList.find(k => k.id == kecMatch.kota_id);
          if (kotaMatch) initialKota = kotaMatch.kota;
        }
      }

      setForm({
        namaSekolah: sekolah.nama,
        tingkat: sekolah.tingkat,
        kota: initialKota,
        kecamatan: sekolah.kecamatan,
        alamat: sekolah.alamat || '',
        statusAktif: sekolah.statusAktif || '',
        jumlahSiswaKelas12: sekolah.jumlahSiswaKelas12 || 0,
      });
    }
  }, [isOpen, sekolah, kecamatanList, kotaList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (name === 'kota') {
        return { ...prev, kota: value, kecamatan: '' };
      }
      // Jika kecamatan dipilih dan kota belum ada, set kota otomatis
      if (name === 'kecamatan' && !prev.kota && value) {
        const kecMatch = kecamatanList.find(k => k.kecamatan === value);
        if (kecMatch) {
          const kotaMatch = kotaList.find(k => k.id == kecMatch.kota_id);
          if (kotaMatch) {
            return { ...prev, kecamatan: value, kota: kotaMatch.kota };
          }
        }
      }
      return {
        ...prev,
        [name]: name === 'jumlahSiswaKelas12' ? parseInt(value) || 0 : value
      };
    });
  };

  const isValid = form.namaSekolah.trim() && form.tingkat && form.kecamatan.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const { editSekolah } = await import('@/lib/api/sekolah.api');
      await editSekolah(sekolah.id, {
        namaSekolah: form.namaSekolah,
        tingkat: form.tingkat,
        kecamatan: form.kecamatan,
        alamat: form.alamat || undefined,
        statusAktif: form.statusAktif || undefined,
        jumlahSiswaKelas12: form.jumlahSiswaKelas12 || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Gagal menyimpan perubahan sekolah');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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

          {/* Tingkat + Kota */}
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
                Kota/Kabupaten <span className="text-rose-400">*</span>
              </label>
              <select
                required
                name="kota"
                value={form.kota}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option value="">— Pilih Kota —</option>
                {kotaList.map(k => (
                  <option key={k.id} value={k.kota}>{k.kota}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kecamatan */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Kecamatan <span className="text-rose-400">*</span>
            </label>
            <select
              required
              name="kecamatan"
              value={form.kecamatan}
              onChange={handleChange}
              className={FIELD_CLASS}
            >
              <option value="">{form.kota ? '— Pilih Kecamatan —' : '— Semua Kecamatan —'}</option>
              {kecamatanList
                .filter(kec => !form.kota || kotaList.find(k => k.kota === form.kota)?.id == kec.kota_id)
                .map(kec => (
                  <option key={kec.id} value={kec.kecamatan}>{kec.kecamatan}</option>
                ))
              }
            </select>
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
