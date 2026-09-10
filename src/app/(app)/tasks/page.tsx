'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TundaTaskModal } from '@/components/sekolah/TundaTaskModal';
import { CatatInteraksiModal } from '@/components/sekolah/CatatInteraksiModal';
import { CatatInteraksiSiswaModal } from '@/components/siswa/CatatInteraksiSiswaModal';
import { getSekolahDetail } from '@/lib/api/sekolah.api';
import type { SekolahDetail } from '@/lib/types/sekolah.types';
import apiClient from '@/lib/apiClient';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'completed';

interface Task {
  tipe: 'sekolah' | 'siswa' | 'homevisit' | 'aktifitas_ekstra';
  id: string;
  siswaId?: string;
  nama: string;
  status: string;
  commercialState?: string;
  intent?: string;
  priorityScore?: number;
  nextAction: string;
  dueDate: string;
  dueDateISO: string;
  dueCategory: string;
  prioritas?: string;
  cro?: string;
  pj?: string;
  aging?: number;
}

interface TaskCounts {
  overdue_gt14: number;
  overdue_8_14: number;
  overdue_1_7: number;
  hari_ini: number;
  besok: number;
  akan_datang: number;
}

interface TundaTarget {
  id: string;
  tipe: Task['tipe'];
  title: string;
}

// ─── Tab config ──────────────────────────────────────────────────────────────

