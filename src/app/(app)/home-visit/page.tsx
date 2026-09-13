'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Home, Building2, School, Plus, Search,
  CheckCircle2, AlertCircle, Clock, ArrowUpRight,
  Loader2, Phone, Calendar, Handshake, ChevronRight, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { CommercialStateBadge } from '@/components/siswa/CommercialStateBadge';
import { DecisionConsultationModal } from '@/components/home-visit/DecisionConsultationModal';

interface DetailWali {
  nama_wali?: string;
  peran_wali?: string;
  kesepakatan?: string;
  catatan?: string;
  lokasi_konsultasi?: string;
}

interface HomeVisitItem {
  id: number;
  idSiswa: string;
  namaSiswa: string;
  namaSekolah: string;
  kelas: string;
  wa?: string;
  tanggal: string;
  channel: string;
  hasilAktivitas: string;
  eventType: string;
  statusSebelum: string;
  statusSesudah: string;
  nextAction: string;
  dueDate: string | null;
  catatan: string | null;
  pjCro: string;
  commercialState: string;
  detailWali: DetailWali;
}

interface HomeVisitStats {
  total: number;
  komitCount: number;
  followUpCount: number;
  rejectedCount: number;
  conversionRate: number;
}

// ── Skeleton Desktop Row ──────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-border/50 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-secondary rounded w-full max-w-28" />
        </td>
      ))}
    </tr>
  );
}

// ── Skeleton Mobile Card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border rounded-xl p-3.5 space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-secondary rounded w-1/3" />
        <div className="h-5 bg-secondary rounded w-24" />
      </div>
      <div className="flex justify-between items-start pt-2 border-t border-border/30">
        <div className="space-y-1.5 w-1/2">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-3 bg-secondary rounded w-1/2" />
        </div>
        <div className="h-4 bg-secondary rounded w-1/4" />
      </div>
      <div className="h-10 bg-secondary/40 rounded-lg w-full" />
    </div>
  );
}

