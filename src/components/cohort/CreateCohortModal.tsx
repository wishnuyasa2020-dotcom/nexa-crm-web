'use client';

import { useState } from 'react';
import { X, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useCohortStore } from '@/store/useCohortStore';

interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCohortModal({ isOpen, onClose, onSuccess }: CreateCohortModalProps) {
  const { createCohort } = useCohortStore();
  const [namaPeriod, setNamaPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPeriod.trim()) {
      setError('Nama Cohort wajib diisi (contoh: 2027/2028).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createCohort({
        nama_period: namaPeriod.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      onClose();
      if (onSuccess) onSuccess();
      setNamaPeriod('');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal membuat Cohort baru');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-card border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 h-14 border-b">
          <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Buat Cohort Baru
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nama / Periode Cohort <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={namaPeriod}
              onChange={(e) => setNamaPeriod(e.target.value)}
              placeholder="Contoh: 2027/2028 atau 2028/2029"
              className="w-full px-3 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Cohort baru otomatis dibuat dengan status <span className="font-semibold text-amber-500">Draft</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Tanggal Mulai (Opsional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 h-10 bg-background border rounded-lg text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Tanggal Selesai (Opsional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 h-10 bg-background border rounded-lg text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Buat Cohort'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
