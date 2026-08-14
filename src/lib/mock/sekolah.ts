// ============================================================
// MOCK DATA — Modul Sekolah (Nexa CRM)
// Data sementara selama API belum siap / dev mode
// ============================================================

export interface MockPIC {
  nama: string;
  jabatan: string;
  noWa: string;
}

export interface MockAktivitas {
  id: number;
  jenisAktivitas: string;
  tanggal: string; // ISO date
  hasilAktivitas: string;
  isDowngrade: boolean;
  statusSebelum: string;
  statusSesudah: string;
  nextAction: string | null;
  dueDate: string | null;
  catatan: string;
  pjCro: string;
  isUnplanned: boolean;
  editedBy?: string;
  editedAt?: string;
  createdAt: string; // ISO datetime
}

export interface MockAktivitasEkstra {
  id: string;
  jenisAktivitas: 'WhatsApp PIC' | 'Telepon PIC' | 'Meeting PIC';
  tanggalRencana: string;
  tujuanCatatan: string;
  pjAktivitas: string;
  statusAktivitas: 'Direncanakan' | 'Selesai' | 'Dibatalkan';
  tanggalRealisasi?: string;
  catatanHasil?: string;
  alasanBatal?: string;
  createdAt: string;
}

export interface MockSekolah {
  id: string;           // SCH-000001
  idRecord: string;     // same as id (legacy compat)
  nama: string;
  tingkat: string;
  kecamatan: string;
  alamat: string;
  statusAktif: 'Aktif' | 'Nonaktif' | 'Belum Diketahui';
  jumlahSiswaKelas12: number;
  // CRM state (sekolah_periode)
  status: string;
  nextAction: string | null;
  dueDate: string | null;
  pjCro: string;
  marketingPeriod: string;
  // Relations
  pic: MockPIC | null;
  aktivitas: MockAktivitas[];
  aktivitasEkstra: MockAktivitasEkstra[];
  createdAt: string;
}

// ---- Hari ini sebagai referensi tanggal ----
const TODAY = '2026-08-14';
const FMT = (d: string) => d; // ISO string passthrough

