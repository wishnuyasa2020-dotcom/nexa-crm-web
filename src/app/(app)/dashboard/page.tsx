'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, School, CheckSquare, TrendingUp, Activity, ArrowUpRight, Trophy, Medal, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalSekolah: number;
  totalSiswa: number;
  totalTerdaftar: number;
  prospekAktif: number;
  konsultasi: number;
  siapDaftar: number;
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
  nextAction: string;
  dueDate: string;
  dueCategory: string;
}

interface TaskCounts {
  hari_ini: number;
  overdue_1_7: number;
  overdue_8_14: number;
  overdue_gt14: number;
  besok: number;
  akan_datang: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FUNNEL_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#c4b5fd', '#10b981', '#f59e0b', '#f43f5e'
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [funnels, setFunnels]         = useState<FunnelItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tasks, setTasks]             = useState<TaskItem[]>([]);
  const [taskCounts, setTaskCounts]   = useState<TaskCounts | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
      <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 animate-pulse">
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
          <div className="lg:col-span-2 bg-card border border-border rounded-xl h-[360px]" />
          <div className="bg-card border border-border rounded-xl h-[360px]" />
          <div className="bg-card border border-border rounded-xl h-[360px]" />
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
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Dashboard CRO</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Data real-time dari database · Diperbarui {lastRefresh.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={15} />
        </button>
      </div>

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
              {card.sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* ── Charts + Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {/* Funnel Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col h-[380px] lg:h-[360px] min-w-0">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <Activity size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Funnel Siswa</h2>
            <span className="ml-auto text-[10px] text-muted-foreground">per status pipeline</span>
          </div>
          <div className="flex-1 min-h-0 min-w-0">
            {funnels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnels} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, color: '#f8fafc', fontSize: 12 }}
                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-[380px] lg:h-[360px] min-w-0">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex-shrink-0">Distribusi Status</h2>
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
            <div className="space-y-2 mt-4 pt-4 border-t border-border/50 flex-shrink-0">
              {funnels.slice(0, 4).map((f, i) => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FUNNEL_COLORS[i] }} />
                  <span className="text-muted-foreground truncate flex-1">{f.name}</span>
                  <span className="text-foreground font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-[380px] lg:h-[360px] lg:col-span-3 xl:col-span-1 min-w-0">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Top CRO Bulan Ini</h2>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {leaderboard.length > 0 ? (
              leaderboard.map((cro) => (
                <div key={cro.username} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500/50" />
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-sm">
                    {cro.rank === 1 ? <Medal size={16} className="text-amber-500" />
                     : cro.rank === 2 ? <Medal size={16} className="text-slate-400" />
                     : <Medal size={16} className="text-amber-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cro.nama}</p>
                    <p className="text-[10px] text-muted-foreground">{cro.totalClosing} closing</p>
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

      {/* ── Mini TaskList ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden min-w-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tasks Prioritas</h2>
            {taskCounts && taskCounts.hari_ini > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                {taskCounts.hari_ini} hari ini
              </span>
            )}
            {totalOverdue > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                {totalOverdue} overdue
              </span>
            )}
          </div>
          <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
            Lihat semua <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada task hari ini 🎉
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Target</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Tipe</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Next Action</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={`${t.tipe}-${t.id}-${i}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 text-foreground font-medium max-w-[180px] truncate">
                      {t.nama}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                        t.tipe === 'sekolah' ? 'bg-blue-500/10 text-blue-400' :
                        t.tipe === 'siswa' ? 'bg-violet-500/10 text-violet-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      )}>
                        {t.tipe === 'aktifitas_ekstra' ? 'ekstra' : t.tipe}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{t.nextAction}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{t.dueDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
