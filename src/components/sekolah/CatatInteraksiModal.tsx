'use client';

/**
 * CatatInteraksiModal.tsx
 * Modal Event-Sourcing untuk mencatat interaksi visit sekolah.
 * Menggantikan pola "Hasil Aktivitas" lama dengan "Outcome-based" sesuai ontologi Nexa OS.
 *
 * Endpoint: POST /api/v1/sekolah/:id/interactions
 * Menghasilkan Event: InteractionLogged, SosialisasiApproved, SosialisasiRejected, dll
 */

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  OUTCOME_OPTIONS, OUTCOME_META, CHANNEL_OPTIONS, ALASAN_TIDAK_BISA,
  type OutcomeKey,
} from '@/lib/constants/sekolah';
import type { SekolahDetail } from '@/lib/types/sekolah.types';
import { logInteraction } from '@/lib/api/sekolah.api';

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  sekolah:   SekolahDetail;
  onSuccess: () => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CatatInteraksiModal({ isOpen, onClose, sekolah, onSuccess }: Props) {
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Form fields
  const [channel,            setChannel]            = useState('Visit Langsung');
  const [outcome,            setOutcome]            = useState<OutcomeKey | ''>('');
  const [catatanFakta,       setCatatanFakta]       = useState('');
  const [tanggalInteraksi,   setTanggalInteraksi]   = useState(today());
  const [tanggalSosialisasi, setTanggalSosialisasi] = useState('');
  const [alasanTidakBisa,    setAlasanTidakBisa]    = useState('');
  const [catatanAlasan,      setCatatanAlasan]      = useState('');

  // Visit Awal fields
  const [statusAktif,   setStatusAktif]   = useState<'Aktif' | 'Nonaktif' | 'Belum Diketahui'>('Belum Diketahui');
  const [alamat,        setAlamat]        = useState(sekolah.alamat ?? '');
  const [jumlahSiswa,   setJumlahSiswa]   = useState('');
  const [namaPic,       setNamaPic]       = useState('');
  const [jabatanPic,    setJabatanPic]    = useState('');
  const [noWaPic,       setNoWaPic]       = useState('');

  const meta        = outcome ? OUTCOME_META[outcome] : null;
  const isVisitAwal = sekolah.status === 'Belum Visit';

  // Reset saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setChannel('Visit Langsung');
      setOutcome('');
      setCatatanFakta('');
      setTanggalInteraksi(today());
      setTanggalSosialisasi('');
      setAlasanTidakBisa('');
      setCatatanAlasan('');
      setStatusAktif('Belum Diketahui');
      setAlamat(sekolah.alamat ?? '');
      setJumlahSiswa('');
      setNamaPic('');
      setJabatanPic('');
      setNoWaPic('');
      setError(null);
    }
  }, [isOpen, sekolah.alamat]);

  // Validation
  const catatanOk = catatanFakta.trim().length >= 5;
  const catatanDowngradeOk = !meta?.isDowngrade || catatanFakta.trim().length >= 10;
  const visitAwalOk = !isVisitAwal || (alamat && jumlahSiswa && namaPic && jabatanPic && noWaPic);
  const sosialisasiOk = !meta?.requiresTanggalSos || !!tanggalSosialisasi;
  const alasanOk = !meta?.requiresAlasan || (!!alasanTidakBisa && (alasanTidakBisa !== 'Alasan lainnya' || !!catatanAlasan));

  const formValid = Boolean(outcome && channel && catatanOk && catatanDowngradeOk && visitAwalOk && sosialisasiOk && alasanOk);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid || !outcome) return;
    setLoading(true);
    setError(null);
    try {
      await logInteraction(sekolah.id, {
        outcome,
        channel,
        catatanFakta: catatanFakta.trim(),
        tanggalInteraksi,
        tanggalSosialisasi: meta?.requiresTanggalSos ? tanggalSosialisasi : undefined,
        alasanTidakBisa:    meta?.requiresAlasan ? alasanTidakBisa : undefined,
        catatanAlasan:      meta?.requiresAlasan && alasanTidakBisa === 'Alasan lainnya' ? catatanAlasan : undefined,
        // Visit Awal
        statusAktif:        isVisitAwal ? statusAktif : undefined,
        alamatLengkap:      isVisitAwal ? alamat : undefined,
        jumlahSiswaKelas12: isVisitAwal ? parseInt(jumlahSiswa, 10) : undefined,
        namaPic:            isVisitAwal ? namaPic : undefined,
        jabatanPic:         isVisitAwal ? jabatanPic : undefined,
        noWaPic:            isVisitAwal ? noWaPic : undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Gagal menyimpan interaksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background sm:bg-card w-full sm:max-w-xl sm:rounded-2xl shadow-xl sm:border border-border flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-card rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              Catat Interaksi Visit
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{sekolah.nama}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4 pb-24 sm:pb-5">
          <form id="catatInteraksiForm" onSubmit={handleSubmit} className="space-y-4">

            {/* ── Tanggal & Channel ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tanggal Interaksi *</label>
                <input
                  type="date"
                  value={tanggalInteraksi}
                  max={today()}
                  onChange={e => setTanggalInteraksi(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Channel (Jenis Interaksi) *</label>
                <select
                  value={channel}
                  onChange={e => setChannel(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* ── Visit Awal: Data Sekolah ── */}
            {isVisitAwal && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  Data Sekolah — Wajib Diisi (Visit Pertama)
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status Aktif *</label>
                  <div className="flex gap-4">
                    {(['Aktif', 'Nonaktif', 'Belum Diketahui'] as const).map(s => (
                      <label key={s} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="radio" name="statusAktif" value={s} checked={statusAktif === s} onChange={() => setStatusAktif(s)} className="accent-primary" />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Alamat Lengkap *</label>
                  <input required={isVisitAwal} value={alamat} onChange={e => setAlamat(e.target.value)} placeholder="Jl. Sudirman No. 5..." className={INPUT_CLASS} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Jml Siswa Kls 12 *</label>
                    <input required={isVisitAwal} type="number" min={0} value={jumlahSiswa} onChange={e => setJumlahSiswa(e.target.value)} placeholder="Misal: 200" className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nama PIC *</label>
                    <input required={isVisitAwal} value={namaPic} onChange={e => setNamaPic(e.target.value)} placeholder="Ibu/Pak..." className={INPUT_CLASS} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Jabatan PIC *</label>
                    <input required={isVisitAwal} value={jabatanPic} onChange={e => setJabatanPic(e.target.value)} placeholder="Guru BK / Wakasek..." className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">No. WA PIC *</label>
                    <input required={isVisitAwal} value={noWaPic} onChange={e => setNoWaPic(e.target.value)} placeholder="+62 812..." className={INPUT_CLASS} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Outcome ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Outcome (Hasil Interaksi) *</label>
              <select
                required
                value={outcome}
                onChange={e => { setOutcome(e.target.value as OutcomeKey | ''); setTanggalSosialisasi(''); setAlasanTidakBisa(''); }}
                className={INPUT_CLASS}
              >
                <option value="">— Pilih outcome/fakta... —</option>
                {OUTCOME_OPTIONS.map(o => (
                  <option key={o} value={o}>{OUTCOME_META[o].label}</option>
                ))}
              </select>
            </div>

            {/* ── Preview target state ── */}
            {meta && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-xs">
                <span className="text-muted-foreground">Status akan menjadi:</span>
                <span className="font-semibold text-foreground">{meta.targetState}</span>
                {meta.isTerminal && <span className="ml-auto text-rose-400 font-medium">🔒 Terminal</span>}
                {meta.isDowngrade && <span className="ml-auto text-amber-400 font-medium">↩️ Downgrade</span>}
              </div>
            )}

            {/* ── Conditional: Tanggal Sosialisasi ── */}
            {meta?.requiresTanggalSos && (
              <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Calendar size={13} />
                  ⚡ Tanggal Sosialisasi Disepakati — Wajib Diisi
                </p>
                <input
                  required
                  type="date"
                  value={tanggalSosialisasi}
                  min={today()}
                  onChange={e => setTanggalSosialisasi(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            )}

            {/* ── Conditional: Alasan Tidak Bisa ── */}
            {meta?.requiresAlasan && (
              <div className="border border-rose-500/30 bg-rose-500/5 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  Alasan Tidak Bisa Sosialisasi — Wajib
                </p>
                <select required value={alasanTidakBisa} onChange={e => setAlasanTidakBisa(e.target.value)} className={INPUT_CLASS}>
                  <option value="">— Pilih alasan —</option>
                  {ALASAN_TIDAK_BISA.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {alasanTidakBisa === 'Alasan lainnya' && (
                  <textarea
                    required
                    rows={2}
                    value={catatanAlasan}
                    onChange={e => setCatatanAlasan(e.target.value)}
                    placeholder="Jelaskan alasan..."
                    className={cn(INPUT_CLASS, 'resize-none')}
                  />
                )}
              </div>
            )}

            {/* ── Catatan Fakta ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                Catatan Fakta *
                {meta?.isDowngrade && <span className="text-rose-500 text-[10px]">↩️ Wajib min. 10 karakter</span>}
                <span className={cn('ml-auto text-[10px]', catatanOk ? 'text-emerald-400' : 'text-muted-foreground')}>
                  {catatanFakta.trim().length}/5 min
                </span>
              </label>
              <textarea
                required
                rows={3}
                value={catatanFakta}
                onChange={e => setCatatanFakta(e.target.value)}
                placeholder="Tulis fakta hasil interaksi secara objektif..."
                className={cn(
                  INPUT_CLASS, 'resize-none',
                  meta?.isDowngrade && !catatanDowngradeOk && catatanFakta.length > 0 && 'border-rose-500 ring-1 ring-rose-500'
                )}
              />
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-5 border-t border-border flex justify-end gap-3 shrink-0 bg-card z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-none">
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:block px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="catatInteraksiForm"
            disabled={loading || !formValid}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2 text-sm font-medium text-white gradient-primary rounded-xl sm:rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Simpan Interaksi
          </button>
        </div>
      </div>
    </div>
  );
}
