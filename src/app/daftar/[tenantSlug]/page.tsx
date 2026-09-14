'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Info,
  Phone,
  Tag,
  School,
  Pencil,
  User,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  Hash,
  X,
  Sparkles,
  AlertTriangle,
  Flame,
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
  programs?: string[];
  programNames?: string;
}

type PageStep = 'loading' | 'step1_form' | 'step2_invoice' | 'success' | 'error' | 'already_paid';

const PEKERJAAN_OPTIONS = [
  'PNS',
  'TNI/POLRI',
  'Guru',
  'Karyawan Swasta',
  'Wiraswasta',
  'Lainnya',
];

const GENDER_OPTIONS = ['Laki-laki', 'Perempuan'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '-';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function isDiscountActive(config?: PaymentConfig | null): boolean {
  if (!config || !config.discountAmount || config.discountAmount <= 0) return false;
  if (!config.discountEndDate) return true;
  const end = new Date(config.discountEndDate + 'T23:59:59');
  return !isNaN(end.getTime()) && new Date() <= end;
}

function getRemainingTimeText(expiresAt?: string | null): { dateFormatted: string; daysLeftText: string; isUrgent: boolean; fullDateWithTime: string } {
  const exp = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const dateFormatted = exp.toLocaleDateString('id-ID', options);
  const timeStr = `${String(exp.getHours()).padStart(2, '0')}:${String(exp.getMinutes()).padStart(2, '0')} WIB`;
  const fullDateWithTime = `${dateFormatted} (${timeStr})`;

  let daysLeftText = '';
  if (diffDays <= 0) {
    daysLeftText = 'Hari Terakhir!';
  } else if (diffDays === 1) {
    daysLeftText = `Sisa ${diffHours} Jam`;
  } else {
    daysLeftText = `Sisa ${diffDays} Hari`;
  }

  return {
    dateFormatted,
    daysLeftText,
    isUrgent: diffDays <= 3,
    fullDateWithTime
  };
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
  const tenantSlug = (params?.tenantSlug as string) || '';

  // Token dari URL (resume flow): /daftar/[tenantSlug]?token=xxx
  const urlToken = searchParams?.get('token') || null;

  // ── Page State
  const [step, setStep] = useState<PageStep>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // ── Tenant & Config
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [schools, setSchools] = useState<SekolahItem[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);

  // ── Mode Edit vs View Only (Khusus Resume Token)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);

  // ── Field Data Calon Siswa
  const [namaLengkap, setNamaLengkap] = useState('');
  const [noWa, setNoWa] = useState('');
  const [selectedSekolah, setSelectedSekolah] = useState('');
  const [namaSekolahPreview, setNamaSekolahPreview] = useState('');
  const [asalSekolahManual, setAsalSekolahManual] = useState('');
  const [isManualSekolah, setIsManualSekolah] = useState(false);
  const [kelas, setKelas] = useState('');
  const [nik, setNik] = useState('');
  const [gender, setGender] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [namaProgram, setNamaProgram] = useState('');
  const [minatAwal, setMinatAwal] = useState('Ya');
  const [rencanaLulus, setRencanaLulus] = useState('Kerja');
  const [consentWa, setConsentWa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Field Data Orang Tua / Wali
  const [namaOrtu, setNamaOrtu] = useState('');
  const [waOrtu, setWaOrtu] = useState('');
  const [tglLahirOrtu, setTglLahirOrtu] = useState('');
  const [pekerjaanOrtu, setPekerjaanOrtu] = useState('');

  // ── Snapshot Backup for Cancel Edit
  const backupDataRef = useRef<Record<string, any>>({});

  // ── Step 2 Invoice State
  const [invoiceData, setInvoiceData] = useState<{
    token: string;
    idSiswa: string;
    namaLengkap: string;
    noWa: string;
    namaSekolah?: string;
    kelas?: string;
  } | null>(null);

  // ── Load Initial Data (Tenant Info + Sekolah + Payment Config) ─────────────

  const loadInitialData = useCallback(async () => {
    if (!tenantSlug) return;

    try {
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
        const pData = paymentRes.value.data.data;
        setPaymentConfig(pData);
        if (Array.isArray(pData?.programs) && pData.programs.length > 0) {
          setAvailablePrograms(pData.programs);
        }
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
          namaSekolah: d.namaSekolah || '',
          kelas: d.kelas || '',
        });

        if (d.paymentConfig) {
          setPaymentConfig(d.paymentConfig);
        }
        if (d.expiresAt) {
          setTokenExpiresAt(d.expiresAt);
        }
        if (Array.isArray(d.programs) && d.programs.length > 0) {
          setAvailablePrograms(d.programs);
        } else if (Array.isArray(d.paymentConfig?.programs) && d.paymentConfig.programs.length > 0) {
          setAvailablePrograms(d.paymentConfig.programs);
        }

        if (d.brandName && !tenantInfo) {
          setTenantInfo({ tenantId: tenantSlug, brandName: d.brandName, whatsappNumber: '' });
        }

        // Pre-fill state form dari database
        const loadedNama = d.namaLengkap || '';
        const loadedWa = d.noWa || '';
        const loadedSekolahId = d.idSekolah || '';
        const loadedSekolahNama = d.namaSekolah || '';
        const loadedKelas = d.kelas || '';
        const loadedNik = d.nik || '';
        const loadedGender = d.gender || '';
        const loadedTglLahir = d.tanggalLahir || '';
        const loadedAlamat = d.alamatLengkap || '';
        const loadedProgram = d.namaProgram || '';
        const loadedNamaOrtu = d.namaOrtu || '';
        const loadedWaOrtu = d.waOrtu || '';
        const loadedTglLahirOrtu = d.tglLahirOrtu || '';
        const loadedPekerjaanOrtu = d.pekerjaanOrtu || '';
        const loadedMinat = d.minatAwal || 'Ya';
        const loadedRencana = d.rencanaLulus || 'Kerja';

        setNamaLengkap(loadedNama);
        setNoWa(loadedWa);
        setSelectedSekolah(loadedSekolahId);
        setNamaSekolahPreview(loadedSekolahNama);
        setKelas(loadedKelas);
        setNik(loadedNik);
        setGender(loadedGender);
        setTanggalLahir(loadedTglLahir);
        setAlamatLengkap(loadedAlamat);
        setNamaProgram(loadedProgram);
        setNamaOrtu(loadedNamaOrtu);
        setWaOrtu(loadedWaOrtu);
        setTglLahirOrtu(loadedTglLahirOrtu);
        setPekerjaanOrtu(loadedPekerjaanOrtu);
        setMinatAwal(loadedMinat);
        setRencanaLulus(loadedRencana);
        setConsentWa(true);

        // Pastikan sekolah terdaftar di opsi dropdown agar tidak hilang
        if (loadedSekolahId && loadedSekolahNama) {
          setSchools(prev => {
            if (prev.some(s => s.id_sekolah === loadedSekolahId)) return prev;
            return [{ id_sekolah: loadedSekolahId, nama_sekolah: loadedSekolahNama, jenjang: 'SMA/SMK' }, ...prev];
          });
        }

        // Simpan backup untuk fitur 'Batal' edit
        backupDataRef.current = {
          namaLengkap: loadedNama,
          noWa: loadedWa,
          selectedSekolah: loadedSekolahId,
          namaSekolahPreview: loadedSekolahNama,
          kelas: loadedKelas,
          nik: loadedNik,
          gender: loadedGender,
          tanggalLahir: loadedTglLahir,
          alamatLengkap: loadedAlamat,
          namaProgram: loadedProgram,
          namaOrtu: loadedNamaOrtu,
          waOrtu: loadedWaOrtu,
          tglLahirOrtu: loadedTglLahirOrtu,
          pekerjaanOrtu: loadedPekerjaanOrtu,
          minatAwal: loadedMinat,
          rencanaLulus: loadedRencana,
        };

        // Default state: View Only!
        setIsEditMode(false);
        setStep('step2_invoice');
      }
    } catch (err: any) {
      const status = err.response?.data?.status;
      if (status === 'paid') {
        setStep('already_paid');
      } else if (status === 'expired') {
        setErrorMessage('Link pendaftaran ini sudah kedaluwarsa (7 hari). Silakan mendaftar ulang.');
        setStep('step1_form');
      } else {
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

  // ── Handler: Simpan Perubahan Mode Edit (PUT /reg-token/:token) ─────────────

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlToken) return;

    if (!namaLengkap.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    const cleanWa = noWa.replace(/\D/g, '');
    if (!cleanWa || cleanWa.length < 10) {
      setErrorMessage('Nomor WhatsApp tidak valid (minimal 10 digit).');
      return;
    }

    try {
      setIsSavingEdit(true);
      setErrorMessage(null);

      const resolvedSekolahNama = isManualSekolah
        ? asalSekolahManual.trim()
        : (schools.find(s => s.id_sekolah === selectedSekolah)?.nama_sekolah || namaSekolahPreview);

      const payload = {
        nama_lengkap: namaLengkap.trim(),
        no_wa: noWa.trim(),
        id_sekolah: isManualSekolah ? undefined : (selectedSekolah || undefined),
        asal_sekolah: isManualSekolah ? asalSekolahManual.trim() : undefined,
        nik: nik.trim() || undefined,
        gender: gender || undefined,
        tanggal_lahir: tanggalLahir || undefined,
        alamat_lengkap: alamatLengkap.trim() || undefined,
        nama_program: namaProgram || undefined,
        nama_ortu: namaOrtu.trim() || undefined,
        wa_ortu: waOrtu.trim() || undefined,
        tgl_lahir_ortu: tglLahirOrtu || undefined,
        pekerjaan_ortu: pekerjaanOrtu || undefined,
      };

      const res = await apiClient.put(`/api/public/${tenantSlug}/reg-token/${urlToken}`, payload);

      if (res.data?.status === 'ok') {
        setNamaSekolahPreview(resolvedSekolahNama);
        setInvoiceData(prev => prev ? {
          ...prev,
          namaLengkap: namaLengkap.trim(),
          noWa: noWa.trim(),
          namaSekolah: resolvedSekolahNama,
          kelas: kelas.trim(),
        } : null);

        // Update backup snapshot
        backupDataRef.current = {
          namaLengkap,
          noWa,
          selectedSekolah,
          namaSekolahPreview: resolvedSekolahNama,
          kelas,
          nik,
          gender,
          tanggalLahir,
          alamatLengkap,
          namaProgram,
          namaOrtu,
          waOrtu,
          tglLahirOrtu,
          pekerjaanOrtu,
          minatAwal,
          rencanaLulus,
        };

        setIsEditMode(false);
        setSaveSuccessMsg('Biodata pendaftaran berhasil diperbarui.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Handler: Batal Edit (Kembali ke Snapshot) ──────────────────────────────

  const handleCancelEdit = () => {
    const b = backupDataRef.current;
    if (b) {
      setNamaLengkap(b.namaLengkap || '');
      setNoWa(b.noWa || '');
      setSelectedSekolah(b.selectedSekolah || '');
      setNamaSekolahPreview(b.namaSekolahPreview || '');
      setKelas(b.kelas || '');
      setNik(b.nik || '');
      setGender(b.gender || '');
      setTanggalLahir(b.tanggalLahir || '');
      setAlamatLengkap(b.alamatLengkap || '');
      setNamaProgram(b.namaProgram || '');
      setNamaOrtu(b.namaOrtu || '');
      setWaOrtu(b.waOrtu || '');
      setTglLahirOrtu(b.tglLahirOrtu || '');
      setPekerjaanOrtu(b.pekerjaanOrtu || '');
      setMinatAwal(b.minatAwal || 'Ya');
      setRencanaLulus(b.rencanaLulus || 'Kerja');
    }
    setIsManualSekolah(false);
    setErrorMessage(null);
    setIsEditMode(false);
  };

  // ── Step 1: Submit Pendaftaran Baru (Tanpa Token) ─────────────────────────

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
        nik: nik.trim() || undefined,
        gender: gender || undefined,
        tanggal_lahir: tanggalLahir || undefined,
        alamat_lengkap: alamatLengkap.trim() || undefined,
        nama_program: namaProgram || undefined,
        nama_ortu: namaOrtu.trim() || undefined,
        wa_ortu: waOrtu.trim() || undefined,
        tgl_lahir_ortu: tglLahirOrtu || undefined,
        pekerjaan_ortu: pekerjaanOrtu || undefined,
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

      if (token) {
        window.history.replaceState(null, '', `?token=${token}`);
      }

      setTokenExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      const resolvedSekolahNama = isManualSekolah
        ? asalSekolahManual.trim()
        : (schools.find(s => s.id_sekolah === selectedSekolah)?.nama_sekolah || '');

      setNamaSekolahPreview(resolvedSekolahNama);

      setInvoiceData({
        token: token || '',
        idSiswa: siswaData.id,
        namaLengkap: siswaData.nama,
        noWa: siswaData.wa,
        namaSekolah: resolvedSekolahNama,
        kelas: kelas.trim(),
      });

      // Simpan backup snapshot
      backupDataRef.current = {
        namaLengkap: siswaData.nama,
        noWa: siswaData.wa,
        selectedSekolah,
        namaSekolahPreview: resolvedSekolahNama,
        kelas,
        nik,
        gender,
        tanggalLahir,
        alamatLengkap,
        namaProgram,
        namaOrtu,
        waOrtu,
        tglLahirOrtu,
        pekerjaanOrtu,
        minatAwal,
        rencanaLulus,
      };

      setIsEditMode(false);
      setStep('step2_invoice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan jaringan saat mendaftar.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Konfirmasi Sudah Transfer via WhatsApp ────────────────────────

  const handleConfirmTransfer = () => {
    const waCounselor = tenantInfo?.whatsappNumber || '';
    const waClean = waCounselor.replace(/\D/g, '');
    const namaText = invoiceData?.namaLengkap || namaLengkap || '-';
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

  const brandName = tenantInfo?.brandName || 'NexaMOS';

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
        <div className="w-full max-w-lg mx-auto bg-card border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Sudah Terdaftar!</h2>
            <p className="text-sm text-muted-foreground">
              Pendaftaran ini sudah dikonfirmasi sebelumnya. Tim konselor kami akan segera menghubungi Anda.
            </p>
          </div>
          <div className="p-4 bg-primary/5 rounded-xl text-xs text-muted-foreground text-left border border-primary/20">
            <p>Jika ada pertanyaan atau butuh bantuan lebih lanjut, hubungi konselor resmi kami langsung.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <PageShell brandName={brandName}>
        <div className="w-full max-w-lg mx-auto bg-card border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Konfirmasi Terkirim! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              Terima kasih, <strong className="text-foreground">{invoiceData?.namaLengkap || namaLengkap}</strong>. Tim admin kami akan memverifikasi pembayaran Biaya Formulir dan menghubungi Anda dalam 1×24 jam.
            </p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-xs text-muted-foreground text-left space-y-2 border">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span>Apa yang Terjadi Selanjutnya?</span>
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Admin memverifikasi pembayaran Biaya Formulir Anda</li>
              <li>Status Anda diperbarui menjadi <strong>Registered Opportunity</strong></li>
              <li>Konselor menghubungi Anda untuk menjadwalkan konsultasi keputusan</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-left">
            <Info size={14} className="shrink-0 text-amber-600 mt-0.5" />
            <span>Simpan link ini sebagai bukti pendaftaran Anda: <span className="font-mono text-primary break-all">{typeof window !== 'undefined' ? window.location.href : ''}</span></span>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Step 2: Invoice & Biodata (Resume Flow / View Only Mode) ──────────────

  if (step === 'step2_invoice') {
    const regFee = paymentConfig?.registrationFee ?? 500000;
    const accountNumber = paymentConfig?.bankAccountNumber || '-';
    const accountHolder = paymentConfig?.bankAccountHolder || '-';
    const bankName = paymentConfig?.bankName || 'Bank';
    const bankNotes = paymentConfig?.bankNotes || 'Sertakan nama lengkap calon siswa pada berita acara transfer.';
    const waCounselor = tenantInfo?.whatsappNumber?.replace(/\D/g, '') || '';
    const resolvedSekolah = namaSekolahPreview || (schools.find(s => s.id_sekolah === selectedSekolah)?.nama_sekolah) || '-';

    return (
      <PageShell brandName={brandName}>
        <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* ═══════════════════════════════════════════════════════════════════
              BANNER HIGHLIGHT BATAS WAKTU AKTIF 7 HARI (URGENCY & SCARCITY PUSH)
             ═══════════════════════════════════════════════════════════════════ */}
          {(() => {
            const timeInfo = getRemainingTimeText(tokenExpiresAt);
            return (
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-linear-to-br from-amber-500/20 via-orange-500/10 to-amber-500/20 p-4 sm:p-5 shadow-lg shadow-amber-500/10 animate-in fade-in zoom-in-95 duration-300">
                {/* Glow decoratif */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 animate-pulse">
                      <Clock size={24} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                          <Flame size={14} className="text-rose-500 fill-rose-500" />
                          Batas Waktu Pembayaran & Penguncian Kuota
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs animate-bounce">
                          ⏳ {timeInfo.daysLeftText}
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-black text-foreground">
                        Aktif s.d. <span className="text-amber-600 underline decoration-amber-500/60 decoration-2 underline-offset-4">{timeInfo.fullDateWithTime}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">
                        Selesaikan pembayaran Biaya Formulir sebelum batas waktu di atas untuk mengamankan nomor antrean jadwal konsultasi keputusan resmi dan penguncian kuota program pelatihan Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Success Banner saat edit berhasil */}
          {saveSuccessMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500/70 hover:text-rose-500">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              KARTU BIODATA: VIEW ONLY MODE vs EDIT MODE
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-card border rounded-2xl shadow-md overflow-hidden">
            
            {/* Header Biodata */}
            <div className="p-4 sm:p-5 border-b bg-secondary/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                    {isEditMode ? 'Ubah Data Pendaftaran' : 'Biodata Pendaftaran Resmi'}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/20">
                      Terverifikasi
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isEditMode
                      ? 'Perbarui informasi siswa dan data orang tua di bawah'
                      : 'Data calon siswa & orang tua yang tercatat pada sistem'}
                  </p>
                </div>
              </div>

              {/* Tombol Toggle Edit / Batal */}
              {urlToken && (
                <div>
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSavingEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border rounded-lg transition-colors"
                    >
                      <X size={13} />
                      <span>Batal</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(true);
                        setErrorMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors shadow-xs"
                      title="Edit Data Pendaftaran"
                    >
                      <Pencil size={13} />
                      <span>Edit Data</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content: View Only atau Form Edit */}
            {!isEditMode ? (
              // ── VIEW ONLY MODE ─────────────────────────────────────────────
              <div className="p-4 sm:p-6 space-y-6">
                
                {/* 1. Data Calon Siswa */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-3">
                    <GraduationCap size={14} />
                    <span>Data Calon Siswa</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-secondary/20 p-4 rounded-xl border text-xs">
                    <div>
                      <p className="text-muted-foreground">Nama Lengkap Siswa</p>
                      <p className="font-bold text-sm text-foreground mt-0.5">{namaLengkap || '-'}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Nomor WhatsApp Siswa</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-500" />
                        {noWa || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Asal Sekolah</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                        <School size={12} className="text-primary" />
                        {resolvedSekolah}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Kelas / Tingkat</p>
                      <p className="font-semibold text-foreground mt-0.5">{kelas || '-'}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">NIK Siswa (16 Digit)</p>
                      <p className="font-mono font-medium text-foreground mt-0.5">
                        {nik ? (
                          nik
                        ) : (
                          <span className="text-muted-foreground/70 italic">Belum diisi</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Jenis Kelamin</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {gender ? (
                          gender
                        ) : (
                          <span className="text-muted-foreground/70 italic">Belum dipilih</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Tanggal Lahir Siswa</p>
                      <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                        <Calendar size={12} className="text-muted-foreground" />
                        {tanggalLahir ? formatDateIndo(tanggalLahir) : <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Pilihan Program Pelatihan</p>
                      <div className="mt-0.5">
                        {namaProgram ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            <Sparkles size={11} /> {namaProgram}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 italic">Belum dipilih</span>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">Alamat Lengkap</p>
                      <p className="font-medium text-foreground mt-0.5 flex items-start gap-1.5">
                        <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                        <span className="wrap-break-word">
                          {alamatLengkap || <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Data Orang Tua / Wali */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-3">
                    <Users size={14} />
                    <span>Data Orang Tua / Wali</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-secondary/20 p-4 rounded-xl border text-xs">
                    <div>
                      <p className="text-muted-foreground">Nama Lengkap Orang Tua / Wali</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {namaOrtu || <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Nomor Telepon / WhatsApp Ortu</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-500" />
                        {waOrtu || <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Tanggal Lahir Orang Tua</p>
                      <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                        <Calendar size={12} className="text-muted-foreground" />
                        {tglLahirOrtu ? formatDateIndo(tglLahirOrtu) : <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Pekerjaan Orang Tua</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                        <Briefcase size={12} className="text-amber-600" />
                        {pekerjaanOrtu || <span className="text-muted-foreground/70 italic">Belum dipilih</span>}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // ── EDIT MODE ──────────────────────────────────────────────────
              <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-6">
                
                {/* 1. Formulir Siswa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <GraduationCap size={14} />
                    <span>Perbarui Data Siswa</span>
                  </div>

                  {/* Nama Lengkap & WA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Nama Lengkap Siswa <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaLengkap}
                        onChange={e => setNamaLengkap(e.target.value)}
                        placeholder="Contoh: Muhammad Rizky"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Nomor WhatsApp Siswa <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={noWa}
                        onChange={e => setNoWa(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* Asal Sekolah */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Asal Sekolah</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualSekolah(!isManualSekolah);
                          if (!isManualSekolah) {
                            setAsalSekolahManual(namaSekolahPreview || '');
                          }
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {isManualSekolah ? 'Pilih dari daftar sekolah' : 'Sekolah tidak terdaftar?'}
                      </button>
                    </div>

                    {!isManualSekolah ? (
                      <select
                        value={selectedSekolah}
                        onChange={e => {
                          setSelectedSekolah(e.target.value);
                          const sObj = schools.find(s => s.id_sekolah === e.target.value);
                          if (sObj) setNamaSekolahPreview(sObj.nama_sekolah);
                        }}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      >
                        <option value="">-- Pilih Asal Sekolah --</option>
                        {schools.map(s => (
                          <option key={s.id_sekolah} value={s.id_sekolah}>
                            {s.nama_sekolah} {s.jenjang ? `(${s.jenjang})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={asalSekolahManual}
                        onChange={e => setAsalSekolahManual(e.target.value)}
                        placeholder="Ketik nama sekolah lengkap Anda..."
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    )}
                  </div>

                  {/* NIK, Gender, Tgl Lahir */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">NIK Siswa (16 Digit)</label>
                      <input
                        type="text"
                        maxLength={16}
                        inputMode="numeric"
                        value={nik}
                        onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                        placeholder="16 digit sesuai KTP/KK"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Jenis Kelamin</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      >
                        <option value="">-- Pilih Gender --</option>
                        {GENDER_OPTIONS.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Tanggal Lahir Siswa</label>
                      <input
                        type="date"
                        value={tanggalLahir}
                        onChange={e => setTanggalLahir(e.target.value)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* Pilihan Program Pelatihan */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Pilih Program Pelatihan</label>
                    {availablePrograms.length > 0 ? (
                      <select
                        value={namaProgram}
                        onChange={e => setNamaProgram(e.target.value)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      >
                        <option value="">-- Pilih Program Pelatihan --</option>
                        {availablePrograms.map((prog, idx) => (
                          <option key={idx} value={prog}>{prog}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={namaProgram}
                        onChange={e => setNamaProgram(e.target.value)}
                        placeholder="Contoh: Kaigo / Caregiver, Pertanian, Magang Jepang..."
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    )}
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      value={alamatLengkap}
                      onChange={e => setAlamatLengkap(e.target.value)}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten..."
                      className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none resize-y"
                    />
                  </div>
                </div>

                {/* 2. Formulir Orang Tua */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Users size={14} />
                    <span>Perbarui Data Orang Tua / Wali</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Nama Lengkap Orang Tua / Wali</label>
                      <input
                        type="text"
                        value={namaOrtu}
                        onChange={e => setNamaOrtu(e.target.value)}
                        placeholder="Contoh: Bapak / Ibu Supriyadi"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Nomor WhatsApp / Telepon Ortu</label>
                      <input
                        type="tel"
                        value={waOrtu}
                        onChange={e => setWaOrtu(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Tanggal Lahir Orang Tua</label>
                      <input
                        type="date"
                        value={tglLahirOrtu}
                        onChange={e => setTglLahirOrtu(e.target.value)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Pekerjaan Orang Tua</label>
                      <select
                        value={pekerjaanOrtu}
                        onChange={e => setPekerjaanOrtu(e.target.value)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs sm:text-sm focus:border-primary outline-none"
                      >
                        <option value="">-- Pilih Pekerjaan Orang Tua --</option>
                        {PEKERJAAN_OPTIONS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tombol Simpan & Batal */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold gradient-primary text-white shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    {isSavingEdit ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              KARTU INVOICE PEMBAYARAN BIAYA FORMULIR
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
            {/* Header Invoice */}
            <div className="gradient-primary p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Invoice Biaya Formulir Pendaftaran</p>
                  <p className="text-2xl font-extrabold mt-1">{formatRupiah(regFee)}</p>
                </div>
                <CreditCard size={32} className="text-white/30" />
              </div>
              <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/90">
                Langkah resmi untuk mengamankan posisi konsultasi dan bimbingan karir Anda di <strong>{brandName}</strong>.
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">

              {/* Alert Push Urgensi di Invoice */}
              {(() => {
                const timeInfo = getRemainingTimeText(tokenExpiresAt);
                return (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 font-semibold">
                    <AlertTriangle size={16} className="shrink-0 text-amber-500 animate-pulse" />
                    <span>
                      Batas waktu verifikasi pendaftaran & invoice ini: <strong className="text-foreground font-bold">{timeInfo.dateFormatted}</strong> ({timeInfo.daysLeftText}). Kuota pendaftaran akan otomatis dilepas ke pendaftar lain jika melewati batas waktu.
                    </span>
                  </div>
                );
              })()}

              {/* Instruksi Transfer */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Landmark size={15} className="text-primary shrink-0" />
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Rekening Resmi Tujuan Transfer</p>
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
                      <p className="text-xs text-muted-foreground">Atas Nama (Pemilik)</p>
                      <p className="font-bold text-sm text-foreground">{accountHolder}</p>
                    </div>
                    <CopyButton text={accountHolder} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <div>
                      <p className="text-xs text-muted-foreground">Nominal yang Harus Ditransfer</p>
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
                    <p className="font-semibold">Berita Acara Transfer:</p>
                    <p>{bankNotes}</p>
                    <p>Contoh: <strong>Formulir – {namaLengkap}</strong></p>
                  </div>
                </div>
              </div>

              {/* Timeline Alur */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Alur Setelah Pembayaran</p>
                <div className="space-y-2">
                  {[
                    { icon: CreditCard, text: 'Transfer Biaya Formulir ke rekening resmi di atas' },
                    { icon: MessageSquare, text: 'Klik tombol "Konfirmasi Sudah Transfer via WhatsApp"' },
                    { icon: ShieldCheck, text: 'Admin memverifikasi pembayaran & mengaktifkan status Registered' },
                    { icon: CheckCircle2, text: 'Konselor menghubungi Anda untuk jadwal konsultasi resmi' },
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
                    Ada pertanyaan seputar pendaftaran? Chat konselor
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Resume Notice & Jaminan Penguncian Data */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border text-xs text-muted-foreground">
            <Clock size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Penguncian Kuota Pendaftaran 7 Hari:</span>
              <p>Link ini menyimpan biodata Anda secara aman hingga <strong>{getRemainingTimeText(tokenExpiresAt).fullDateWithTime}</strong>. Anda dapat membuka kembali link ini melalui WhatsApp kapan pun sebelum batas waktu berakhir untuk menyelesaikan konfirmasi transfer.</p>
            </div>
          </div>

          {/* Summary Biaya Program Keseluruhan */}
          {paymentConfig && (() => {
            const hasPromo = isDiscountActive(paymentConfig);
            const discount = hasPromo ? (paymentConfig.discountAmount || 0) : 0;
            const finalTotal = Math.max(0, paymentConfig.totalProgramFee - discount);
            const promoName = paymentConfig.discountLabel || 'Promo Khusus';

            return (
              <div className="bg-card border rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Ringkasan Biaya Program Keseluruhan</p>
                  {hasPromo && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <Tag size={11} /> {promoName}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya Formulir (Tahap 1 - Sekarang)</span>
                    <span className="font-semibold text-foreground">{formatRupiah(paymentConfig.registrationFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment Pelatihan (Tahap 2)</span>
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
                        <span className="font-bold text-foreground">Total Biaya Setelah Diskon</span>
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
                <p className="text-xs text-muted-foreground/70">* Biaya Formulir diperhitungkan sebagai pengurang biaya program penuh.</p>
              </div>
            );
          })()}

        </div>
      </PageShell>
    );
  }

  // ── Step 1: Biodata Form (Jalur 1 Tanpa Token) ─────────────────────────────

  const isSubmitDisabled = isSubmitting || !consentWa || !namaLengkap.trim() || noWa.replace(/\D/g, '').length < 10;

  return (
    <PageShell brandName={brandName}>
      <div className="w-full max-w-xl mx-auto space-y-4">

        {/* Step Indicator */}
        <StepIndicator currentStep={1} />

        {/* Card Form */}
        <div className="bg-card border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <form onSubmit={handleStep1Submit} className="p-6 sm:p-8 space-y-6">

            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
                <button onClick={() => setErrorMessage(null)} className="text-rose-500/70 hover:text-rose-500">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* 1. SEKSI DATA SISWA */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <GraduationCap size={15} />
                <span>Data Calon Siswa</span>
              </div>

              {/* Nama Lengkap & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={noWa}
                    onChange={e => setNoWa(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
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
                    {isManualSekolah ? 'Pilih dari daftar sekolah' : 'Sekolah tidak ada di daftar?'}
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
                        {s.nama_sekolah} {s.jenjang ? `(${s.jenjang})` : ''}
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

              {/* NIK, Gender, Tgl Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">NIK Siswa (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    inputMode="numeric"
                    value={nik}
                    onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="16 digit KTP/KK"
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  >
                    <option value="">-- Pilih Gender --</option>
                    {GENDER_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tanggal Lahir Siswa</label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={e => setTanggalLahir(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Program Pilihan & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Pilih Program Pelatihan</label>
                  {availablePrograms.length > 0 ? (
                    <select
                      value={namaProgram}
                      onChange={e => setNamaProgram(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                    >
                      <option value="">-- Pilih Program --</option>
                      {availablePrograms.map((prog, idx) => (
                        <option key={idx} value={prog}>{prog}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={namaProgram}
                      onChange={e => setNamaProgram(e.target.value)}
                      placeholder="Contoh: Kaigo / Caregiver, Pertanian..."
                      className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                    />
                  )}
                </div>

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
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Alamat Lengkap Tempat Tinggal</label>
                <textarea
                  rows={2}
                  value={alamatLengkap}
                  onChange={e => setAlamatLengkap(e.target.value)}
                  placeholder="Alamat lengkap, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten..."
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors resize-y"
                />
              </div>
            </div>

            {/* 2. SEKSI DATA ORANG TUA / WALI */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Users size={15} />
                <span>Data Orang Tua / Wali</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nama Lengkap Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={namaOrtu}
                    onChange={e => setNamaOrtu(e.target.value)}
                    placeholder="Contoh: Bapak / Ibu Slamet Riyadi"
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nomor Telepon / WhatsApp Ortu</label>
                  <input
                    type="tel"
                    value={waOrtu}
                    onChange={e => setWaOrtu(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tanggal Lahir Orang Tua</label>
                  <input
                    type="date"
                    value={tglLahirOrtu}
                    onChange={e => setTglLahirOrtu(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Pekerjaan Orang Tua</label>
                  <select
                    value={pekerjaanOrtu}
                    onChange={e => setPekerjaanOrtu(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                  >
                    <option value="">-- Pilih Pekerjaan Orang Tua --</option>
                    {PEKERJAAN_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Consent WhatsApp */}
            <div className="pt-2 border-t">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border bg-secondary/30 cursor-pointer select-none transition-all hover:bg-secondary/50">
                <input
                  type="checkbox"
                  checked={consentWa}
                  onChange={e => setConsentWa(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary shrink-0"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-semibold text-foreground">
                    Persetujuan Kontak WhatsApp Resmi (Wajib) <span className="text-rose-500">*</span>
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Saya bersedia dihubungi via WhatsApp oleh tim konselor resmi {brandName} untuk konsultasi karir, verifikasi biodata, dan panduan program pelatihan.
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
                    <span>Menyimpan Biodata...</span>
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
              <span>Data dilindungi secara rahasia oleh NexaMOS & Consent Engine.</span>
            </div>
          </form>
        </div>

        {/* Info Preview Biaya Program */}
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
                <span>Biaya Formulir Pendaftaran (Tahap 1)</span>
                <span className="font-semibold text-foreground">{formatRupiah(paymentConfig.registrationFee)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span className="text-muted-foreground/70">DP Pelatihan (Tahap 2)</span>
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
      <div className="max-w-xl mx-auto w-full mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
          <GraduationCap size={14} />
          <span>Formulir Pendaftaran Resmi</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{brandName}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Daftarkan diri Anda dan dapatkan panduan jalur karir bersama tim konselor resmi kami.
        </p>
      </div>

      {children}

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full mt-6 text-center text-xs text-muted-foreground/60">
        Powered by <span className="font-semibold text-muted-foreground">NexaMOS</span> — Platform Manajemen CRO Terdepan
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { label: 'Biodata Siswa & Ortu', num: 1 },
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
