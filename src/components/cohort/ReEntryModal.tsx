'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, AlertCircle, CheckCircle2, Users, School, ArrowRight, ShieldAlert } from 'lucide-react';
import { Cohort } from '@/store/useCohortStore';
import apiClient from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

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
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();

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
      setError(t('period.errSelectSource'));
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
      setError(err.response?.data?.message || err.message || t('period.errSimulateFailed'));
    } finally {
      setSimulating(false);
    }
  };

  const handleExecute = async () => {
    const confirmMsg = t('period.confirmExecute').replace('{name}', targetCohort.nama_period);
    if (!confirm(confirmMsg)) {
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
        setSuccessMessage(res.data.message || t('period.executeSuccess'));
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('period.errExecuteFailed'));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-card border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-dvh flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RefreshCw size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                {t('period.reEntryModalTitle')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('period.targetPrefix')} <span className="font-bold text-foreground">{targetCohort.nama_period}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('period.closeBtn')}
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
              {isGeneral ? t('period.sourceCohortLabelGeneral') : t('period.sourceCohortLabelLpk')}
            </label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setSimResult(null);
              }}
              className="w-full px-3 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
            >
              {sourceOptions.length === 0 ? (
                <option value="">{t('period.noSourceCohort')}</option>
              ) : (
                sourceOptions.map((c) => (
                  <option key={c.id_period} value={c.nama_period}>
                    {isGeneral
                      ? t('period.sourceOptionGeneral')
                          .replace('{name}', c.nama_period)
                          .replace('{status}', c.status)
                          .replace('{count}', String(c.total_siswa))
                      : t('period.sourceOptionLpk')
                          .replace('{name}', c.nama_period)
                          .replace('{status}', c.status)
                          .replace('{count}', String(c.total_siswa))}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Dynamic Rule Filters */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-foreground">
              {t('period.eligibilityCriteria')}
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
                  {isGeneral ? t('period.excludeCustomerGeneral') : t('period.excludeCustomerLpk')}
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
                  {isGeneral ? t('period.excludeRegisteredGeneral') : t('period.excludeRegisteredLpk')}
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
                  {isGeneral ? t('period.excludeDoNotContactGeneral') : t('period.excludeDoNotContactLpk')}
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
              className="w-full h-10 border rounded-xl text-xs sm:text-sm font-semibold hover:bg-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('period.btnSimulate')}
            >
              {simulating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-primary" />
                  {isGeneral ? t('period.simulatingGeneral') : t('period.simulatingLpk')}
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  {t('period.btnSimulate')}
                </>
              )}
            </button>
          </div>

          {/* Simulation Results Card */}
          {simResult && (
            <div className="p-4 rounded-xl border bg-card space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('period.simResultTitle')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('period.sourceLabel')}{' '}
                  <span className="font-medium text-foreground">{simResult.source_cohort}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users size={14} className="text-primary" />{' '}
                    {isGeneral ? t('period.eligibleStudentsGeneral') : t('period.eligibleStudentsLpk')}
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {simResult.eligible_students.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isGeneral
                      ? t('period.fromTotalSourceGeneral').replace(
                          '{count}',
                          simResult.total_source_students.toLocaleString('id-ID')
                        )
                      : t('period.fromTotalSourceLpk').replace(
                          '{count}',
                          simResult.total_source_students.toLocaleString('id-ID')
                        )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/30 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <School size={14} className="text-primary" />{' '}
                    {isGeneral ? t('period.schoolsInvolvedGeneral') : t('period.schoolsInvolvedLpk')}
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {simResult.eligible_schools.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('period.willConnectToNew')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ontologi Warning */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-start gap-2.5 text-xs">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">{t('period.ontologyRulePrefix')}</span>{' '}
              {isGeneral
                ? t('period.ontologyRuleNoticeGeneral').replace('{cohort}', targetCohort.nama_period)
                : t('period.ontologyRuleNoticeLpk').replace('{cohort}', targetCohort.nama_period)}
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
            {t('period.closeBtn')}
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing || !simResult || simResult.eligible_students === 0}
            className="px-5 h-10 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {executing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('period.executingBtn')}
              </>
            ) : (
              <>
                {t('period.executeBtn')}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
