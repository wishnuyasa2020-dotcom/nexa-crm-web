'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, RefreshCw, AlertCircle, School, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TundaTaskModal } from '@/components/sekolah/TundaTaskModal';
import { InputAktivitasModal as SekolahInputModal } from '@/components/sekolah/InputAktivitasModal';
import { InputAktivitasModal as SiswaInputModal } from '@/components/siswa/InputAktivitasModal';
import type { SekolahDetail } from '@/lib/types/sekolah.types';
import apiClient from '@/lib/apiClient';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed';

interface Task {
  tipe: 'sekolah' | 'siswa' | 'homevisit' | 'aktifitas_ekstra';
  id: string;
  nama: string;
  status: string;
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
  overdue:   'overdue',
  today:     'today',
  tomorrow:  'tomorrow',
  upcoming:  'upcoming',
  completed: 'done',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [activeTab, setActiveTab]   = useState<TabKey>('overdue');
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [counts, setCounts]         = useState<TaskCounts | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tundaTarget, setTundaTarget] = useState<{ id: string; tipe: Task['tipe']; title: string } | null>(null);

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
      id: 'overdue' as TabKey,
      label: 'Overdue',
      icon: Clock,
      count: totalOverdue,
      activeCls: 'bg-rose-500/10 text-rose-500',
      badgeCls: 'bg-rose-500/20',
    },
    {
      id: 'today' as TabKey,
      label: 'Hari Ini',
      icon: Calendar,
      count: counts?.hari_ini ?? 0,
      activeCls: 'bg-amber-500/10 text-amber-500',
      badgeCls: 'bg-amber-500/20',
    },
    {
      id: 'tomorrow' as TabKey,
      label: 'Besok',
      icon: Calendar,
      count: counts?.besok ?? 0,
      activeCls: 'bg-blue-500/10 text-blue-500',
      badgeCls: 'bg-blue-500/20',
    },
    {
      id: 'upcoming' as TabKey,
      label: 'Mendatang',
      icon: Calendar,
      count: counts?.akan_datang ?? 0,
      activeCls: 'bg-emerald-500/10 text-emerald-500',
      badgeCls: 'bg-emerald-500/20',
    },
    {
      id: 'completed' as TabKey,
      label: 'Selesai',
      icon: CheckSquare,
      count: 0,
      activeCls: 'bg-slate-500/10 text-slate-500',
      badgeCls: 'bg-slate-500/20',
    },
  ];

  // Handle reschedule berhasil — optimistic update
  const handleTundaSuccess = (newDate: string) => {
    if (!tundaTarget) return;
    setTasks(prev => prev.filter(t => !(t.id === tundaTarget.id && t.tipe === tundaTarget.tipe)));
    setTundaTarget(null);
  };

  const handleEksekusi = async (task: Task) => {
    if (task.tipe === 'sekolah') {
      setIsFetchingDetail(true);
      try {
        const { getSekolahDetail } = await import('@/lib/api/sekolah.api');
        const res = await getSekolahDetail(task.id);
        setSekolahDetail(res);
        setEksekusiTarget(task);
      } catch (err) {
        console.error('Gagal mengambil data sekolah', err);
        alert('Gagal memuat data sekolah.');
      } finally {
        setIsFetchingDetail(false);
      }
    } else if (task.tipe === 'siswa') {
      setEksekusiTarget(task);
    } else {
      alert(`Fitur eksekusi untuk tipe ${task.tipe} belum tersedia.`);
    }
  };

  const handleEksekusiSuccess = () => {
    // Hapus task dari list jika sukses
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
            <p className="text-xs text-muted-foreground">Agenda aktivitas lapangan CRO</p>
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

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-card border border-border rounded-xl shadow-sm w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-[90px] px-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
              activeTab === tab.id ? tab.activeCls : 'text-muted-foreground hover:bg-secondary/50'
            )}
          >
            <tab.icon size={14} className="shrink-0" />
            <span className="truncate">{tab.label}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0',
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
                <div className="flex-1 h-9 bg-secondary rounded" />
                <div className="flex-1 h-9 bg-secondary rounded" />
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
            {activeTab === 'overdue'   ? '🎉 Tidak ada task overdue!' :
             activeTab === 'today'     ? 'Tidak ada agenda untuk hari ini.' :
             activeTab === 'tomorrow'  ? 'Tidak ada agenda untuk besok.' :
             activeTab === 'upcoming'  ? 'Tidak ada agenda mendatang.' :
                                        'Riwayat task kosong.'}
          </div>
        ) : (
          tasks.map((task) => (
            <div key={`${task.tipe}-${task.id}`} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {/* Tipe icon */}
                  {task.tipe === 'sekolah' ? (
                    <School size={13} className="text-blue-400 shrink-0" />
                  ) : (
                    <User size={13} className="text-violet-400 shrink-0" />
                  )}
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                    task.tipe === 'sekolah'         ? 'bg-blue-500/10 text-blue-400' :
                    task.tipe === 'siswa'           ? 'bg-violet-500/10 text-violet-400' :
                    task.tipe === 'homevisit'       ? 'bg-teal-500/10 text-teal-400' :
                                                     'bg-orange-500/10 text-orange-400'
                  )}>
                    {task.tipe === 'aktifitas_ekstra' ? 'Ekstra' :
                     task.tipe === 'homevisit' ? 'Home Visit' :
                     task.tipe === 'sekolah' ? 'Sekolah' : 'Siswa'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-primary/10 text-primary border border-primary/20">
                    {task.status}
                  </span>
                </div>
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
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 leading-tight break-words">
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
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">PJ:</span>
                        {task.cro || task.pj}
                      </span>
                    </>
                  )}
                  {task.aging !== undefined && task.aging > 0 && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">•</span>
                      <span className="text-[10px] text-amber-400">aging {task.aging}h</span>
                    </>
                  )}
                </p>
              </div>

              {/* Card Actions */}
              {activeTab !== 'completed' && (
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setTundaTarget({
                      id: task.id,
                      tipe: task.tipe,
                      title: `[${task.nextAction}] ${task.nama}`
                    })}
                    className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={14} /> Tunda
                  </button>
                  <button
                    onClick={() => handleEksekusi(task)}
                    className="flex-1 py-2.5 rounded-lg gradient-primary text-xs font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <CheckSquare size={14} /> Eksekusi
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Modal Tunda Task ── */}
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

      {/* ── Modal Eksekusi Task ── */}
      {eksekusiTarget?.tipe === 'sekolah' && sekolahDetail && (
        <SekolahInputModal
          isOpen={!!eksekusiTarget}
          onClose={() => { setEksekusiTarget(null); setSekolahDetail(null); }}
          sekolah={sekolahDetail}
          onSuccess={handleEksekusiSuccess}
        />
      )}

      {eksekusiTarget?.tipe === 'siswa' && (
        <SiswaInputModal
          isOpen={!!eksekusiTarget}
          onClose={() => setEksekusiTarget(null)}
          // onSuccess={handleEksekusiSuccess} // If SiswaInputModal supports this later
        />
      )}
    </div>
  );
}
