'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Home, Building2, School, Plus, Search, Filter,
  Users, CheckCircle2, AlertCircle, Clock, ArrowUpRight,
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
              <Home size={18} />
            </div>
            <h1 className="text-xl font-bold text-foreground">Home Visit & Konsultasi Ortu</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            <span className="font-semibold text-foreground">Commitment Threshold:</span> Validasi keputusan bersama orang tua untuk menaikkan status <span className="font-semibold text-blue-400">Prospect</span> menjadi <span className="font-semibold text-violet-400">Opportunity</span>.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Catat Konsultasi Baru</span>
        </button>
      </div>

      {/* KPI Cards / Metrik Ontologi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Konsultasi</span>
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Handshake size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Tercatat di periode ini</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Komitmen Disetujui</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-500">{stats.komitCount}</span>
              <span className="text-xs font-bold text-violet-400">➔ Opportunity</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Lolos Commitment Gate</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Pertimbangan Ortu</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-yellow-500">{stats.followUpCount}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Perlu Diskusi Lanjutan</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-primary">{stats.conversionRate}%</span>
            <p className="text-xs text-muted-foreground mt-0.5">Prospect ➔ Opportunity</p>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Search */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama siswa, sekolah, atau nama orang tua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Filter Channel */}
          <div className="flex items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3.5 py-2 bg-secondary/50 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            >
              <option value="ALL">Semua Lokasi</option>
              <option value="Home Visit">Home Visit</option>
              <option value="Kantor Derma">Kantor Derma</option>
              <option value="Sekolah Siswa">Sekolah Siswa</option>
            </select>

            {/* Filter Outcome */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="px-3.5 py-2 bg-secondary/50 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            >
              <option value="ALL">Semua Status Komitmen</option>
              <option value="Disetujui">Komitmen Disetujui</option>
              <option value="Pertimbangan">Pertimbangan Ortu</option>
              <option value="Ditolak">Ditolak Ortu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Table / Cards */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat riwayat konsultasi...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-500 space-y-3">
            <AlertCircle size={32} className="mx-auto" />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 transition-all"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition-all"
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
                            className="text-emerald-500 text-xs hover:underline inline-flex items-center gap-1 mt-0.5"
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
