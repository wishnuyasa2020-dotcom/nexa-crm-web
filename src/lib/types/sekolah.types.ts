/**
 * sekolah.types.ts
 * TypeScript types untuk Modul Sekolah — match dengan response nexa-os backend
 * Field names disesuaikan dgn crm.sekolah.service.js output.
 */

// ── PIC (Person In Charge) ────────────────────────────────────────────────────
export interface PIC {
  nama:    string;
  jabatan: string;
  noWa:    string;
}

// ── Sekolah item (list page) ──────────────────────────────────────────────────
export interface Sekolah {
  idRecord:        string;
  id:              string;
  nama:            string;
  tingkat:         string;       // jenjang
  kecamatan:       string;
  alamat:          string;
  statusAktif:     string;       // status_sekolah: 'Aktif' | 'Nonaktif' | 'Belum Diketahui'
  pic:             PIC | null;
  pjCro:           string;       // pj_sekolah
  status:          string;       // status_terkini CRM (backward compat)
  pipelineState:   string;       // pipeline_state — ontologi B2B baru (Identified | Engaged | Sosialisasi Terjadwal | Sudah Sosialisasi | Identity Captured | Disqualified)
  commercialState: string;       // Commercial State (alias status_terkini)
  intent:          'High' | 'Mid' | 'Low' | null;  // Intent level
  nextAction:      string | null;
  dueDate:         string | null; // YYYY-MM-DD
  marketingPeriod: string;
  aging:           number;        // hari sejak status_updated_date
}

// ── Riwayat Aktivitas / Event Log (timeline) ──────────────────────────────────────
export interface Aktivitas {
  id:              number;
  jenisAktivitas:  string;
  tanggal:         string | null;
  hasilAktivitas:  string;       // outcome text
  outcome:         string;       // same as hasilAktivitas
  eventType:       string;       // 'InteractionLogged' | 'SosialisasiApproved' | etc
  statusSesudah:   string;
  nextAction:      string | null;
  dueDate:         string | null;
  catatan:         string;
  pic:             PIC | null;
  jumlahSiswa:     number | null;
  statusAktif:     string | null;
  alasanTidakBisa: string | null;
  createdAt:       string;
}

// ── Aktivitas Ekstra ──────────────────────────────────────────────────────────
export interface AktivitasEkstra {
  id:               string;       // id_aktifitas_ekstra
  jenisAktivitas:   string;       // 'WhatsApp PIC' | 'Telepon PIC' | 'Meeting PIC'
  tanggalRencana:   string | null;
  tanggalRealisasi: string | null;
  tujuanCatatan:    string;
  pjAktivitas:      string;
  statusAktivitas:  'Direncanakan' | 'Selesai' | 'Dibatalkan';
  catatanHasil:     string | null;
  createdAt:        string;
}

// ── Detail Sekolah (detail page) ──────────────────────────────────────────────────────
export interface SekolahDetail extends Sekolah {
  jumlahSiswaKelas12: number;
  sekolahAktif:       string;    // sekolah_aktif di sekolah_periode
  alasanTidakBisa:    string;
  catatan:            string;
  aktivitas:          Aktivitas[];         // Event Log (append-only)
  aktivitasEkstra:    AktivitasEkstra[];
}

// ── API Response wrappers ─────────────────────────────────────────────────────
export interface SekolahListResponse {
  data:       Sekolah[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface SekolahStatsResponse {
  total:               number;
  cold:                number;  // Belum Visit
  belumVisit:          number;  // alias cold (backward compat)
  engaged:             number;  // Tunggu Visit Ulang + Tunggu Keputusan
  proses:              number;  // Semua tahap Engaged (alias, backward compat)
  sosialisasiTerjadwal:number;
  sosialisasi:         number;  // Sudah Sosialisasi
  identityCaptured?:   number;
  leadCaptured:        number;  // alias identityCaptured for backward compat
  tidakBisa:           number;
  nonaktif:            number;
}

// ── Filter params untuk list ──────────────────────────────────────────────────
export interface SekolahListParams {
  period?:    string;
  page?:      number;
  status?:    string;
  kecamatan?: string;
  pjCro?:     string;
  search?:    string;
  intent?:    string;
}

// ── Payload Tambah Sekolah ────────────────────────────────────────────────────
export interface TambahSekolahPayload {
  namaSekolah: string;
  tingkat:     string;
  kecamatan:   string;
  alamat?:     string;
  pjCro?:      string;
}

// ── Payload Edit Sekolah ──────────────────────────────────────────────────────
export interface EditSekolahPayload {
  namaSekolah?:       string;
  tingkat?:           string;
  kecamatan?:         string;
  alamat?:            string;
  statusAktif?:       string;
  picNama?:           string;
  picWa?:             string;
  jumlahSiswaKelas12?: number;
  sekolahAktif?:      string;
}

// ── Payload Input Aktivitas (BACKWARD COMPAT) ─────────────────────────────────────────────
export interface InputAktivitasPayload {
  jenisAktivitas:       string;
  tanggalAktivitas:     string;       // YYYY-MM-DD
  hasilAktivitas:       string;
  catatan:              string;
  dueDateNextAction?:   string | null;
  isUnplanned?:         boolean;

  // Wajib saat Visit Awal
  statusAktif?:         string;
  alamatLengkap?:       string;
  jumlahSiswaKelas12?:  number;
  namaPic?:             string;
  jabatanPic?:          string;
  noWaPic?:             string;

  // Wajib jika hasil Ditolak Final
  alasanTidakBisa?:     string;
  catatanAlasan?:       string;
}

// ── Payload Log Interaction (Event-Sourcing, Endpoint Baru) ────────────────────────
export interface LogInteractionPayload {
  outcome:              string;       // Kunci dari INTERACTION_OUTCOME_MAP
  channel:              string;       // 'Visit Langsung' | 'WhatsApp' | 'Telepon'
  catatanFakta:         string;       // Catatan wajib diisi
  tanggalInteraksi?:    string;       // YYYY-MM-DD (default hari ini)
  tanggalSosialisasi?:  string;       // Wajib jika outcome = 'Mendapat Izin Sosialisasi'

  // Wajib saat Visit Awal
  statusAktif?:         string;
  alamatLengkap?:       string;
  jumlahSiswaKelas12?:  number;
  namaPic?:             string;
  jabatanPic?:          string;
  noWaPic?:             string;

  // Wajib jika outcome = 'Ditolak Final'
  alasanTidakBisa?:     string;
  catatanAlasan?:       string;
}

// ── Payload Aktivitas Ekstra ───────────────────────────────────────────────────────────
export interface BuatEkstraPayload {
  jenisAktivitas: 'WhatsApp PIC' | 'Telepon PIC' | 'Meeting PIC';
  tanggalRencana: string;
  tujuanCatatan:  string;
  pjAktivitas?:   string;
}

export interface SelesaikanEkstraPayload {
  tanggalRealisasi: string;
  catatanHasil?:    string;
}

export interface BatalkanEkstraPayload {
  alasanBatal?: string;
}
