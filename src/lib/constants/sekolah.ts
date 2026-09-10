// ============================================================
// MASTER CONSTANTS — Modul Sekolah (Nexa CRM)
// Sumber: diagram_alur_sekolah.md — Section 3.4, 2, 5
// ============================================================

export type StatusCRM =
  // ── Pipeline States Baru (Ontologi B2B) ──
  | 'Identified'
  | 'Engaged'
  | 'Sosialisasi Terjadwal'
  | 'Sudah Sosialisasi'
  | 'Identity Captured'
  | 'Lead Captured'
  | 'Disqualified'
  // ── Status Operasional Lama (backward-compat) ──
  | 'Belum Visit'
  | 'Tunggu Visit Ulang'
  | 'Tunggu Keputusan'
  | 'Tunggu Jadwal Sosialisasi'
  | 'Tidak Bisa Sosialisasi'
  | 'Nonaktif / Tutup / Merger';

export type HasilAktivitas =
  | 'Belum Bertemu PIC'
  | 'Diminta Visit Ulang'
  | 'Diminta Meeting'
  | 'Menunggu Keputusan'
  | 'Izin Sosialisasi'
  | 'Jadwal Sosialisasi Disepakati'
  | 'Jadwal Sosialisasi Ditunda'
  | 'Jadwal Sosialisasi Dibatalkan'
  | 'PIC Berganti — Perlu Visit Ulang'
  | 'Sosialisasi Selesai'
  | 'Data Siswa Terinput'
  | 'Ditolak Final'
  | 'Tutup / Merger';

export interface HasilMapping {
  status: StatusCRM;
  nextAction: string | null;
  isTerminal: boolean;
  isDowngrade: boolean;
  autoFillDueDate: 'H+1' | null;
  requiresAlasan?: boolean;
}

