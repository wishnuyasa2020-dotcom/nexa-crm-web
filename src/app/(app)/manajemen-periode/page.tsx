'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays, Plus, RefreshCw, CheckCircle2, Archive, Loader2,
  AlertCircle, ShieldAlert, ArrowLeft, Users, School, ArrowUpRight
} from 'lucide-react';
import { useCohortStore, Cohort } from '@/store/useCohortStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';
import { CreateCohortModal } from '@/components/cohort/CreateCohortModal';
import { ReEntryModal } from '@/components/cohort/ReEntryModal';
import { cn } from '@/lib/utils';

export default function ManajemenPeriodePage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
  const { cohorts, loading, error, fetchCohorts, setActiveCohort, archiveCohort } = useCohortStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reEntryTarget, setReEntryTarget] = useState<Cohort | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const isAuthorized = !user || user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'manager';

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  if (user && !isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 shadow-xs">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{t('period.accessDenied')}</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {t('period.accessDeniedDesc')}
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <ArrowLeft size={16} /> {t('period.backToDashboard')}
        </Link>
      </div>
    );
  }

  const handleSetActive = async (cohort: Cohort) => {
    const confirmMsg = t('period.confirmSetActive').replace('{name}', cohort.nama_period);
    if (!confirm(confirmMsg)) {
      return;
    }
    setActionLoadingId(cohort.id_period);
    setActionError('');
    setActionSuccess('');

    try {
      await setActiveCohort(cohort.id_period);
      setActionSuccess(t('period.setActiveSuccess').replace('{name}', cohort.nama_period));
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || t('period.setActiveFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (cohort: Cohort) => {
    const confirmMsg = t('period.confirmArchive').replace('{name}', cohort.nama_period);
    if (!confirm(confirmMsg)) {
      return;
    }
    setActionLoadingId(cohort.id_period);
    setActionError('');
    setActionSuccess('');

    try {
      await archiveCohort(cohort.id_period);
      setActionSuccess(t('period.archiveSuccess').replace('{name}', cohort.nama_period));
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || t('period.archiveFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeCohort = cohorts.find((c) => c.status === 'aktif');

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <header className="shrink-0 min-h-16 sm:h-16 border-b bg-card px-4 sm:px-6 py-3 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Row 1 (Mobile) / Left (Desktop) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {t('period.title')}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {isGeneral ? t('period.subtitleGeneral') : t('period.subtitleLpk')}
            </p>
          </div>
        </div>

        {/* Row 2 (Mobile) / Right (Desktop) */}
        <div className="w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto h-10 px-4 gradient-primary text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-primary/20 transition-all"
            title={t('period.createCohortBtn')}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('period.createCohortBtn')}</span>
            <span className="sm:hidden">{t('period.addShort')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Active Cohort Banner */}
        {activeCohort && (
          <div className="p-4 sm:p-5 rounded-2xl border bg-linear-to-r from-primary/10 via-primary/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 self-start sm:self-auto mt-0.5 sm:mt-0">
                <CheckCircle2 size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {t('period.activeCohortTitle').replace('{name}', activeCohort.nama_period)}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                    {t('period.activeOperationalBadge')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {isGeneral ? t('period.activeDescGeneral') : t('period.activeDescLpk')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground shrink-0 w-full sm:w-auto justify-start sm:justify-end pt-2 sm:pt-0 border-t border-border/30 sm:border-0">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Users size={15} className="text-primary" />
                <span>
                  {isGeneral
                    ? t('period.studentsUnitGeneral').replace('{count}', activeCohort.total_siswa.toLocaleString('id-ID'))
                    : t('period.studentsUnitLpk').replace('{count}', activeCohort.total_siswa.toLocaleString('id-ID'))}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <School size={15} className="text-primary" />
                <span>
                  {isGeneral
                    ? t('period.schoolsUnitGeneral').replace('{count}', activeCohort.total_sekolah.toLocaleString('id-ID'))
                    : t('period.schoolsUnitLpk').replace('{count}', activeCohort.total_sekolah.toLocaleString('id-ID'))}
                </span>
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
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {t('period.tableTitle')}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('period.totalPeriods').replace('{count}', String(cohorts.length))}
            </span>
          </div>

          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/40 border-b">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">{t('period.thCodeId')}</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">{t('period.thCohortName')}</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">{t('period.thDateRange')}</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">{t('period.thStatus')}</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground">{t('period.thTotalData')}</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground text-right w-56">{t('period.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin text-primary" />
                          <span>{t('period.loadingCohorts')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : cohorts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                        {t('period.emptyCohorts')}
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
                              ? `${cohort.start_date || '-'} ${t('period.dateRangeSeparator')} ${cohort.end_date || '-'}`
                              : t('period.dateNotSet')}
                          </td>
                          <td className="px-5 py-3.5">
                            {cohort.status === 'aktif' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {t('period.statusActive')}
                              </span>
                            ) : cohort.status === 'draft' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {t('period.statusDraft')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                {t('period.statusArchived')}
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
                                  className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={t('period.titleSetActive')}
                                >
                                  {isRowLoading ? <Loader2 size={13} className="animate-spin" /> : t('period.btnSetActive')}
                                </button>
                              )}

                              {cohort.status !== 'aktif' && (
                                <button
                                  onClick={() => setReEntryTarget(cohort)}
                                  disabled={isRowLoading}
                                  className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-secondary transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={t('period.titleReEntry')}
                                >
                                  <RefreshCw size={12} className="text-primary" />
                                  <span>{t('period.btnReEntry')}</span>
                                </button>
                              )}

                              {cohort.status === 'aktif' && (
                                <button
                                  onClick={() => handleArchive(cohort)}
                                  disabled={isRowLoading}
                                  className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                  title={t('period.titleArchive')}
                                >
                                  {isRowLoading ? <Loader2 size={13} className="animate-spin" /> : <><Archive size={12} /><span>{t('period.btnArchive')}</span></>}
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
          setActionSuccess(t('period.createSuccess'));
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
