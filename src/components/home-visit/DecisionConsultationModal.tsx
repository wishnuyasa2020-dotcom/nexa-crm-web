'use client';

import { useState, useEffect } from 'react';
import { X, Home, Building2, School, Loader2, CheckCircle, AlertCircle, Calendar, User, Phone, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { getDisplayLabel } from '@/lib/constants/lifecycle';

interface ProspectItem {
  id: string;
  nama: string;
  namaSekolah: string;
  kelas: string;
  wa?: string;
  commercialState: string;
  cro: string;
}

interface DecisionConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedSiswaId?: string;
  preselectedSiswaName?: string;
}

type ChannelType = 'Home Visit' | 'Kantor Derma' | 'Sekolah Siswa';
type OutcomeType = 'Komitmen Disetujui' | 'Perlu Diskusi Lanjutan' | 'Ditolak / Keberatan';

const CHANNELS: { value: ChannelType; label: string; icon: typeof Home; desc: string }[] = [
  { value: 'Home Visit', label: 'Home Visit', icon: Home, desc: 'Kunjungan langsung ke rumah siswa' },
  { value: 'Kantor Derma', label: 'Kantor / Head Office', icon: Building2, desc: 'Siswa & ortu datang ke kantor konsultasi' },
  { value: 'Sekolah Siswa', label: 'Sekolah Siswa', icon: School, desc: 'Pertemuan tatap muka di sekolah' },
];

const OUTCOMES: { value: OutcomeType; label: string; impact: string; dot: string; color: string }[] = [
  {
    value: 'Komitmen Disetujui',
    label: 'Komitmen Disetujui (Naik Opportunity)',
    impact: '⭐️ Memenuhi Commitment Threshold: Status siswa otomatis naik menjadi Opportunity.',
    dot: '🟢',
    color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500'
  },
  {
    value: 'Perlu Diskusi Lanjutan',
    label: 'Perlu Diskusi Lanjutan (Follow Up)',
    impact: 'Ortu masih menimbang biaya/jadwal. Siswa tetap di Prospect dengan status Pertimbangan Ortu.',
    dot: '🟡',
    color: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-500'
  },
  {
    value: 'Ditolak / Keberatan',
    label: 'Ditolak / Keberatan Ortu',
    impact: 'Orang tua menyatakan tidak diizinkan atau keberatan biaya.',
    dot: '🔴',
    color: 'border-rose-500/40 bg-rose-500/5 text-rose-500'
  }
];

