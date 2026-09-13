'use strict';
'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Banknote, ShieldCheck, CheckCircle2, 
  AlertCircle, Loader2, Copy, Sparkles, HelpCircle, Tag, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

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

  const user = useAuthStore((s) => s.user);
  const tenantSlug = user?.tenant_id || 'derma';
  const publicFormUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/daftar/${tenantSlug}`
    : `/daftar/${tenantSlug}`;

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
        setFormData({
          ...res.data.data,
          registrationFee: Number(res.data.data.registrationFee) || 500000,
          coreDepositAmount: Number(res.data.data.coreDepositAmount) || 1500000,
          totalProgramFee: Number(res.data.data.totalProgramFee) || 15000000,
          discountAmount: Number(res.data.data.discountAmount) || 0,
          discountLabel: res.data.data.discountLabel || '',
          discountEndDate: res.data.data.discountEndDate || '',
        });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Gagal memuat konfigurasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNorek = () => {
    if (!formData.bankAccountNumber) return;
    navigator.clipboard.writeText(formData.bankAccountNumber);
    setCopied(true);
    toast.success('Nomor rekening berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
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
        if (res.data.data) {
          setFormData(res.data.data);
        }
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
      {/* Alert Banner / Overview */}
      <div className="bg-primary/5 border rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Standardisasi Rekening & Biaya Pendaftaran</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Nomor rekening dan nominal biaya di bawah ini otomatis tampil pada formulir pendaftaran publik (<span className="font-mono text-primary font-medium">/daftar/{tenantSlug}</span>) dan tagihan pembayaran calon siswa.
            </p>
          </div>
        </div>

        {/* Action Buttons: Salin & Buka Formulir Publik */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(publicFormUrl);
              toast.success('Link formulir pendaftaran publik disalin!');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors shadow-xs"
            title="Salin Link Publik untuk Brosur / Medsos"
          >
            <Copy size={13} />
            <span>Salin Link Publik</span>
          </button>
          <a
            href={publicFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
            title="Buka Halaman Formulir Pendaftaran Publik"
          >
            <ExternalLink size={13} />
            <span>Buka Formulir</span>
          </a>
        </div>
      </div>

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
            <div className="flex items-center gap-2.5 border-b pb-3.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Rekening Bank Resmi Tenant</h2>
                <p className="text-xs text-muted-foreground">Tujuan transfer bank untuk calon siswa & wali</p>
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
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nomor Rekening Bank <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Contoh: 8830123456"
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                  {formData.bankAccountNumber && (
                    <button
                      type="button"
                      onClick={handleCopyNorek}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Copy size={12} />
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Atas Nama Pemilik Rekening (A.N.) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankAccountHolder}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                  placeholder="Contoh: PT DERMA INDONESIA MAJU / LPK DERMA"
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Harus persis sama dengan nama yang muncul di layar ATM / m-Banking agar tidak dicurigai siswa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Instruksi / Catatan Berita Transfer
                </label>
                <textarea
                  rows={2}
                  value={formData.bankNotes}
                  onChange={(e) => setFormData({ ...formData, bankNotes: e.target.value })}
                  placeholder="Contoh: Mohon sertakan nama lengkap siswa pada berita acara transfer."
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Interactive Bank Card Preview */}
              <div className="mt-4 p-4 rounded-xl gradient-primary text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span className="font-semibold uppercase tracking-wider">Kartu Rekening Resmi</span>
                  <span className="font-bold">{formData.bankName || 'BANK'}</span>
                </div>
                <p className="text-lg font-mono font-bold tracking-widest py-1">
                  {formData.bankAccountNumber || '•••• •••• •••• ••••'}
                </p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/20">
                  <span className="opacity-80">A.N. {formData.bankAccountHolder || 'NAMA LEMBAGA RESMI'}</span>
                  <ShieldCheck size={16} className="opacity-90" />
                </div>
              </div>

            </div>
          </div>

          {/* ── KARTU 2: PRICING CONFIG (BIAYA FORMULIR & DP PELATIHAN) ── */}
          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b pb-3.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Banknote size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Standarisasi Nominal Biaya Program</h2>
                <p className="text-xs text-muted-foreground">Kustomisasi tahapan konversi komersial tenant</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Biaya Formulir (Registration Fee) */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Biaya Formulir Pendaftaran (Registration Fee)
                  </label>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Pre-Core Offer
                  </span>
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Siswa yang memvalidasi pembayaran ini akan otomatis naik ke status <span className="font-semibold text-purple-400">Registered Opportunity</span>.
                </p>
              </div>

              {/* DP Pelatihan (Core Deposit) */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Nominal DP Pelatihan (Core Deposit)
                  </label>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Core Conversion
                  </span>
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Validasi pembayaran DP ini secara sah mengubah status siswa menjadi <span className="font-semibold text-emerald-400">Customer (Closing)</span>.
                </p>
              </div>

              {/* Total Biaya Program Penuh */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CreditCard size={14} className="text-muted-foreground" />
                    Total Biaya Pelatihan / Program Penuh
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Referensi Invoice
                  </span>
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dicantumkan pada ringkasan biaya program agar siswa mengetahui sisa tagihan setelah dipotong DP.
                </p>
              </div>

              {/* ── Diskon Program (Single, Label Bebas) ── */}
              <div className="p-3.5 rounded-xl border bg-secondary/15 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Tag size={13} className="text-rose-500" />
                    Diskon Program (Opsional)
                  </label>
                  {formData.discountAmount > 0 && (
                    <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      Promo Aktif
                    </span>
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
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Kosongkan jika tidak ada batas waktu. Jika diisi, formulir publik akan otomatis menyembunyikan diskon setelah tanggal ini.
                  </p>
                </div>

                {/* Preview Simulasi */}
                {formData.discountAmount > 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1.5 text-xs">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles size={12} className="text-rose-500" />
                      Simulasi Harga Program:
                    </p>
                    <div className="space-y-1 border-t border-rose-500/10 pt-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Harga Normal</span>
                        <span className="font-semibold line-through">{formatRupiah(formData.totalProgramFee)}</span>
                      </div>
                      <div className="flex justify-between text-rose-500 font-semibold">
                        <span>Potongan "{formData.discountLabel || 'Promo'}"</span>
                        <span>- {formatRupiah(formData.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-500 font-bold border-t border-rose-500/10 pt-1">
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
                  <HelpCircle size={13} className="text-primary" /> Rantai Konversi Komersial Tenant:
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
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Terakhir diupdate: <span className="font-medium text-foreground">{formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('id-ID') : 'Belum pernah'}</span>
            {formData.updatedBy && <span> oleh <span className="font-medium text-foreground">{formData.updatedBy}</span></span>}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Simpan Konfigurasi Pembayaran</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
