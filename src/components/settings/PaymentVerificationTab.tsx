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
      toast.error(error.response?.data?.message || error.message || 'Gagal memuat data verifikasi.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

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
        toast.success(res.data.message || 'Pembayaran berhasil diverifikasi!');
        setSelectedItemForVerify(null);
        setVerifyNotes('');
        fetchVerifications();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || 'Gagal memverifikasi pembayaran.');
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
        toast.success('Pendaftaran/token berhasil dibatalkan.');
        setSelectedItemForReject(null);
        setRejectReason('');
        fetchVerifications();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || 'Gagal membatalkan token.');
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
          toast.success(res.data.message || 'DP Pelatihan siswa berhasil diverifikasi! Status resmi naik ke Siswa / Peserta (CUSTOMER).');
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
          toast.success(res.data.message || 'Pembayaran formulir siswa berhasil dicatat! Status resmi naik ke Siswa Terdaftar (REGISTERED).');
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
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan verifikasi manual.');
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    toast.success('Token disalin ke clipboard');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Verifikasi Pembayaran Pendaftaran & DP Pelatihan</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  NexaMOS Evidence Layer
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Modul otorisasi keuangan bagi Admin & Manager untuk memvalidasi pembayaran formulir pendaftaran (Rp 500.000) menuju status <strong className="text-foreground">Siswa Terdaftar (REGISTERED)</strong> dan verifikasi DP Pelatihan sah (Rp 1.500.000) menuju status <strong className="text-foreground">Siswa / Peserta (CUSTOMER)</strong> dengan audit trail immutable.
              </p>
            </div>
          </div>

          {/* Action Button: Manual Verify */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={fetchVerifications}
              disabled={loading}
              className="p-2.5 rounded-xl border border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              title="Segarkan Data"
            >
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            </button>
            <button
              onClick={() => {
                setIsManualModalOpen(true);
                setSelectedStudentForManual(null);
                setSearchStudentInput('');
              }}
              className="px-4 py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              <UserCheck size={15} />
              <span>Verifikasi Pembayaran Manual</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t">
          <div className="rounded-xl border bg-background p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">{summary.total_pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Terverifikasi Lunas</p>
              <p className="text-2xl font-bold text-emerald-500 mt-0.5">{summary.total_paid}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Dana Masuk Pendaftaran</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{formatRupiah(summary.total_paid * 500000)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Banknote size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border">
          <button
            onClick={() => setStatusFilter('pending')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'pending'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock size={13} className="text-amber-500" />
            <span>Menunggu ({summary.total_pending})</span>
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'paid'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Lunas ({summary.total_paid})</span>
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'expired'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <X size={13} className="text-rose-500" />
            <span>Batal/Expired ({summary.total_expired})</span>
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'all'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Semua ({summary.total_all})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari siswa, no. WA, ortu..."
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
            <p className="text-xs text-muted-foreground">Memuat antrean verifikasi pembayaran...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} />
            </div>
            <p className="text-sm font-semibold text-foreground">Tidak Ada Data Verifikasi</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {statusFilter === 'pending'
                ? 'Saat ini belum ada antrean formulir pendaftaran yang menunggu verifikasi pembayaran.'
                : 'Tidak ditemukan transaksi pendaftaran yang sesuai dengan filter pencarian.'}
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
                          <Clock size={11} /> Menunggu Verifikasi
                        </span>
                      )}
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Lunas Terverifikasi
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                          <X size={11} /> Batal / Expired
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
                      {/* WA Siswa */}
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-muted-foreground shrink-0" />
                        <span>Siswa: </span>
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
                        <span className="truncate">{item.nama_sekolah || 'Channel Umum'}</span>
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
                          <span>Ortu: <strong className="text-foreground">{item.nama_ortu}</strong></span>
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
                        <span>Submit: {formatDate(item.created_at)}</span>
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
                      <p className="text-xs text-muted-foreground font-medium">Biaya Formulir</p>
                      <p className="text-base font-bold text-emerald-500">{formatRupiah(item.registration_fee || 500000)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Button Open Form */}
                      <a
                        href={publicFormUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1"
                        title="Lihat Formulir Publik"
                      >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">Form</span>
                      </a>

                      {/* Button Open Siswa Detail */}
                      <Link
                        href={`/siswa/${item.id_siswa}`}
                        className="px-2.5 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1"
                        title="Buka Halaman Siswa"
                      >
                        <User size={12} />
                        <span className="hidden sm:inline">Siswa</span>
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
                            title="Batalkan / Expire Pendaftaran"
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
                            <span>Verifikasi Lunas</span>
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
                  <h3 className="text-base font-bold text-foreground">Verifikasi Pembayaran Siswa</h3>
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

            {/* Info Siswa */}
            <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Siswa:</span>
                <span className="font-bold text-foreground">{selectedItemForVerify.nama_siswa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. WhatsApp:</span>
                <span className="font-medium text-foreground">+{selectedItemForVerify.no_wa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asal Sekolah:</span>
                <span className="text-foreground">{selectedItemForVerify.nama_sekolah || '-'}</span>
              </div>
              {selectedItemForVerify.nama_program && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Program:</span>
                  <span className="font-semibold text-primary">{selectedItemForVerify.nama_program}</span>
                </div>
              )}
              {selectedItemForVerify.nama_ortu && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orang Tua / Wali:</span>
                  <span className="text-foreground">{selectedItemForVerify.nama_ortu} ({selectedItemForVerify.wa_ortu || '-'})</span>
                </div>
              )}
            </div>

            {/* Form Input */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nominal Diterima (Rp)
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
                  Metode Pembayaran
                </label>
                <select
                  value={verifyMethod}
                  onChange={(e) => setVerifyMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Transfer Bank">Transfer Bank (BCA / Mandiri / BRI / BNI / Lainnya)</option>
                  <option value="QRIS">QRIS Statis / Dinamis</option>
                  <option value="Tunai / Cash">Tunai / Cash di Kantor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Catatan / No. Referensi Mutasi Bank (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mutasi BCA tgl 14/09 an. Sayuti Ref #9281"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
              <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
              <span>
                Dengan menekan tombol di bawah, status siswa akan resmi bertransisi menjadi <strong className="text-foreground">Registered Opportunity</strong> dan tercatat ke audit trail event log.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForVerify(null)}
                className="px-4 py-2 rounded-xl border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Konfirmasi Lunas</span>
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
                  <h3 className="text-base font-bold text-foreground">Batalkan Pendaftaran / Token</h3>
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
              Apakah Anda yakin ingin membatalkan atau menandai token invoice pendaftaran ini sebagai expired? Tindakan ini akan dicatat ke event log.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Alasan Pembatalan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Misal: Salah input nominal, ganti jalur pendaftaran, atau permintaan wali siswa"
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
                Kembali
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-destructive/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Membatalkan...' : 'Ya, Batalkan Token'}
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
                  <h3 className="text-base font-bold text-foreground">Verifikasi Pembayaran Manual</h3>
                  <p className="text-xs text-muted-foreground">Catat bukti transfer pendaftaran langsung / tunai</p>
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
                    Cari Calon Siswa (Ketik Nama, No. WhatsApp, atau ID Siswa)
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Contoh: Wahyu / 0856... / STD-000180"
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
                        ? 'Ketik minimal 2 karakter untuk mencari calon siswa...'
                        : 'Tidak ditemukan siswa yang cocok.'}
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
                            +{s.no_wa} · {s.nama_sekolah || 'Channel Umum'} · CRO: {s.cro || '-'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <CommercialStateBadge 
                            state={s.commercial_state || 'LEAD'} 
                            size="sm" 
                          />
                          <p className="text-xs text-primary font-semibold mt-1 flex items-center justify-end gap-1">
                            Pilih <ArrowRight size={11} />
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
                    <p className="text-xs text-muted-foreground">Siswa Terpilih:</p>
                    <p className="text-sm font-bold text-foreground">{selectedStudentForManual.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">
                      +{selectedStudentForManual.no_wa} · {selectedStudentForManual.nama_sekolah || 'Channel Umum'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForManual(null)}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Ganti Siswa
                  </button>
                </div>

                {/* Jenis Konversi & Pembayaran */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Jenis Konversi & Pembayaran
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
                      <p className="font-bold">🟣 Biaya Formulir</p>
                      <p className="text-2xs opacity-80 mt-0.5 font-normal">➔ Siswa Terdaftar (REGISTERED)</p>
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
                      <p className="font-bold">🟢 DP Pelatihan Sah</p>
                      <p className="text-2xs opacity-80 mt-0.5 font-normal">➔ Siswa / Peserta (CUSTOMER)</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Nominal Pembayaran (Rp)
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
                      Metode Pembayaran
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
                      Nama Bank / Kas Tujuan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: BCA / Mandiri / Kas Kantor"
                      value={manualBank}
                      onChange={(e) => setManualBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Catatan / No. Referensi Transfer
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bukti slip transfer BCA dikirim lewat WA ortu / Ref: TRX-9921"
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
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualVerification}
                    disabled={isSavingManual}
                    className="px-5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingManual ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>{manualPaymentType === 'core_deposit' ? 'Verifikasi DP & Jadikan Customer' : 'Verifikasi Pendaftaran (Registered)'}</span>
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
