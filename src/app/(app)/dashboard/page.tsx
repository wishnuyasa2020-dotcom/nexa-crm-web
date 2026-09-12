'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Users, School, CheckSquare, TrendingUp, Activity, 
  ArrowUpRight, Trophy, Medal, RefreshCw, AlertCircle, 
  ShieldCheck, Calendar, Clock, Check, Loader2, Zap 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { TundaTaskModal } from '@/components/sekolah/TundaTaskModal';
import { CatatInteraksiModal } from '@/components/sekolah/CatatInteraksiModal';
import { CatatInteraksiSiswaModal } from '@/components/siswa/CatatInteraksiSiswaModal';
import UpgradeTierModal from '@/components/subscription/UpgradeTierModal';
import { getSekolahDetail } from '@/lib/api/sekolah.api';
import type { SekolahDetail } from '@/lib/types/sekolah.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalSekolah: number;
  totalSiswa: number;
  totalTerdaftar: number;
  prospekAktif: number;
  konsultasi: number;
  siapDaftar: number;
}

interface QuotaInfo {
  tier: string;
  limitSiswa: number;
  usedSiswa: number;
  limitSekolah: number;
  usedSekolah: number;
  limitUser: number;
  usedUser: number;
}

interface FunnelItem {
  name: string;
  value: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  nama: string;
  totalClosing: number;
  medal: string;
}

interface TaskItem {
  tipe: 'sekolah' | 'siswa' | 'homevisit' | 'aktifitas_ekstra';
  id: string;
  nama: string;
  status: string;
  commercialState?: string;
  intent?: string;
  nextAction: string;
  dueDate: string;
  dueCategory: string;
  siswaId?: string;
}

interface TundaTarget {
  id: string;
  title: string;
  tipe: 'sekolah' | 'siswa' | 'homevisit' | 'aktifitas_ekstra';
}

interface TaskCounts {
  hari_ini: number;
  overdue_1_7: number;
  overdue_8_14: number;
  overdue_gt14: number;
  besok: number;
  akan_datang: number;
}

// ─── Constants (5 Tahap Universal Ontologi B2C) ───────────────────────────────

