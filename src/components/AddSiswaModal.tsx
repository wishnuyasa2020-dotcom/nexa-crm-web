'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface SekolahDropdown {
  value: string;
  text: string;
}

export function AddSiswaModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [sekolahList, setSekolahList] = useState<SekolahDropdown[]>([]);
  
  const [formData, setFormData] = useState({
    nama: '',
    idSekolah: '',
    kelas: '',
    wa: '',
    email: '',
    alamat: '',
    minatAwal: '',
    rencanaLulus: '',
    orangtuaTahu: '',
    dueDate: '',
    catatan: ''
  });

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/utils/sekolah-dropdown')
        .then(res => {
          const raw = res.data?.data || res.data || [];
          setSekolahList(Array.isArray(raw) ? raw : []);
        })
        .catch(err => console.error('Gagal fetch dropdown sekolah', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.idSekolah) return alert('Nama & Sekolah wajib diisi');
    
    setLoading(true);
    try {
      await apiClient.post('/siswa/add', formData);
      setFormData({
        nama: '', idSekolah: '', kelas: '', wa: '', email: '', alamat: '',
        minatAwal: '', rencanaLulus: '', orangtuaTahu: '', dueDate: '', catatan: ''
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan siswa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Tambah Siswa Baru</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5 custom-scrollbar flex-1">
          <form id="addSiswaForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nama Lengkap *</label>
                <input required name="nama" value={formData.nama} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" placeholder="Budi Santoso" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Asal Sekolah *</label>
                <select required name="idSekolah" value={formData.idSekolah} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none">
                  <option value="">-- Pilih Sekolah --</option>
                  {sekolahList.map((s, i) => (
                    <option key={s.value || i} value={s.value}>{s.text}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">No. WhatsApp</label>
                <input name="wa" value={formData.wa} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" placeholder="0812..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Kelas</label>
                <input name="kelas" value={formData.kelas} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" placeholder="12 IPA 1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Minat Kerja ke Jepang</label>
                <select name="minatAwal" value={formData.minatAwal} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none">
                  <option value="">-- Pilih --</option>
                  <option value="Ya">Ya, saya berminat</option>
                  <option value="Ragu">Masih ragu-ragu</option>
                  <option value="Tidak">Tidak berminat</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Rencana Setelah Lulus</label>
                <select name="rencanaLulus" value={formData.rencanaLulus} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none">
                  <option value="">-- Pilih --</option>
                  <option value="Kerja">Kerja</option>
                  <option value="Kuliah">Kuliah</option>
                  <option value="Bisnis">Bisnis</option>
                  <option value="Belum Tahu">Belum Tahu</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Orangtua Tahu LPK?</label>
                <select name="orangtuaTahu" value={formData.orangtuaTahu} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none">
                  <option value="">-- Pilih --</option>
                  <option value="Sudah">Sudah</option>
                  <option value="Belum">Belum</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Jadwal Kontak Lanjut (Due Date)</label>
                <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Alamat</label>
              <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows={2} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" placeholder="Alamat lengkap" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Catatan Awal</label>
              <textarea name="catatan" value={formData.catatan} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none" placeholder="Info tambahan..." />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-3 bg-secondary/10">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors">Batal</button>
          <button type="submit" form="addSiswaForm" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-70 transition-all">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Simpan Siswa
          </button>
        </div>
      </div>
    </div>
  );
}
