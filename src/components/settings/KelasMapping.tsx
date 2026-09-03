'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface KelasMapping {
  id: number;
  kelas: string;
}

export default function KelasMapping() {
  const [mappings, setMappings] = useState<KelasMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ kelas: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/settings/kelas-mapping');
      if (res.data.status === 'ok') {
        setMappings(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal memuat data mapping kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (mapping?: KelasMapping) => {
    if (mapping) {
      setEditingId(mapping.id);
      setFormData({ kelas: mapping.kelas });
    } else {
      setEditingId(null);
      setFormData({ kelas: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ kelas: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/api/v1/settings/kelas-mapping/${editingId}`, formData);
      } else {
        await apiClient.post('/api/v1/settings/kelas-mapping', formData);
      }
      await fetchMappings();
      handleCloseForm();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mapping kelas ini?')) return;
    try {
      await apiClient.delete(`/api/v1/settings/kelas-mapping/${id}`);
      await fetchMappings();
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
          <h2 className="text-lg font-semibold text-foreground">Master Kelas</h2>
          <p className="text-sm text-muted-foreground">
            Atur daftar master kelas yang akan muncul sebagai pilihan di Form Publik dan Generator Link QR.
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas
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
              <th className="px-6 py-3 font-medium text-foreground">Nama Kelas</th>
              <th className="px-6 py-3 font-medium text-foreground text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mappings.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                  Belum ada data master kelas yang ditambahkan.
                </td>
              </tr>
            ) : (
              mappings.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium text-foreground">{m.kelas}</td>
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
                {editingId ? 'Edit Master Kelas' : 'Tambah Master Kelas'}
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
                  Nama Kelas <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  placeholder="e.g., 12 IPA 1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
