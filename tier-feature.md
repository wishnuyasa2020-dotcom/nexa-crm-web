# Nexa CRM - Tier & Feature Classification

Dokumen ini mendefinisikan rancangan klasifikasi tier, fitur, dan limitasi untuk sistem Multi-Tenant Nexa CRM (SaaS khusus LPK).

**Catatan Sistem (Business Logic):**
- Limit yang digunakan adalah **Ingestion Limit** (batas input data baru per periode tagihan), bukan Storage Limit. Data historis yang sudah diinput pada bulan sebelumnya tidak akan dihapus saat periode tagihan di-reset.
- **Reset Kuota Otomatis:** Sistem akan memiliki Cron Job background yang otomatis mereset kuota limit setiap tanggal billing/reset tenant.
- **UI UX:** Dashboard tenant harus menampilkan *Progress Bar* Limit (Misal: "Siswa Baru Terinput Bulan Ini: 800 / 1000") agar user paham pemakaian mereka.

---

## 1. Free Tenant
- **Harga Langganan:** Rp. 0,- / bulan atau tahun
- **Limit Input Siswa Baru:** Maksimal 300 siswa per periode reset 3 bulan (Setara 100 siswa/bulan).
- **Limit Input Sekolah Baru:** Maksimal 10 sekolah per periode reset 3 bulan.
- **Periode Reset Kuota:** 3 Bulan sekali.
- **Maksimum User:**
  - 1 User Administrator
  - 1 User Manager
  - 1 User Chief CRO
  - 1 User CRO
## 2. Pro Tenant
- **Harga Langganan:** 
  - Bulanan: Rp. 500.000 / bulan
  - Tahunan: Rp. 5.000.000 / tahun (Diskon 2 bulan, wajib dibayar dimuka)
- **Limit Input Siswa Baru:** Maksimal 1.000 siswa per bulan (atau 12.000 siswa/tahun jika langganan tahunan).
- **Limit Input Sekolah Baru:** Maksimal 20 sekolah per bulan (atau 240 sekolah/tahun jika langganan tahunan).
- **Periode Reset Kuota:** Mengikuti siklus tagihan (1 Bulan sekali untuk bulanan, atau 1 Tahun sekali untuk tahunan).
- **Maksimum User:**
  - 1 User Administrator
  - 1 User Manager
  - 1 User Chief CRO
  - 2 User CRO
  - **Fitur Add-on Seat (CRO):** Jika butuh tambahan user CRO tanpa upgrade ke Tier Business, dikenakan biaya Rp. 100.000/bulan per tambahan 1 akun CRO.
## 3. Business Tenant
- **Harga Langganan:** 
  - Bulanan: Rp. 1.500.000 / bulan
  - Tahunan: Rp. 15.000.000 / tahun (Diskon 3 juta, wajib dibayar dimuka)
- **Limit Input Siswa Baru:** 
  - Jika tagihan bulanan: Maksimal 2.500 siswa per bulan.
  - Jika tagihan tahunan: Maksimal 30.000 siswa per tahun.
- **Limit Input Sekolah Baru:** 
  - Jika tagihan bulanan: Maksimal 41 sekolah per bulan.
  - Jika tagihan tahunan: Maksimal 500 sekolah per tahun.
- **Periode Reset Kuota:** Selaras dengan siklus tagihan (Di-reset tiap 1 bulan jika bayar bulanan, atau tiap 12 bulan jika bayar tahunan).
- **Maksimum User:**
  - 1 User Administrator
  - 1 User Manager
  - 3 User Chief CRO
  - 10 User CRO
  - **Fitur Add-on Seat (CRO):** Tersedia seharga Rp. 100.000/bulan per tambahan 1 akun CRO.

## 4. Enterprise Tenant
- **Harga Langganan:** 
  - Bulanan (Kontrak): Rp. 4.000.000 / bulan (Berdasarkan kontrak perjanjian tertulis, wajib dibayar dimuka setiap bulan).
  - Tahunan (Kontrak 3 Tahun): Rp. 40.000.000 / tahun (Wajib dibayar dimuka setiap tahunnya).
  - Lifetime Access (Sekali Bayar): Rp. 100.000.000 dibayar dimuka.
- **Limit Input Siswa Baru:** 
  - Jika tagihan bulanan: Maksimal 8.333 siswa per bulan.
  - Jika tagihan tahunan / Lifetime: Maksimal 100.000 siswa per tahun.
- **Limit Input Sekolah Baru:** 
  - Jika tagihan bulanan: Maksimal 166 sekolah per bulan.
  - Jika tagihan tahunan / Lifetime: Maksimal 2.000 sekolah per tahun.
- **Periode Reset Kuota:** Mengikuti siklus tagihan. Khusus untuk akses **Lifetime**, kuota limit (100.000 siswa & 2.000 sekolah) akan di-reset setiap siklus 12 bulan dari tanggal aktivasi.
- **Maksimum User:**
  - 1 User Administrator
  - 3 User Manager
  - 5 User Chief CRO
  - 30 User CRO
- **Syarat & Ketentuan Lifetime Access (S&K):** Akses "Lifetime" berlaku maksimal selama 10 tahun atau selama sistem produk SaaS Nexa CRM beroperasi. Hal ini untuk memitigasi bengkaknya biaya operasional server di masa depan.
