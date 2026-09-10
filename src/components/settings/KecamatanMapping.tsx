'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Loader2, X, MapPin, Building2, AlertCircle, Search, Filter } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface KecamatanMappingItem {
  id: number;
  kecamatan: string;
  kota_id: number;
  kota?: string;
}

interface KotaMappingItem {
  id: number;
  kota: string;
}

export default function KecamatanMapping() {
  const [mappings, setMappings] = useState<KecamatanMappingItem[]>([]);
  const [kotaList, setKotaList] = useState<KotaMappingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKotaFilter, setSelectedKotaFilter] = useState<string>('all');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ kecamatan: '', kota_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
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
      setError(err.response?.data?.message || err.message || 'Gagal memuat data master kecamatan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (mapping?: KecamatanMappingItem) => {
    setFormError('');
    if (mapping) {
      setEditingId(mapping.id);
      setFormData({ kecamatan: mapping.kecamatan, kota_id: mapping.kota_id.toString() });
    } else {
      setEditingId(null);
      // Default to the currently filtered city if one is selected
      const defaultKotaId = selectedKotaFilter !== 'all' ? selectedKotaFilter : (kotaList[0]?.id?.toString() || '');
      setFormData({ kecamatan: '', kota_id: defaultKotaId });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ kecamatan: '', kota_id: '' });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kota_id) {
      setFormError('Pilih kota/kabupaten terlebih dahulu.');
      return;
    }
    if (!formData.kecamatan.trim()) {
      setFormError('Nama kecamatan wajib diisi.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await apiClient.put(`/api/v1/settings/kecamatan/${editingId}`, {
          kecamatan: formData.kecamatan.trim(),
          kota_id: parseInt(formData.kota_id, 10)
        });
      } else {
        await apiClient.post('/api/v1/settings/kecamatan', {
          kecamatan: formData.kecamatan.trim(),
          kota_id: parseInt(formData.kota_id, 10)
        });
      }
      await fetchData();
      handleCloseForm();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Gagal menyimpan data kecamatan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kecamatan ini dari master data?')) return;
    try {
      await apiClient.delete(`/api/v1/settings/kecamatan/${id}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal menghapus kecamatan');
    }
  };

  // Filtered mappings
  const filteredMappings = useMemo(() => {
    return mappings.filter(item => {
      const matchSearch = item.kecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.kota && item.kota.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchKota = selectedKotaFilter === 'all' || item.kota_id.toString() === selectedKotaFilter;
      return matchSearch && matchKota;
    });
  }, [mappings, searchQuery, selectedKotaFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <MapPin size={18} className="text-primary" /> Master Kecamatan
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Daftar kecamatan hierarkis yang terikat pada kota/kabupaten induk untuk formulir publik dan filter domisili.
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto h-10 px-4 gradient-primary text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-primary/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          Tambah Kecamatan
        </button>
      </div>

      {error && (
        <div className="p-4 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kecamatan..."
            className="w-full pl-9 pr-3.5 h-10 bg-card border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-44">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={selectedKotaFilter}
              onChange={(e) => setSelectedKotaFilter(e.target.value)}
              className="w-full pl-8.5 pr-8 h-10 bg-card border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Semua Kota/Kabupaten</option>
              {kotaList.map(kota => (
                <option key={kota.id} value={kota.id.toString()}>{kota.kota}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 border-b">
              <tr>
                <th className="px-5 py-3 font-semibold text-muted-foreground">Kota / Kabupaten</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground">Nama Kecamatan</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    {searchQuery || selectedKotaFilter !== 'all'
                      ? 'Tidak ada data kecamatan yang sesuai dengan filter.'
                      : 'Belum ada data master kecamatan yang ditambahkan.'}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground shrink-0" />
                      <span>{m.kota || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{m.kecamatan}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => handleOpenForm(m)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Edit Kecamatan"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus Kecamatan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form (Center Dialog) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 h-14 border-b">
              <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                {editingId ? 'Edit Master Kecamatan' : 'Tambah Master Kecamatan'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Kota/Kabupaten Induk <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.kota_id}
                  onChange={(e) => setFormData({ ...formData, kota_id: e.target.value })}
                  className="w-full px-3 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="" disabled>Pilih Kota/Kabupaten</option>
                  {kotaList.map(kota => (
                    <option key={kota.id} value={kota.id.toString()}>{kota.kota}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Nama Kecamatan <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kecamatan}
                  onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                  placeholder="Contoh: Mengwi, Sukawati, Kebayoran Baru"
                  className="w-full px-3 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Nama kecamatan ini akan muncul sebagai opsi pada form publik pendaftaran.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 h-10 border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
