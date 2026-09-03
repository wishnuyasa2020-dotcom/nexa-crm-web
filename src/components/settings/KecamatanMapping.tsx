'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface KecamatanMapping {
  id: number;
  kecamatan: string;
  kota_id: number;
  kota?: string;
}

interface KotaMapping {
  id: number;
  kota: string;
}

export default function KecamatanMapping() {
  const [mappings, setMappings] = useState<KecamatanMapping[]>([]);
  const [kotaList, setKotaList] = useState<KotaMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ kecamatan: '', kota_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKecamatan, resKota] = await Promise.all([
        apiClient.get('/api/v1/settings/kecamatan'),
        apiClient.get('/api/v1/settings/kota')
      ]);
      if (resKecamatan.data.status === 'ok') {
        setMappings(resKecamatan.data.data || []);
      }
      if (resKota.data.status === 'ok') {
        setKotaList(resKota.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };



  const handleOpenForm = (mapping?: KecamatanMapping) => {
    if (mapping) {
      setEditingId(mapping.id);
      setFormData({ kecamatan: mapping.kecamatan, kota_id: mapping.kota_id.toString() });
    } else {
      setEditingId(null);
      setFormData({ kecamatan: '', kota_id: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ kecamatan: '', kota_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/api/v1/settings/kecamatan/${editingId}`, {
          kecamatan: formData.kecamatan,
          kota_id: parseInt(formData.kota_id)
        });
      } else {
        await apiClient.post('/api/v1/settings/kecamatan', {
          kecamatan: formData.kecamatan,
          kota_id: parseInt(formData.kota_id)
        });
      }
      await fetchData();
      handleCloseForm();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mapping kecamatan ini?')) return;
    try {
      await apiClient.delete(`/api/v1/settings/kecamatan/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menghapus mapping');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Master Kecamatan</h2>
          <p className="text-sm text-muted-foreground">
            Atur daftar master kecamatan yang akan muncul sebagai pilihan di Form Publik dan Generator Link QR.
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Kecamatan
        </button>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 font-medium text-foreground">Kota/Kabupaten</th>
              <th className="px-6 py-3 font-medium text-foreground">Nama Kecamatan</th>
              <th className="px-6 py-3 font-medium text-foreground text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mappings.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                  Belum ada data master kecamatan yang ditambahkan.
                </td>
              </tr>
            ) : (
              mappings.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium text-foreground">{m.kota || '-'}</td>
                  <td className="px-6 py-3 font-medium text-foreground">{m.kecamatan}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleOpenForm(m)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {editingId ? 'Edit Master Kecamatan' : 'Tambah Master Kecamatan'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kota/Kabupaten <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.kota_id}
                  onChange={(e) => setFormData({ ...formData, kota_id: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>Pilih Kota/Kabupaten</option>
                  {kotaList.map(kota => (
                    <option key={kota.id} value={kota.id}>{kota.kota}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Kecamatan <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kecamatan}
                  onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                  placeholder="e.g., Kebayoran Baru"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nama ini akan muncul sebagai opsi di form publik pendaftaran.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
