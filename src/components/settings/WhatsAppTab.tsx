'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, CheckCircle2, Clock, AlertTriangle, 
  Smartphone, ShieldCheck, RefreshCw, XCircle, 
  Info, Sparkles, Building, ArrowRight, ShieldAlert, AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface WhatsAppConfigData {
  tenantId: string;
  brandName: string;
  whatsappPhoneId: string | null;
  whatsappWabaId: string | null;
  whatsappNumber: string | null;
  whatsappDisplayName: string | null;
  whatsappStatus: 'NOT_CONFIGURED' | 'PENDING_PROVISIONING' | 'CONNECTED' | 'REJECTED';
  whatsappBusinessCategory: string | null;
  whatsappRequestedAt: string | null;
  whatsappConnectedAt: string | null;
  whatsappNotes: string | null;
}

export default function WhatsAppTab() {
  const [data, setData] = useState<WhatsAppConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Lembaga Pelatihan Kerja (LPK)');
  const [checkFreshNumber, setCheckFreshNumber] = useState(false);
  const [checkDisplayNameCompliance, setCheckDisplayNameCompliance] = useState(false);
  const [notes, setNotes] = useState('');

  const loadWhatsappStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/settings/whatsapp');
      if (res.data?.status === 'ok') {
        setData(res.data.data);
        if (res.data.data.whatsappDisplayName) {
          setDisplayName(res.data.data.whatsappDisplayName);
        } else if (res.data.data.brandName) {
          setDisplayName(res.data.data.brandName);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load whatsapp config:', err);
      toast.error('Gagal memuat status integrasi WhatsApp.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWhatsappStatus();
  }, [loadWhatsappStatus]);

  async function handleSubmitRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!checkFreshNumber) {
      toast.error('Anda wajib menyetujui pernyataan penggunaan nomor baru.');
      return;
    }
    if (!checkDisplayNameCompliance) {
      toast.error('Anda wajib menyetujui pernyataan kesesuaian Display Name Meta.');
      return;
    }
    if (!whatsappNumber.trim()) {
      toast.error('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Nama tampilan brand wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        displayName: displayName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        businessCategory,
        isFreshNumberDeclaration: true,
        notes: notes.trim(),
      };

      const res = await apiClient.post('/api/v1/settings/whatsapp/register', payload);
      if (res.data?.status === 'ok') {
        toast.success(res.data.message || 'Pengajuan nomor WhatsApp berhasil dikirim!');
        setData(res.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal mengajukan nomor WhatsApp.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect() {
    const confirm = window.confirm(
      'Apakah Anda yakin ingin memutuskan integrasi WhatsApp ini? Fitur Live Chat dan Broadcast tidak akan dapat mengirim pesan hingga nomor baru terhubung.'
    );
    if (!confirm) return;

    try {
      setDisconnecting(true);
      const res = await apiClient.delete('/api/v1/settings/whatsapp/disconnect');
      if (res.data?.status === 'ok') {
        toast.success('Integrasi WhatsApp berhasil diputuskan.');
        setData(res.data.data);
        setCheckFreshNumber(false);
        setCheckDisplayNameCompliance(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal memutuskan integrasi.';
      toast.error(msg);
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Memuat status integrasi WhatsApp Bisnis...</p>
      </div>
    );
  }

  const status = data?.whatsappStatus || 'NOT_CONFIGURED';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Integrasi WhatsApp Bisnis</h2>
                {status === 'CONNECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Terhubung (Active)
                  </span>
                )}
                {status === 'PENDING_PROVISIONING' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Clock size={12} />
                    Menunggu Aktivasi
                  </span>
                )}
                {status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                    <XCircle size={12} />
                    Pengajuan Ditolak
                  </span>
                )}
                {status === 'NOT_CONFIGURED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Koneksi nomor resmi WhatsApp Business Platform (Cloud API) untuk Live Chat & Broadcast massal
              </p>
            </div>
          </div>

          <button
            onClick={loadWhatsappStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RefreshCw size={13} />
            Segarkan
          </button>
        </div>
      </div>

      {/* ── STATE 1: REJECTED ALERT ── */}
      {status === 'REJECTED' && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-destructive">Permohonan Registrasi Nomor Ditolak</p>
            <p className="text-muted-foreground leading-relaxed">
              Catatan Tim Superadmin: <span className="text-foreground font-medium">{data?.whatsappNotes || 'Data tidak sesuai atau nomor tidak valid.'}</span>
            </p>
            <p className="text-muted-foreground">Silakan periksa kembali dan ajukan ulang formulir di bawah ini.</p>
          </div>
        </div>
      )}

      {/* ── STATE 2: CONNECTED (SUDAH AKTIF) ── */}
      {status === 'CONNECTED' && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Nomor WhatsApp Resmi</span>
                <p className="text-base font-bold text-foreground font-mono">
                  {data?.whatsappNumber ? `+${data.whatsappNumber}` : 'Nomor Terdaftar'}
                </p>
                <p className="text-xs text-muted-foreground">Nomor aktif pengiriman pesan Cloud API</p>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Nama Tampilan (Display Name)</span>
                <p className="text-base font-bold text-foreground">
                  {data?.whatsappDisplayName || data?.brandName}
                </p>
                <p className="text-xs text-muted-foreground">Nama profil verified yang muncul di WA penerima</p>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">WhatsApp Phone ID (Meta)</span>
                <p className="text-xs font-mono text-emerald-600 font-semibold truncate">
                  {data?.whatsappPhoneId || '-'}
                </p>
                <p className="text-xs text-muted-foreground">Identitas unik saluran perpesanan Meta</p>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Tanggal Terhubung</span>
                <p className="text-xs font-medium text-foreground">
                  {data?.whatsappConnectedAt ? new Date(data.whatsappConnectedAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'Aktif'}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Quality Rating: HIGH (Sehat)</p>
              </div>
            </div>

            {/* Ready Modules Callout */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Modul WhatsApp Siap Digunakan</h4>
                  <p className="text-xs text-muted-foreground">
                    Live Chat Shared Inbox, Template Meta, dan Automated Nurturing sudah aktif sepenuhnya.
                  </p>
                </div>
              </div>
            </div>

            {/* BSUID Notice for Connected State */}
            <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-3">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Dukungan Meta BSUID Aktif:</strong> Sesuai kebijakan Meta terbaru, jika siswa baru yang menghubungi bisnis menyembunyikan nomor telepon mereka, sistem Nexa CRM akan otomatis mengidentifikasi siswa tersebut melalui <em>Business-Scoped User ID (BSUID)</em> secara transparan.
              </p>
            </div>

            {/* Danger Zone: Disconnect */}
            <div className="pt-4 border-t flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Putuskan Integrasi WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  Hanya lakukan ini jika Anda ingin mengganti nomor WhatsApp resmi tenant.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3.5 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Memutuskan...' : 'Putuskan Nomor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 3: PENDING PROVISIONING (DALAM PROSES) ── */}
      {status === 'PENDING_PROVISIONING' && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Permohonan Sedang Diproses Tim Superadmin</h3>
              <p className="text-xs text-muted-foreground">
                Nomor Anda sedang didaftarkan ke Meta Business Manager / WhatsApp Cloud API.
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={14} /> Langkah 1
              </span>
              <p className="text-xs font-medium text-foreground">Formulir Dikirim</p>
              <p className="text-xs text-muted-foreground">Data pengajuan tersimpan</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <RefreshCw size={14} className="animate-spin" /> Langkah 2
              </span>
              <p className="text-xs font-medium text-foreground">Registrasi Meta</p>
              <p className="text-xs text-muted-foreground">Proses pendaftaran WABA</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/40 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Langkah 3</span>
              <p className="text-xs font-medium text-muted-foreground">Verifikasi SMS OTP</p>
              <p className="text-xs text-muted-foreground">Kode 6 digit ke HP Anda</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/40 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Langkah 4</span>
              <p className="text-xs font-medium text-muted-foreground">Siap Digunakan</p>
              <p className="text-xs text-muted-foreground">Sinkronisasi Live Chat</p>
            </div>
          </div>

          {/* Submitted Summary */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Ringkasan Pengajuan:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Nomor WhatsApp:</span>
                <span className="font-semibold text-foreground font-mono">+{data?.whatsappNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Display Name Brand:</span>
                <span className="font-semibold text-foreground">{data?.whatsappDisplayName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Kategori Industri:</span>
                <span className="font-semibold text-foreground">{data?.whatsappBusinessCategory || '-'}</span>
              </div>
            </div>
          </div>

          {/* Crucial OTP Instruction Alert */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground">Penting: Siapkan Ponsel Penerima SMS OTP</p>
              <p className="text-muted-foreground leading-relaxed">
                Pastikan kartu SIM dari nomor di atas aktif di ponsel biasa dan dapat menerima SMS. Saat tim teknis Nexa mendaftarkan nomor Anda ke Meta, Meta akan mengirimkan <strong>6 Digit Kode OTP</strong> via SMS. Tim teknis/Superadmin kami akan menghubungi Anda untuk meminta kode tersebut.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {disconnecting ? 'Membatalkan...' : 'Batalkan Pengajuan'}
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 4: NOT_CONFIGURED OR REJECTED (FORMULIR REGISTRASI) ── */}
      {(status === 'NOT_CONFIGURED' || status === 'REJECTED') && (
        <form onSubmit={handleSubmitRegister} className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Formulir Pendaftaran Nomor WhatsApp Bisnis</h3>
          </div>

          {/* ── CALLOUT 1: REKOMENDASI MUTLAK NOMOR BARU (FRESH SIM) ── */}
          <div className="p-4.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
              <Smartphone size={16} />
              <span>SANGAT DIREKOMENDASIKAN: GUNAKAN NOMOR PERDANA / BARU (FRESH SIM)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              WhatsApp Business Cloud API mensyaratkan nomor telepon yang didaftarkan <strong>tidak boleh terhubung ke aplikasi WhatsApp Messenger biasa maupun WhatsApp Business di ponsel</strong>.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <strong className="text-foreground">Keuntungan Nomor Baru:</strong> Tingkat keberhasilan pendaftaran 100% instan, SMS OTP lancar, dan tidak ada risiko penolakan sesi atau penundaan hapus akun Meta.
              </li>
              <li>
                <strong className="text-foreground">Jika Menggunakan Nomor Lama:</strong> Anda <em>WAJIB</em> membuka aplikasi WhatsApp di ponsel terlebih dahulu, lalu pilih menu <em>Setelan ➔ Akun ➔ Hapus Akun Saya (Delete My Account)</em> secara permanen sebelum nomor diajukan ke sini.
              </li>
            </ul>
          </div>

          {/* ── CALLOUT 2: KESESUAIAN DISPLAY NAME DENGAN META POLICY ── */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <Building size={16} />
              <span>KETENTUAN DISPLAY NAME (NAMA BRAND RESMI META)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Meta menerapkan verifikasi nama yang sangat ketat. Nama yang Anda daftarkan harus mencerminkan identitas bisnis atau lembaga resmi Anda (contoh: <span className="font-semibold text-foreground">"LPK Derma Indonesia"</span>). Jangan menggunakan nama acak, promosi, atau nama barang (contoh yang <strong>DITOLAK META</strong>: <span className="text-destructive font-medium">"Jual Obat Murah"</span> atau <span className="text-destructive font-medium">"Diskon Kursus Jepang"</span>).
            </p>
          </div>

          {/* ── CALLOUT 3: KESIAPAN BSUID META 2026 ── */}
          <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Arsitektur Kesiapan Meta BSUID 2026:</strong> Sistem Nexa OS telah terintegrasi dengan standar privasi <em>Business-Scoped User ID (BSUID)</em>. Pesan masuk dari audiens/siswa yang menyembunyikan nomor ponselnya tetap akan terarsip rapi di ruang Live Chat Anda.
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nama Tampilan Brand (Display Name) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: LPK Derma Indonesia"
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">Nama resmi yang akan diajukan ke Meta</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nomor WhatsApp Baru <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-semibold text-muted-foreground select-none">
                  +62
                </span>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="81234567890"
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-muted-foreground">Masukkan angka setelah kode negara (tanpa awalan 0)</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Kategori Industri / Bisnis</label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Lembaga Pelatihan Kerja (LPK)">Lembaga Pelatihan Kerja (LPK)</option>
                <option value="Sekolah / Perguruan Tinggi">Sekolah / Perguruan Tinggi / Bimbel</option>
                <option value="Klinik & Kesehatan Estetika">Klinik & Kesehatan Estetika</option>
                <option value="Konsultan & Jasa Profesional">Konsultan & Jasa Profesional</option>
                <option value="Perdagangan & Retail">Perdagangan & Retail</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Declarations (Mandatory Checkboxes) */}
          <div className="space-y-3 pt-2 border-t">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={checkFreshNumber}
                onChange={(e) => setCheckFreshNumber(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground leading-relaxed">
                <strong className="text-emerald-600 font-semibold">[WAJIB]</strong> Saya mengonfirmasi bahwa nomor di atas adalah <strong>nomor baru (Fresh SIM)</strong> atau nomor yang telah saya hapus akun WhatsApp-nya secara permanen dari ponsel, dan siap menerima SMS verifikasi OTP Meta.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={checkDisplayNameCompliance}
                onChange={(e) => setCheckDisplayNameCompliance(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground leading-relaxed">
                <strong className="text-amber-600 font-semibold">[WAJIB]</strong> Saya memahami bahwa nama tampilan (Display Name) harus sesuai dengan brand resmi usaha saya dan tidak mengandung kata-kata promosi acak agar tidak ditolak oleh Meta.
              </span>
            </label>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={submitting || !checkFreshNumber || !checkDisplayNameCompliance}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengirim Pengajuan...
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Ajukan Pendaftaran Nomor
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