export const MOCK_SEKOLAH: MockSekolah[] = [
  {
    id: 'SCH-000001',
    idRecord: 'SCH-000001',
    nama: 'SMA Negeri 1 Kota',
    tingkat: 'SMA',
    kecamatan: 'Sukajadi',
    alamat: 'Jl. Sudirman No. 5, Bandung',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 210,
    status: 'Tunggu Jadwal Sosialisasi',
    nextAction: 'Jadwalkan Sosialisasi',
    dueDate: '2026-08-06', // overdue >8 hari → 🟠
    pjCro: 'Budi Santoso',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Ibu Wulandari', jabatan: 'Guru BK', noWa: '08123456001' },
    aktivitas: [
      {
        id: 1, jenisAktivitas: 'Follow Up', tanggal: '2026-08-10',
        hasilAktivitas: 'Jadwal Sosialisasi Dibatalkan',
        isDowngrade: true,
        statusSebelum: 'Sosialisasi Terjadwal', statusSesudah: 'Tunggu Jadwal Sosialisasi',
        nextAction: 'Jadwalkan Sosialisasi', dueDate: '2026-08-14',
        catatan: 'PIC mendadak tidak bisa hadir, minta reschedule minggu depan',
        pjCro: 'Budi Santoso', isUnplanned: false,
        createdAt: '2026-08-10T09:30:00',
      },
      {
        id: 2, jenisAktivitas: 'Follow Up', tanggal: '2026-08-08',
        hasilAktivitas: 'Jadwal Sosialisasi Disepakati',
        isDowngrade: false,
        statusSebelum: 'Tunggu Jadwal Sosialisasi', statusSesudah: 'Sosialisasi Terjadwal',
        nextAction: 'Laksanakan Sosialisasi', dueDate: '2026-08-10',
        catatan: 'Jadwal disepakati tanggal 10 Agustus',
        pjCro: 'Budi Santoso', isUnplanned: false,
        createdAt: '2026-08-08T14:20:00',
      },
      {
        id: 3, jenisAktivitas: 'Visit Awal', tanggal: '2026-07-28',
        hasilAktivitas: 'Izin Sosialisasi',
        isDowngrade: false,
        statusSebelum: 'Belum Visit', statusSesudah: 'Tunggu Jadwal Sosialisasi',
        nextAction: 'Jadwalkan Sosialisasi', dueDate: '2026-08-05',
        catatan: 'PIC menyambut baik, akan koordinasi jadwal',
        pjCro: 'Budi Santoso', isUnplanned: false,
        createdAt: '2026-07-28T10:00:00',
      },
    ],
    aktivitasEkstra: [
      {
        id: 'AE-000001', jenisAktivitas: 'WhatsApp PIC',
        tanggalRencana: '2026-08-15', tujuanCatatan: 'Konfirmasi ulang jadwal sosialisasi',
        pjAktivitas: 'Budi Santoso', statusAktivitas: 'Direncanakan',
        createdAt: '2026-08-12T10:00:00',
      },
    ],
    createdAt: '2026-07-20T08:00:00',
  },
  {
    id: 'SCH-000002',
    idRecord: 'SCH-000002',
    nama: 'SMK Bintang Timur',
    tingkat: 'SMK',
    kecamatan: 'Buahbatu',
    alamat: 'Jl. Soekarno Hatta No. 100',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 320,
    status: 'Tunggu Keputusan',
    nextAction: 'Meeting PIC',
    dueDate: '2026-08-14', // hari ini
    pjCro: 'Sari Dewi',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Pak Rahmat', jabatan: 'Wakasek Kurikulum', noWa: '08123456002' },
    aktivitas: [
      {
        id: 4, jenisAktivitas: 'Visit Awal', tanggal: '2026-08-12',
        hasilAktivitas: 'Diminta Meeting',
        isDowngrade: false,
        statusSebelum: 'Belum Visit', statusSesudah: 'Tunggu Keputusan',
        nextAction: 'Meeting PIC', dueDate: '2026-08-14',
        catatan: 'PIC antusias tapi minta meeting resmi dengan kepala sekolah',
        pjCro: 'Sari Dewi', isUnplanned: false,
        createdAt: '2026-08-12T11:00:00',
      },
    ],
    aktivitasEkstra: [],
    createdAt: '2026-08-01T09:00:00',
  },
  {
    id: 'SCH-000003',
    idRecord: 'SCH-000003',
    nama: 'SMA Al-Azhar Bandung',
    tingkat: 'SMA',
    kecamatan: 'Antapani',
    alamat: 'Jl. Arcamanik No. 8',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 180,
    status: 'Sudah Sosialisasi',
    nextAction: 'Input Data Siswa',
    dueDate: '2026-08-15', // besok
    pjCro: 'Budi Santoso',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Ibu Fatimah', jabatan: 'Guru BK', noWa: '08123456003' },
    aktivitas: [
      {
        id: 5, jenisAktivitas: 'Laksanakan Sosialisasi', tanggal: '2026-08-14',
        hasilAktivitas: 'Sosialisasi Selesai',
        isDowngrade: false,
        statusSebelum: 'Sosialisasi Terjadwal', statusSesudah: 'Sudah Sosialisasi',
        nextAction: 'Input Data Siswa', dueDate: '2026-08-15',
        catatan: 'Sosialisasi berjalan lancar, siswa antusias. Presentasi 2 jam.',
        pjCro: 'Budi Santoso', isUnplanned: false,
        createdAt: '2026-08-14T15:00:00',
      },
    ],
    aktivitasEkstra: [
      {
        id: 'AE-000002', jenisAktivitas: 'WhatsApp PIC',
        tanggalRencana: '2026-08-15', tujuanCatatan: 'Konfirmasi jadwal serah data siswa',
        pjAktivitas: 'Budi Santoso', statusAktivitas: 'Direncanakan',
        createdAt: '2026-08-14T16:00:00',
      },
    ],
    createdAt: '2026-07-25T09:00:00',
  },
  {
    id: 'SCH-000004',
    idRecord: 'SCH-000004',
    nama: 'SMA Harapan Bangsa',
    tingkat: 'SMA',
    kecamatan: 'Cimahi Selatan',
    alamat: 'Jl. Padasuka No. 22',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 95,
    status: 'Lead Captured',
    nextAction: null,
    dueDate: null,
    pjCro: 'Sari Dewi',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Pak Dedi', jabatan: 'Guru BK', noWa: '08123456004' },
    aktivitas: [
      {
        id: 6, jenisAktivitas: 'Input Data Siswa', tanggal: '2026-08-10',
        hasilAktivitas: 'Data Siswa Terinput',
        isDowngrade: false,
        statusSebelum: 'Sudah Sosialisasi', statusSesudah: 'Lead Captured',
        nextAction: null, dueDate: null,
        catatan: '95 siswa kelas 12, data sudah lengkap di sistem',
        pjCro: 'Sari Dewi', isUnplanned: false,
        createdAt: '2026-08-10T13:00:00',
      },
    ],
    aktivitasEkstra: [
      {
        id: 'AE-000003', jenisAktivitas: 'Telepon PIC',
        tanggalRencana: '2026-08-10', tujuanCatatan: 'Follow up jadwal input siswa',
        pjAktivitas: 'Sari Dewi', statusAktivitas: 'Selesai',
        tanggalRealisasi: '2026-08-10', catatanHasil: 'PIC konfirmasi data sudah siap',
        createdAt: '2026-08-08T10:00:00',
      },
    ],
    createdAt: '2026-07-15T10:00:00',
  },
  {
    id: 'SCH-000005',
    idRecord: 'SCH-000005',
    nama: 'SMK Triguna Utama',
    tingkat: 'SMK',
    kecamatan: 'Coblong',
    alamat: 'Jl. Dipatiukur No. 35',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 260,
    status: 'Belum Visit',
    nextAction: 'Visit Awal',
    dueDate: null,
    pjCro: 'Andi Pratama',
    marketingPeriod: '2026/2027',
    pic: null,
    aktivitas: [],
    aktivitasEkstra: [],
    createdAt: '2026-08-13T08:00:00',
  },
  {
    id: 'SCH-000006',
    idRecord: 'SCH-000006',
    nama: 'MA Darul Ulum',
    tingkat: 'MA',
    kecamatan: 'Cibeunying Kidul',
    alamat: 'Jl. Cikutra No. 71',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 140,
    status: 'Tunggu Visit Ulang',
    nextAction: 'Visit Ulang',
    dueDate: '2026-07-30', // overdue >14 hari → 🔴
    pjCro: 'Andi Pratama',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Ustadz Hamid', jabatan: 'Waka Kesiswaan', noWa: '08123456006' },
    aktivitas: [
      {
        id: 7, jenisAktivitas: 'Visit Awal', tanggal: '2026-07-28',
        hasilAktivitas: 'Belum Bertemu PIC',
        isDowngrade: false,
        statusSebelum: 'Belum Visit', statusSesudah: 'Tunggu Visit Ulang',
        nextAction: 'Visit Ulang', dueDate: '2026-07-30',
        catatan: 'Kepala sekolah sedang dinas luar, PIC tidak ada. Diminta kembali.',
        pjCro: 'Andi Pratama', isUnplanned: false,
        createdAt: '2026-07-28T10:30:00',
      },
    ],
    aktivitasEkstra: [],
    createdAt: '2026-07-20T09:00:00',
  },
  {
    id: 'SCH-000007',
    idRecord: 'SCH-000007',
    nama: 'SMA Pasundan 2',
    tingkat: 'SMA',
    kecamatan: 'Regol',
    alamat: 'Jl. Lengkong Kecil No. 18',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 300,
    status: 'Sosialisasi Terjadwal',
    nextAction: 'Laksanakan Sosialisasi',
    dueDate: '2026-08-20',
    pjCro: 'Sari Dewi',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Ibu Neni', jabatan: 'Guru BK', noWa: '08123456007' },
    aktivitas: [
      {
        id: 8, jenisAktivitas: 'Jadwalkan Sosialisasi', tanggal: '2026-08-12',
        hasilAktivitas: 'Jadwal Sosialisasi Disepakati',
        isDowngrade: false,
        statusSebelum: 'Tunggu Jadwal Sosialisasi', statusSesudah: 'Sosialisasi Terjadwal',
        nextAction: 'Laksanakan Sosialisasi', dueDate: '2026-08-20',
        catatan: 'Jadwal sosialisasi: 20 Agustus jam 09.00 di Aula sekolah',
        pjCro: 'Sari Dewi', isUnplanned: false,
        createdAt: '2026-08-12T14:00:00',
      },
    ],
    aktivitasEkstra: [],
    createdAt: '2026-07-22T10:00:00',
  },
  {
    id: 'SCH-000008',
    idRecord: 'SCH-000008',
    nama: 'SMK Negeri 2 Bandung',
    tingkat: 'SMK',
    kecamatan: 'Cicendo',
    alamat: 'Jl. Ciliwung No. 4',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 450,
    status: 'Tidak Bisa Sosialisasi',
    nextAction: null,
    dueDate: null,
    pjCro: 'Budi Santoso',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Pak Supriadi', jabatan: 'Wakasek', noWa: '08123456008' },
    aktivitas: [
      {
        id: 9, jenisAktivitas: 'Visit Ulang', tanggal: '2026-08-05',
        hasilAktivitas: 'Ditolak Final',
        isDowngrade: false,
        statusSebelum: 'Tunggu Keputusan', statusSesudah: 'Tidak Bisa Sosialisasi',
        nextAction: null, dueDate: null,
        catatan: 'Kepala sekolah sudah kontrak eksklusif dengan lembaga lain',
        pjCro: 'Budi Santoso', isUnplanned: false,
        createdAt: '2026-08-05T11:00:00',
      },
    ],
    aktivitasEkstra: [],
    createdAt: '2026-07-10T09:00:00',
  },
  {
    id: 'SCH-000009',
    idRecord: 'SCH-000009',
    nama: 'SMA Kartika Siliwangi',
    tingkat: 'SMA',
    kecamatan: 'Sumur Bandung',
    alamat: 'Jl. Aceh No. 76',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 175,
    status: 'Belum Visit',
    nextAction: 'Visit Awal',
    dueDate: null,
    pjCro: 'Sari Dewi',
    marketingPeriod: '2026/2027',
    pic: null,
    aktivitas: [],
    aktivitasEkstra: [],
    createdAt: '2026-08-14T07:30:00',
  },
  {
    id: 'SCH-000010',
    idRecord: 'SCH-000010',
    nama: 'SMA Negeri 3 Bandung',
    tingkat: 'SMA',
    kecamatan: 'Coblong',
    alamat: 'Jl. Belitung No. 8',
    statusAktif: 'Aktif',
    jumlahSiswaKelas12: 520,
    status: 'Tunggu Keputusan',
    nextAction: 'Follow Up',
    dueDate: '2026-08-18',
    pjCro: 'Andi Pratama',
    marketingPeriod: '2026/2027',
    pic: { nama: 'Ibu Rini', jabatan: 'Guru BK', noWa: '08123456010' },
    aktivitas: [
      {
        id: 10, jenisAktivitas: 'Visit Awal', tanggal: '2026-08-13',
        hasilAktivitas: 'Menunggu Keputusan',
        isDowngrade: false,
        statusSebelum: 'Belum Visit', statusSesudah: 'Tunggu Keputusan',
        nextAction: 'Follow Up', dueDate: '2026-08-18',
        catatan: 'Kepala sekolah akan rapat dulu dengan yayasan, keputusan dalam seminggu',
        pjCro: 'Andi Pratama', isUnplanned: false,
        createdAt: '2026-08-13T10:00:00',
      },
    ],
    aktivitasEkstra: [],
    createdAt: '2026-08-05T09:00:00',
  },
];

