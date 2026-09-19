'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, X, Building2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';

interface KotaMappingItem {
  id: number;
  kota: string;
}

export default function KotaMapping() {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState<KotaMappingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ kota: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/settings/kota');
      if (res.data.status === 'ok') {
        setMappings(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('settings.kotaLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (mapping?: KotaMappingItem) => {
    setFormError('');
    if (mapping) {
      setEditingId(mapping.id);
      setFormData({ kota: mapping.kota });
    } else {
      setEditingId(null);
      setFormData({ kota: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ kota: '' });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kota.trim()) {
      setFormError(t('settings.kotaNameRequired'));
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await apiClient.put(`/api/v1/settings/kota/${editingId}`, formData);
      } else {
        await apiClient.post('/api/v1/settings/kota', formData);
      }
      await fetchMappings();
      handleCloseForm();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || t('settings.kotaSaveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('settings.kotaDeleteConfirm'))) return;
    try {
      await apiClient.delete(`/api/v1/settings/kota/${id}`);
      await fetchMappings();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('settings.kotaDeleteFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 size={18} className="text-primary" /> {t('settings.kotaTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('settings.kotaSubtitle')}
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto h-10 px-4 gradient-primary text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-primary/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          {t('settings.addKotaBtn')}
        </button>
      </div>

      {error && (
        <div className="p-4 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 border-b">
              <tr>
                <th className="px-5 py-3 font-semibold text-muted-foreground">{t('settings.thKotaName')}</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground text-right w-32">{t('settings.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    {t('settings.emptyKota')}
                  </td>
                </tr>
              ) : (
                mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{m.kota}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => handleOpenForm(m)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title={t('settings.editKotaTooltip')}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title={t('settings.deleteKotaTooltip')}
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
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {editingId ? t('settings.editKotaModalTitle') : t('settings.addKotaModalTitle')}
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
                  {t('settings.kotaNameLabel')} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kota}
                  onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                  placeholder={t('settings.kotaNamePlaceholder')}
                  className="w-full px-3 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {t('settings.kotaNameHelp')}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 h-10 border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  {t('settings.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : t('settings.saveConfigBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
