'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, School, Shield, Users, CheckCircle2, AlertTriangle, Info,
  ArrowRight, Search, ChevronDown, ChevronRight, MessageSquare, Radio,
  TrendingUp, Clock, Calendar, CheckSquare, Zap, Sparkles, Send,
  FileText, Key, Phone, Mail, ExternalLink, RefreshCw, UserCheck, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PanduanPage() {
  const [activeTab, setActiveTab] = useState<'sekolah' | 'admin' | 'cro'>('sekolah');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'b2b-pipeline': true,
    'b2b-decision': true,
    'admin-assign-kelas': true,
    'admin-waba': true,
    'admin-smartrouting': true,
    'admin-domains': true,
    'cro-funnel': true,
    'cro-territorial': true,
    'cro-fnar': true,
    'cro-tasks': true,
    'cro-chat': true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-16 md:pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <BookOpen size={13} className="shrink-0" />
              <span>SOP & KNOWLEDGE BASE NEXA CRM</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Panduan Penggunaan Tenant
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Pusat referensi dan standar operasional berbasis bukti (<strong>Event-Sourcing CQRS</strong>) untuk Tim CRO, Chief CRO, Manager, dan Administrator.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Cari SOP, konsep, fitur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons (Touch Friendly & Horizontally Scrollable on Mobile) */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border overflow-x-auto scrollbar-none pb-1 touch-pan-x">
          <button
            onClick={() => setActiveTab('sekolah')}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer",
              activeTab === 'sekolah'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <School size={15} className="shrink-0" />
            <span>1. Pipeline Sekolah (B2B)</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer",
              activeTab === 'admin'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Shield size={15} className="shrink-0" />
            <span>2. Admin (Sistem & Layanan)</span>
          </button>

          <button
            onClick={() => setActiveTab('cro')}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer",
              activeTab === 'cro'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Users size={15} className="shrink-0" />
            <span>3. CRO (Siswa & Lapangan)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PIPELINE SEKOLAH (B2B)                                             */}
      {/* ========================================================================= */}
      {activeTab === 'sekolah' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
          {/* Intro Card */}
          <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <School size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Konsep Kemitraan Sekolah (B2B)</h2>
                  <p className="text-xs text-muted-foreground">Pemisahan relasi institusional dengan transaksi komersial siswa</p>
                </div>
              </div>
              <Link
                href="/sekolah"
                className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
              >
                <span>Buka Data Sekolah</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Di dalam filosofi Nexa OS, <strong>Sekolah (B2B) dan Siswa (B2C) adalah dua alam yang berbeda</strong>. Sekolah bukanlah pihak yang membeli paket pelatihan atau membayar biaya formulir. Sekolah berfungsi sebagai <em>Decision Environment</em> dan penyedia izin sosialisasi.
              </p>
              <div className="p-3.5 rounded-xl bg-secondary/50 border text-xs text-foreground space-y-1.5">
                <p className="font-semibold text-purple-600 flex items-center gap-1.5">
                  <Info size={14} className="shrink-0" /> Aturan Baku Ontologi Nexa OS:
                </p>
                <p>
                  Status sekolah yang "Mendukung" atau "Aktif MoU" <strong>TIDAK OTOMATIS</strong> membuat siswanya berstatus Qualified/Prospect. Siswa tetap wajib melewati kualifikasi individu berbasis bukti (FNAR Framework).
                </p>
              </div>
            </div>
          </div>

          {/* 4 Tahap Pipeline Sekolah */}
          {matchesSearch('pipeline sekolah tahapan identified engaged sosialisasi') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('b2b-pipeline')}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">4 Tahapan Siklus Kemitraan Sekolah</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['b2b-pipeline'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['b2b-pipeline'] && (
                <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-background/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border">Tahap 1</span>
                      <span className="text-xs font-semibold text-amber-500">Belum Visit (Identified)</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Identifikasi Data Sekolah</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sekolah target telah masuk dalam master wilayah binaan, memiliki estimasi kuota siswa kelas 12, namun tim operasional belum pernah melakukan kunjungan tatap muka ke pihak institusi.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-background/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">Tahap 2</span>
                      <span className="text-xs font-semibold text-blue-500">Tunggu Visit Ulang (Engaged)</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Kunjungan Penjajakan Awal</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Chief CRO atau Manager telah bertemu dengan Guru BK/Humas. Penawaran telah diajukan dan sedang menunggu penjadwalan presentasi kelas atau konfirmasi izin dinas.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-background/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">Tahap 3</span>
                      <span className="text-xs font-semibold text-purple-500">Sudah Sosialisasi</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Eksekusi Presentasi Lapangan</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tim CRO telah melakukan presentasi di aula atau kelas. Form QR publik dan brosur program telah disebarkan. Mencapai tahap ini membuka akses bagi Chief CRO untuk mengeksekusi penugasan teritorial (<strong>Assign Kelas ke CRO</strong>) di Modul Siswa.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-background/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Tahap 4</span>
                      <span className="text-xs font-semibold text-emerald-500">Identity Captured / Active Partner</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Penyerapan Audiens & Kemitraan Sah</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Data kontak siswa berhasil terserap ke CRM secara masif. Dokumen MoU kerja sama resmi telah ditandatangani dan diarsipkan ke dalam sistem bukti.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision Environment & Peran Validator */}
          {matchesSearch('guru bk kepsek validator peran cro chief manager') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('b2b-decision')}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Peran Guru BK sebagai "Validator" & Pembagian Tugas</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['b2b-decision'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['b2b-decision'] && (
                <div className="pt-2 space-y-4 text-sm leading-relaxed">
                  <div className="p-4 rounded-xl bg-secondary/40 border space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600">
                      Jaring Keputusan Institusi (Decision Environment)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Siswa SMA/SMK tidak dapat memutuskan keikutsertaan program luar negeri sendirian tanpa validasi sekolah. Guru BK, Wali Kelas, dan Kepala Sekolah berperan sebagai <strong>Validator & Trust Anchor</strong> yang memberikan kepastian bagi orang tua siswa bahwa program lembaga terdaftar resmi dan kredibel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-card space-y-1.5">
                      <div className="font-bold text-foreground text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        Peran CRO (Read-Only di Modul Sekolah)
                      </div>
                      <p className="text-xs text-muted-foreground">
                        CRO <strong>dilarang mengubah status kemitraan sekolah</strong>. CRO berfokus melayani prospek siswa di kelas yang telah di-assign, mengeksekusi kunjungan sosialisasi terjadwal, dan menginput tugas harian.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-card space-y-1.5">
                      <div className="font-bold text-foreground text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        Peran Chief CRO, Manager & Admin
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Bertanggung jawab penuh dalam negosiasi MoU dengan Kepala Sekolah, manajemen wilayah kecamatan binaan, dan mengalokasikan kelas binaan kepada CRO secara adil.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADMIN (SISTEM, LAYANAN, TEMPLATE & SMART ROUTING)                   */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
          {/* Quick Links Admin */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <Link
              href="/manajemen-tim"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">Manajemen Tim</h4>
                  <p className="text-xs text-muted-foreground truncate">Kelola staf &amp; seat</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
            </Link>

            <Link
              href="/siswa"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <UserCheck size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">Penugasan Kelas</h4>
                  <p className="text-xs text-muted-foreground truncate">Assign Kelas ke CRO</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
            </Link>

            <Link
              href="/settings?tab=whatsapp"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">WhatsApp Bisnis</h4>
                  <p className="text-xs text-muted-foreground truncate">Status WABA &amp; SIM</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
            </Link>

            <Link
              href="/templates"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">Template Admin</h4>
                  <p className="text-xs text-muted-foreground truncate">Smart Routing</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
            </Link>
          </div>

          {/* 🌟 PANDUAN LANGKAH DEMI LANGKAH: CARA CHIEF CRO & ADMIN MELAKUKAN PENUGASAN KELAS KE CRO */}
          {matchesSearch('assign kelas penugasan teritorial chief cro manager admin replace auto inherit b2c langkah sop panduan') && (
            <div className="rounded-2xl border-2 border-purple-500/30 bg-card p-4 sm:p-6 md:p-7 shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm w-fit mb-1 sm:mb-0 sm:absolute sm:top-0 sm:right-0 sm:rounded-none sm:rounded-bl-xl">
                Otoritas Khusus Chief CRO, Manager &amp; Admin
              </div>

              <div 
                className="flex items-center justify-between cursor-pointer select-none pt-1 sm:pt-2 min-h-11"
                onClick={() => toggleSection('admin-assign-kelas')}
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <UserCheck size={20} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                      SOP &amp; Panduan Lengkap: Cara Melakukan Penugasan Kelas ke Staf CRO
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Panduan langkah demi langkah bagi Chief CRO, Manager, dan Admin dalam mendistribusikan teritorial kelas (1 Kelas = 1 CRO), mekanisme Auto-Replace, dan pewarisan otomatis siswa baru.
                    </p>
                  </div>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-assign-kelas'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {expandedSections['admin-assign-kelas'] && (
                <div className="pt-2 sm:pt-3 space-y-4 sm:space-y-5">
                  {/* Banner Ringkasan Filosofi 1 Komando */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                      <Shield size={16} className="shrink-0" />
                      Prinsip Distribusi Teritorial Satu Komando
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Penugasan hak asuh prospek siswa (B2C) dilakukan berbasis unit <strong>KELAS</strong> di sekolah binaan tertentu (contoh: <em>Kelas 12 TKJ 1 di SMKS Hasina</em>). Tombol eksekusi penugasan ini <strong>hanya dapat diakses oleh akun berkedudukan Chief CRO, Manager, dan Administrator</strong> guna mencegah perebutan prospek liar antar-staf di lapangan.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                        <span className="text-foreground"><strong>1 Kelas = 1 CRO:</strong> Menghindari kanibalisasi</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                        <span className="text-foreground"><strong>Auto-Replace:</strong> Ganti CRO otomatis seketika</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                        <span className="text-foreground"><strong>Auto-Inherit:</strong> Siswa baru otomatis diwariskan</span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Langkah Demi Langkah Praktis */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600 shrink-0" />
                      Langkah Demi Langkah Eksekusi di Dashboard CRM:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
                      {/* Step 1 */}
                      <div className="p-4 rounded-xl border bg-background space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            Langkah 1
                          </span>
                          <Link
                            href="/siswa"
                            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold text-xs"
                          >
                            <span>Buka Halaman Siswa</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">Masuk ke Menu Data Siswa (/siswa)</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          Pastikan Anda login ke CRM menggunakan akun dengan peran <strong>Chief CRO</strong>, <strong>Manager</strong>, atau <strong>Admin</strong>. Klik menu <strong>Siswa</strong> pada sidebar navigasi kiri utama.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-4 rounded-xl border bg-background space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            Langkah 2
                          </span>
                          <span className="text-muted-foreground text-xs font-mono font-semibold">[ 📑 Assign Kelas ]</span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">Klik Tombol [ Assign Kelas ]</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          Di bagian header atas halaman (bersebelahan dengan tombol <em>Tambah Siswa</em>, <em>Import</em>, dan <em>Export</em>), klik tombol <strong>Assign Kelas</strong> berwarna ungu untuk membuka modal dialog penugasan wilayah.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-4 rounded-xl border bg-background space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Langkah 3
                          </span>
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 size={13} /> Filter Validasi Otomatis
                          </span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">Pilih Sekolah Binaan (Sudah Sosialisasi)</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          Pilih nama sekolah target dari dropdown <strong>1. Pilih Sekolah</strong>. Sistem secara otomatis hanya menampilkan sekolah yang berstatus minimal <strong>Sudah Sosialisasi</strong> atau <strong>Identity Captured</strong> untuk menjamin data audiens kelas sudah ada di database.
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="p-4 rounded-xl border bg-background space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Langkah 4
                          </span>
                          <span className="text-muted-foreground text-xs">Cek Kuota &amp; CRO Saat Ini</span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">Pilih Kelas yang Hendak Ditugaskan</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          Pilih kelas pada dropdown <strong>2. Pilih Kelas</strong>. Sistem akan menyajikan seluruh kelas aktif yang telah terdaftar dari sekolah tersebut (baik hasil form konfirmasi publik QR, import file, maupun input manual), lengkap dengan info jumlah siswa dan pemegang CRO saat ini.
                        </p>
                      </div>

                      {/* Step 5 */}
                      <div className="p-4 rounded-xl border bg-background space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Langkah 5
                          </span>
                          <span className="text-muted-foreground text-xs">Target CRO</span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">Tentukan Staf CRO Penerima Mandat</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          Pilih staf CRO aktif yang akan bertanggung jawab penuh mengelola kelas tersebut dari dropdown <strong>3. Pilih Target CRO</strong>. Staf ini nantinya memegang hak asuh atas seluruh siswa di kelas tersebut.
                        </p>
                      </div>

                      {/* Step 6 */}
                      <div className="p-4 rounded-xl border bg-background space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Langkah 6
                          </span>
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <Zap size={13} /> Eksekusi Aman &amp; Cepat
                          </span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">Tinjau Ringkasan &amp; Eksekusi Assign</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          Tinjau kotak ringkasan pratinjau. Jika kelas sudah dipegang CRO lama, sistem akan mengonfirmasi <strong>Auto-Replace</strong>. Klik tombol <strong>[ Assign Kelas Sekarang ]</strong>. Seluruh siswa seketika berpindah ke CRO target tanpa ada data yang tertinggal!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Jaminan Otomatisasi & Integritas Pasca Penugasan */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-background border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                      <RefreshCw size={16} className="shrink-0" />
                      3 Jaminan Otomatisasi &amp; Integritas Sistem Pasca-Penugasan (Must-Know Admin):
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-secondary/40 border space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          1. Garansi Pewarisan Hak Asuh Siswa Baru (Auto-Inheritance):
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Setelah kelas di-assign ke seorang CRO, <strong>Chief CRO TIDAK PERLU melakukan assign ulang</strong> jika di kemudian hari ada siswa baru yang menyusul mendaftar. Baik melalui <em>Form Publik QR Sosialisasi (https://form-konfirmasi.nexamos.cloud)</em>, <em>Import Excel</em>, maupun <em>Input Manual</em>, siswa baru pada sekolah &amp; kelas tersebut secara otomatis langsung diwariskan ke CRO pemegang kelas saat ini.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/40 border space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          2. Sistem Auto-Replace Terintegrasi (Tanpa Data Tercecer):
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Chief CRO dapat memindahkan hak asuh kelas sewaktu-waktu (misalnya saat rotasi tim atau staf berhalangan). Sistem akan otomatis me-replace penanggung jawab seluruh siswa di kelas tersebut ke CRO baru dalam satu transaksi database atomik yang aman.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/40 border space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          3. Audit Trail Permanen Event-Sourcing CQRS:
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Setiap penugasan kelas tercatat permanen di <code>events_log</code> dengan tipe event <code>ClassAssignedToCro</code>. Log ini mencatat ID sekolah, nama kelas, CRO lama, CRO baru, total siswa yang dialihkan, serta identitas Chief CRO yang melakukan penugasan untuk audit akuntabilitas dan perhitungan insentif kinerja.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🌟 HIGHLIGHT KHUSUS: SERVICE WINDOW & DUAL SMART ROUTING */}
          {matchesSearch('service window sw open sw closed smart routing dual template hemat biaya fallback') && (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-card p-4 sm:p-6 md:p-7 shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm w-fit mb-1 sm:mb-0 sm:absolute sm:top-0 sm:right-0 sm:rounded-none sm:rounded-bl-xl">
                Keunggulan Eksklusif Nexa MOS
              </div>

              <div 
                className="flex items-center justify-between cursor-pointer select-none pt-1 sm:pt-2 min-h-11"
                onClick={() => toggleSection('admin-smartrouting')}
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <Zap size={20} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                      Konsep Service Window Meta & Inovasi Dual Smart Routing Nexa MOS
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Solusi penghematan biaya pesan WhatsApp hingga 80% dengan jaminan 100% keterkiriman pesan
                    </p>
                  </div>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-smartrouting'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {expandedSections['admin-smartrouting'] && (
                <div className="pt-2 sm:pt-3 space-y-4 sm:space-y-5">
                  {/* Penjelasan Service Window 24 Jam Meta */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-background border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Clock size={16} className="shrink-0" /> 1. Mengenal Regulasi 24-Hour Service Window (SW) Meta
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      WhatsApp Cloud API memberlakukan batasan ketat percakapan berbasis <strong>Service Window (SW)</strong> yang dihitung 24 jam sejak pesan terakhir diterima dari audiens:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          SW OPEN (Jendela Terbuka / 24 Jam Aktif)
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Siswa baru saja mengirim chat ke nomor WABA Anda. Selama 24 jam ini, Anda dapat membalas dengan teks biasa atau tombol <strong>100% GRATIS tanpa biaya Meta!</strong>
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                          SW CLOSED (Jendela Tertutup / Di luar 24 Jam)
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sudah lewat 24 jam sejak pesan siswa terakhir. Meta <strong>melarang pengiriman teks biasa</strong> dan mewajibkan Template Meta resmi yang dikenakan tarif per percakapan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Solusi Dual Smart Routing */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-background border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                      <Sparkles size={16} className="shrink-0" /> 2. Mengapa Dual Smart Routing Nexa MOS Sangat Unggul?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pada CRM WhatsApp konvensional, setiap kali staf menekan kirim template, sistem langsung memanggil Meta API berbayar meskipun Service Window siswa sedang terbuka. <strong>Nexa MOS menghentikan pemborosan ini:</strong>
                    </p>

                    <div className="space-y-2.5 pt-1 text-xs">
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/40 border">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">Dual-Template Pairing:</strong> Setiap broadcast dan template di Nexa dipasangkan menjadi 2 format: <em>Meta Template</em> (untuk audiens dengan SW Tutup) dan <em>CRM Template</em> (untuk audiens dengan SW Buka).
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/40 border">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">Pencegatan Otomatis (Smart Interception):</strong> Backend Nexa OS secara otomatis mendeteksi status <code>is_sw_open = true</code>. Permintaan pengiriman template dicegat seketika dan diubah menjadi pesan <em>Interactive Quick Reply Button</em> yang gratis, menghemat anggaran operasional hingga <strong>60%–80%</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/40 border">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">Zero-Failure Fallback System:</strong> Jika API Meta menolak format interaktif (karena limit karakter header Meta &gt; 60 huruf atau pembatasan tombol), sistem tidak membiarkan pesan gagal kirim. Sistem otomatis mengonversinya menjadi teks murni dengan pilihan nomor (<em>Numbered List</em>). <strong>Tingkat keberhasilan kirim dijamin 100%!</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onboarding WhatsApp Pola A & PIN 2FA Meta */}
          {matchesSearch('waba whatsapp onboarding pola a graph api pin 2fa fresh sim') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('admin-waba')}
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Ketentuan Integrasi Nomor WhatsApp Bisnis (WABA Pola A)</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-waba'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['admin-waba'] && (
                <div className="pt-2 space-y-4 text-sm leading-relaxed">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 space-y-1.5">
                    <div className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                      <Phone size={16} className="shrink-0" /> Alur Aktivasi Berbantuan (Assisted Onboarding):
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pihak admin tenant cukup mendaftarkan nomor kartu perdana baru melalui menu <strong>Pengaturan ➔ Integrasi WhatsApp</strong>. Tim support teknis Nexa MOS akan membantu sinkronisasi Cloud API dan meminta kode OTP SMS saat verifikasi nomor dilakukan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        Wajib Fresh SIM (Nomor Baru)
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Satu nomor telepon tidak dapat aktif di aplikasi WhatsApp ponsel dan WhatsApp Cloud API secara bersamaan. Wajib menggunakan kartu perdana baru atau menghapus akun WA ponsel terlebih dahulu via menu <em>Setelan ➔ Akun ➔ Hapus Akun Saya</em>.
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        Display Name Kepatuhan Meta
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Nama tampilan wajib mencerminkan brand/lembaga resmi (contoh: <em>LPK Amanah Bandung</em>). Dilarang keras memakai nama produk atau promo seperti <em>Kursus Jepang Murah</em> karena akan ditolak secara otomatis oleh Meta.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pemisahan Domain Produksi & Email Alert */}
          {matchesSearch('domain produksi url 404 crm nexamos nexamos.cloud crm.nexamos.cloud admin email superadmin') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('admin-domains')}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Pemisahan Domain Produksi (Cegah 404) & Email Security Alert</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-domains'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['admin-domains'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/40 border space-y-2">
                    <h4 className="font-bold text-foreground text-sm">2 Domain Resmi Ekosistem Nexa MOS:</h4>
                    <div className="space-y-1.5 text-muted-foreground">
                      <p>• 🌐 <strong>Landing Page Pemasaran:</strong> <code className="text-primary font-bold">https://nexamos.cloud</code> (Website statis promosi. <em>Jangan pernah gunakan untuk rute internal aplikasi!</em>)</p>
                      <p>• 💻 <strong>Aplikasi CRM Tenant:</strong> <code className="text-emerald-600 font-bold">https://crm.nexamos.cloud</code> (Tempat operasional seluruh modul CRM dan target semua tombol link email alert).</p>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary">
                      Keamanan Akun & Email Security Alert:
                    </h4>
                    <p className="text-muted-foreground">
                      • <strong>Security Alert Mutasi Kredensial:</strong> Jika terjadi pergantian password atau username pada staf CRM, email alert otomatis terkirim dengan direct button menuju panel Manajemen Tim di <code className="text-foreground font-semibold">https://crm.nexamos.cloud/manajemen-tim</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRO (PIPELINE SISWA, WEEKLY, TASKS, CHAT, BC, NURTURE, SNOOZE)     */}
      {/* ========================================================================= */}
      {activeTab === 'cro' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
          {/* Quick Links CRO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <Link
              href="/tasks"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center gap-2.5 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <CheckSquare size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">Task List</h4>
                <p className="text-xs text-muted-foreground truncate">SOP Eksekusi Tugas</p>
              </div>
            </Link>

            <Link
              href="/weekly"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center gap-2.5 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">Weekly Kanban</h4>
                <p className="text-xs text-muted-foreground truncate">Jadwal Lapangan</p>
              </div>
            </Link>

            <Link
              href="/live-chat"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center gap-2.5 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">Live Chat</h4>
                <p className="text-xs text-muted-foreground truncate">Shared Inbox WA</p>
              </div>
            </Link>

            <Link
              href="/siswa"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center gap-2.5 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">Data Siswa</h4>
                <p className="text-xs text-muted-foreground truncate">Kualifikasi FNAR</p>
              </div>
            </Link>
          </div>

          {/* Universal Funnel Siswa (B2C) Berbasis Bukti */}
          {matchesSearch('pipeline siswa b2c lead prospect opportunity registered customer fnar komitmen dp') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-funnel')}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Universal State Model Siswa (B2C) — Menolak Ilusi "Perasaan" CRO</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-funnel'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-funnel'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border text-muted-foreground">
                    Di Nexa OS, <strong>CRO dilarang memindahkan status prospek hanya karena merasa siswa tersebut "antusias" atau "kelihatannya minat"</strong>. Status hanya bisa berpindah jika didukung oleh bukti objektif (observable event) yang sah.
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">LEAD</span>
                          <span className="font-semibold text-foreground text-sm">Verified Initial Interest + Valid Contact</span>
                        </div>
                        <p className="text-muted-foreground">
                          Syarat mutlak: Memiliki identitas minimum, kontak WA valid, dan ada tindakan nyata menunjukkan minat awal (mengisi form/bertanya di stan).
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-muted/60 sm:bg-transparent">Syarat: Kontak Valid</span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold border border-blue-500/20">PROSPECT</span>
                          <span className="font-semibold text-foreground text-sm">Lulus Kualifikasi FNAR Framework</span>
                        </div>
                        <p className="text-muted-foreground">
                          Terbukti memenuhi 4 dimensi: <strong>Fit</strong> (usia/syarat program), <strong>Need</strong> (kebutuhan kerja nyata), <strong>Ability</strong> (kemampuan fisik/medis), dan <strong>Readiness</strong> (waktu kelulusan).
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-blue-500/10 sm:bg-transparent">Syarat: FNAR Assessment</span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold border border-purple-500/20">OPPORTUNITY</span>
                          <span className="font-semibold text-foreground text-sm">Lolos Commitment Threshold (Konsultasi Keputusan)</span>
                        </div>
                        <p className="text-muted-foreground">
                          Status Opportunity hanya terbuka jika telah terlaksana konsultasi keputusan nyata yang <strong>melibatkan orang tua/wali</strong> (Home Visit atau Konsultasi Kantor). Minat siswa saja belum diakui sebagai komitmen!
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-purple-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-purple-500/10 sm:bg-transparent">Syarat: Ortu Hadir</span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">REGISTERED</span>
                          <span className="font-semibold text-foreground text-sm">Beli Formulir Pendaftaran (Rp500.000)</span>
                        </div>
                        <p className="text-muted-foreground">
                          Siswa berhak menerima layanan pra-pelatihan (pre-core). <em>PENTING: Siswa di tahap ini BELUM berstatus sebagai Customer!</em>
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-emerald-500/10 sm:bg-transparent">Bukti: Formulir Lunas</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">CUSTOMER</span>
                          <span className="font-semibold text-foreground text-sm">Pelunasan DP Pelatihan (Rp1.500.000 Core Conversion)</span>
                        </div>
                        <p className="text-muted-foreground">
                          Hanya tercipta setelah admin memverifikasi transfer DP pelatihan inti. Status komersial Customer resmi tercipta.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-emerald-500/20 sm:bg-transparent">Core Conversion</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/50 border text-xs text-foreground">
                    🛡️ <strong>Aturan Wilayah 1 Kelas = 1 CRO:</strong> Satu kelas di sekolah binaan hanya dapat dikelola oleh tepat 1 CRO per periode aktif. Penugasan didistribusikan langsung oleh Chief CRO/Manager melalui fitur <em>Assign Kelas</em> untuk mencegah konflik dan perebutan prospek.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Penugasan Teritorial: 1 Kelas Banyak Siswa = 1 CRO */}
          {matchesSearch('teritorial kelas assignment penugasan chief cro sekolah sosialisasi replace auto inherit b2c') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-territorial')}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="text-primary w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        SOP Penugasan Teritorial: 1 Kelas Banyak Siswa = 1 CRO
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        Otoritas Chief CRO
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-territorial'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-territorial'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border space-y-1.5">
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-primary shrink-0" />
                      Prinsip Dasar Kepemilikan Teritorial Nexa OS
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Di CRM konvensional, prospek sering diperebutkan per individu secara liar antar staf sales. Di Nexa OS, unit penugasan hak asuh prospek siswa (B2C) adalah <strong>KELAS</strong> di sekolah binaan tertentu (contoh: <em>Kelas 12 TKJ 1 di SMKS Hasina</em>). Satu kelas berisi banyak siswa dan <strong>wajib dikelola oleh tepat satu CRO</strong> pada periode pemasaran aktif.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Pilar 1 */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          1. Otoritas Chief CRO &amp; Manajemen
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Distribusi Teritorial Satu Komando</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Hanya pengguna dengan peran <strong>Chief CRO</strong>, <strong>Manager</strong>, atau <strong>Admin</strong> yang berwenang membagikan penugasan kelas melalui tombol <code>Assign Kelas</code> di halaman Master Siswa. Staf CRO biasa tidak dapat mengklaim atau memindahkan kelas secara sepihak.
                      </p>
                    </div>

                    {/* Pilar 2 */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          2. Syarat Sekolah Wajib Sosialisasi
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Hanya Sekolah &apos;Sudah Sosialisasi&apos;</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Fitur penugasan kelas hanya membuka sekolah yang telah mencapai status <strong>Sudah Sosialisasi</strong> atau <strong>Identity Captured</strong>. Ini memastikan bahwa penugasan CRO hanya terjadi ketika presentasi telah dieksekusi dan audiens siswa telah terinput ke sistem.
                      </p>
                    </div>

                    {/* Pilar 3 */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          3. Sistem Auto-Replace Terintegrasi
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Menjaga Integritas 1 Kelas = 1 CRO</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Jika suatu kelas sebelumnya sudah dipegang oleh CRO lain, Chief CRO dapat langsung memindahtangankan kelas tersebut. Sistem secara otomatis <strong>me-replace penanggung jawab seluruh siswa</strong> di kelas tersebut ke CRO tujuan baru. Tidak ada siswa yang tertinggal atau terpecah.
                      </p>
                    </div>

                    {/* Pilar 4 */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          4. Auto-Inherit Ingestion Siswa Baru
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Pewarisan Hak Asuh Otomatis</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Setiap kali ada siswa baru yang mendaftar (baik melalui <strong>Form Publik QR Sosialisasi</strong>, <strong>Import Excel/CSV</strong>, maupun <strong>Input Manual</strong>) pada sekolah dan kelas yang sudah di-assign, siswa tersebut secara otomatis langsung ter-assign ke CRO pemegang kelas itu.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/30 text-xs text-foreground space-y-1">
                    <p className="font-bold text-purple-600 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="shrink-0" /> Audit Trail Event-Sourcing CQRS:
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Setiap mutasi penugasan kelas terekam secara permanen di <code>events_log</code> dengan tipe event <code>ClassAssignedToCro</code>. Log ini mencatat ID sekolah, nama kelas, CRO lama, CRO baru, total siswa yang ikut dialihkan, dan user Chief CRO yang mengeksekusi penugasan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Framework Kualifikasi FNAR */}
          {matchesSearch('fnar fit need ability readiness kualifikasi lead prospect gate lolos diskualifikasi') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-fnar')}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Framework FNAR — 4 Pilar Kualifikasi Objektif (Lead ➔ Prospect)
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-fnar'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-fnar'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border space-y-1.5">
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-primary shrink-0" />
                      Apa itu Framework FNAR?
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>FNAR (Fit, Need, Ability, Readiness)</strong> adalah kerangka kerja asesmen berbasis bukti objektif yang digunakan oleh CRO untuk membedakan antara siswa yang sekadar <em>"berminat/penasaran"</em> dengan calon peserta yang memang <em>"layak, mampu, dan siap berangkat"</em>. Siswa yang berstatus <strong>Lead</strong> tidak dapat dinaikkan menjadi <strong>Prospect</strong> sebelum ke-4 pilar ini diverifikasi:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* F: FIT */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          F — FIT (Kesesuaian Syarat)
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Kesesuaian Kriteria Dasar Program</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        • <strong>Bukti Wajib:</strong> Ada foto/salinan ijazah SMA/SMK sederajat, rentang usia masuk batas regulasi visa kerja (18–27 tahun), dan tinggi/berat badan proporsional.
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        ❌ <em>Jika usia &gt; 28 tahun atau belum berijazah SMA ➔ Otomatis Disqualified (Gugur).</em>
                      </div>
                    </div>

                    {/* N: NEED */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          N — NEED (Kebutuhan Nyata)
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Motivasi & Dorongan Ekonomi Nyata</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        • <strong>Bukti Wajib:</strong> Catatan wawancara telepon/tatap muka yang menunjukkan motivasi ekonomi kuat (kebutuhan membantu keluarga, modal usaha mandiri, bukan sekadar ikut tren teman).
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        ⚠️ <em>Jika motif masih ragu-ragu ➔ Tetap di Lead & dialirkan ke kampanye Drip Nurturing.</em>
                      </div>
                    </div>

                    {/* A: ABILITY */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          A — ABILITY (Kemampuan Fisik & Medis)
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Kelayakan Fisik, Medis & Finansial</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        • <strong>Bukti Wajib:</strong> Deklarasi medis tidak pernah patah tulang mayor, tidak buta warna, tidak bertindik/bertato, lolos pra-MCU, serta kemampuan pendanaan keluarga yang realistis.
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        ❌ <em>Patah tulang mayor / buta warna total ➔ Hard Gate Disqualified (Ditolak sistem).</em>
                      </div>
                    </div>

                    {/* R: READINESS */}
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          R — READINESS (Kesiapan Waktu)
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">Kesiapan Waktu Memulai Pelatihan</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        • <strong>Bukti Wajib:</strong> Siswa kelas 12 semester akhir yang siap masuk asrama pelatihan setelah kelulusan, dan siap dijadwalkan sesi konsultasi keputusan bersama orang tua minggu ini.
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        💤 <em>Jika masih kelas 10 atau 11 ➔ Masuk status Hibernasi (Snooze Campaign 60–90 hari).</em>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-xs text-foreground space-y-1">
                    <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="shrink-0" /> Mekanisme Event CQRS Nexa OS:
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Sistem tidak mengizinkan CRO mengubah status prospek secara manual. Perpindahan status <code>LEAD ➔ PROSPECT</code> dipicu otomatis oleh event sistem <code>QualificationPassed</code> hanya ketika CRO telah mengisi dan mengunggah checklist verifikasi 4 dimensi FNAR di atas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Task List & Weekly Planning */}
          {matchesSearch('task list weekly planning kanban eksekusi tunda bukti') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-tasks')}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">SOP Task List Harian & Weekly Planning Kanban</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-tasks'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-tasks'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} className="shrink-0" /> Tombol [ ✅ EKSEKUSI ]
                      </h4>
                      <p className="text-muted-foreground">
                        Ditekan oleh CRO saat berada di lokasi atau sesaat setelah aktivitas selesai. Sistem menampilkan modal wajib unggah bukti observasi dan catatan lapangan. Kartu tugas otomatis berpindah ke tab "Selesai".
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-amber-500">
                        <Clock size={16} className="shrink-0" /> Tombol [ 📅 TUNDA ]
                      </h4>
                      <p className="text-muted-foreground">
                        Ditekan jika pertemuan batal karena kendala pihak prospek/keluarga. CRO wajib memasukkan tanggal baru dan <strong>alasan spesifik penundaan</strong>. Riwayat penundaan abadi di log audit sistem.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/40 border space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600">
                      Weekly Planning Kanban (Senin – Sabtu)
                    </h4>
                    <p className="text-muted-foreground">
                      Setiap awal pekan, CRO menarik kartu tugas dari bilah <strong>Backlog (Kiri)</strong> menuju kolom <strong>Hari Kerja (Kanan)</strong>. Perubahan jadwal antar hari memicu event CQRS <code>WeeklyTaskRescheduled</code> secara transparan kepada Chief CRO dan Manager.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Live Chat, Broadcast, Nurturing & Snooze */}
          {matchesSearch('live chat shared inbox broadcast nurture snooze drip gating') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-chat')}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">SOP Live Chat, Broadcast, Nurturing & Snooze Campaign</h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-chat'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-chat'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="font-bold text-sm flex items-center gap-2 text-emerald-600">
                        <MessageSquare size={16} className="shrink-0" /> Live Chat Shared Inbox (Silo System)
                      </div>
                      <p className="text-muted-foreground">
                        • <strong>Silo Privasi:</strong> CRO hanya melihat roomchat prospek binaannya sendiri.<br />
                        • <strong>Indikator SW:</strong> Badge Hijau (SW Buka, ketik chat bebas) vs Badge Merah (SW Tutup, composer terkunci & wajib pilih template resmi).<br />
                        • <strong>Proteksi Gating:</strong> Modul chat terkunci jika nomor WhatsApp tenant belum aktif.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="font-bold text-sm flex items-center gap-2 text-blue-600">
                        <Radio size={16} className="shrink-0" /> Broadcast WA (Wizard 3 Langkah)
                      </div>
                      <p className="text-muted-foreground">
                        Pengiriman pesan massal menggunakan wizard 3 langkah: 1) Pilih Audiens Berdasarkan Sekolah/Status, 2) Pilih Pasangan Dual Template (Meta Template & CRM Template), 3) Kirim ke antrean latar belakang.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="font-bold text-sm flex items-center gap-2 text-purple-600">
                        <TrendingUp size={16} className="shrink-0" /> Automated Nurturing (Drip Probing)
                      </div>
                      <p className="text-muted-foreground">
                        Mesin mengirim pesan probing bertahap (Probe 1 hingga Probe 5). Begitu siswa membalas, automasi seketika berhenti (*interupsi otomatis*) dan mengirim alert ke CRO untuk penanganan manual.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-background space-y-2">
                      <div className="font-bold text-sm flex items-center gap-2 text-amber-500">
                        <Clock size={16} className="shrink-0" /> Snooze Campaign (Hibernasi Prospek)
                      </div>
                      <p className="text-muted-foreground">
                        Untuk siswa yang meminta jeda ("Belum saatnya"), sistem menidurkan kontak selama 30, 60, atau 90 hari, lalu otomatis menyapa kembali saat jatuh tempo. Jika izin WA dicabut, prospek seketika dikeluarkan dari antrean snooze.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