const FUNNEL_COLORS = [
  '#64748b', // Known Profile (Slate)
  '#3b82f6', // Lead (Blue)
  '#8b5cf6', // Prospect (Violet)
  '#f59e0b', // Opportunity (Amber)
  '#10b981', // Customer (Emerald)
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [quota, setQuota]             = useState<QuotaInfo | null>(null);
  const [funnels, setFunnels]         = useState<FunnelItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tasks, setTasks]             = useState<TaskItem[]>([]);
  const [taskCounts, setTaskCounts]   = useState<TaskCounts | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── Modal & Action States (Event-Sourcing) ──
  const [tundaTarget, setTundaTarget] = useState<TundaTarget | null>(null);
  const [eksekusiTarget, setEksekusiTarget] = useState<TaskItem | null>(null);
  const [sekolahDetail, setSekolahDetail] = useState<SekolahDetail | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  const handleTundaClick = (t: TaskItem) => {
    setTundaTarget({
      id: t.id,
      title: t.nama,
      tipe: t.tipe,
    });
  };

  const handleTundaSuccess = () => {
    if (tundaTarget) {
      setTasks(prev => prev.filter(t => !(t.id === tundaTarget.id && t.tipe === tundaTarget.tipe)));
      setTundaTarget(null);
      load();
    }
  };

  const handleEksekusiClick = async (task: TaskItem) => {
    if (task.tipe === 'sekolah') {
      setIsFetchingDetail(true);
      try {
        const res = await getSekolahDetail(task.id);
        setSekolahDetail(res);
        setEksekusiTarget(task);
      } catch (err) {
        console.error('Gagal mengambil data sekolah', err);
        alert('Gagal memuat data sekolah.');
      } finally {
        setIsFetchingDetail(false);
      }
    } else if (task.tipe === 'siswa' || task.tipe === 'homevisit') {
      setEksekusiTarget(task);
    } else {
      alert(`Fitur eksekusi untuk tipe ${task.tipe} belum tersedia.`);
    }
  };

  const handleEksekusiSuccess = () => {
    if (eksekusiTarget) {
      setTasks(prev => prev.filter(t => !(t.id === eksekusiTarget.id && t.tipe === eksekusiTarget.tipe)));
    }
    setEksekusiTarget(null);
    setSekolahDetail(null);
    load();
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch semua data parallel
      const [statsRes, chartsRes, leaderboardRes, tasksRes] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/dashboard/charts'),
        apiClient.get('/dashboard/leaderboard'),
        apiClient.get('/tasks?filter=today&limit=5'),
      ]);

      // ── Stats ──
      const s = statsRes.data.data;
      setStats({
        totalSekolah:   s.stats.totalSekolah   ?? 0,
        totalSiswa:     s.stats.totalSiswa      ?? 0,
        totalTerdaftar: s.stats.totalTerdaftar  ?? 0,
        prospekAktif:   s.stats.prospekAktif    ?? 0,
        konsultasi:     s.stats.konsultasi      ?? 0,
        siapDaftar:     s.stats.siapDaftar      ?? 0,
      });

      if (s.quota) {
        setQuota({
          tier: s.quota.tier ?? 'Free',
          limitSiswa: s.quota.limitSiswa ?? 300,
          usedSiswa: s.quota.usedSiswa ?? 0,
          limitSekolah: s.quota.limitSekolah ?? 10,
          usedSekolah: s.quota.usedSekolah ?? 0,
          limitUser: s.quota.limitUser ?? 4,
          usedUser: s.quota.usedUser ?? 0,
        });
      }

      // ── Charts (funnel siswa) ──
      const c = chartsRes.data.data;
      const funnelData: FunnelItem[] = (c.funnelSiswa || [])
        .filter((f: { status: string; count: number }) => f.count > 0)
        .map((f: { status: string; count: number }) => ({ name: f.status, value: f.count }));
      setFunnels(funnelData);

      // ── Leaderboard ──
      setLeaderboard(leaderboardRes.data.data.leaderboard || []);

      // ── Tasks (mini) ──
      const t = tasksRes.data.data;
      setTasks(t.tasks || []);
      setTaskCounts(t.counts || null);

      setLastRefresh(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat data dashboard';
      setError(msg);
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived stat cards ──
  const totalOverdue = taskCounts
    ? (taskCounts.overdue_1_7 + taskCounts.overdue_8_14 + taskCounts.overdue_gt14)
    : 0;

  const statCards = [
    {
      label: 'Siswa Aktif',
      value: stats?.prospekAktif ?? '-',
      sub: `${stats?.totalSiswa ?? 0} total di pipeline`,
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Sekolah Di-handle',
      value: stats?.totalSekolah ?? '-',
      sub: 'periode ini',
      icon: School,
      color: 'text-violet-400',
    },
    {
      label: 'Tasks Hari Ini',
      value: taskCounts?.hari_ini ?? '-',
      sub: totalOverdue > 0 ? `⚠️ ${totalOverdue} overdue` : 'Semua on-track',
      icon: CheckSquare,
      color: 'text-amber-400',
    },
    {
      label: 'Konversi Bulan Ini',
      value: stats?.totalTerdaftar ?? '-',
      sub: 'siswa terdaftar',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
  ];

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 w-full min-w-0 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-28">
              <div className="w-8 h-8 bg-secondary rounded-lg mb-3" />
              <div className="w-16 h-7 bg-secondary rounded mb-1" />
              <div className="w-24 h-3 bg-secondary rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl h-96" />
          <div className="bg-card border border-border rounded-xl h-96" />
          <div className="bg-card border border-border rounded-xl h-96" />
        </div>
        <div className="bg-card border border-border rounded-xl h-48" />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
          <AlertCircle size={24} />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Dashboard<span className="hidden sm:inline"> CRO</span>
            </h1>
            {quota && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={cn(
                  "h-6 px-2 sm:px-2.5 inline-flex items-center justify-center rounded-full text-xs font-bold uppercase tracking-wider border leading-none shrink-0",
                  quota.tier.toLowerCase() === 'free' ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                  quota.tier.toLowerCase() === 'pro' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  quota.tier.toLowerCase() === 'business' ? "bg-violet-500/10 text-violet-500 border-violet-500/20" :
                  "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm shadow-amber-500/20"
                )}>
                  {quota.tier}
                </span>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="h-6 px-2 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-full text-xs font-bold gradient-primary text-white hover:opacity-90 transition-all shadow-sm shadow-primary/20 cursor-pointer leading-none shrink-0"
                  title="Tingkatkan Kapasitas / Upgrade Tier Tenant"
                >
                  <Zap size={11} className="shrink-0" />
                  <span>Upgrade<span className="hidden sm:inline"> Tier</span></span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Data real-time dari database · Diperbarui {lastRefresh.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button
          onClick={load}
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          title="Refresh data"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Quota Progress ── */}
      {quota && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Kuota Siswa */}
          <div className="bg-card border border-border rounded-xl p-5 w-full flex flex-col xl:flex-row gap-6 items-center card-hover min-w-0">
            <div className="flex items-center gap-4 min-w-48">
              <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Kuota Siswa Baru</p>
                <p className="text-xs text-muted-foreground">Periode Tagihan Aktif</p>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-foreground font-medium">
                  {quota.usedSiswa.toLocaleString('id-ID')} terpakai
                </span>
                <span className="text-muted-foreground">
                  {quota.limitSiswa.toLocaleString('id-ID')} limit
                </span>
              </div>
              
              <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    (quota.usedSiswa / quota.limitSiswa) > 0.95 ? "bg-rose-500 shadow-sm shadow-rose-500/50" :
                    (quota.usedSiswa / quota.limitSiswa) > 0.80 ? "bg-amber-400 shadow-sm shadow-amber-400/50" :
                    "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  )}
                  style={{ width: `${Math.min(Math.max((quota.usedSiswa / quota.limitSiswa) * 100, 0), 100)}%` }}
                />
              </div>
              
              <div className="text-xs mt-2 text-right absolute right-0 -bottom-5">
                {(quota.usedSiswa / quota.limitSiswa) > 0.80 ? (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-amber-500 hover:text-amber-600 font-semibold underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Mendekati limit. Upgrade tier</span>
                    <Zap size={10} />
                  </button>
                ) : (
                  <span className="text-muted-foreground/70">Sisa kuota aman.</span>
                )}
              </div>
            </div>
          </div>

          {/* Kuota Sekolah */}
          <div className="bg-card border border-border rounded-xl p-5 w-full flex flex-col xl:flex-row gap-6 items-center card-hover min-w-0">
            <div className="flex items-center gap-4 min-w-48">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <School size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Kuota Sekolah Baru</p>
                <p className="text-xs text-muted-foreground">Periode Tagihan Aktif</p>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-foreground font-medium">
                  {quota.usedSekolah.toLocaleString('id-ID')} terpakai
                </span>
                <span className="text-muted-foreground">
                  {quota.limitSekolah.toLocaleString('id-ID')} limit
                </span>
              </div>
              
              <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    (quota.usedSekolah / quota.limitSekolah) > 0.95 ? "bg-rose-500 shadow-sm shadow-rose-500/50" :
                    (quota.usedSekolah / quota.limitSekolah) > 0.80 ? "bg-amber-400 shadow-sm shadow-amber-400/50" :
                    "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  )}
                  style={{ width: `${Math.min(Math.max((quota.usedSekolah / quota.limitSekolah) * 100, 0), 100)}%` }}
                />
              </div>
              
              <div className="text-xs mt-2 text-right absolute right-0 -bottom-5">
                {(quota.usedSekolah / quota.limitSekolah) > 0.80 ? (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-amber-500 hover:text-amber-600 font-semibold underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Mendekati limit. Upgrade tier</span>
                    <Zap size={10} />
                  </button>
                ) : (
                  <span className="text-muted-foreground/70">Sisa kuota aman.</span>
                )}
              </div>
            </div>
          </div>

          {/* Kuota User */}
          <div className="bg-card border border-border rounded-xl p-5 w-full flex flex-col xl:flex-row gap-6 items-center card-hover min-w-0">
            <div className="flex items-center gap-4 min-w-48">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Kuota User Aktif</p>
                <p className="text-xs text-muted-foreground">Admin, Manager & CRO</p>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-foreground font-medium">
                  {quota.usedUser.toLocaleString('id-ID')} terpakai
                </span>
                <span className="text-muted-foreground">
                  {quota.limitUser.toLocaleString('id-ID')} limit
                </span>
              </div>
              
              <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    (quota.usedUser / quota.limitUser) > 0.95 ? "bg-rose-500 shadow-sm shadow-rose-500/50" :
                    (quota.usedUser / quota.limitUser) > 0.80 ? "bg-amber-400 shadow-sm shadow-amber-400/50" :
                    "bg-pink-400 shadow-sm shadow-pink-400/50"
                  )}
                  style={{ width: `${Math.min(Math.max((quota.usedUser / quota.limitUser) * 100, 0), 100)}%` }}
                />
              </div>
              
              <div className="text-xs mt-2 text-right absolute right-0 -bottom-5">
                {(quota.usedUser / quota.limitUser) > 0.80 ? (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-amber-500 hover:text-amber-600 font-semibold underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Mendekati limit. Upgrade tier</span>
                    <Zap size={10} />
                  </button>
                ) : (
                  <span className="text-muted-foreground/70">Sisa kuota aman.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-xl p-4 card-hover min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2 rounded-lg bg-secondary', card.color)}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              {card.sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* ── Charts + Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {/* Funnel Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col h-96 min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <Activity size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Funnel Siswa (B2C Pipeline)</h2>
            <span className="ml-auto text-xs text-muted-foreground">5 Tahap Universal</span>
          </div>
          <div className="flex-1 min-h-0 min-w-0">
            {funnels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnels} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {funnels.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data siswa di periode ini
              </div>
            )}
          </div>
        </div>

        {/* Distribusi Donut */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-96 min-w-0">
          <h2 className="text-sm font-semibold text-foreground mb-4 shrink-0">Distribusi Pipeline</h2>
          <div className="flex-1 min-h-0 min-w-0">
            {funnels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={funnels} dataKey="value" innerRadius={50} outerRadius={75} strokeWidth={0}>
                    {funnels.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, color: '#f8fafc', fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data distribusi
              </div>
            )}
          </div>
          {funnels.length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-border/50 shrink-0">
              {funnels.slice(0, 5).map((f, i) => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }} />
                  <span className="text-muted-foreground truncate flex-1">{f.name}</span>
                  <span className="text-foreground font-semibold">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-96 lg:col-span-3 xl:col-span-1 min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Top CRO (Closing DP)</h2>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {leaderboard.length > 0 ? (
              leaderboard.map((cro) => (
                <div key={cro.username} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500/50" />
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm">
                    {cro.rank === 1 ? <Medal size={16} className="text-amber-500" />
                     : cro.rank === 2 ? <Medal size={16} className="text-slate-400" />
                     : <Medal size={16} className="text-amber-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cro.nama}</p>
                    <p className="text-xs text-muted-foreground">{cro.totalClosing} closing</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{cro.medal}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                <Trophy size={28} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Belum ada closing bulan ini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mini TaskList (Tasks Prioritas dengan Aksi Cepat) ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden min-w-0 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/10">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckSquare size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tasks Prioritas (Fokus Hari Ini)</h2>
            {taskCounts && taskCounts.hari_ini > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400">
                {taskCounts.hari_ini} hari ini
              </span>
            )}
            {totalOverdue > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400">
                {totalOverdue} overdue
              </span>
            )}
          </div>
          <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
            Lihat semua di Task List <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada task yang perlu dieksekusi hari ini 🎉
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Target Entitas</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Pipeline State</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Next Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Due Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tasks.map((t, i) => (
                  <tr key={`${t.tipe}-${t.id}-${i}`} className="hover:bg-secondary/30 transition-colors">
                    {/* Target & Entity Badge */}
                    <td className="px-5 py-3 text-foreground font-medium max-w-56 truncate">
                      <div className="flex items-center gap-2 flex-wrap">
                        {t.tipe === 'sekolah' ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
                            🟣 Sekolah
                          </span>
                        ) : t.tipe === 'siswa' ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 inline-flex items-center gap-1">
                            🟠 Siswa
                          </span>
                        ) : t.tipe === 'homevisit' ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 inline-flex items-center gap-1">
                            🏠 Home Visit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
                            ⚡ Ekstra
                          </span>
                        )}
                        <span className="truncate">{t.nama}</span>
                      </div>
                    </td>

                    {/* Pipeline State & Intent */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-foreground/80 border border-border">
                          {t.commercialState || t.status}
                        </span>
                        {t.intent && (
                          <span className={cn(
                            'px-1.5 py-0.5 rounded-md text-xs font-semibold border',
                            t.intent === 'High' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            t.intent === 'Mid' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          )}>
                            {t.intent}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Next Action */}
                    <td className="px-5 py-3 text-muted-foreground text-xs max-w-44 truncate">
                      {t.nextAction || '-'}
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {t.dueDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 text-foreground/80 border border-border">
                          <Clock size={11} className="text-muted-foreground" />
                          {t.dueDate}
                        </span>
                      ) : '-'}
                    </td>

                    {/* Aksi Cepat: Tunda & Eksekusi */}
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleTundaClick(t)}
                          className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-all inline-flex items-center gap-1"
                          title="Tunda Jadwal Task"
                        >
                          <Calendar size={13} />
                          <span className="hidden sm:inline">Tunda</span>
                        </button>
                        <button
                          onClick={() => handleEksekusiClick(t)}
                          disabled={isFetchingDetail && eksekusiTarget?.id === t.id}
                          className="px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20 inline-flex items-center gap-1 disabled:opacity-50"
                          title="Eksekusi Kunjungan / Catat Interaksi"
                        >
                          {isFetchingDetail && eksekusiTarget?.id === t.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckSquare size={13} />
                          )}
                          <span className="hidden sm:inline">Eksekusi</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal Tunda Task (Event-Sourcing: TaskRescheduled) ── */}
      {tundaTarget && (
        <TundaTaskModal
          isOpen={!!tundaTarget}
          onClose={() => setTundaTarget(null)}
          taskTitle={tundaTarget.title}
          taskId={tundaTarget.id}
          taskTipe={tundaTarget.tipe}
          onSuccess={handleTundaSuccess}
        />
      )}

      {/* ── Modal Eksekusi Sekolah (Event-Sourcing Evidence) ── */}
      {eksekusiTarget?.tipe === 'sekolah' && sekolahDetail && (
        <CatatInteraksiModal
          isOpen={!!eksekusiTarget}
          onClose={() => { setEksekusiTarget(null); setSekolahDetail(null); }}
          sekolah={sekolahDetail}
          onSuccess={handleEksekusiSuccess}
        />
      )}

      {/* ── Modal Eksekusi Siswa & Home Visit (Event-Sourcing Evidence) ── */}
      {(eksekusiTarget?.tipe === 'siswa' || eksekusiTarget?.tipe === 'homevisit') && (
        <CatatInteraksiSiswaModal
          isOpen={!!eksekusiTarget}
          onClose={() => setEksekusiTarget(null)}
          siswaId={eksekusiTarget.siswaId || eksekusiTarget.id}
          siswaName={eksekusiTarget.nama}
          onSuccess={handleEksekusiSuccess}
        />
      )}

      {/* ── Modal Upgrade Tier Tenant (Midtrans Payment Gateway) ── */}
      <UpgradeTierModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={quota?.tier}
        onUpgradeSuccess={() => {
          load();
        }}
      />
    </div>
  );
}
