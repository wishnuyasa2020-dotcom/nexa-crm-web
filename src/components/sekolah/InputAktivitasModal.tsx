'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MASTER_HASIL_SEKOLAH, JENIS_AKTIVITAS, ALASAN_TIDAK_BISA,
  type HasilAktivitas,
} from '@/lib/constants/sekolah';
import type { SekolahDetail } from '@/lib/types/sekolah.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sekolah: SekolahDetail;
  onSuccess: () => void;
  forceVisitAwal?: boolean;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const HASIL_OPTIONS = Object.keys(MASTER_HASIL_SEKOLAH) as HasilAktivitas[];

export function InputAktivitasModal({ isOpen, onClose, sekolah, onSuccess, forceVisitAwal }: Props) {
  const [loading, setLoading] = useState(false);

  // Accordion State for Mobile
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C'>('A');

  // Section A
  const [jenisAktivitas, setJenisAktivitas] = useState<string>(forceVisitAwal ? 'Visit Awal' : '');
  const [tanggalAktivitas, setTanggalAktivitas] = useState(today());

  // Section B (Data Sekolah — wajib saat Visit Awal)
  const [statusAktif, setStatusAktif] = useState<'Aktif' | 'Nonaktif' | 'Belum Diketahui'>('Belum Diketahui');
  const [alamat, setAlamat] = useState(sekolah.alamat ?? '');
  const [jumlahSiswa, setJumlahSiswa] = useState('');
  const [namaPic, setNamaPic] = useState('');
  const [jabatanPic, setJabatanPic] = useState('');
  const [noWaPic, setNoWaPic] = useState('');

  // Section C
  const [hasil, setHasil] = useState<HasilAktivitas | ''>('');
  const [catatan, setCatatan] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [alasanTidakBisa, setAlasanTidakBisa] = useState('');
  const [catatanAlasan, setCatatanAlasan] = useState('');

  const mapping = hasil ? MASTER_HASIL_SEKOLAH[hasil] : null;
  const isVisitAwal = jenisAktivitas === 'Visit Awal' || forceVisitAwal;
  const requiresAlasan = mapping?.requiresAlasan;
  const isTerminal = mapping?.isTerminal;
  const isDowngrade = mapping?.isDowngrade;
  const catatanOk = catatan.length >= 10;

  useEffect(() => {
    if (mapping) {
      if (isTerminal) {
        setDueDate('');
      } else if (mapping.autoFillDueDate === 'H+1') {
        setDueDate(tomorrow());
      } else {
        setDueDate('');
      }
    }
  }, [hasil, isTerminal, mapping]);

  // Validation
  let formValid = Boolean(jenisAktivitas && tanggalAktivitas && hasil);
  if (isVisitAwal) {
    if (!alamat || !jumlahSiswa || !namaPic || !jabatanPic || !noWaPic) formValid = false;
  }
  if (!isTerminal && !dueDate) formValid = false;
  if (isDowngrade && !catatanOk) formValid = false;
  if (requiresAlasan) {
    if (!alasanTidakBisa) formValid = false;
    if (alasanTidakBisa === 'Alasan lainnya' && !catatanAlasan) formValid = false;
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    try {
      const { inputAktivitas } = await import('@/lib/api/sekolah.api');
      await inputAktivitas(sekolah.id, {
        jenisAktivitas,
        tanggalAktivitas,
        hasilAktivitas: hasil as string,
        catatan,
        dueDateNextAction: dueDate || null,
        statusAktif: isVisitAwal ? statusAktif : undefined,
        alamatLengkap: isVisitAwal ? alamat : undefined,
        jumlahSiswaKelas12: isVisitAwal ? parseInt(jumlahSiswa, 10) : undefined,
        namaPic: isVisitAwal ? namaPic : undefined,
        jabatanPic: isVisitAwal ? jabatanPic : undefined,
        noWaPic: isVisitAwal ? noWaPic : undefined,
        alasanTidakBisa: requiresAlasan ? alasanTidakBisa : undefined,
        catatanAlasan: requiresAlasan && alasanTidakBisa === 'Alasan lainnya' ? catatanAlasan : undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Gagal menyimpan aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const AccordionHeader = ({ section, title, isCompleted }: { section: 'A' | 'B' | 'C', title: string, isCompleted: boolean }) => (
    <button
      type="button"
      onClick={() => setActiveSection(section)}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl border transition-all sm:hidden",
        activeSection === section ? "bg-primary/5 border-primary/30" : "bg-card border-border",
        isCompleted && activeSection !== section && "bg-emerald-500/5 border-emerald-500/20"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn(
          "w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-bold",
          activeSection === section ? "bg-primary/20 text-primary" : 
          isCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-secondary text-muted-foreground"
        )}>
          {isCompleted && activeSection !== section ? <Check size={12} /> : section}
        </span>
        <span className={cn("text-sm font-semibold", activeSection === section ? "text-primary" : "text-foreground")}>
          {title}
        </span>
      </div>
      <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", activeSection === section && "rotate-180")} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div className="bg-background sm:bg-card w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl shadow-xl sm:border border-border flex flex-col sm:max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-card flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Input Aktivitas</h2>
            <p className="text-xs text-muted-foreground">{sekolah.nama}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3 sm:space-y-6 pb-24 sm:pb-5">
          <form id="inputAktivitasForm" onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">

            {/* ── SEKSI A: Jenis & Tanggal ── */}
            <div className={cn("space-y-4", activeSection !== 'A' && "hidden sm:block")}>
              <h3 className="hidden sm:flex text-xs font-semibold text-primary/80 uppercase tracking-wider items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-bold">A</span>
                Jenis &amp; Tanggal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card p-4 sm:p-0 rounded-xl border sm:border-none border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Jenis Aktivitas *</label>
                  <select
                    required
                    value={jenisAktivitas}
                    onChange={e => setJenisAktivitas(e.target.value)}
                    disabled={!!forceVisitAwal}
                    className={cn(INPUT_CLASS, forceVisitAwal && 'opacity-60 cursor-not-allowed')}
                  >
                    <option value="">— Pilih —</option>
                    {JENIS_AKTIVITAS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Aktivitas *</label>
                  <input
                    required
                    type="date"
                    value={tanggalAktivitas}
                    max={today()}
                    onChange={e => setTanggalAktivitas(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                {/* Next button for mobile accordion */}
                <div className="sm:hidden pt-2 flex justify-end">
                  <button type="button" onClick={() => setActiveSection(isVisitAwal ? 'B' : 'C')} className="px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg">Lanjut</button>
                </div>
              </div>
            </div>
            <AccordionHeader section="A" title="Jenis & Tanggal" isCompleted={!!jenisAktivitas && !!tanggalAktivitas} />

            {/* ── SEKSI B: Data Sekolah (wajib Visit Awal) ── */}
            {isVisitAwal && (
              <>
                <div className={cn("space-y-4 border sm:border-amber-500/20 sm:bg-amber-500/5 bg-card border-border rounded-xl p-4", activeSection !== 'B' && "hidden sm:block")}>
                  <h3 className="hidden sm:flex text-xs font-semibold text-amber-500 uppercase tracking-wider items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] flex items-center justify-center font-bold">B</span>
                    Data Sekolah (Wajib Visit Awal)
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Status Aktif *</label>
                    <div className="flex gap-4 text-sm">
                      {(['Aktif', 'Nonaktif', 'Belum Diketahui'] as const).map(s => (
                        <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="statusAktif" value={s} checked={statusAktif === s} onChange={() => setStatusAktif(s)} className="accent-primary" />
                          <span className="text-sm text-foreground">{s}</span>
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
                  
                  <div className="sm:hidden pt-2 flex justify-end">
                    <button type="button" onClick={() => setActiveSection('C')} className="px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg">Lanjut</button>
                  </div>
                </div>
                <AccordionHeader section="B" title="Data Sekolah (Visit Awal)" isCompleted={!!alamat && !!jumlahSiswa && !!namaPic && !!jabatanPic && !!noWaPic} />
              </>
            )}

            {/* ── SEKSI C: Hasil & Tindak Lanjut ── */}
            <div className={cn("space-y-4 bg-card border sm:border-none border-border p-4 sm:p-0 rounded-xl", activeSection !== 'C' && "hidden sm:block")}>
              <h3 className="hidden sm:flex text-xs font-semibold text-primary/80 uppercase tracking-wider items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-bold">C</span>
                Hasil &amp; Tindak Lanjut
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Hasil Aktivitas *</label>
                <select required value={hasil} onChange={e => setHasil(e.target.value as HasilAktivitas | '')} className={INPUT_CLASS}>
                  <option value="">— Pilih hasil aktivitas —</option>
                  {HASIL_OPTIONS.map(h => (
                    <option key={h} value={h}>
                      {MASTER_HASIL_SEKOLAH[h].isDowngrade ? `↩️ ${h}` : h}
                      {h === 'Data Siswa Terinput' ? ' ✅' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {mapping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-xl border border-border/50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Status Terkini</label>
                    <div className="text-sm font-medium text-foreground">{mapping.status}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Next Action</label>
                    <div className="text-sm font-medium text-foreground">{mapping.nextAction ?? '—'}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  Due Date Next Action
                  {mapping?.autoFillDueDate === 'H+1' && <span className="text-amber-500 text-[10px]">⚡ Auto H+1</span>}
                  {isTerminal && <span className="text-muted-foreground text-[10px]">🔒 Dikunci null</span>}
                </label>
                <input type="date" value={dueDate} min={today()} onChange={e => setDueDate(e.target.value)} disabled={isTerminal} className={cn(INPUT_CLASS, isTerminal && 'opacity-40 cursor-not-allowed')} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  Catatan
                  {isDowngrade && <span className="text-rose-500 text-[10px]">↩️ Wajib min 10 karakter</span>}
                </label>
                <textarea required={isDowngrade} rows={3} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan singkat..." className={cn(INPUT_CLASS, 'resize-none', isDowngrade && !catatanOk && catatan.length > 0 && 'border-rose-500 ring-1 ring-rose-500')} />
              </div>

              {requiresAlasan && (
                <div className="border border-rose-500/30 bg-rose-500/5 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5">
                    <AlertCircle size={13} /> Alasan Tidak Bisa Sosialisasi — Wajib
                  </p>
                  <select required value={alasanTidakBisa} onChange={e => setAlasanTidakBisa(e.target.value)} className={INPUT_CLASS}>
                    <option value="">— Pilih alasan —</option>
                    {ALASAN_TIDAK_BISA.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {alasanTidakBisa === 'Alasan lainnya' && (
                    <textarea required rows={2} value={catatanAlasan} onChange={e => setCatatanAlasan(e.target.value)} placeholder="Jelaskan alasan..." className={cn(INPUT_CLASS, 'resize-none mt-2')} />
                  )}
                </div>
              )}
            </div>
            <AccordionHeader section="C" title="Hasil & Tindak Lanjut" isCompleted={!!hasil && (isTerminal || !!dueDate)} />

          </form>
        </div>

        {/* Footer */}
        <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-5 border-t border-border flex justify-end gap-3 flex-shrink-0 bg-card sm:bg-secondary/5 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-none">
          <button type="button" onClick={onClose} className="hidden sm:block px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
            Batal
          </button>
          <button
            type="submit"
            form="inputAktivitasForm"
            disabled={loading || !formValid}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2 text-sm font-medium text-white gradient-primary rounded-xl sm:rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Simpan Aktivitas
          </button>
        </div>

      </div>
    </div>
  );
}
