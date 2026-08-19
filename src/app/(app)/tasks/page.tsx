'use client';

import { useState, useMemo, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/sekolah/StatusBadge';
import { TundaTaskModal } from '@/components/sekolah/TundaTaskModal';
import { InputAktivitasModal } from '@/components/sekolah/InputAktivitasModal';
import { getMockSekolahList, MockSekolah } from '@/lib/mock/sekolah';

type TabKey = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overdue');
  const [loading, setLoading] = useState(true);
  const [sekolahList, setSekolahList] = useState<MockSekolah[]>([]);

  // Modals state
  const [selectedSekolahForTunda, setSelectedSekolahForTunda] = useState<MockSekolah | null>(null);
  const [selectedSekolahForInput, setSelectedSekolahForInput] = useState<MockSekolah | null>(null);

  useEffect(() => {
    // Simulate loading data
    setLoading(true);
    setTimeout(() => {
      const res = getMockSekolahList({ page: 1, pageSize: 100 });
      // Only get sekolah that has due date
      setSekolahList(res.data.filter(s => s.dueDate));
      setLoading(false);
    }, 600);
  }, []);

  const todayStr = '2026-08-14'; // Mock today date
  const tomorrowStr = '2026-08-15'; // Mock tomorrow date

  const tasks = useMemo(() => {
    const overdue: MockSekolah[] = [];
    const today: MockSekolah[] = [];
    const tomorrow: MockSekolah[] = [];
    const upcoming: MockSekolah[] = [];
    const completed: MockSekolah[] = [];

    sekolahList.forEach(s => {
      if (!s.dueDate) return;
      if (s.dueDate < todayStr) overdue.push(s);
      else if (s.dueDate === todayStr) today.push(s);
      else if (s.dueDate === tomorrowStr) tomorrow.push(s);
      else upcoming.push(s);
    });

    return { overdue, today, tomorrow, upcoming, completed };
  }, [sekolahList]);

  const currentList = tasks[activeTab];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 text-white">
            <CheckSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Task List</h1>
            <p className="text-xs text-muted-foreground">Agenda aktivitas lapangan</p>
          </div>
        </div>
        <button 
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }} 
          className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Top Tabs ── */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-card border border-border rounded-xl shadow-sm w-full">
        {[
          { id: 'overdue', label: 'Overdue', icon: Clock, count: tasks.overdue.length, activeCls: 'bg-rose-500/10 text-rose-500', badgeCls: 'bg-rose-500/20' },
          { id: 'today', label: 'Hari Ini', icon: Calendar, count: tasks.today.length, activeCls: 'bg-amber-500/10 text-amber-500', badgeCls: 'bg-amber-500/20' },
          { id: 'tomorrow', label: 'Besok', icon: Calendar, count: tasks.tomorrow.length, activeCls: 'bg-blue-500/10 text-blue-500', badgeCls: 'bg-blue-500/20' },
          { id: 'upcoming', label: 'Mendatang', icon: Calendar, count: tasks.upcoming.length, activeCls: 'bg-emerald-500/10 text-emerald-500', badgeCls: 'bg-emerald-500/20' },
          { id: 'completed', label: 'Selesai', icon: CheckSquare, count: tasks.completed.length, activeCls: 'bg-slate-500/10 text-slate-500', badgeCls: 'bg-slate-500/20' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabKey)}
            className={cn(
              "flex-1 min-w-[100px] px-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === tab.id ? tab.activeCls : "text-muted-foreground hover:bg-secondary/50"
            )}
          >
            <tab.icon size={14} className="shrink-0" /> <span className="truncate">{tab.label}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0", activeTab === tab.id ? tab.badgeCls : "bg-secondary text-muted-foreground")}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Card List ── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex justify-between mb-3"><div className="w-20 h-5 bg-secondary rounded" /><div className="w-24 h-5 bg-secondary rounded" /></div>
              <div className="w-3/4 h-6 bg-secondary rounded mb-4" />
              <div className="flex gap-2"><div className="flex-1 h-9 bg-secondary rounded" /><div className="flex-1 h-9 bg-secondary rounded" /></div>
            </div>
          ))
        ) : currentList.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
            {activeTab === 'overdue' ? 'Wah, keren! Tidak ada task yang overdue. 🎉' : 
             activeTab === 'today' ? 'Tidak ada agenda untuk hari ini.' : 'Belum ada agenda mendatang.'}
          </div>
        ) : (
          currentList.map(task => (
            <div key={task.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <StatusBadge status={task.status} size="sm" />
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-md",
                  activeTab === 'overdue' ? "bg-rose-500/10 text-rose-500" :
                  activeTab === 'today' ? "bg-amber-500/10 text-amber-500" : 
                  activeTab === 'tomorrow' ? "bg-blue-500/10 text-blue-500" :
                  activeTab === 'completed' ? "bg-slate-500/10 text-slate-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  📅 {task.dueDate}
                </span>
              </div>
              
              {/* Card Body */}
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 leading-tight break-words">{task.nama}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{task.nextAction}</span>
                  <span className="hidden sm:inline text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">PJ:</span> 
                    {task.pjCro}
                  </span>
                </p>
              </div>

              {/* Card Footer Actions */}
              {activeTab !== 'completed' && (
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button 
                    onClick={() => setSelectedSekolahForTunda(task)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={14} /> Tunda
                  </button>
                  <button 
                    onClick={() => setSelectedSekolahForInput(task)}
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

      {/* ── Modals ── */}
      {selectedSekolahForTunda && (
        <TundaTaskModal
          isOpen={!!selectedSekolahForTunda}
          onClose={() => setSelectedSekolahForTunda(null)}
          taskTitle={`[${selectedSekolahForTunda.nextAction}] ${selectedSekolahForTunda.nama}`}
          onSuccess={(newDate) => {
            // Optimistic update
            setSekolahList(prev => prev.map(s => s.id === selectedSekolahForTunda.id ? { ...s, dueDate: newDate } : s));
            setSelectedSekolahForTunda(null);
          }}
        />
      )}

      {selectedSekolahForInput && (
        <InputAktivitasModal
          isOpen={!!selectedSekolahForInput}
          onClose={() => setSelectedSekolahForInput(null)}
          sekolah={selectedSekolahForInput}
          onSuccess={() => {
            setSelectedSekolahForInput(null);
            // Simulate reload
            setLoading(true);
            setTimeout(() => setLoading(false), 600);
          }}
        />
      )}
    </div>
  );
}