// Section 3.4 — Master Hasil → Status Mapping
export const MASTER_HASIL_SEKOLAH: Record<HasilAktivitas, HasilMapping> = {
  'Belum Bertemu PIC':             { status: 'Tunggu Visit Ulang',        nextAction: 'Visit Ulang',             isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Diminta Visit Ulang':           { status: 'Tunggu Visit Ulang',        nextAction: 'Visit Ulang',             isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Diminta Meeting':               { status: 'Tunggu Keputusan',          nextAction: 'Meeting PIC',             isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Menunggu Keputusan':            { status: 'Tunggu Keputusan',          nextAction: 'Follow Up',               isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Izin Sosialisasi':              { status: 'Tunggu Jadwal Sosialisasi', nextAction: 'Jadwalkan Sosialisasi',   isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Jadwal Sosialisasi Disepakati': { status: 'Sosialisasi Terjadwal',     nextAction: 'Laksanakan Sosialisasi',  isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Jadwal Sosialisasi Ditunda':    { status: 'Tunggu Jadwal Sosialisasi', nextAction: 'Jadwalkan Sosialisasi',   isTerminal: false, isDowngrade: false, autoFillDueDate: null },
  'Jadwal Sosialisasi Dibatalkan': { status: 'Tunggu Jadwal Sosialisasi', nextAction: 'Jadwalkan Sosialisasi',   isTerminal: false, isDowngrade: true,  autoFillDueDate: null },
  'PIC Berganti — Perlu Visit Ulang': { status: 'Tunggu Visit Ulang',    nextAction: 'Visit Ulang',             isTerminal: false, isDowngrade: true,  autoFillDueDate: null },
  'Sosialisasi Selesai':           { status: 'Sudah Sosialisasi',         nextAction: 'Input Data Siswa',        isTerminal: false, isDowngrade: false, autoFillDueDate: 'H+1' },
  'Data Siswa Terinput':           { status: 'Identity Captured',         nextAction: null,                      isTerminal: true,  isDowngrade: false, autoFillDueDate: null },
  'Ditolak Final':                 { status: 'Tidak Bisa Sosialisasi',    nextAction: null,                      isTerminal: true,  isDowngrade: false, autoFillDueDate: null, requiresAlasan: true },
  'Tutup / Merger':                { status: 'Nonaktif / Tutup / Merger', nextAction: null,                      isTerminal: true,  isDowngrade: false, autoFillDueDate: null },
};

// Section 2 — Status Badge Color Mapping (Tailwind classes)
export const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // ── Pipeline States Baru (Ontologi B2B) ──
  'Identified':            { bg: 'bg-slate-500/15',   text: 'text-slate-300',   border: 'border-slate-500/20',  dot: 'bg-slate-300' },
  'Engaged':               { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/20',  dot: 'bg-amber-400' },
  'Sosialisasi Terjadwal': { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
  'Sudah Sosialisasi':     { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20',dot: 'bg-emerald-400' },
  'Identity Captured':     { bg: 'bg-emerald-600/20', text: 'text-emerald-300', border: 'border-emerald-500/30',dot: 'bg-emerald-300' },
  'Lead Captured':         { bg: 'bg-emerald-600/20', text: 'text-emerald-300', border: 'border-emerald-500/30',dot: 'bg-emerald-300' },
  'Disqualified':          { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/20',   dot: 'bg-rose-400' },
  // ── Status Operasional Lama (backward-compat untuk detail sekolah) ──
  'Belum Visit':               { bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/20',  dot: 'bg-slate-400' },
  'Tunggu Visit Ulang':        { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/20',  dot: 'bg-amber-400' },
  'Tunggu Keputusan':          { bg: 'bg-orange-500/15',  text: 'text-orange-400',  border: 'border-orange-500/20', dot: 'bg-orange-400' },
  'Tunggu Jadwal Sosialisasi': { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/20',   dot: 'bg-blue-400' },
  'Tidak Bisa Sosialisasi':    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/20',   dot: 'bg-rose-400' },
  'Nonaktif / Tutup / Merger': { bg: 'bg-zinc-500/15',    text: 'text-zinc-400',    border: 'border-zinc-500/20',   dot: 'bg-zinc-400' },
};

// Section 7.1 — Overdue threshold colors
export const OVERDUE_COLORS = {
  ok:     { text: 'text-slate-400',  label: '' },
  warn:   { text: 'text-amber-400',  label: '🟡' }, // H+1 – H+7
  urgent: { text: 'text-orange-400', label: '🟠' }, // H+8 – H+14
  kritis: { text: 'text-rose-400',   label: '🔴' }, // > H+14
};

export function getOverdueCategory(dueDateStr: string | null): keyof typeof OVERDUE_COLORS {
  if (!dueDateStr) return 'ok';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  if (diff <= 0) return 'ok';
  if (diff <= 7) return 'warn';
  if (diff <= 14) return 'urgent';
  return 'kritis';
}

// Jenis Aktivitas Utama (backward compat for old InputAktivitasModal)
export const JENIS_AKTIVITAS = [
  'Visit Awal',
  'Visit Ulang',
  'Follow Up',
  'Meeting PIC',
  'Jadwalkan Sosialisasi',
  'Laksanakan Sosialisasi',
  'Input Data Siswa',
] as const;

// Channel / Jenis Interaksi (Event-Sourcing — endpoint /interactions)
export const CHANNEL_OPTIONS = [
  'Visit Langsung',
  'WhatsApp',
  'Telepon',
  'Meeting',
] as const;

// Outcome Options (Event-Sourcing — endpoint /interactions)
export const OUTCOME_OPTIONS = [
  'PIC Tidak di Tempat / Menunggu Respon',
  'PIC Minta Proposal Ditinggal',
  'PIC Minta Kembali Minggu Depan',
  'Diminta Meeting',
  'Menunggu Keputusan',
  'Mendapat Izin Sosialisasi',
  'Jadwal Sosialisasi Ditunda',
  'Jadwal Sosialisasi Dibatalkan',
  'PIC Berganti — Perlu Visit Ulang',
  'Sosialisasi Selesai',
  'Data Siswa Terinput',
  'Ditolak Final',
  'Tutup / Merger',
] as const;

export type OutcomeKey = typeof OUTCOME_OPTIONS[number];

// Outcome Map: outcome → UI metadata
export const OUTCOME_META: Record<OutcomeKey, {
  label: string;
  targetState: string;
  isTerminal: boolean;
  isDowngrade: boolean;
  requiresAlasan: boolean;
  requiresTanggalSos: boolean;
  eventType: string;
}> = {
  'PIC Tidak di Tempat / Menunggu Respon': { label: 'PIC Tidak di Tempat',          targetState: 'Tunggu Visit Ulang',        isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'PIC Minta Proposal Ditinggal':          { label: 'Proposal Ditinggal',            targetState: 'Tunggu Visit Ulang',        isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'PIC Minta Kembali Minggu Depan':        { label: 'Minta Kembali Minggu Depan',   targetState: 'Tunggu Visit Ulang',        isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'Diminta Meeting':                       { label: 'Diminta Meeting',               targetState: 'Tunggu Keputusan',          isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'Menunggu Keputusan':                    { label: 'Menunggu Keputusan',            targetState: 'Tunggu Keputusan',          isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'Mendapat Izin Sosialisasi':             { label: '⚡ Mendapat Izin Sosialisasi', targetState: 'Sosialisasi Terjadwal',     isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: true,  eventType: 'SosialisasiApproved' },
  'Jadwal Sosialisasi Ditunda':            { label: '↩️ Jadwal Ditunda',              targetState: 'Tunggu Jadwal Sosialisasi', isTerminal: false, isDowngrade: true,  requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'Jadwal Sosialisasi Dibatalkan':         { label: '↩️ Jadwal Dibatalkan',           targetState: 'Tunggu Jadwal Sosialisasi', isTerminal: false, isDowngrade: true,  requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'PIC Berganti — Perlu Visit Ulang':      { label: '↩️ PIC Berganti',                targetState: 'Tunggu Visit Ulang',        isTerminal: false, isDowngrade: true,  requiresAlasan: false, requiresTanggalSos: false, eventType: 'InteractionLogged' },
  'Sosialisasi Selesai':                   { label: '✅ Sosialisasi Selesai',         targetState: 'Sudah Sosialisasi',         isTerminal: false, isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'SosialisasiCompleted' },
  'Data Siswa Terinput':                   { label: '🎯 Data Siswa Terinput',      targetState: 'Identity Captured',         isTerminal: true,  isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'BatchStudentsImported' },
  'Ditolak Final':                         { label: '🔴 Ditolak Final',              targetState: 'Tidak Bisa Sosialisasi',    isTerminal: true,  isDowngrade: false, requiresAlasan: true,  requiresTanggalSos: false, eventType: 'SosialisasiRejected' },
  'Tutup / Merger':                        { label: 'Tutup / Merger',                targetState: 'Nonaktif / Tutup / Merger', isTerminal: true,  isDowngrade: false, requiresAlasan: false, requiresTanggalSos: false, eventType: 'SchoolClosed' },
};

// Intent Options
export const INTENT_OPTIONS = ['High', 'Mid', 'Low'] as const;
export type IntentLevel = typeof INTENT_OPTIONS[number];

export const INTENT_BADGE: Record<IntentLevel, { label: string; icon: string; bg: string; text: string; border: string }> = {
  High: { label: 'High',  icon: '🔥', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20' },
  Mid:  { label: 'Mid',   icon: '🟢', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Low:  { label: 'Low',   icon: '⚪', bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/20' },
};

// Event Type Config (untuk label di Event Log UI)
export const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  InteractionLogged:     { label: 'Interaksi',            color: 'text-amber-400',   icon: '🟡' },
  SosialisasiApproved:   { label: 'Sosialisasi Approved', color: 'text-blue-400',    icon: '🔵' },
  SosialisasiCompleted:  { label: 'Sosialisasi Selesai',  color: 'text-emerald-400', icon: '🟢' },
  SosialisasiRejected:   { label: 'Ditolak',              color: 'text-rose-400',    icon: '🔴' },
  BatchStudentsImported: { label: 'Identity Captured',    color: 'text-emerald-300', icon: '🎯' },
  SchoolClosed:          { label: 'Tutup / Merger',        color: 'text-zinc-400',    icon: '⚫' },
};

// Jenis Aktivitas Ekstra (Section 8.1)
export const JENIS_AKTIVITAS_EKSTRA = [
  'WhatsApp PIC',
  'Telepon PIC',
  'Meeting PIC',
] as const;

// Alasan Tidak Bisa Sosialisasi (Screen 5)
export const ALASAN_TIDAK_BISA = [
  'Tidak menerima lembaga luar',
  'Sudah bekerja sama dengan lembaga lain',
  'Kebijakan kepala sekolah / yayasan',
  'Tidak ada kelas XII / Jurusan tidak sesuai',
  'Waktu tidak memungkinkan',
  'Alasan lainnya',
] as const;

// Tingkat / Jenjang (pakai existing)
export const TINGKAT_OPTIONS = ['SMA', 'SMK', 'MA', 'Lainnya'] as const;

// Role check helpers
export const isManagerOrAdmin = (role: string) =>
  ['Manager', 'Admin'].includes(role);