export function DecisionConsultationModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedSiswaId,
  preselectedSiswaName,
}: DecisionConsultationModalProps) {
  const [selectedSiswaId, setSelectedSiswaId] = useState(preselectedSiswaId || '');
  const [prospects, setProspects] = useState<ProspectItem[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);

  const [channel, setChannel] = useState<ChannelType>('Home Visit');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [namaWali, setNamaWali] = useState('');
  const [peranWali, setPeranWali] = useState('Ayah');
  const [hasil, setHasil] = useState<OutcomeType>('Komitmen Disetujui');
  const [kesepakatan, setKesepakatan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [nextAction, setNextAction] = useState('Formulir Pendaftaran & Pembayaran');
  const [dueDate, setDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prospects if no preselected ID
  useEffect(() => {
    if (!isOpen) return;
    if (preselectedSiswaId) {
      setSelectedSiswaId(preselectedSiswaId);
      return;
    }

    setLoadingProspects(true);
    apiClient.get<{ status: string; data: ProspectItem[] }>('/api/v1/home-visit/prospects')
      .then(res => {
        if (res.data.status === 'ok') {
          setProspects(res.data.data || []);
          if (res.data.data && res.data.data.length > 0 && !selectedSiswaId) {
            setSelectedSiswaId(res.data.data[0].id);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load prospects:', err);
      })
      .finally(() => {
        setLoadingProspects(false);
      });
  }, [isOpen, preselectedSiswaId, selectedSiswaId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId) {
      setError('Pilih siswa yang dikonsultasikan.');
      return;
    }
    if (!namaWali.trim()) {
      setError('Nama Orang Tua / Wali wajib diisi (syarat mutlak Decision Environment B2B2C).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        channel,
        tanggal,
        nama_wali: namaWali.trim(),
        peran_wali: peranWali,
        hasil_konsultasi: hasil,
        kesepakatan: kesepakatan.trim(),
        catatan: catatan.trim(),
        next_action: nextAction.trim(),
        due_date: dueDate || undefined,
      };

      const res = await apiClient.post(`/api/v1/siswa/${selectedSiswaId}/decision-consultation`, payload);
      if (res.data.status === 'ok') {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Gagal menyimpan data konsultasi.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mencatat konsultasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-xl bg-card sm:rounded-2xl rounded-t-2xl border shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Handshake size={18} />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Catat Konsultasi Keputusan</h2>
              <p className="text-xs text-muted-foreground">
                Bukti Komitmen Ortu & Siswa (Prospect ➔ Opportunity)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pilih Siswa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Siswa Target <span className="text-rose-500">*</span>
            </label>
            {preselectedSiswaId ? (
              <div className="px-3.5 py-2.5 rounded-xl bg-secondary/50 border text-sm font-semibold text-foreground flex items-center gap-2">
                <User size={16} className="text-primary" />
                <span>{preselectedSiswaName || preselectedSiswaId}</span>
              </div>
            ) : loadingProspects ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Memuat daftar prospek...</span>
              </div>
            ) : (
              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              >
                <option value="">-- Pilih Siswa (Prospek / Lead) --</option>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.namaSekolah || 'Tanpa Sekolah'}) — State: {getDisplayLabel(p.commercialState)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lokasi / Channel Konsultasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lokasi / Metode Pertemuan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const active = channel === ch.value;
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={cn(
                      'p-3 rounded-xl border text-left flex flex-col gap-1 transition-all',
                      active
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/60 hover:border-border bg-secondary/30 text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Icon size={15} className={active ? 'text-primary' : 'text-muted-foreground'} />
                      <span>{ch.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ch.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tanggal & Pihak Pengambil Keputusan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Tanggal Konsultasi *</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Peran Pengambil Keputusan *
              </label>
              <select
                value={peranWali}
                onChange={(e) => setPeranWali(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              >
                <option value="Ayah">Ayah</option>
                <option value="Ibu">Ibu</option>
                <option value="Ayah & Ibu">Ayah & Ibu (Keduanya)</option>
                <option value="Wali / Paman / Kakek">Wali / Paman / Kakek</option>
              </select>
            </div>
          </div>

          {/* Nama Orang Tua / Wali */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
              <span>Nama Orang Tua / Wali yang Hadir</span>
              <span className="text-rose-500 normal-case">*Wajib (Veto/Payer)</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Bpk. Sutrisno / Ibu Maryati"
              value={namaWali}
              onChange={(e) => setNamaWali(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Hasil Konsultasi (Commitment Threshold) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hasil Validasi Komitmen <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {OUTCOMES.map((oc) => {
                const active = hasil === oc.value;
                return (
                  <button
                    key={oc.value}
                    type="button"
                    onClick={() => {
                      setHasil(oc.value);
                      if (oc.value === 'Komitmen Disetujui') {
                        setNextAction('Formulir Pendaftaran & DP Pelatihan');
                      } else if (oc.value === 'Perlu Diskusi Lanjutan') {
                        setNextAction('Follow Up Telepon / Kunjungan Lanjutan');
                      } else {
                        setNextAction('Tutup Kasus / Recycle Nurturing');
                      }
                    }}
                    className={cn(
                      'w-full p-3.5 rounded-xl border text-left transition-all',
                      active
                        ? cn(oc.color, 'ring-1 ring-primary/40')
                        : 'border-border/60 hover:border-border bg-secondary/20 text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                      <span>{oc.dot}</span>
                      <span>{oc.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-5 leading-relaxed">{oc.impact}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kesepakatan & Rencana Pembayaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Butir Kesepakatan & Rencana Komitmen
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Ortu setuju program Jepang, sanggup bayar formulir Rp500.000 tgl 25 dan mulai DP setelah kelulusan..."
              value={kesepakatan}
              onChange={(e) => setKesepakatan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Next Action & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Langkah Berikutnya (Next Action)
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Next action..."
                className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Batas Waktu (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          </div>{/* end scrollable body */}

          {/* Action Buttons — sticky footer */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t bg-card shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Simpan Hasil Konsultasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
