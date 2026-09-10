'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, AlertCircle, CheckCircle2, Users, School, ArrowRight, ShieldAlert } from 'lucide-react';
import { Cohort } from '@/store/useCohortStore';
import apiClient from '@/lib/apiClient';

interface ReEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCohort: Cohort | null;
  availableCohorts: Cohort[];
  onSuccess?: () => void;
}

interface SimulationResult {
  eligible_students: number;
  eligible_schools: number;
  total_source_students: number;
  source_cohort: string | null;
  target_cohort: string;
  message?: string;
}

export function ReEntryModal({
  isOpen,
  onClose,
  targetCohort,
  availableCohorts,
  onSuccess,
}: ReEntryModalProps) {
  // Source cohorts: exclude target cohort
  const sourceOptions = availableCohorts.filter(
    (c) => targetCohort && c.nama_period !== targetCohort.nama_period
  );

  const defaultSource = sourceOptions.find((c) => c.status === 'aktif')?.nama_period ||
    sourceOptions[0]?.nama_period || '';

  const [selectedSource, setSelectedSource] = useState(defaultSource);
  const [excludeCustomer, setExcludeCustomer] = useState(true);
  const [excludeRegistered, setExcludeRegistered] = useState(true);
  const [excludeDoNotContact, setExcludeDoNotContact] = useState(true);

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (defaultSource && !selectedSource) {
      setSelectedSource(defaultSource);
    }
  }, [defaultSource, selectedSource]);

  if (!isOpen || !targetCohort) return null;

  const handleSimulate = async () => {
    if (!selectedSource) {
      setError('Pilih Cohort sumber terlebih dahulu.');
      return;
    }

    setSimulating(true);
    setError('');
    setSuccessMessage('');
    setSimResult(null);

    try {
      const res = await apiClient.post(
        `/api/v1/cohorts/${targetCohort.id_period}/re-entry-simulation`,
        {
          sourceCohort: selectedSource,
          excludeCustomer,
          excludeRegistered,
          excludeDoNotContact,
        }
      );
      if (res.data?.status === 'ok') {
        setSimResult(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal menghitung simulasi Re-entry');
    } finally {
      setSimulating(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm(`Konfirmasi eksekusi Re-entry massal ke Cohort ${targetCohort.nama_period}? Aksi ini permanen.`)) {
      return;
    }

    setExecuting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await apiClient.post(
        `/api/v1/cohorts/${targetCohort.id_period}/execute-re-entry`,
        {
          sourceCohort: selectedSource,
          excludeCustomer,
          excludeRegistered,
          excludeDoNotContact,
        }
      );
      if (res.data?.status === 'ok') {
        setSuccessMessage(res.data.message || 'Eksekusi Re-entry berhasil!');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal mengeksekusi Re-entry');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-card border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RefreshCw size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                Eksekusi Re-entry Massal
              </h3>
              <p className="text-xs text-muted-foreground">
                Target: <span className="font-bold text-foreground">{targetCohort.nama_period}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 text-xs sm:text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0 text-green-600" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          {/* Source Cohort Selection */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Bawa Siswa dari Cohort Sumber:
            </label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setSimResult(null);
              }}
              className="w-full px-3 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
            >
              {sourceOptions.length === 0 ? (
                <option value="">Tidak ada cohort sumber lain</option>
              ) : (
                sourceOptions.map((c) => (
                  <option key={c.id_period} value={c.nama_period}>
                    {c.nama_period} ({c.status}) — {c.total_siswa} Siswa
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Dynamic Rule Filters */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-foreground">
              Kriteria Kelayakan (Dynamic Filters):
            </label>

            <div className="p-3 rounded-xl border bg-secondary/20 space-y-2.5 text-xs text-foreground">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeCustomer}
                  onChange={(e) => {
                    setExcludeCustomer(e.target.checked);
                    setSimResult(null);
                  }}
                  className="rounded border text-primary focus:ring-primary/40 w-4 h-4"
                />
                <span>
                  Keluarkan siswa berstatus <span className="font-semibold text-primary">Customer (Lunas DP)</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeRegistered}
                  onChange={(e) => {
                    setExcludeRegistered(e.target.checked);
                    setSimResult(null);
                  }}
                  className="rounded border text-primary focus:ring-primary/40 w-4 h-4"
                />
                <span>
                  Keluarkan siswa yang berstatus <span className="font-semibold text-primary">Registered Opportunity</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeDoNotContact}
                  onChange={(e) => {
                    setExcludeDoNotContact(e.target.checked);
                    setSimResult(null);
                  }}
                  className="rounded border text-primary focus:ring-primary/40 w-4 h-4"
                />
                <span>
                  Keluarkan siswa <span className="font-semibold text-destructive">Do Not Contact / Disqualified</span>
                </span>
              </label>
            </div>
          </div>

          {/* Hitung Simulasi Button */}
          <div>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating || !selectedSource}
              className="w-full h-10 border rounded-xl text-xs sm:text-sm font-semibold hover:bg-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {simulating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Mengkalkulasi Kelayakan Siswa...
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  Hitung Simulasi Re-entry
                </>
              )}
            </button>
          </div>

          {/* Simulation Results Card */}
          {simResult && (
            <div className="p-4 rounded-xl border bg-card space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Hasil Simulasi
                </span>
                <span className="text-xs text-muted-foreground">
                  Sumber: <span className="font-medium text-foreground">{simResult.source_cohort}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users size={14} className="text-primary" /> Siswa Memenuhi Syarat
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {simResult.eligible_students.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    dari total {simResult.total_source_students.toLocaleString('id-ID')} siswa sumber
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/30 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <School size={14} className="text-primary" /> Sekolah Terlibat
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {simResult.eligible_schools.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    akan dihubungkan ke cohort baru
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ontologi Warning */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-start gap-2.5 text-xs">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Aturan Ontologi Nexa OS:</span> Siswa yang di-re-entry tidak menduplikasi data induk di master. Mereka akan didaftarkan sebagai <span className="font-semibold">Lead Baru</span> di Cohort <span className="font-semibold">{targetCohort.nama_period}</span> dengan status PJ CRO dikosongkan (Unassigned) untuk didistribusikan ulang.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t shrink-0 flex items-center justify-end gap-3 bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing || !simResult || simResult.eligible_students === 0}
            className="px-5 h-10 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {executing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengeksekusi...
              </>
            ) : (
              <>
                Mulai Eksekusi Re-entry
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
