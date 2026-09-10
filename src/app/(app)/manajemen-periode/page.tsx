'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays, Plus, RefreshCw, CheckCircle2, Archive, Loader2,
  AlertCircle, ShieldAlert, ArrowLeft, Users, School, ArrowUpRight
} from 'lucide-react';
import { useCohortStore, Cohort } from '@/store/useCohortStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CreateCohortModal } from '@/components/cohort/CreateCohortModal';
import { ReEntryModal } from '@/components/cohort/ReEntryModal';
import { cn } from '@/lib/utils';

export default function ManajemenPeriodePage() {
  const { user } = useAuthStore();
  const { cohorts, loading, error, fetchCohorts, setActiveCohort, archiveCohort } = useCohortStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reEntryTarget, setReEntryTarget] = useState<Cohort | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const isAuthorized = !user || user.role === 'Admin' || user.role === 'Manager';

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  if (user && !isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 shadow-xs">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Akses Dibatasi</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Halaman Manajemen Periode / Cohort hanya dapat diakses oleh <span className="font-semibold text-foreground">Administrator</span> dan <span className="font-semibold text-foreground">Manager</span>.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const handleSetActive = async (cohort: Cohort) => {
    if (!confirm(`Aktifkan Cohort ${cohort.nama_period}? Cohort aktif saat ini akan otomatis diarsipkan.`)) {
      return;
    }
    setActionLoadingId(cohort.id_period);
    setActionError('');
    setActionSuccess('');

    try {
      await setActiveCohort(cohort.id_period);
      setActionSuccess(`Cohort ${cohort.nama_period} berhasil diaktifkan!`);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Gagal mengaktifkan Cohort');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (cohort: Cohort) => {
    if (!confirm(`Arsipkan Cohort ${cohort.nama_period}?`)) {
      return;
    }
    setActionLoadingId(cohort.id_period);
    setActionError('');
    setActionSuccess('');

    try {
      await archiveCohort(cohort.id_period);
      setActionSuccess(`Cohort ${cohort.nama_period} berhasil diarsipkan.`);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Gagal mengarsipkan Cohort');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeCohort = cohorts.find((c) => c.status === 'aktif');

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <header className="shrink-0 h-16 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Manajemen Periode (Cohort)</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Pusat kontrol siklus tahun ajaran komersial, status aktif, dan eksekusi Re-entry
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-4 gradient-primary text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-primary/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Buat Cohort Baru</span>
          <span className="sm:hidden">Baru</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Active Cohort Banner */}
        {activeCohort && (
          <div className="p-4 sm:p-5 rounded-2xl border bg-linear-to-r from-primary/10 via-primary/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Cohort Aktif: {activeCohort.nama_period}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                    🟢 Aktif Operasional
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Seluruh alur kerja CRM (Data Siswa, Sekolah, Task List, Weekly Planning) saat ini berjalan pada cohort ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground shrink-0">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Users size={15} className="text-primary" />
                <span>{activeCohort.total_siswa.toLocaleString('id-ID')} Siswa</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <School size={15} className="text-primary" />
                <span>{activeCohort.total_sekolah.toLocaleString('id-ID')} Sekolah</span>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {actionError && (
          <div className="p-4 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 text-xs sm:text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table of Cohorts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Daftar Periode / Cohort Tersedia
            </h3>
            <span className="text-xs text-muted-foreground">
              Total {cohorts.length} Periode
            </span>
          </div>

          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/40 border-b">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">Kode ID</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">Nama Cohort</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">Rentang Waktu</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">Total Data</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground text-right w-56">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin text-primary" />
                          <span>Memuat daftar Cohort...</span>
                        </div>
                      </td>
                    </tr>
                  ) : cohorts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                        Belum ada data Cohort yang dibuat. Klik tombol "Buat Cohort Baru" di atas.
                      </td>
                    </tr>
                  ) : (
                    cohorts.map((cohort) => {
                      const isRowLoading = actionLoadingId === cohort.id_period;

                      return (
                        <tr key={cohort.id_period} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground font-medium">
                            {cohort.id_period}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {cohort.nama_period}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {cohort.start_date || cohort.end_date
                              ? `${cohort.start_date || '-'} s/d ${cohort.end_date || '-'}`
                              : 'Tidak ditentukan'}
                          </td>
                          <td className="px-5 py-3.5">
                            {cohort.status === 'aktif' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Aktif
                              </span>
                            ) : cohort.status === 'draft' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Draft
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                Arsip
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-foreground font-medium">
                                <Users size={13} className="text-muted-foreground" /> {cohort.total_siswa}
                              </span>
                              <span className="flex items-center gap-1 text-foreground font-medium">
                                <School size={13} className="text-muted-foreground" /> {cohort.total_sekolah}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {cohort.status !== 'aktif' && (
                                <button
                                  onClick={() => handleSetActive(cohort)}
                                  disabled={isRowLoading}
                                  className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Jadikan Cohort Aktif"
                                >
                                  {isRowLoading ? <Loader2 size={13} className="animate-spin" /> : 'Set Aktif'}
                                </button>
                              )}

                              {cohort.status !== 'aktif' && (
                                <button
                                  onClick={() => setReEntryTarget(cohort)}
                                  disabled={isRowLoading}
                                  className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-secondary transition-colors flex items-center gap-1.5 cursor-pointer"
                                  title="Jalankan simulasi & eksekusi Re-entry"
                                >
                                  <RefreshCw size={12} className="text-primary" />
                                  <span>Re-entry</span>
                                </button>
                              )}

                              {cohort.status === 'aktif' && (
                                <button
                                  onClick={() => handleArchive(cohort)}
                                  disabled={isRowLoading}
                                  className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                  title="Arsipkan Cohort Ini"
                                >
                                  {isRowLoading ? <Loader2 size={13} className="animate-spin" /> : <><Archive size={12} /><span>Arsipkan</span></>}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateCohortModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setActionSuccess('Cohort baru berhasil dibuat!');
          fetchCohorts();
        }}
      />

      <ReEntryModal
        isOpen={!!reEntryTarget}
        targetCohort={reEntryTarget}
        availableCohorts={cohorts}
        onClose={() => setReEntryTarget(null)}
        onSuccess={() => {
          fetchCohorts();
        }}
      />
    </div>
  );
}
