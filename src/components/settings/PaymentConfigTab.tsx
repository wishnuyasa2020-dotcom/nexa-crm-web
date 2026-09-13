'use strict';
'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Banknote, ShieldCheck, CheckCircle2, 
  AlertCircle, Loader2, Copy, Sparkles, HelpCircle, Tag,
  Pencil, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface PaymentConfigData {
  id?: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankNotes: string;
  registrationFee: number;
  coreDepositAmount: number;
  totalProgramFee: number;
  discountAmount: number;
  discountLabel: string;
  discountEndDate: string;
  qrisImageUrl?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

const POPULAR_BANKS = [
  'BCA',
  'Bank Mandiri',
  'BRI',
  'BNI',
  'Bank Syariah Indonesia (BSI)',
  'CIMB Niaga',
  'Permata Bank',
  'Bank Danamon',
  'Bank BTPN / Jenius',
  'Bank Lainnya',
];

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

export default function PaymentConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedHolder, setCopiedHolder] = useState(false);

  // ── Mode Edit vs Terkunci (Pencil Toggle) ──────────────────────────
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [savedData, setSavedData] = useState<PaymentConfigData | null>(null);

  const isEditingAny = isEditingBank || isEditingPricing;

  const [formData, setFormData] = useState<PaymentConfigData>({
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankNotes: 'Mohon sertakan nama lengkap calon siswa pada berita acara transfer m-Banking.',
    registrationFee: 500000,
    coreDepositAmount: 1500000,
    totalProgramFee: 15000000,
    discountAmount: 0,
    discountLabel: '',
    discountEndDate: '',
    qrisImageUrl: null
  });

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/v1/settings/payment-config');
      if (res.data?.status === 'ok' && res.data.data) {
        const loaded: PaymentConfigData = {
          ...res.data.data,
          registrationFee: Number(res.data.data.registrationFee) || 500000,
          coreDepositAmount: Number(res.data.data.coreDepositAmount) || 1500000,
          totalProgramFee: Number(res.data.data.totalProgramFee) || 15000000,
          discountAmount: Number(res.data.data.discountAmount) || 0,
          discountLabel: res.data.data.discountLabel || '',
          discountEndDate: res.data.data.discountEndDate || '',
        };
        setFormData(loaded);
        setSavedData(loaded);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Gagal memuat konfigurasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBank = () => {
    if (savedData) {
      setFormData((prev) => ({
        ...prev,
        bankName: savedData.bankName,
        bankAccountNumber: savedData.bankAccountNumber,
        bankAccountHolder: savedData.bankAccountHolder,
        bankNotes: savedData.bankNotes,
      }));
    }
    setIsEditingBank(false);
  };

  const handleCancelPricing = () => {
    if (savedData) {
      setFormData((prev) => ({
        ...prev,
        registrationFee: savedData.registrationFee,
        coreDepositAmount: savedData.coreDepositAmount,
        totalProgramFee: savedData.totalProgramFee,
        discountAmount: savedData.discountAmount,
        discountLabel: savedData.discountLabel,
        discountEndDate: savedData.discountEndDate,
      }));
    }
    setIsEditingPricing(false);
  };

  const handleCancelAll = () => {
    if (savedData) {
      setFormData(savedData);
    }
    setIsEditingBank(false);
    setIsEditingPricing(false);
  };

  const handleCopyNorek = () => {
    if (!formData.bankAccountNumber) return;
    navigator.clipboard.writeText(formData.bankAccountNumber);
    setCopied(true);
    toast.success('Nomor rekening berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHolder = () => {
    if (!formData.bankAccountHolder) return;
    navigator.clipboard.writeText(formData.bankAccountHolder);
    setCopiedHolder(true);
    toast.success('Nama pemilik rekening berhasil disalin!');
    setTimeout(() => setCopiedHolder(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankAccountNumber.trim()) {
      toast.error('Nomor rekening bank wajib diisi.');
      return;
    }
    if (!formData.bankAccountHolder.trim()) {
      toast.error('Nama pemilik rekening (A.N.) wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.put('/api/v1/settings/payment-config', formData);
      if (res.data?.status === 'ok') {
        toast.success(res.data.message || 'Konfigurasi pembayaran berhasil disimpan!');
        const updated = res.data.data || formData;
        setFormData(updated);
        setSavedData(updated);
        setIsEditingBank(false);
        setIsEditingPricing(false);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e.response?.data?.message || e.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm">Memuat pengaturan rekening & biaya...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border text-destructive text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── KARTU 1: REKENING BANK TRANSFER RESMI ── */}
          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            {/* Header Card 1: 2-Row di Mobile (Ikon di Row 1) & Inline di Desktop */}
            <div className="border-b pb-3.5">
              {/* Khusus Mobile (< sm): Row 1 = Ikon + Judul + Tombol Edit, Row 2 = Subtitle */}
              <div className="sm:hidden space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                      <Building2 size={16} />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground truncate">Rekening Bank Resmi Tenant</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingBank) {
                        handleCancelBank();
                      } else {
                        setIsEditingBank(true);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                      isEditingBank
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border-border"
                    )}
                    title={isEditingBank ? "Batal ubah data rekening" : "Klik untuk mengubah rekening bank"}
                  >
                    <Pencil size={12} className={isEditingBank ? "text-amber-500" : "text-blue-500"} />
                    <span>{isEditingBank ? 'Batal' : 'Edit'}</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Tujuan transfer bank untuk calon siswa &amp; wali
                </p>
              </div>

              {/* Desktop (>= sm): Tampilan Asli Sejajar Inline */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Rekening Bank Resmi Tenant</h2>
                    <p className="text-xs text-muted-foreground">Tujuan transfer bank untuk calon siswa &amp; wali</p>
                  </div>
                </div>

                {/* Tombol Ikon Pensil Edit / Batal */}
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingBank) {
                      handleCancelBank();
                    } else {
                      setIsEditingBank(true);
                    }
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                    isEditingBank
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border-border"
                  )}
                  title={isEditingBank ? "Batal ubah data rekening" : "Klik untuk mengubah rekening bank"}
                >
                  <Pencil size={13} className={isEditingBank ? "text-amber-500" : "text-blue-500"} />
                  <span>{isEditingBank ? 'Batal' : 'Edit'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Bank <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  disabled={!isEditingBank}
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {/* Row 1 di Mobile: Label di kiri, Tombol Salin di kanan */}
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Nomor Rekening Bank <span className="text-destructive">*</span>
                  </label>
                  {formData.bankAccountNumber && (
                    <button
                      type="button"
                      onClick={handleCopyNorek}
                      className="sm:hidden text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground border border-border/50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Salin Nomor Rekening"
                    >
                      <Copy size={11} />
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>

                {/* Row 2: Input Nomor Rekening Full-Width */}
                <div className="relative">
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Contoh: 8830123456"
                    disabled={!isEditingBank}
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed sm:pr-20"
                    required
                  />
                  {/* Tombol Salin Desktop (Inline di dalam input) */}
                  {formData.bankAccountNumber && (
                    <button
                      type="button"
                      onClick={handleCopyNorek}
                      className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors items-center gap-1 cursor-pointer"
                      title="Salin Nomor Rekening"
                    >
                      <Copy size={12} />
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                {/* Row 1 di Mobile: Label di kiri, Tombol Salin di kanan */}
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Atas Nama Pemilik Rekening (A.N.) <span className="text-destructive">*</span>
                  </label>
                  {formData.bankAccountHolder && (
                    <button
                      type="button"
                      onClick={handleCopyHolder}
                      className="sm:hidden text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground border border-border/50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Salin Nama Pemilik Rekening"
                    >
                      <Copy size={11} />
                      <span>{copiedHolder ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>

                {/* Row 2: Input Atas Nama Full-Width */}
                <div className="relative">
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    placeholder="Contoh: PT DERMA INDONESIA MAJU / LPK DERMA"
                    disabled={!isEditingBank}
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed sm:pr-20"
                    required
                  />
                  {/* Tombol Salin Desktop (Inline di dalam input) */}
                  {formData.bankAccountHolder && (
                    <button
                      type="button"
                      onClick={handleCopyHolder}
                      className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors items-center gap-1 cursor-pointer"
                      title="Salin Nama Pemilik Rekening"
                    >
                      <Copy size={12} />
                      <span>{copiedHolder ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Harus persis sama dengan nama yang muncul di layar ATM / m-Banking agar tidak dicurigai siswa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Instruksi / Catatan Berita Transfer
                </label>
                <textarea
                  rows={3}
                  value={formData.bankNotes}
                  onChange={(e) => setFormData({ ...formData, bankNotes: e.target.value })}
                  placeholder="Contoh: Mohon sertakan nama lengkap siswa pada berita acara transfer."
                  disabled={!isEditingBank}
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed min-h-24 sm:min-h-16"
                />
              </div>

              {/* Interactive Bank Card Preview */}
              <div className="mt-4 p-3.5 sm:p-4 rounded-xl gradient-primary text-white space-y-2 shadow-md overflow-hidden">
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span className="font-semibold uppercase tracking-wider">Kartu Rekening Resmi</span>
                  <span className="font-bold">{formData.bankName || 'BANK'}</span>
                </div>
                <p className="text-base sm:text-lg font-mono font-bold tracking-wide sm:tracking-widest py-1 break-all select-all">
                  {formData.bankAccountNumber || '•••• •••• •••• ••••'}
                </p>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/20 gap-2">
                  <span className="opacity-80 truncate">A.N. {formData.bankAccountHolder || 'NAMA LEMBAGA RESMI'}</span>
                  <ShieldCheck size={16} className="opacity-90 shrink-0" />
                </div>
              </div>

            </div>
          </div>

          {/* ── KARTU 2: PRICING CONFIG (BIAYA FORMULIR & DP PELATIHAN) ── */}
          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            {/* Header Card 2: 2-Row di Mobile (Ikon di Row 1) & Inline di Desktop */}
            <div className="border-b pb-3.5">
              {/* Khusus Mobile (< sm): Row 1 = Ikon + Judul + Tombol Edit, Row 2 = Subtitle */}
              <div className="sm:hidden space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <Banknote size={16} />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground truncate">Standarisasi Biaya Program</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingPricing) {
                        handleCancelPricing();
                      } else {
                        setIsEditingPricing(true);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                      isEditingPricing
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border-border"
                    )}
                    title={isEditingPricing ? "Batal ubah nominal biaya" : "Klik untuk mengubah standardisasi biaya"}
                  >
                    <Pencil size={12} className={isEditingPricing ? "text-amber-500" : "text-emerald-500"} />
                    <span>{isEditingPricing ? 'Batal' : 'Edit'}</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Kustomisasi tahapan konversi komersial tenant
                </p>
              </div>

              {/* Desktop (>= sm): Tampilan Asli Sejajar Inline */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                    <Banknote size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Standarisasi Nominal Biaya Program</h2>
                    <p className="text-xs text-muted-foreground">Kustomisasi tahapan konversi komersial tenant</p>
                  </div>
                </div>

                {/* Tombol Ikon Pensil Edit / Batal */}
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingPricing) {
                      handleCancelPricing();
                    } else {
                      setIsEditingPricing(true);
                    }
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                    isEditingPricing
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border-border"
                  )}
                  title={isEditingPricing ? "Batal ubah nominal biaya" : "Klik untuk mengubah standardisasi biaya"}
                >
                  <Pencil size={13} className={isEditingPricing ? "text-amber-500" : "text-emerald-500"} />
                  <span>{isEditingPricing ? 'Batal' : 'Edit'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Biaya Formulir (Registration Fee) */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-purple-500" />
                    Biaya Formulir Pendaftaran (Registration Fee)
                  </label>
                  <div>
                    <span className="inline-block text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Pre-Core Offer
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.registrationFee}
                    onChange={(e) => setFormData({ ...formData, registrationFee: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    disabled={!isEditingPricing}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Siswa yang memvalidasi pembayaran ini akan otomatis naik ke status <span className="font-semibold text-purple-400">Registered Opportunity</span>.
                </p>
              </div>

              {/* DP Pelatihan (Core Deposit) */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    Nominal DP Pelatihan (Core Deposit)
                  </label>
                  <div>
                    <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Core Conversion
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={formData.coreDepositAmount}
                    onChange={(e) => setFormData({ ...formData, coreDepositAmount: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    disabled={!isEditingPricing}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Validasi pembayaran DP ini secara sah mengubah status siswa menjadi <span className="font-semibold text-emerald-400">Customer (Closing)</span>.
                </p>
              </div>

              {/* Total Biaya Program Penuh */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CreditCard size={14} className="hidden sm:inline-block text-muted-foreground" />
                    Total Biaya Pelatihan / Program Penuh
                  </label>
                  <div>
                    <span className="inline-block text-xs text-muted-foreground">
                      Referensi Invoice
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.totalProgramFee}
                    onChange={(e) => setFormData({ ...formData, totalProgramFee: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    disabled={!isEditingPricing}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dicantumkan pada ringkasan biaya program agar siswa mengetahui sisa tagihan setelah dipotong DP.
                </p>
              </div>

              {/* ── Diskon Program (Single, Label Bebas) ── */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Tag size={13} className="hidden sm:inline-block text-rose-500" />
                    Diskon Program (Opsional)
                  </label>
                  {formData.discountAmount > 0 && (
                    <div>
                      <span className="inline-block text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Promo Aktif
                      </span>
                    </div>
                  )}
                </div>

                {/* Judul / Label Promo */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Judul Program Diskon
                  </label>
                  <input
                    type="text"
                    value={formData.discountLabel}
                    onChange={(e) => setFormData({ ...formData, discountLabel: e.target.value })}
                    placeholder="Contoh: Early Bird Batch 3, Promo Lebaran, Diskon Alumni..."
                    disabled={!isEditingPricing}
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Label ini yang akan tampil pada invoice formulir pendaftaran siswa.
                  </p>
                </div>

                {/* Nominal Diskon */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Nominal Potongan Harga
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      placeholder="0"
                      disabled={!isEditingPricing}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Tanggal Akhir Berlaku */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Berlaku Sampai (Tanggal Akhir)
                  </label>
                  <input
                    type="date"
                    value={formData.discountEndDate}
                    onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                    disabled={!isEditingPricing}
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Kosongkan jika tidak ada batas waktu. Jika diisi, formulir publik akan otomatis menyembunyikan diskon setelah tanggal ini.
                  </p>
                </div>

                {/* Preview Simulasi */}
                {formData.discountAmount > 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1.5 text-xs">
                    <div className="font-bold text-foreground flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                      <span className="flex items-center gap-1.5 text-rose-500">
                        <Sparkles size={12} />
                        <span className="text-foreground">Simulasi</span>
                      </span>
                      <span>Harga Program:</span>
                    </div>
                    <div className="space-y-2 sm:space-y-1 border-t border-rose-500/10 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-muted-foreground gap-0.5 sm:gap-2">
                        <span>Harga Normal</span>
                        <span className="font-semibold line-through">{formatRupiah(formData.totalProgramFee)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-rose-500 font-semibold gap-0.5 sm:gap-2">
                        <span className="wrap-break-word">Potongan "{formData.discountLabel || 'Promo'}"</span>
                        <span>- {formatRupiah(formData.discountAmount)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-emerald-500 font-bold border-t border-rose-500/10 pt-1.5 sm:pt-1 gap-0.5 sm:gap-2">
                        <span>Harga Setelah Diskon</span>
                        <span>{formatRupiah(Math.max(0, formData.totalProgramFee - formData.discountAmount))}</span>
                      </div>
                    </div>
                    {formData.discountEndDate && (
                      <p className="text-muted-foreground pt-1">
                        ⏰ Berlaku s.d. <span className="font-semibold text-foreground">{new Date(formData.discountEndDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </p>
                    )}
                  </div>
                )}

              </div>

              {/* Ringkasan Skema Konversi Ontologi */}
              <div className="p-3 rounded-lg border bg-background/50 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <HelpCircle size={13} className="text-primary hidden sm:inline-block" /> Rantai Konversi Komersial Tenant:
                </p>
                <div className="flex items-center gap-1.5 flex-wrap font-medium">
                  <span className="text-foreground">Opportunity</span>
                  <span>➔</span>
                  <span className="text-purple-400">{formatRupiah(formData.registrationFee)} (Form)</span>
                  <span>➔</span>
                  <span className="text-emerald-400">{formatRupiah(formData.coreDepositAmount)} (DP)</span>
                  <span>➔</span>
                  <span className="text-foreground font-semibold">🎯 Customer</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isEditingAny ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
                <Pencil size={12} /> Mode Edit Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-medium border border-border/60">
                <Lock size={12} /> Data Terkunci (Mode Baca)
              </span>
            )}
            <span className="hidden sm:inline">
              Terakhir diupdate: <span className="font-medium text-foreground">{formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('id-ID') : 'Belum pernah'}</span>
              {formData.updatedBy && <span> oleh <span className="font-medium text-foreground">{formData.updatedBy}</span></span>}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isEditingAny ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelAll}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal Semua
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} className="hidden sm:inline-block" />
                      <span>Simpan Konfigurasi</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingBank(true);
                  setIsEditingPricing(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border bg-primary/10 hover:bg-primary/15 text-primary border-primary/25 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Pencil size={14} />
                <span>Ubah Konfigurasi (Klik untuk Edit)</span>
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
