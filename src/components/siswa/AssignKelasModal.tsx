'use client';

import { useState, useEffect } from 'react';
import { X, Layers, Users, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import type { SekolahSosialisasiOption, KelasOption } from '@/lib/types/siswa.types';

interface AssignKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignKelasModal({ isOpen, onClose, onSuccess }: AssignKelasModalProps) {
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingKelas, setLoadingKelas]     = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [errorMsg, setErrorMsg]             = useState('');
  const [successMsg, setSuccessMsg]         = useState('');

  const [sekolahList, setSekolahList]       = useState<SekolahSosialisasiOption[]>([]);
  const [croList, setCroList]               = useState<string[]>([]);
  const [kelasList, setKelasList]           = useState<KelasOption[]>([]);

  const [selectedSekolahId, setSelectedSekolahId] = useState('');
  const [selectedKelasKey, setSelectedKelasKey]   = useState('');
  const [targetCro, setTargetCro]                 = useState('');
  const [alasan, setAlasan]                       = useState('');

  // ── 1. Load Daftar Sekolah (Sudah Sosialisasi) & CRO Aktif ────────────────
  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setSelectedSekolahId('');
      setSelectedKelasKey('');
      setTargetCro('');
      setAlasan('');
      setErrorMsg('');
      setSuccessMsg('');
      setKelasList([]);
      return;
    }

    async function fetchInitialData() {
      setLoadingInitial(true);
      setErrorMsg('');
      try {
        const [sekRes, croRes] = await Promise.all([
          apiClient.get('/api/v1/siswa/utils/sekolah-sosialisasi'),
          apiClient.get('/api/v1/sekolah/utils/cro-list'),
        ]);

        if (sekRes.data?.status === 'ok') {
          setSekolahList(sekRes.data.data || []);
        }
        if (croRes.data?.status === 'ok') {
          const cros = croRes.data.data || [];
          setCroList(Array.isArray(cros) ? cros.map((c: { nama?: string; cro?: string } | string) => typeof c === 'string' ? c : (c.nama || c.cro || '')) : []);
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setErrorMsg(e.response?.data?.message || e.message || 'Gagal memuat data sekolah & CRO.');
      } finally {
        setLoadingInitial(false);
      }
    }

    fetchInitialData();
  }, [isOpen]);

  // ── 2. Load Kelas ketika Sekolah Dipilih ───────────────────────────────────
  useEffect(() => {
    if (!selectedSekolahId) {
      setKelasList([]);
      setSelectedKelasKey('');
      return;
    }

    async function fetchKelas() {
      setLoadingKelas(true);
      setErrorMsg('');
      setSelectedKelasKey('');
      try {
        const res = await apiClient.get(`/api/v1/siswa/utils/kelas-by-sekolah?id_sekolah=${selectedSekolahId}`);
        if (res.data?.status === 'ok') {
          setKelasList(res.data.data || []);
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setErrorMsg(e.response?.data?.message || e.message || 'Gagal memuat data kelas.');
      } finally {
        setLoadingKelas(false);
      }
    }

    fetchKelas();
  }, [selectedSekolahId]);

  if (!isOpen) return null;

  // Selected entities detail
  const selectedSekolah = sekolahList.find(s => s.id_sekolah === selectedSekolahId);
  const selectedKelas   = kelasList.find(k => (k.kelas_id ? String(k.kelas_id) : k.nama_kelas) === selectedKelasKey);

  const currentCro = selectedKelas?.current_cro || '';
  const isReplacing = Boolean(currentCro && targetCro && currentCro.toLowerCase() !== targetCro.toLowerCase());
  const isSameCro   = Boolean(currentCro && targetCro && currentCro.toLowerCase() === targetCro.toLowerCase());

  // ── 3. Handle Submit Assignment ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSekolahId || !selectedKelas || !targetCro) {
      setErrorMsg('Harap lengkapi semua pilihan: Sekolah, Kelas, dan Target CRO.');
      return;
    }
    if (isSameCro) {
      setErrorMsg(`Kelas ini sudah dipegang oleh CRO ${targetCro}. Pilih CRO lain untuk memindahtangankan.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiClient.post('/api/v1/siswa/assign-kelas', {
        id_sekolah:  selectedSekolahId,
        nama_kelas:  selectedKelas.nama_kelas,
        kelas_id:    selectedKelas.kelas_id || null,
        target_cro:  targetCro,
        alasan:      alasan.trim() || undefined,
      });

      if (res.data?.status === 'ok') {
        setSuccessMsg(res.data.message || 'Berhasil meng-assign kelas ke CRO.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message || e.message || 'Terjadi kesalahan saat meng-assign kelas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white shadow-xs">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Assign Kelas ke CRO</h2>
              <p className="text-xs text-muted-foreground">Konsep Teritorial 1 Kelas Banyak Siswa = 1 CRO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body Form ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-xs text-destructive">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-500">
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {loadingInitial ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs">Memuat daftar sekolah & CRO...</p>
            </div>
          ) : (
            <>
              {/* 1. Pilih Sekolah */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>1. Pilih Sekolah <span className="text-destructive">*</span></span>
                  <span className="text-xs font-normal text-muted-foreground">Wajib status &apos;Sudah Sosialisasi&apos;</span>
                </label>
                <select
                  value={selectedSekolahId}
                  onChange={e => setSelectedSekolahId(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors"
                  required
                >
                  <option value="">-- Pilih Sekolah --</option>
                  {sekolahList.map(s => (
                    <option key={s.id_sekolah} value={s.id_sekolah}>
                      {s.nama_sekolah} ({s.total_siswa} siswa)
                    </option>
                  ))}
                </select>
                {sekolahList.length === 0 && (
                  <p className="text-xs text-amber-500">Belum ada sekolah yang berstatus &apos;Sudah Sosialisasi&apos; pada periode ini.</p>
                )}
              </div>

              {/* 2. Pilih Kelas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>2. Pilih Kelas <span className="text-destructive">*</span></span>
                  {loadingKelas && <Loader2 size={12} className="animate-spin text-primary" />}
                </label>
                <select
                  value={selectedKelasKey}
                  onChange={e => setSelectedKelasKey(e.target.value)}
                  disabled={!selectedSekolahId || loadingKelas || submitting}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors disabled:opacity-50"
                  required
                >
                  <option value="">
                    {!selectedSekolahId ? '-- Pilih sekolah terlebih dahulu --' : kelasList.length === 0 ? '-- Belum ada data siswa di sekolah ini --' : '-- Pilih Kelas --'}
                  </option>
                  {kelasList.map(k => {
                    const key = k.kelas_id ? String(k.kelas_id) : k.nama_kelas;
                    return (
                      <option key={key} value={key}>
                        Kelas {k.nama_kelas} ({k.student_count} siswa) — {k.current_cro ? `CRO: ${k.current_cro}` : 'Belum Ada CRO'}
                      </option>
                    );
                  })}
                </select>
                {selectedSekolahId && !loadingKelas && kelasList.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sekolah ini belum memiliki data siswa yang terinput.</p>
                )}
              </div>

              {/* 3. Pilih Target CRO */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  3. Pilih Target CRO <span className="text-destructive">*</span>
                </label>
                <select
                  value={targetCro}
                  onChange={e => setTargetCro(e.target.value)}
                  disabled={!selectedKelasKey || submitting}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors disabled:opacity-50"
                  required
                >
                  <option value="">-- Pilih CRO yang Ditugaskan --</option>
                  {croList.map(cro => (
                    <option key={cro} value={cro}>{cro}</option>
                  ))}
                </select>
              </div>

              {/* Ringkasan Konfirmasi Dinamis */}
              {selectedKelas && targetCro && (
                <div className="p-4 bg-secondary/40 border rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Users size={14} className="text-primary" /> Ringkasan Dampak
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {selectedKelas.student_count} Siswa Terbawa
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Sekolah:</span>
                      <span className="font-medium text-foreground truncate block">{selectedSekolah?.nama_sekolah}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Kelas:</span>
                      <span className="font-medium text-foreground block">Kelas {selectedKelas.nama_kelas}</span>
                    </div>
                  </div>

                  {/* CRO Transition Flow */}
                  <div className="flex items-center justify-between p-2.5 bg-card border rounded-lg text-xs">
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground block">CRO Sebelumnya</span>
                      <span className="font-semibold text-foreground truncate block">
                        {currentCro || 'Belum Ada'}
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0 mx-2" />
                    <div className="min-w-0 text-right">
                      <span className="text-xs text-primary font-medium block">CRO Baru</span>
                      <span className="font-bold text-primary truncate block">{targetCro}</span>
                    </div>
                  </div>

                  {/* Warning replace notice */}
                  {isReplacing && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>
                        Kelas ini saat ini dipegang oleh <strong>{currentCro}</strong>. Meng-assign ke <strong>{targetCro}</strong> akan secara otomatis me-replace penanggung jawab seluruh {selectedKelas.student_count} siswa di kelas ini.
                      </span>
                    </div>
                  )}

                  {isSameCro && (
                    <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>Kelas ini sudah dipegang oleh CRO terpilih. Harap pilih CRO lain.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Alasan / Catatan (Opsional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Catatan / Alasan Penugasan <span className="font-normal text-muted-foreground">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penugasan teritorial semester baru"
                  value={alasan}
                  onChange={e => setAlasan(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors"
                />
              </div>
            </>
          )}

          {/* ── Footer Actions ─────────────────────────────────────────────── */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || loadingInitial || !selectedSekolahId || !selectedKelasKey || !targetCro || isSameCro}
              className="px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Layers size={13} />
                  <span>Assign Kelas Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