export default function HomeVisitPage() {
  const [data, setData] = useState<HomeVisitItem[]>([]);
  const [stats, setStats] = useState<HomeVisitStats>({
    total: 0,
    komitCount: 0,
    followUpCount: 0,
    rejectedCount: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (channelFilter !== 'ALL') params.channel = channelFilter;
      if (outcomeFilter !== 'ALL') params.outcome = outcomeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get<{ status: string; data: { data: HomeVisitItem[]; stats: HomeVisitStats } }>(
        '/api/v1/home-visit',
        { params }
      );

      if (res.data.status === 'ok') {
        setData(res.data.data.data || []);
        setStats(res.data.data.stats || {
          total: 0,
          komitCount: 0,
          followUpCount: 0,
          rejectedCount: 0,
          conversionRate: 0,
        });
      } else {
        setError('Gagal memuat data konsultasi.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat memuat data konsultasi.');
    } finally {
      setLoading(false);
    }
  }, [channelFilter, outcomeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* ── Header Bar (Pola Halaman Siswa) ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Row 1 (Mobile): Icon, Title, & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-500 border border-pink-500/20 shadow-xs shrink-0">
            <Home size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">Home Visit & Konsultasi Ortu</h1>
            <p className="text-xs text-muted-foreground truncate">
              Commitment Threshold: Validasi keputusan orang tua (Prospect ➔ Opportunity)
            </p>
          </div>
        </div>

        {/* Row 2 (Mobile): Action Button Full Width */}
        <div className="w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
            title="Catat Konsultasi Baru"
          >
            <Plus size={16} />
            <span>Catat Konsultasi Baru</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards / Metrik Ontologi ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Konsultasi */}
        <div className="bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Konsultasi</span>
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Handshake size={14} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Tercatat di periode ini</p>
          </div>
        </div>

        {/* Komitmen Disetujui */}
        <div className="bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Komitmen Disetujui</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-500">{stats.komitCount}</span>
              <span className="text-xs font-bold text-violet-400">➔ Opp.</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Lolos Commitment Gate</p>
          </div>
        </div>

        {/* Pertimbangan Ortu */}
        <div className="bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Pertimbangan Ortu</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl font-bold text-yellow-500">{stats.followUpCount}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Perlu Diskusi Lanjutan</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl font-bold text-primary">{stats.conversionRate}%</span>
            <p className="text-xs text-muted-foreground mt-0.5">Prospect ➔ Opportunity</p>
          </div>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama siswa, sekolah, atau nama orang tua..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {/* ── Filter Bar (Permanen) ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Filter Channel */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
        >
          <option value="ALL">Semua Lokasi / Channel</option>
          <option value="Home Visit">🏠 Home Visit</option>
          <option value="Kantor Derma">🏢 Kantor Derma</option>
          <option value="Sekolah Siswa">🏫 Sekolah Siswa</option>
        </select>

        {/* Filter Outcome */}
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
        >
          <option value="ALL">Semua Status Komitmen</option>
          <option value="Disetujui">🟢 Komitmen Disetujui</option>
          <option value="Pertimbangan">🟡 Pertimbangan Ortu</option>
          <option value="Ditolak">🔴 Ditolak Ortu</option>
        </select>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          DESKTOP TABLE (hidden sm:block)
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block bg-card border rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Lokasi</th>
                  <th className="py-3.5 px-4">Siswa & Sekolah</th>
                  <th className="py-3.5 px-4">Wali / Orang Tua (Veto)</th>
                  <th className="py-3.5 px-4">Hasil Validasi Komitmen</th>
                  <th className="py-3.5 px-4">Kesepakatan & Next Action</th>
                  <th className="py-3.5 px-4">PJ CRO</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-500 space-y-3">
            <AlertCircle size={32} className="mx-auto" />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground/30">
              <Home size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Belum ada riwayat konsultasi keputusan</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                Catat interaksi tatap muka bersama orang tua (Home Visit, pertemuan kantor, atau sekolah) untuk memenuhi Commitment Threshold dan memindahkan siswa ke status Opportunity.
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Catat Konsultasi Pertama</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Lokasi</th>
                  <th className="py-3.5 px-4">Siswa & Sekolah</th>
                  <th className="py-3.5 px-4">Wali / Orang Tua (Veto)</th>
                  <th className="py-3.5 px-4">Hasil Validasi Komitmen</th>
                  <th className="py-3.5 px-4">Kesepakatan & Next Action</th>
                  <th className="py-3.5 px-4">PJ CRO</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((item) => {
                  const isKomit = item.hasilAktivitas.includes('Disetujui');
                  const isFollowUp = item.hasilAktivitas.includes('Pertimbangan');
                  const isReject = item.hasilAktivitas.includes('Ditolak');

                  return (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Tanggal & Lokasi */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar size={13} className="text-muted-foreground" />
                          <span>{item.tanggal}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          {item.channel === 'Home Visit' ? (
                            <Home size={12} className="text-pink-400" />
                          ) : item.channel === 'Kantor Derma' ? (
                            <Building2 size={12} className="text-blue-400" />
                          ) : (
                            <School size={12} className="text-emerald-400" />
                          )}
                          <span>{item.channel}</span>
                        </div>
                      </td>

                      {/* Siswa & Sekolah */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/siswa/${item.idSiswa}`}
                          className="font-bold text-foreground hover:text-primary hover:underline"
                        >
                          {item.namaSiswa || item.idSiswa}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.namaSekolah} {item.kelas ? `(${item.kelas})` : ''}
                        </p>
                        {item.wa && (
                          <a
                            href={`https://wa.me/${item.wa.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 text-xs hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                          >
                            <Phone size={10} />
                            <span>{item.wa}</span>
                          </a>
                        )}
                      </td>

                      {/* Wali / Orang Tua */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-foreground block">
                          {item.detailWali.nama_wali || 'Orang Tua / Wali'}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          Peran: {item.detailWali.peran_wali || 'Orang Tua'}
                        </span>
                      </td>

                      {/* Hasil Validasi Komitmen */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {isKomit ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs">
                              <CheckCircle2 size={12} />
                              <span>Komitmen Disetujui</span>
                            </span>
                          ) : isFollowUp ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-semibold text-xs">
                              <Clock size={12} />
                              <span>Pertimbangan Ortu</span>
                            </span>
                          ) : isReject ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold text-xs">
                              <XCircle size={12} />
                              <span>Ditolak / Keberatan</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{item.hasilAktivitas}</span>
                          )}
                          <div className="block">
                            <CommercialStateBadge state={item.commercialState} size="sm" />
                          </div>
                        </div>
                      </td>

                      {/* Kesepakatan & Next Action */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.detailWali.kesepakatan ? (
                          <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
                            {item.detailWali.kesepakatan}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">—</p>
                        )}
                        {item.nextAction && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="font-semibold text-foreground/80">Next:</span> {item.nextAction}
                            {item.dueDate ? ` (${item.dueDate})` : ''}
                          </p>
                        )}
                      </td>

                      {/* PJ CRO */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                        {item.pjCro || '—'}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/siswa/${item.idSiswa}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors"
                        >
                          <span>Lihat Siswa</span>
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MOBILE CARD LIST (sm:hidden - Pola Halaman Siswa)
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="py-12 text-center text-rose-500 space-y-3 bg-card border rounded-xl p-4">
            <AlertCircle size={28} className="mx-auto" />
            <p className="text-xs">{error}</p>
            <button
              onClick={fetchData}
              className="px-3.5 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-3 bg-card border rounded-xl p-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground/40">
              <Home size={24} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Belum ada riwayat konsultasi</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Catat konsultasi ortu untuk memenuhi Commitment Threshold.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-white text-xs font-semibold shadow hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Catat Konsultasi Baru</span>
            </button>
          </div>
        ) : (
          data.map((item) => {
            const isKomit = item.hasilAktivitas.includes('Disetujui');
            const isFollowUp = item.hasilAktivitas.includes('Pertimbangan');
            const isReject = item.hasilAktivitas.includes('Ditolak');

            return (
              <div
                key={item.id}
                className="bg-card border rounded-xl p-3.5 space-y-2.5 shadow-xs hover:border-primary/30 transition-all"
              >
                {/* Header Card: 2 Baris (Row 1: Tanggal & Badge Komitmen, Row 2: Channel Lokasi) */}
                <div className="space-y-1.5">
                  {/* Row 1: Tanggal di kiri & Badge Komitmen di kanan */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={12} className="text-muted-foreground shrink-0" />
                      <span className="font-semibold text-foreground">{item.tanggal}</span>
                    </div>

                    {/* Outcome Badge */}
                    {isKomit ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs shrink-0">
                        <CheckCircle2 size={11} />
                        <span>Disetujui</span>
                      </span>
                    ) : isFollowUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-semibold text-xs shrink-0">
                        <Clock size={11} />
                        <span>Pertimbangan</span>
                      </span>
                    ) : isReject ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold text-xs shrink-0">
                        <XCircle size={11} />
                        <span>Ditolak</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">{item.hasilAktivitas}</span>
                    )}
                  </div>

                  {/* Row 2: Lokasi / Channel */}
                  <div className="flex items-center text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 border border-border/40 text-muted-foreground">
                      {item.channel === 'Home Visit' ? (
                        <Home size={11} className="text-pink-400 shrink-0" />
                      ) : item.channel === 'Kantor Derma' ? (
                        <Building2 size={11} className="text-blue-400 shrink-0" />
                      ) : (
                        <School size={11} className="text-emerald-400 shrink-0" />
                      )}
                      <span className="font-medium text-foreground/80">{item.channel}</span>
                    </span>
                  </div>
                </div>

                {/* Info Siswa & Wali */}
                <div className="flex items-start justify-between gap-2 pt-2 border-t border-border/40">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/siswa/${item.idSiswa}`}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      <span className="truncate">{item.namaSiswa || item.idSiswa}</span>
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.namaSekolah} {item.kelas ? `(${item.kelas})` : ''}
                    </p>
                    {item.wa && (
                      <a
                        href={`https://wa.me/${item.wa.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-500 text-xs hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                      >
                        <Phone size={10} />
                        <span>{item.wa}</span>
                      </a>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground">
                      {item.detailWali?.nama_wali || 'Orang Tua / Wali'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Peran: {item.detailWali?.peran_wali || 'Orang Tua'}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <CommercialStateBadge state={item.commercialState} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Box Kesepakatan & Next Action (jika ada) */}
                {(item.detailWali?.kesepakatan || item.nextAction) && (
                  <div className="bg-secondary/40 border border-border/40 rounded-lg p-2.5 text-xs space-y-1">
                    {item.detailWali?.kesepakatan && (
                      <p className="text-foreground leading-relaxed">
                        <span className="font-semibold text-muted-foreground">Catatan:</span> {item.detailWali.kesepakatan}
                      </p>
                    )}
                    {item.nextAction && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <span className="font-semibold text-foreground/80">Next Action:</span> {item.nextAction}
                        {item.dueDate ? ` (${item.dueDate})` : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer: CRO & Aksi Lihat Siswa */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 text-muted-foreground">
                  <span>
                    PJ CRO: <strong className="text-foreground font-medium">{item.pjCro || '—'}</strong>
                  </span>
                  <Link
                    href={`/siswa/${item.idSiswa}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors"
                  >
                    <span>Detail Siswa</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Catat Konsultasi */}
      <DecisionConsultationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