// ---- Helper functions ----

export function getMockSekolahList(params?: {
  search?: string;
  filterStatus?: string;
  filterKecamatan?: string;
  filterCro?: string;
  page?: number;
  pageSize?: number;
}): { data: MockSekolah[]; total: number } {
  let list = [...MOCK_SEKOLAH];

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      s.kecamatan.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }
  if (params?.filterStatus) {
    list = list.filter(s => s.status === params.filterStatus);
  }
  if (params?.filterKecamatan) {
    list = list.filter(s => s.kecamatan === params.filterKecamatan);
  }
  if (params?.filterCro) {
    list = list.filter(s => s.pjCro === params.filterCro);
  }

  const total = list.length;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const data = list.slice(start, start + pageSize);

  return { data, total };
}

export function getMockSekolahById(id: string): MockSekolah | null {
  return MOCK_SEKOLAH.find(s => s.id === id) ?? null;
}

export function getMockKecamatanList(): string[] {
  return [...new Set(MOCK_SEKOLAH.map(s => s.kecamatan))].sort();
}

export function getMockCROList(): string[] {
  return [...new Set(MOCK_SEKOLAH.map(s => s.pjCro))].sort();
}

export function getMockStatSummary() {
  const total = MOCK_SEKOLAH.length;
  const belumVisit = MOCK_SEKOLAH.filter(s => s.status === 'Belum Visit').length;
  const proses = MOCK_SEKOLAH.filter(s =>
    ['Tunggu Visit Ulang', 'Tunggu Keputusan', 'Tunggu Jadwal Sosialisasi', 'Sosialisasi Terjadwal'].includes(s.status)
  ).length;
  const sosialisasi = MOCK_SEKOLAH.filter(s => s.status === 'Sudah Sosialisasi').length;
  const leadCaptured = MOCK_SEKOLAH.filter(s => s.status === 'Lead Captured').length;
  const tidakBisa = MOCK_SEKOLAH.filter(s => s.status === 'Tidak Bisa Sosialisasi').length;
  return { total, belumVisit, proses, sosialisasi, leadCaptured, tidakBisa };
}
