'use client';

import { useState, useEffect } from 'react';
import { 
  X, Link2, Copy, Check, MessageSquare, ExternalLink, 
  Loader2, AlertCircle, ShieldCheck, Clock, School, User
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface ShareRegistrationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaId: string;
  siswaName: string;
  siswaWa?: string | null;
  namaSekolah?: string | null;
}

interface RegistrationTokenData {
  token: string;
  idSiswa: string;
  namaLengkap: string;
  noWa: string;
  expiresAt: string;
  tenantSlug: string;
  registrationPath: string;
}

export function ShareRegistrationLinkModal({
  isOpen,
  onClose,
  siswaId,
  siswaName,
  siswaWa,
  namaSekolah
}: ShareRegistrationLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokenData, setTokenData] = useState<RegistrationTokenData | null>(null);

  useEffect(() => {
    if (isOpen && siswaId) {
      generateOrGetToken();
    } else {
      setTokenData(null);
      setError('');
      setCopied(false);
    }
  }, [isOpen, siswaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateOrGetToken = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post(`/api/v1/siswa/${siswaId}/registration-token`);
      if (res.data?.status === 'ok' && res.data.data) {
        setTokenData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Gagal membuat link pendaftaran.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fullUrl = tokenData?.registrationPath && typeof window !== 'undefined'
    ? `${window.location.origin}${tokenData.registrationPath}`
    : '';

  const handleCopy = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Link pendaftaran berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin link.');
    }
  };

  const handleSendWa = () => {
    if (!fullUrl) return;
    const cleanWa = (siswaWa || tokenData?.noWa || '').replace(/\D/g, '');
    let targetNumber = cleanWa;
    if (targetNumber.startsWith('08')) {
      targetNumber = '62' + targetNumber.slice(1);
    } else if (targetNumber.startsWith('8')) {
      targetNumber = '62' + targetNumber;
    }

    const message = `Halo Kak *${siswaName}*,\n\nBerikut adalah link formulir & invoice pendaftaran resmi kamu:\n👉 ${fullUrl}\n\nData kamu sudah terdaftar di sistem. Silakan buka link di atas untuk menyelesaikan transfer Biaya Formulir Pendaftaran agar jadwal konsultasi kamu dapat segera dikonfirmasi oleh tim kami.\n\n_Catatan: Link pendaftaran ini bersifat personal dan berlaku selama 7 hari._ Terima kasih! 🙏`;

    const waUrl = targetNumber
      ? `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  const handleOpenPreview = () => {
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl border shadow-2xl flex flex-col max-h-[90dvh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Link2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Link Formulir & Invoice Pendaftaran</h2>
              <p className="text-xs text-muted-foreground">Link personal dengan pre-fill otomatis untuk siswa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Student Info Card */}
          <div className="p-3.5 rounded-xl border bg-secondary/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User size={12} /> Calon Siswa
              </span>
              <span className="text-xs font-mono font-bold text-primary">{siswaId}</span>
            </div>
            <p className="text-sm font-bold text-foreground">{siswaName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {namaSekolah && (
                <span className="flex items-center gap-1">
                  <School size={11} className="text-primary" /> {namaSekolah}
                </span>
              )}
              {siswaWa && (
                <span className="flex items-center gap-1">
                  📱 {siswaWa}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span>Menyiapkan link personal pendaftaran...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* URL Box & Copy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  URL Pendaftaran Siswa (Berlaku 7 Hari)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="w-full px-3 py-2 text-xs font-mono bg-background border rounded-xl text-foreground focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSendWa}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <MessageSquare size={14} />
                  <span>Kirim via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="w-full py-2.5 px-3 rounded-xl border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Lihat Tampilan Siswa</span>
                </button>
              </div>

              {/* Explanatory Callout */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                  <span>Pre-Fill Otomatis & Terenkripsi</span>
                </div>
                <p className="leading-relaxed">
                  Ketika siswa membuka link di atas, halaman akan langsung menampilkan <strong>Step 2 (Invoice & Nomor Rekening)</strong> dengan nama dan sekolah siswa sudah tertera. Siswa tidak perlu mengulang pengisian biodata dari awal.
                </p>
                {tokenData?.expiresAt && (
                  <p className="flex items-center gap-1 text-muted-foreground pt-0.5">
                    <Clock size={11} className="text-primary" />
                    <span>Kedaluwarsa: {new Date(tokenData.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </p>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t bg-secondary/20 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border bg-card hover:bg-secondary text-foreground transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
