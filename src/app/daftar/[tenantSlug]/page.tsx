'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  MessageSquare,
  GraduationCap,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  Landmark,
  Clock,
  ChevronRight,
  RotateCcw,
  Info,
  Phone,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SekolahItem {
  id_sekolah: string;
  nama_sekolah: string;
  jenjang: string;
}

interface TenantInfo {
  tenantId: string;
  brandName: string;
  whatsappNumber: string;
}

interface PaymentConfig {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankNotes: string;
  registrationFee: number;
  coreDepositAmount: number;
  totalProgramFee: number;
  discountAmount?: number;
  discountLabel?: string;
  discountEndDate?: string | null;
  qrisImageUrl: string | null;
}

type PageStep = 'loading' | 'step1_form' | 'step2_invoice' | 'success' | 'error' | 'already_paid';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function isDiscountActive(config?: PaymentConfig | null): boolean {
  if (!config || !config.discountAmount || config.discountAmount <= 0) return false;
  if (!config.discountEndDate) return true;
  const end = new Date(config.discountEndDate + 'T23:59:59');
  return !isNaN(end.getTime()) && new Date() <= end;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {copied ? 'Tersalin!' : 'Salin'}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PublicRegistrationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = (params?.tenantSlug as string) || '';

  // Token dari URL (resume flow): /daftar/[tenantSlug]?token=xxx
  const urlToken = searchParams?.get('token') || null;

  // ── Page State
  const [step, setStep] = useState<PageStep>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Tenant & Config
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [schools, setSchools] = useState<SekolahItem[]>([]);

  // ── Step 1 Form State
  const [namaLengkap, setNamaLengkap] = useState('');
  const [noWa, setNoWa] = useState('');
  const [selectedSekolah, setSelectedSekolah] = useState('');
  const [asalSekolahManual, setAsalSekolahManual] = useState('');
  const [isManualSekolah, setIsManualSekolah] = useState(false);
  const [kelas, setKelas] = useState('');
  const [minatAwal, setMinatAwal] = useState('Ya');
  const [rencanaLulus, setRencanaLulus] = useState('Kerja');
  const [consentWa, setConsentWa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Step 2 Invoice State
  const [invoiceData, setInvoiceData] = useState<{
    token: string;
    idSiswa: string;
    namaLengkap: string;
    noWa: string;
  } | null>(null);

  // ── Load initial data ──────────────────────────────────────────────────────

  const loadInitialData = useCallback(async () => {
    if (!tenantSlug) return;

    try {
      // Parallel: Tenant info + sekolah list + payment config
      const [infoRes, sekolahRes, paymentRes] = await Promise.allSettled([
        apiClient.get(`/api/public/${tenantSlug}/info`),
        apiClient.get(`/api/public/${tenantSlug}/sekolah`),
        apiClient.get(`/api/public/${tenantSlug}/payment-config`),
      ]);

      if (infoRes.status === 'fulfilled' && infoRes.value.data?.status === 'ok') {
        setTenantInfo(infoRes.value.data.data);
      }
      if (sekolahRes.status === 'fulfilled' && sekolahRes.value.data?.status === 'ok') {
        setSchools(sekolahRes.value.data.data || []);
      }
      if (paymentRes.status === 'fulfilled' && paymentRes.value.data?.status === 'ok') {
        setPaymentConfig(paymentRes.value.data.data);
      }
    } catch (err) {
      console.warn('Error loading initial data:', err);
    }
  }, [tenantSlug]);

  // ── Resume from token ──────────────────────────────────────────────────────

  const resumeFromToken = useCallback(async (token: string) => {
    try {
      const res = await apiClient.get(`/api/public/${tenantSlug}/reg-token/${token}`);

      if (res.data?.status === 'ok') {
        const d = res.data.data;
        setInvoiceData({
          token: d.token,
          idSiswa: d.idSiswa,
          namaLengkap: d.namaLengkap,
          noWa: d.noWa,
        });
        if (d.paymentConfig) setPaymentConfig(d.paymentConfig);
        if (d.brandName && !tenantInfo) {
          setTenantInfo({ tenantId: tenantSlug, brandName: d.brandName, whatsappNumber: '' });
        }
        setStep('step2_invoice');
      }
    } catch (err: any) {
      const status = err.response?.data?.status;
      if (status === 'paid') {
        setStep('already_paid');
      } else if (status === 'expired') {
        setErrorMessage('Link pendaftaran ini sudah kedaluwarsa (7 hari). Silakan mendaftar ulang melalui halaman awal.');
        setStep('step1_form');
      } else {
        // Token tidak valid → arahkan ke form biasa
        setStep('step1_form');
      }
    }
  }, [tenantSlug, tenantInfo]);

  useEffect(() => {
    let isMounted = true;
    setStep('loading');

    const init = async () => {
      await loadInitialData();
      if (!isMounted) return;

      if (urlToken) {
        await resumeFromToken(urlToken);
      } else {
        setStep('step1_form');
      }
    };

    init();
    return () => { isMounted = false; };
  }, [tenantSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1: Submit Biodata ─────────────────────────────────────────────────

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consentWa) {
      setErrorMessage('Persetujuan komunikasi WhatsApp (Consent Opt-In) wajib dicentang.');
      return;
    }
    if (!namaLengkap.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    const cleanWa = noWa.replace(/\D/g, '');
    if (!cleanWa || cleanWa.length < 10) {
      setErrorMessage('Nomor WhatsApp tidak valid. Masukkan minimal 10 digit.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Register siswa ke sistem
      const registerRes = await apiClient.post(`/api/public/${tenantSlug}/register`, {
        nama_lengkap: namaLengkap.trim(),
        no_wa: noWa.trim(),
        id_sekolah: isManualSekolah ? undefined : (selectedSekolah || undefined),
        asal_sekolah: isManualSekolah ? asalSekolahManual.trim() : undefined,
        kelas: kelas.trim() || undefined,
        minat_awal: minatAwal,
        rencana_lulus: rencanaLulus,
        consent_wa: true,
      });

      if (registerRes.data?.status !== 'ok') {
        setErrorMessage(registerRes.data?.message || 'Gagal menyimpan pendaftaran.');
        return;
      }

      const siswaData = registerRes.data.data;

      // 2. Buat token untuk resume Step-2
      const tokenRes = await apiClient.post(`/api/public/${tenantSlug}/reg-token`, {
        id_siswa: siswaData.id,
        nama_lengkap: siswaData.nama,
        no_wa: siswaData.wa,
      });

      const token = tokenRes.data?.data?.token;

      // 3. Update URL agar bisa di-bookmark/share
      if (token) {
        window.history.replaceState(null, '', `?token=${token}`);
      }

      setInvoiceData({
        token: token || '',
        idSiswa: siswaData.id,
        namaLengkap: siswaData.nama,
        noWa: siswaData.wa,
      });

      setStep('step2_invoice');
      // Scroll ke atas
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan jaringan saat mendaftar.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Konfirmasi Sudah Transfer ─────────────────────────────────────

  const handleConfirmTransfer = () => {
    const waCounselor = tenantInfo?.whatsappNumber || '';
    const waClean = waCounselor.replace(/\D/g, '');
    const namaText = invoiceData?.namaLengkap || '-';
    const nominalText = paymentConfig ? formatRupiah(paymentConfig.registrationFee) : 'Rp500.000';
    const waText = encodeURIComponent(
      `Halo Kak, saya *${namaText}* sudah melakukan transfer *Biaya Formulir ${nominalText}* ke rekening ${paymentConfig?.bankName || ''} a.n ${paymentConfig?.bankAccountHolder || ''}. Mohon konfirmasi pendaftaran saya. Terima kasih 🙏`
    );

    if (waClean) {
      window.open(`https://wa.me/${waClean}?text=${waText}`, '_blank');
    }
    setStep('success');
  };

  // ── Render States ──────────────────────────────────────────────────────────

  const brandName = tenantInfo?.brandName || 'Nexa';

  // Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-sm font-medium">Memuat halaman pendaftaran...</span>
        </div>
      </div>
    );
  }

  // Already Paid
  if (step === 'already_paid') {
    return (
      <PageShell brandName={brandName}>
        <div className="w-full max-w-md mx-auto bg-card border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Sudah Terdaftar!</h2>
            <p className="text-sm text-muted-foreground">Pendaftaran ini sudah dikonfirmasi sebelumnya. Tim konselor kami akan segera menghubungi Anda.</p>
          </div>
          <div className="p-4 bg-primary/5 rounded-xl text-xs text-muted-foreground text-left border border-primary/20">
            <p>Jika ada pertanyaan, hubungi konselor kami langsung.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <PageShell brandName={brandName}>
        <div className="w-full max-w-md mx-auto bg-card border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Konfirmasi Terkirim! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              Terima kasih, <strong className="text-foreground">{invoiceData?.namaLengkap}</strong>. Tim admin kami akan memverifikasi pembayaran Biaya Formulir dan menghubungi Anda dalam 1×24 jam.
            </p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-xs text-muted-foreground text-left space-y-2 border">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span>Apa yang Terjadi Selanjutnya?</span>
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Admin verifikasi pembayaran Biaya Formulir</li>
              <li>Anda mendapatkan status <strong>Registered</strong> & akses konsultasi lanjutan</li>
              <li>Konselor menghubungi Anda untuk jadwal konsultasi</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-left">
            <Info size={14} className="shrink-0 text-amber-500 mt-0.5" />
            <span>Simpan link ini sebagai bukti pendaftaran Anda: <span className="font-mono text-primary break-all">{typeof window !== 'undefined' ? window.location.href : ''}</span></span>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Step 2: Invoice ────────────────────────────────────────────────────────

  if (step === 'step2_invoice' && invoiceData) {
    const regFee = paymentConfig?.registrationFee ?? 500000;
    const accountNumber = paymentConfig?.bankAccountNumber || '-';
    const accountHolder = paymentConfig?.bankAccountHolder || '-';
    const bankName = paymentConfig?.bankName || 'Bank';
    const bankNotes = paymentConfig?.bankNotes || 'Sertakan nama lengkap pada berita transfer.';
    const waCounselor = tenantInfo?.whatsappNumber?.replace(/\D/g, '') || '';

    return (
      <PageShell brandName={brandName}>
        <div className="w-full max-w-lg mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Step Indicator */}
          <StepIndicator currentStep={2} />

          {/* Greeting Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data berhasil disimpan! Pendaftar:</p>
                <p className="font-bold text-foreground">{invoiceData.namaLengkap}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={11} /> {invoiceData.noWa}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Card */}
          <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
            {/* Header Invoice */}
            <div className="gradient-primary p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Invoice Biaya Formulir</p>
                  <p className="text-2xl font-extrabold mt-1">{formatRupiah(regFee)}</p>
                </div>
                <CreditCard size={32} className="text-white/30" />
              </div>
              <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/80">
                Langkah terakhir untuk mengamankan posisi konsultasi Anda di <strong>{brandName}</strong>.
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">

              {/* Instruksi Transfer */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Landmark size={15} className="text-primary shrink-0" />
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Rekening Tujuan Transfer</p>
                </div>

                <div className="rounded-xl border bg-secondary/30 divide-y overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-bold text-sm text-foreground">{bankName}</p>
                    </div>
                    <CopyButton text={bankName} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                      <p className="font-bold text-lg text-foreground font-mono tracking-wider">{accountNumber}</p>
                    </div>
                    <CopyButton text={accountNumber} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Atas Nama</p>
                      <p className="font-bold text-sm text-foreground">{accountHolder}</p>
                    </div>
                    <CopyButton text={accountHolder} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah Transfer</p>
                      <p className="font-extrabold text-primary text-lg">{formatRupiah(regFee)}</p>
                    </div>
                    <CopyButton text={String(regFee)} />
                  </div>
                </div>
              </div>

              {/* Keterangan Berita Transfer */}
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-600 space-y-1">
                    <p className="font-semibold">Berita Transfer Penting:</p>
                    <p>{bankNotes}</p>
                    <p>Contoh: <strong>Biaya Formulir – {invoiceData.namaLengkap}</strong></p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Alur Setelah Pembayaran</p>
                <div className="space-y-2">
                  {[
                    { icon: CreditCard, text: 'Transfer Biaya Formulir ke rekening di atas' },
                    { icon: MessageSquare, text: 'Klik tombol "Konfirmasi Sudah Transfer" di bawah' },
                    { icon: ShieldCheck, text: 'Admin verifikasi & Anda mendapatkan status Registered' },
                    { icon: CheckCircle2, text: 'Konselor menghubungi untuk jadwal konsultasi' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                        {i + 1}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  className="w-full py-3.5 px-4 rounded-xl gradient-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare size={16} />
                  Konfirmasi Sudah Transfer via WhatsApp
                  <ArrowRight size={15} />
                </button>

                {waCounselor && (
                  <a
                    href={`https://wa.me/${waCounselor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl border bg-card text-foreground text-sm font-medium hover:bg-secondary/50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare size={14} className="text-emerald-500" />
                    Ada pertanyaan? Chat konselor
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Resume Notice */}
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-secondary/50 border text-xs text-muted-foreground">
            <Clock size={14} className="shrink-0 mt-0.5 text-primary" />
            <div>
              <span className="font-semibold text-foreground">Link ini berlaku 7 hari.</span> Anda bisa menutup halaman ini dan kembali nanti. Buka kembali link yang sama untuk melanjutkan konfirmasi pembayaran.
            </div>
          </div>

          {/* Summary Biaya Program */}
          {paymentConfig && (() => {
            const hasPromo = isDiscountActive(paymentConfig);
            const discount = hasPromo ? (paymentConfig.discountAmount || 0) : 0;
            const finalTotal = Math.max(0, paymentConfig.totalProgramFee - discount);
            const promoName = paymentConfig.discountLabel || 'Promo Khusus';

            return (
              <div className="bg-card border rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Ringkasan Biaya Program</p>
                  {hasPromo && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <Tag size={11} /> {promoName}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya Formulir (sekarang)</span>
                    <span className="font-semibold text-foreground">{formatRupiah(paymentConfig.registrationFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment Pelatihan</span>
                    <span className="font-semibold text-foreground">{formatRupiah(paymentConfig.coreDepositAmount)}</span>
                  </div>
                  {hasPromo ? (
                    <>
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>Total Biaya Pelatihan Normal</span>
                        <span className="line-through">{formatRupiah(paymentConfig.totalProgramFee)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-rose-500 font-semibold">
                        <span>Potongan "{promoName}"</span>
                        <span>- {formatRupiah(discount)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold text-foreground">Total Setelah Diskon</span>
                        <span className="font-bold text-emerald-500">{formatRupiah(finalTotal)}</span>
                      </div>
                      {paymentConfig.discountEndDate && (
                        <p className="text-xs text-muted-foreground pt-0.5">
                          ⏰ Promo berlaku s.d. <span className="font-semibold text-foreground">{new Date(paymentConfig.discountEndDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-muted-foreground">Total Biaya Program</span>
                      <span className="font-bold text-primary">{formatRupiah(paymentConfig.totalProgramFee)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70">* Biaya Formulir dihitung sebagai bagian dari total program.</p>
              </div>
            );
          })()}

        </div>
      </PageShell>
    );
  }

  // ── Step 1: Biodata Form ───────────────────────────────────────────────────

  const isSubmitDisabled = isSubmitting || !consentWa || !namaLengkap.trim() || noWa.replace(/\D/g, '').length < 10;

  return (
    <PageShell brandName={brandName}>
      <div className="w-full max-w-lg mx-auto space-y-4">

        {/* Step Indicator */}
        <StepIndicator currentStep={1} />

        {/* Card Form */}
        <div className="bg-card border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <form onSubmit={handleStep1Submit} className="p-6 sm:p-8 space-y-5">

            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={e => setNamaLengkap(e.target.value)}
                placeholder="Contoh: Muhammad Rizky Pratama"
                className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={noWa}
                onChange={e => setNoWa(e.target.value)}
                placeholder="0812xxxxxxxx atau 628xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
              />
              <p className="text-xs text-muted-foreground">Format nomor Indonesia (otomatis dinormalisasi).</p>
            </div>

            {/* Asal Sekolah */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Asal Sekolah</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualSekolah(!isManualSekolah);
                    setSelectedSekolah('');
                    setAsalSekolahManual('');
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {isManualSekolah ? 'Pilih dari daftar' : 'Sekolah tidak ada di daftar?'}
                </button>
              </div>
              {!isManualSekolah ? (
                <select
                  value={selectedSekolah}
                  onChange={e => setSelectedSekolah(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                >
                  <option value="">-- Pilih Asal Sekolah --</option>
                  {schools.map(s => (
                    <option key={s.id_sekolah} value={s.id_sekolah}>
                      {s.nama_sekolah} ({s.jenjang})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={asalSekolahManual}
                  onChange={e => setAsalSekolahManual(e.target.value)}
                  placeholder="Ketik nama sekolah Anda lengkap..."
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                />
              )}
            </div>

            {/* Kelas & Rencana */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Kelas / Tingkat</label>
                <input
                  type="text"
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  placeholder="Contoh: 12 TKJ 1"
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Rencana Setelah Lulus</label>
                <select
                  value={rencanaLulus}
                  onChange={e => setRencanaLulus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                >
                  <option value="Kerja">Bekerja</option>
                  <option value="Kuliah">Melanjutkan Kuliah</option>
                  <option value="Wirausaha">Wirausaha / Bisnis</option>
                  <option value="Belum Tahu">Belum Tahu / Konsultasi</option>
                </select>
              </div>
            </div>

            {/* Minat */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Minat Pelatihan / Karir ke Luar Negeri
              </label>
              <select
                value={minatAwal}
                onChange={e => setMinatAwal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
              >
                <option value="Ya">Ya, sangat berminat</option>
                <option value="Ragu">Masih ragu-ragu / butuh tanya dulu</option>
                <option value="Tidak">Belum berminat</option>
              </select>
            </div>

            {/* Consent */}
            <div className="pt-1">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border bg-secondary/30 cursor-pointer select-none transition-all hover:bg-secondary/50">
                <input
                  type="checkbox"
                  checked={consentWa}
                  onChange={e => setConsentWa(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary shrink-0"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-semibold text-foreground">
                    Persetujuan Kontak WhatsApp (Wajib) <span className="text-rose-500">*</span>
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Saya bersedia dihubungi via WhatsApp oleh tim konselor resmi untuk konsultasi karir, bimbingan, dan informasi program.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={cn(
                  'w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2',
                  isSubmitDisabled
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50 shadow-none'
                    : 'gradient-primary shadow-primary/20 hover:opacity-90 active:scale-95'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan Data...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Lanjut ke Instruksi Pembayaran</span>
                    <ChevronRight size={15} />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
              <span>Data dilindungi secara rahasia oleh Nexa OS & Consent Engine.</span>
            </div>
          </form>
        </div>

        {/* Info Preview Biaya */}
        {paymentConfig && (() => {
          const hasPromo = isDiscountActive(paymentConfig);
          const discount = hasPromo ? (paymentConfig.discountAmount || 0) : 0;
          const finalTotal = Math.max(0, paymentConfig.totalProgramFee - discount);
          const promoName = paymentConfig.discountLabel || 'Promo Diskon';

          return (
            <div className="bg-card border rounded-2xl p-4 space-y-2.5 shadow-sm text-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Biaya yang Perlu Disiapkan</p>
                {hasPromo && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <Tag size={11} /> {promoName}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Biaya Formulir Pendaftaran</span>
                <span className="font-semibold text-foreground">{formatRupiah(paymentConfig.registrationFee)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span className="text-muted-foreground/70">DP Pelatihan (setelah diterima)</span>
                <span className="text-muted-foreground/70">{formatRupiah(paymentConfig.coreDepositAmount)}</span>
              </div>
              {hasPromo && (
                <div className="border-t pt-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Biaya Program</span>
                  <div className="text-right">
                    <span className="line-through text-muted-foreground/70 mr-1.5">{formatRupiah(paymentConfig.totalProgramFee)}</span>
                    <span className="font-bold text-emerald-500">{formatRupiah(finalTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </PageShell>
  );
}

// ── Shared Layout Components ───────────────────────────────────────────────────

function PageShell({ brandName, children }: { brandName: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/20 flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-lg mx-auto w-full mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
          <GraduationCap size={14} />
          <span>Formulir Pendaftaran Resmi</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{brandName}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Daftarkan diri Anda dan dapatkan panduan jalur karir bersama tim konselor kami.
        </p>
      </div>

      {children}

      {/* Footer */}
      <div className="max-w-lg mx-auto w-full mt-6 text-center text-xs text-muted-foreground/60">
        Powered by <span className="font-semibold text-muted-foreground">Nexa OS</span> — Platform Manajemen CRO Terdepan
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { label: 'Data Diri', num: 1 },
    { label: 'Instruksi Bayar', num: 2 },
  ];

  return (
    <div className="flex items-center justify-center gap-0 max-w-xs mx-auto">
      {steps.map((s, i) => {
        const isActive = s.num === currentStep;
        const isDone = s.num < currentStep;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                isActive ? 'gradient-primary text-white shadow-md shadow-primary/30' : '',
                isDone ? 'bg-emerald-500 text-white' : '',
                !isActive && !isDone ? 'bg-muted text-muted-foreground' : ''
              )}>
                {isDone ? <Check size={14} /> : s.num}
              </div>
              <span className={cn(
                'text-xs font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-3 mb-5 transition-colors',
                currentStep > 1 ? 'bg-emerald-500' : 'bg-muted'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
