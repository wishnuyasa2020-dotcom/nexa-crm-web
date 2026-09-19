'use strict';
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, Clock, Search, FileText, AlertCircle, 
  ExternalLink, User, Phone, School, GraduationCap, 
  Receipt, Check, X, RefreshCw, Banknote, ShieldCheck,
  Calendar, ArrowRight, Copy, Filter, UserCheck, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';
import { cn } from '@/lib/utils';
import { CommercialStateBadge } from '@/components/siswa/CommercialStateBadge';

interface PaymentVerificationItem {
  id: number;
  token: string;
  id_siswa: string;
  nama_siswa: string;
  no_wa: string;
  status: 'pending' | 'paid' | 'expired';
  expires_at: string;
  created_at: string;
  nama_program?: string | null;
  nama_ortu?: string | null;
  wa_ortu?: string | null;
  pekerjaan_ortu?: string | null;
  nama_sekolah?: string | null;
  cro?: string | null;
  commercial_state?: string | null;
  status_terkini?: string | null;
  registration_fee: number;
}

interface SummaryData {
  total_all: number;
  total_pending: number;
  total_paid: number;
  total_expired: number;
}

interface StudentSearchResult {
  id_siswa: string;
  nama_lengkap: string;
  no_wa: string;
  kelas?: string;
  nama_sekolah?: string;
  cro?: string;
  commercial_state?: string;
  status_terkini?: string;
  pending_token?: string;
  token_status?: string;
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function PaymentVerificationTab() {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
  const { user } = useAuthStore();
  const tenantSlug = user?.tenant_id || 'derma-indonesia';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PaymentVerificationItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total_all: 0,
    total_pending: 0,
    total_paid: 0,
    total_expired: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'expired'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal Verifikasi Token
  const [selectedItemForVerify, setSelectedItemForVerify] = useState<PaymentVerificationItem | null>(null);
  const [verifyNominal, setVerifyNominal] = useState(500000);
  const [verifyMethod, setVerifyMethod] = useState('Transfer Bank');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Modal Batalkan Token
  const [selectedItemForReject, setSelectedItemForReject] = useState<PaymentVerificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal Verifikasi Manual / Pencarian Siswa
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [searchStudentInput, setSearchStudentInput] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<StudentSearchResult[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudentForManual, setSelectedStudentForManual] = useState<StudentSearchResult | null>(null);
  const [manualPaymentType, setManualPaymentType] = useState<'form_fee' | 'core_deposit'>('form_fee');
  const [manualNominal, setManualNominal] = useState(500000);
  const [manualMethod, setManualMethod] = useState('Transfer Bank');
  const [manualBank, setManualBank] = useState('BCA');
  const [manualRef, setManualRef] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Copied state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch items
  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/settings/payment-verifications', {
        params: {
          status: statusFilter,
          search: debouncedSearch
        }
      });
      if (res.data?.status === 'ok' && res.data.data) {
        setItems(res.data.data.items || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      console.error('Fetch verifications error:', error);
      toast.error(error.response?.data?.message || error.message || t('settings.pvLoadFailedToast'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, t]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Handle Verify Token
  const handleVerify = async () => {
    if (!selectedItemForVerify) return;
    try {
      setIsVerifying(true);
      const res = await apiClient.post(
        `/api/v1/settings/payment-verifications/${selectedItemForVerify.token}/verify`,
        {
          nominal: verifyNominal,
          paymentMethod: verifyMethod,
          notes: verifyNotes
        }
      );
      if (res.data?.status === 'ok') {
        toast.success(res.data.message || t('settings.verifyRegSuccessToast'));
        setSelectedItemForVerify(null);
        setVerifyNotes('');
        fetchVerifications();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || t('settings.verifyRegFailedToast'));
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Reject Token
  const handleReject = async () => {
    if (!selectedItemForReject) return;
    try {
      setIsRejecting(true);
      const res = await apiClient.post(
        `/api/v1/settings/payment-verifications/${selectedItemForReject.token}/reject`,
        {
          reason: rejectReason
        }
      );
      if (res.data?.status === 'ok') {
        toast.success(t('settings.rejectProofSuccessToast'));
        setSelectedItemForReject(null);
        setRejectReason('');
        fetchVerifications();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || t('settings.rejectProofFailedToast'));
    } finally {
      setIsRejecting(false);
    }
  };

  // Search Student for Manual Verification
  useEffect(() => {
    if (!searchStudentInput || searchStudentInput.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const res = await apiClient.get('/api/v1/settings/payment-verifications/search-siswa', {
          params: { q: searchStudentInput.trim() }
        });
        if (res.data?.status === 'ok') {
          setStudentSearchResults(res.data.data || []);
        }
      } catch (err) {
        console.error('Search student error:', err);
      } finally {
        setSearchingStudents(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchStudentInput]);

  // Handle Save Manual Verification
  const handleSaveManualVerification = async () => {
    if (!selectedStudentForManual) return;
    try {
      setIsSavingManual(true);
      if (manualPaymentType === 'core_deposit') {
        const res = await apiClient.post('/api/v1/settings/payment-verifications/verify-core-deposit', {
          id_siswa: selectedStudentForManual.id_siswa,
          nominal: manualNominal,
          payment_method: manualMethod,
          notes: manualNotes,
          bank_name: manualBank || manualMethod,
          transaction_ref: manualRef || undefined
        });
        if (res.data?.status === 'ok') {
          toast.success(res.data.message || t('settings.pvManualCoreDepositSuccess'));
          setIsManualModalOpen(false);
          setSelectedStudentForManual(null);
          setSearchStudentInput('');
          setManualNotes('');
          setManualRef('');
          fetchVerifications();
        }
      } else {
        const res = await apiClient.post('/api/v1/settings/payment-verifications/manual-verify', {
          id_siswa: selectedStudentForManual.id_siswa,
          nominal: manualNominal,
          paymentMethod: manualMethod,
          notes: manualNotes
        });
        if (res.data?.status === 'ok') {
          toast.success(res.data.message || t('settings.pvManualFormFeeSuccess'));
          setIsManualModalOpen(false);
          setSelectedStudentForManual(null);
          setSearchStudentInput('');
          setManualNotes('');
          setManualRef('');
          fetchVerifications();
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || t('settings.manualVerifyFailedToast'));
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    toast.success(t('settings.pvTokenCopiedToast'));
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="size-5 sm:size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {isGeneral ? t('settings.pvHeaderTitleGeneral') : t('settings.pvHeaderTitleLpk')}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                  NexaMOS Evidence Layer
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-1.5 max-w-2xl leading-relaxed">
                {isGeneral ? t('settings.pvHeaderDescGeneral') : t('settings.pvHeaderDescLpk')}
              </p>
            </div>
          </div>

          {/* Action Button: Manual Verify */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
            <button
              onClick={fetchVerifications}
              disabled={loading}
              className="p-2.5 rounded-xl border border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 shrink-0"
              title={t('settings.pvRefreshDataTooltip')}
            >
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            </button>
            <button
              onClick={() => {
                setIsManualModalOpen(true);
                setSelectedStudentForManual(null);
                setSearchStudentInput('');
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck size={15} className="shrink-0" />
              <span className="truncate">{isGeneral ? t('settings.manualVerifyModalBtnGeneral') : t('settings.manualVerifyModalBtnLpk')}</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t">
          <div className="rounded-xl border bg-background p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('settings.statTotalPending')}</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">{summary.total_pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('settings.statTotalPaid')}</p>
              <p className="text-2xl font-bold text-emerald-500 mt-0.5">{summary.total_paid}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('settings.pvTotalRevenue')}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{formatRupiah(summary.total_paid * 500000)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Banknote size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
        {/* Status Filter Tabs: 4 Rows on Mobile (1 button per row), 1 Row on Desktop */}
        <div className="w-full sm:w-auto p-1 rounded-xl bg-muted/60 border flex flex-col sm:flex-row gap-1 sm:gap-1.5 min-w-0">
          {/* 1. Pending */}
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={cn(
              'w-full sm:w-auto px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2 min-w-0',
              statusFilter === 'pending'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Clock size={14} className="text-amber-500 shrink-0" />
              <span className="truncate">{t('settings.filterPending')}</span>
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-md text-xs font-bold leading-none shrink-0',
              statusFilter === 'pending' ? 'bg-amber-500/15 text-amber-600' : 'bg-muted-foreground/10 text-muted-foreground'
            )}>
              {summary.total_pending}
            </span>
          </button>

          {/* 2. Paid / Verified */}
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={cn(
              'w-full sm:w-auto px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2 min-w-0',
              statusFilter === 'paid'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span className="truncate">{t('settings.filterPaid')}</span>
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-md text-xs font-bold leading-none shrink-0',
              statusFilter === 'paid' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted-foreground/10 text-muted-foreground'
            )}>
              {summary.total_paid}
            </span>
          </button>

          {/* 3. Expired */}
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={cn(
              'w-full sm:w-auto px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2 min-w-0',
              statusFilter === 'expired'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <X size={14} className="text-rose-500 shrink-0" />
              <span className="truncate">{t('settings.filterExpired')}</span>
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-md text-xs font-bold leading-none shrink-0',
              statusFilter === 'expired' ? 'bg-rose-500/15 text-rose-600' : 'bg-muted-foreground/10 text-muted-foreground'
            )}>
              {summary.total_expired}
            </span>
          </button>

          {/* 4. All Statuses */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'w-full sm:w-auto px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2 min-w-0',
              statusFilter === 'all'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Filter size={14} className={cn('shrink-0', statusFilter === 'all' ? 'text-primary' : 'text-muted-foreground')} />
              <span className="truncate">{t('settings.filterAllStatus')}</span>
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-md text-xs font-bold leading-none shrink-0',
              statusFilter === 'all' ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'
            )}>
              {summary.total_all}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-auto sm:max-w-xs sm:flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={isGeneral ? t('settings.searchVerificationPlaceholderGeneral') : t('settings.searchVerificationPlaceholderLpk')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Items List / Table */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t('settings.pvLoading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} />
            </div>
            <p className="text-sm font-semibold text-foreground">{t('settings.pvEmptyTitle')}</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {statusFilter === 'pending'
                ? t('settings.pvEmptyPending')
                : t('settings.pvEmptyFiltered')}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => {
              const isPaid = item.status === 'paid';
              const isExpired = item.status === 'expired';
              const isPending = item.status === 'pending';
              const publicFormUrl = `/daftar/${tenantSlug}?token=${item.token}`;

              return (
                <div 
                  key={item.token}
                  className="p-4 sm:p-5 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Student & Parent Details */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                        {item.nama_siswa}
                      </h3>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock size={11} /> {t('settings.pvStatusPending')}
                        </span>
                      )}
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> {t('settings.pvStatusPaid')}
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                          <X size={11} /> {t('settings.pvStatusCancelled')}
                        </span>
                      )}

                      {/* Program Badge */}
                      {item.nama_program && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          <GraduationCap size={11} /> {item.nama_program}
                        </span>
                      )}

                      {/* Commercial State */}
                      <CommercialStateBadge 
                        state={item.commercial_state || 'OPPORTUNITY'} 
                        size="sm" 
                      />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                      {/* WA Siswa / Kontak */}
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-muted-foreground shrink-0" />
                        <span>{isGeneral ? t('settings.pvContactPrefix') : t('settings.pvStudentPrefix')}</span>
                        <a 
                          href={`https://wa.me/${item.no_wa.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          +{item.no_wa}
                        </a>
                      </div>

                      {/* Asal Sekolah */}
                      <div className="flex items-center gap-1.5">
                        <School size={13} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{item.nama_sekolah || t('settings.pvGeneralChannel')}</span>
                      </div>

                      {/* CRO Assignee */}
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-muted-foreground shrink-0" />
                        <span>CRO: <strong className="text-foreground">{item.cro || '-'}</strong></span>
                      </div>

                      {/* Orang Tua */}
                      {item.nama_ortu && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={13} className="text-muted-foreground shrink-0" />
                          <span>{t('settings.pvParentPrefix')}<strong className="text-foreground">{item.nama_ortu}</strong></span>
                          {item.wa_ortu && (
                            <a 
                              href={`https://wa.me/${item.wa_ortu.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline ml-1"
                            >
                              ({item.wa_ortu})
                            </a>
                          )}
                          {item.pekerjaan_ortu && <span className="text-muted-foreground">· {item.pekerjaan_ortu}</span>}
                        </div>
                      )}

                      {/* Tanggal Terbit */}
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-muted-foreground shrink-0" />
                        <span>{t('settings.pvSubmitDatePrefix')}{formatDate(item.created_at)}</span>
                      </div>

                      {/* Token Preview with Copy */}
                      <div className="flex items-center gap-1.5">
                        <Receipt size={13} className="text-muted-foreground shrink-0" />
                        <span className="font-mono text-muted-foreground">Token: {item.token.slice(0, 10)}...</span>
                        <button
                          onClick={() => handleCopy(item.token, item.token)}
                          className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                          title="Salin Token"
                        >
                          {copiedToken === item.token ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-muted-foreground font-medium">{t('settings.pvFormFeeLabel')}</p>
                      <p className="text-base font-bold text-emerald-500">{formatRupiah(item.registration_fee || 500000)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Button Open Form */}
                      <a
                        href={publicFormUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1"
                        title={t('settings.pvViewPublicFormTooltip')}
                      >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">Form</span>
                      </a>

                      {/* Button Open Siswa Detail */}
                      <Link
                        href={`/siswa/${item.id_siswa}`}
                        className="px-2.5 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1"
                        title={isGeneral ? t('settings.viewDetailTooltipGeneral') : t('settings.viewDetailTooltip')}
                      >
                        <User size={12} />
                        <span className="hidden sm:inline">{isGeneral ? 'Kontak' : 'Siswa'}</span>
                      </Link>

                      {/* Actions for Pending Tokens */}
                      {isPending && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedItemForReject(item);
                              setRejectReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-destructive/20 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title={t('settings.pvCancelRegTooltip')}
                          >
                            <X size={13} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedItemForVerify(item);
                              setVerifyNominal(item.registration_fee || 500000);
                              setVerifyNotes(`Transfer BCA an. ${item.nama_ortu || item.nama_siswa}`);
                              setVerifyMethod('Transfer Bank');
                            }}
                            className="px-3.5 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={13} />
                            <span>{t('settings.verifyActionBtn')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: Verifikasi Token Lunas ──────────────────────────────────── */}
      {selectedItemForVerify && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isGeneral ? t('settings.pvVerifyModalTitleGeneral') : t('settings.pvVerifyModalTitleLpk')}
                  </h3>
                  <p className="text-xs text-muted-foreground">NexaMOS Financial Evidence</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemForVerify(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Siswa / Kontak */}
            <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGeneral ? t('settings.studentNameLabelGeneral') : t('settings.studentNameLabelLpk')}</span>
                <span className="font-bold text-foreground">{selectedItemForVerify.nama_siswa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. WhatsApp:</span>
                <span className="font-medium text-foreground">+{selectedItemForVerify.no_wa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGeneral ? t('settings.pvInstPrefix') : t('settings.pvSchoolPrefix')}</span>
                <span className="text-foreground">{selectedItemForVerify.nama_sekolah || '-'}</span>
              </div>
              {selectedItemForVerify.nama_program && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.thProgram')}:</span>
                  <span className="font-semibold text-primary">{selectedItemForVerify.nama_program}</span>
                </div>
              )}
              {selectedItemForVerify.nama_ortu && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.pvParentPrefix')}</span>
                  <span className="text-foreground">{selectedItemForVerify.nama_ortu} ({selectedItemForVerify.wa_ortu || '-'})</span>
                </div>
              )}
            </div>

            {/* Form Input */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t('settings.pvNominalReceived')}
                </label>
                <input
                  type="number"
                  value={verifyNominal}
                  onChange={(e) => setVerifyNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm font-bold text-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t('settings.pvPaymentMethod')}
                </label>
                <select
                  value={verifyMethod}
                  onChange={(e) => setVerifyMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Transfer Bank">{t('settings.pvMethodBankTransfer')}</option>
                  <option value="QRIS">{t('settings.pvMethodQris')}</option>
                  <option value="Tunai / Cash">{t('settings.pvMethodCash')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t('settings.pvNotesOrRef')}
                </label>
                <input
                  type="text"
                  placeholder={t('settings.pvNotesPlaceholder')}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
              <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
              <span>
                {isGeneral ? t('settings.confirmVerifyNoticeGeneral') : t('settings.confirmVerifyNoticeLpk')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForVerify(null)}
                className="px-4 py-2 rounded-xl border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                {t('settings.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>{t('settings.verifyingDepositBtn')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>{t('settings.confirmVerifyPaymentBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Batalkan / Expire Token ─────────────────────────────────── */}
      {selectedItemForReject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{t('settings.rejectDialogTitle')}</h3>
                  <p className="text-xs text-muted-foreground">{selectedItemForReject.nama_siswa}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemForReject(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('settings.pvRejectConfirmDesc')}
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t('settings.rejectReasonLabel')}
              </label>
              <textarea
                rows={2}
                placeholder={t('settings.rejectReasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-destructive/20 focus:border-destructive"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForReject(null)}
                className="px-4 py-2 rounded-xl border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                {t('settings.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-destructive/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? t('settings.pvRejectingBtn') : t('settings.confirmRejectBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Verifikasi Pembayaran Manual (Cari Siswa) ──────────────── */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isGeneral ? t('settings.manualVerifyModalTitleGeneral') : t('settings.manualVerifyModalTitleLpk')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isGeneral ? t('settings.pvManualModalSubGeneral') : t('settings.pvManualModalSubLpk')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {!selectedStudentForManual ? (
              // Step 1: Search Student
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {isGeneral ? t('settings.searchStudentHelpGeneral') : t('settings.searchStudentHelpLpk')}
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={isGeneral ? t('settings.searchStudentPlaceholderGeneral') : t('settings.searchStudentPlaceholderLpk')}
                      value={searchStudentInput}
                      onChange={(e) => setSearchStudentInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      autoFocus
                    />
                    {searchingStudents && (
                      <RefreshCw size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Search Results List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 border rounded-xl p-2 bg-muted/20">
                  {studentSearchResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      {searchStudentInput.length < 2
                        ? (isGeneral ? t('settings.pvSearchStudentMinCharsGeneral') : t('settings.pvSearchStudentMinCharsLpk'))
                        : (isGeneral ? t('settings.pvSearchStudentNoResultsGeneral') : t('settings.pvSearchStudentNoResultsLpk'))}
                    </div>
                  ) : (
                    studentSearchResults.map((s) => (
                      <button
                        key={s.id_siswa}
                        type="button"
                        onClick={() => setSelectedStudentForManual(s)}
                        className="w-full p-2.5 rounded-lg border bg-card hover:bg-muted/40 hover:border-primary/30 transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground">{s.nama_lengkap}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            +{s.no_wa} · {s.nama_sekolah || t('settings.pvGeneralChannel')} · CRO: {s.cro || '-'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <CommercialStateBadge 
                            state={s.commercial_state || 'LEAD'} 
                            size="sm" 
                          />
                          <p className="text-xs text-primary font-semibold mt-1 flex items-center justify-end gap-1">
                            {t('settings.pvPickStudent')} <ArrowRight size={11} />
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Step 2: Confirm Payment Form
              <div className="space-y-3.5">
                {/* Selected Student Banner */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {isGeneral ? t('settings.selectedStudentLabelGeneral') : t('settings.selectedStudentLabelLpk')}
                    </p>
                    <p className="text-sm font-bold text-foreground">{selectedStudentForManual.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">
                      +{selectedStudentForManual.no_wa} · {selectedStudentForManual.nama_sekolah || t('settings.pvGeneralChannel')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForManual(null)}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    {t('settings.pvChangeStudent')}
                  </button>
                </div>

                {/* Jenis Konversi & Pembayaran */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t('settings.pvConversionType')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/30 border rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setManualPaymentType('form_fee');
                        setManualNominal(500000);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg text-left transition-all text-xs cursor-pointer border",
                        manualPaymentType === 'form_fee'
                          ? "bg-purple-500/15 text-purple-600 border-purple-500/30 shadow-xs font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <p className="font-bold">{isGeneral ? t('settings.pvTypeFormFeeGeneral') : t('settings.pvTypeFormFeeLpk')}</p>
                      <p className="text-2xs opacity-80 mt-0.5 font-normal">
                        {isGeneral ? t('settings.pvTypeFormFeeDescGeneral') : t('settings.pvTypeFormFeeDescLpk')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualPaymentType('core_deposit');
                        setManualNominal(1500000);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg text-left transition-all text-xs cursor-pointer border",
                        manualPaymentType === 'core_deposit'
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 shadow-xs font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <p className="font-bold">{isGeneral ? t('settings.pvTypeCoreDepositGeneral') : t('settings.pvTypeCoreDepositLpk')}</p>
                      <p className="text-2xs opacity-80 mt-0.5 font-normal">
                        {isGeneral ? t('settings.pvTypeCoreDepositDescGeneral') : t('settings.pvTypeCoreDepositDescLpk')}
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {isGeneral ? t('settings.depositAmountLabelGeneral') : t('settings.depositAmountLabelLpk')}
                  </label>
                  <input
                    type="number"
                    value={manualNominal}
                    onChange={(e) => setManualNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm font-bold text-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t('settings.pvPaymentMethod')}
                    </label>
                    <select
                      value={manualMethod}
                      onChange={(e) => setManualMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t('settings.pvTargetBank')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('settings.pvTargetBankPlaceholder')}
                      value={manualBank}
                      onChange={(e) => setManualBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t('settings.pvTransferNotes')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('settings.pvTransferNotesPlaceholder')}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForManual(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    {t('settings.cancelBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualVerification}
                    disabled={isSavingManual}
                    className="px-5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingManual ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>{t('settings.verifyingDepositBtn')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>
                          {manualPaymentType === 'core_deposit' 
                            ? t('settings.confirmVerifyDepositBtn') 
                            : t('settings.pvConfirmRegBtn')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
