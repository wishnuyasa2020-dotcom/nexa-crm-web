'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  School, 
  ShieldCheck, 
  MessageSquare, 
  Sparkles, 
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';

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

export default function PublicRegistrationPage() {
  const params = useParams();
  const tenantSlug = (params?.tenantSlug as string) || '';

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [schools, setSchools] = useState<SekolahItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [namaLengkap, setNamaLengkap] = useState('');
  const [noWa, setNoWa] = useState('');
  const [selectedSekolah, setSelectedSekolah] = useState('');
  const [asalSekolahManual, setAsalSekolahManual] = useState('');
  const [isManualSekolah, setIsManualSekolah] = useState(false);
  const [kelas, setKelas] = useState('');
  const [minatAwal, setMinatAwal] = useState('Ya');
  const [rencanaLulus, setRencanaLulus] = useState('Kerja');
  const [consentWa, setConsentWa] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredData, setRegisteredData] = useState<{ nama: string; wa: string } | null>(null);

  useEffect(() => {
    if (!tenantSlug) return;

    let isMounted = true;
    setLoadingInitial(true);

    // 1. Fetch info tenant
    apiClient.get(`/api/public/${tenantSlug}/info`)
      .then(res => {
        if (isMounted && res.data?.status === 'ok') {
          setTenantInfo(res.data.data);
        }
      })
      .catch(err => {
        console.warn('Gagal memuat info tenant:', err.message);
      });

    // 2. Fetch list sekolah
    apiClient.get(`/api/public/${tenantSlug}/sekolah`)
      .then(res => {
        if (isMounted && res.data?.status === 'ok') {
          setSchools(res.data.data || []);
        }
      })
      .catch(err => {
        console.warn('Gagal memuat sekolah:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Kepatuhan Consent Engine
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
      const payload = {
        nama_lengkap: namaLengkap.trim(),
        no_wa: noWa.trim(),
        id_sekolah: isManualSekolah ? undefined : (selectedSekolah || undefined),
        asal_sekolah: isManualSekolah ? asalSekolahManual.trim() : undefined,
        kelas: kelas.trim() || undefined,
        minat_awal: minatAwal,
        rencana_lulus: rencanaLulus,
        consent_wa: true,
      };

      const res = await apiClient.post(`/api/public/${tenantSlug}/register`, payload);

      if (res.data?.status === 'ok') {
        setRegisteredData({
          nama: namaLengkap.trim(),
          wa: cleanWa,
        });
        setIsSuccess(true);
      } else {
        setErrorMessage(res.data?.message || 'Gagal menyimpan pendaftaran.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan jaringan saat mendaftar.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-sm font-medium">Memuat form pendaftaran...</span>
        </div>
      </div>
    );
  }

  // ── Success State ─────────────────────────────────────────────────────────
  if (isSuccess && registeredData) {
    const waCounselor = tenantInfo?.whatsappNumber || '628123456789';
    const waText = encodeURIComponent(
      `Halo Konselor ${tenantInfo?.brandName || 'Nexa'}, saya ${registeredData.nama} sudah mendaftar melalui form online. Mohon informasi konsultasi lebih lanjut.`
    );
    const waLink = `https://wa.me/${waCounselor.replace(/\D/g, '')}?text=${waText}`;

    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-muted-foreground">
              Terima kasih, <strong className="text-foreground">{registeredData.nama}</strong>. Data Anda telah masuk ke dalam antrean konseling resmi {tenantInfo?.brandName || 'kami'}.
            </p>
          </div>

          <div className="p-4 bg-secondary/50 rounded-xl text-xs text-muted-foreground text-left space-y-2 border">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span>Persetujuan Privasi Terverifikasi</span>
            </div>
            <p>
              Izin kontak via WhatsApp telah dicatat secara legal (*Opt-In Consent*). Konselor kami akan menyapa nomor WhatsApp Anda segera.
            </p>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl gradient-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 flex items-center justify-center gap-2 transition-all"
          >
            <MessageSquare size={18} /> Hubungi Konselor via WhatsApp <ArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  // ── Form State ────────────────────────────────────────────────────────────
  const isSubmitDisabled = isSubmitting || !consentWa || !namaLengkap.trim() || noWa.replace(/\D/g, '').length < 10;

  return (
    <div className="min-h-screen bg-secondary/20 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-lg w-full mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <GraduationCap size={14} />
            <span>Form Pendaftaran Konsultasi</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {tenantInfo?.brandName ? `${tenantInfo.brandName}` : 'Pendaftaran Siswa Baru'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Isi formulir singkat ini untuk mendapatkan panduan jalur karir dan pelatihan kerja.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            
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
                placeholder="Contoh: Muhammad Rizky"
                className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={noWa}
                  onChange={e => setNoWa(e.target.value)}
                  placeholder="0812xxxxxxxx atau 628xxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-muted-foreground">Format nomor Indonesia (otomatis dinormalisasi ke format internasional).</p>
            </div>

            {/* Asal Sekolah */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Asal Sekolah
                </label>
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
                <div className="relative">
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
                </div>
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

            {/* Kelas / Jurusan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Kelas / Tingkat
                </label>
                <input
                  type="text"
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  placeholder="Contoh: 12 TKJ 1"
                  className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm focus:border-primary outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Rencana Setelah Lulus
                </label>
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

            {/* Minat Pelatihan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Minat Pelatihan / Karir ke Luar Negeri (Jepang)
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

            {/* ── Consent Engine: Checkbox Wajib Hukum & Etika ── */}
            <div className="pt-2">
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

            {/* Tombol Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={cn(
                  'w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2',
                  isSubmitDisabled
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50 shadow-none'
                    : 'gradient-primary shadow-primary/20 hover:opacity-90 active:scale-[0.99]'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memproses Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Kirim Pendaftaran ✉️</span>
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

      </div>
    </div>
  );
}