const TAB_FILTER_MAP: Record<TabKey, string> = {
  today:     'today',
  tomorrow:  'tomorrow',
  upcoming:  'upcoming',
  overdue:   'overdue',
  completed: 'done',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [activeTab, setActiveTab]   = useState<TabKey>('today');
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [counts, setCounts]         = useState<TaskCounts | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tundaTarget, setTundaTarget] = useState<TundaTarget | null>(null);

  const [eksekusiTarget, setEksekusiTarget] = useState<Task | null>(null);
  const [sekolahDetail, setSekolahDetail] = useState<SekolahDetail | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Fetch tasks untuk tab aktif
  const fetchTasks = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/tasks?filter=${TAB_FILTER_MAP[tab]}&limit=50`);
      const d = res.data.data;
      setTasks(d.tasks || []);
      setCounts(d.counts || null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat task';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(activeTab);
  }, [activeTab, fetchTasks]);

  // Count total overdue dari semua bucket
  const totalOverdue = counts
    ? (counts.overdue_gt14 ?? 0) + (counts.overdue_8_14 ?? 0) + (counts.overdue_1_7 ?? 0)
    : 0;

  const tabs = [
    {
      id: 'today' as TabKey,
      label: 'Hari Ini',
      icon: Calendar,
      count: counts?.hari_ini ?? 0,
      activeCls: 'bg-amber-500/10 text-amber-500 font-bold',
      badgeCls: 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'tomorrow' as TabKey,
      label: 'Besok',
      icon: Calendar,
      count: counts?.besok ?? 0,
      activeCls: 'bg-blue-500/10 text-blue-500 font-bold',
      badgeCls: 'bg-blue-500/20 text-blue-400',
    },
    {
      id: 'upcoming' as TabKey,
      label: 'Mendatang',
      icon: Calendar,
      count: counts?.akan_datang ?? 0,
      activeCls: 'bg-emerald-500/10 text-emerald-500 font-bold',
      badgeCls: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'overdue' as TabKey,
      label: 'Overdue',
      icon: Clock,
      count: totalOverdue,
      activeCls: 'bg-rose-500/10 text-rose-500 font-bold',
      badgeCls: 'bg-rose-500/20 text-rose-400',
    },
    {
      id: 'completed' as TabKey,
      label: 'Selesai',
      icon: CheckSquare,
      count: 0,
      activeCls: 'bg-slate-500/10 text-slate-400 font-bold',
      badgeCls: 'bg-slate-500/20 text-slate-400',
    },
  ];

  // Handle reschedule berhasil — optimistic update
  const handleTundaSuccess = () => {
    if (!tundaTarget) return;
    setTasks(prev => prev.filter(t => !(t.id === tundaTarget.id && t.tipe === tundaTarget.tipe)));
    setTundaTarget(null);
  };

  const handleEksekusi = async (task: Task) => {
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
    // Hapus task dari list jika sukses (Optimistic UI Update)
    if (eksekusiTarget) {
      setTasks(prev => prev.filter(t => !(t.id === eksekusiTarget.id && t.tipe === eksekusiTarget.tipe)));
    }
    setEksekusiTarget(null);
    setSekolahDetail(null);
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 text-white">
            <CheckSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Task List</h1>
            <p className="text-xs text-muted-foreground">Agenda aktivitas operasional lapangan CRO</p>
          </div>
        </div>
        <button
          onClick={() => fetchTasks(activeTab)}
          className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Navigation Tabs (Pills) ── */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-card border border-border rounded-xl shadow-sm w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-24 px-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
              activeTab === tab.id ? tab.activeCls : 'text-muted-foreground hover:bg-secondary/50'
            )}
          >
            <tab.icon size={14} className="shrink-0" />
            <span className="truncate">{tab.label}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs font-bold shrink-0',
              activeTab === tab.id ? tab.badgeCls : 'bg-secondary text-muted-foreground'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="space-y-3">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="w-20 h-5 bg-secondary rounded" />
                <div className="w-24 h-5 bg-secondary rounded" />
              </div>
              <div className="w-3/4 h-6 bg-secondary rounded mb-4" />
              <div className="flex gap-2">
                <div className="flex-1 h-11 bg-secondary rounded" />
                <div className="flex-1 h-11 bg-secondary rounded" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center border-2 border-dashed border-border rounded-xl">
            <AlertCircle size={24} className="text-rose-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchTasks(activeTab)}
              className="px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
            {activeTab === 'today'     ? '🎉 Tidak ada agenda untuk hari ini.' :
             activeTab === 'tomorrow'  ? 'Tidak ada agenda untuk besok.' :
             activeTab === 'upcoming'  ? 'Tidak ada agenda mendatang.' :
             activeTab === 'overdue'   ? '🎉 Luar biasa! Tidak ada task overdue.' :
                                         'Riwayat task kosong.'}
          </div>
        ) : (
          tasks.map((task) => (
            <div key={`${task.tipe}-${task.id}`} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Pembeda B2B vs B2C sesuai Ontologi & Wireframe */}
                  {task.tipe === 'sekolah' ? (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wide bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                      🟣 <span>Sekolah (B2B)</span>
                    </span>
                  ) : task.tipe === 'siswa' ? (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wide bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                      🟠 <span>Siswa (B2C)</span>
                    </span>
                  ) : task.tipe === 'homevisit' ? (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wide bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1">
                      🏠 <span>Home Visit</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      ⚡ <span>Ekstra</span>
                    </span>
                  )}

                  {/* Commercial State / Status */}
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-foreground/80 border border-border">
                    {task.commercialState || task.status}
                  </span>

                  {/* Intent Badge */}
                  {task.intent && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-semibold border',
                      task.intent === 'High' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      task.intent === 'Mid' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    )}>
                      {task.intent} Intent
                    </span>
                  )}
                </div>

                {/* Due Date Indicator */}
                <span className={cn(
                  'text-xs font-bold px-2 py-1 rounded-md shrink-0',
                  activeTab === 'overdue'   ? 'bg-rose-500/10 text-rose-500' :
                  activeTab === 'today'     ? 'bg-amber-500/10 text-amber-500' :
                  activeTab === 'tomorrow'  ? 'bg-blue-500/10 text-blue-500' :
                  activeTab === 'completed' ? 'bg-slate-500/10 text-slate-500' :
                                             'bg-emerald-500/10 text-emerald-500'
                )}>
                  📅 {task.dueDate}
                </span>
              </div>

              {/* Card Body */}
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 leading-tight text-wrap">
                  {task.nama}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {task.nextAction}
                  </span>
                  {(task.cro || task.pj) && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1">
                        <span className="text-xs uppercase tracking-wider font-semibold text-foreground/70">PJ:</span>
                        {task.cro || task.pj}
                      </span>
                    </>
                  )}
                  {task.aging !== undefined && task.aging > 0 && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">•</span>
                      <span className="text-xs text-amber-400">aging {task.aging}h</span>
                    </>
                  )}
                </p>
              </div>

              {/* Card Actions (SOP Tombol Eksekusi & Tunda) */}
              {activeTab !== 'completed' && (
                <div className="flex items-center gap-2.5 pt-3 border-t border-border">
                  <button
                    onClick={() => setTundaTarget({
                      id: task.id,
                      tipe: task.tipe,
                      title: `[${task.nextAction}] ${task.nama}`
                    })}
                    className="flex-1 min-h-11 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={15} /> 📅 Tunda
                  </button>
                  <button
                    onClick={() => handleEksekusi(task)}
                    disabled={isFetchingDetail && eksekusiTarget?.id === task.id}
                    className="flex-1 min-h-11 py-2.5 rounded-xl gradient-primary text-xs sm:text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    <CheckSquare size={15} /> ✅ Eksekusi
                  </button>
                </div>
              )}
            </div>
          ))
        )}
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
    </div>
  );
}
