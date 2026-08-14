'use client';

import { useEffect, useState } from 'react';
import { Users, School, CheckSquare, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

const FUNNEL_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#c4b5fd', '#10b981', '#f59e0b', '#f43f5e'
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [funnels, setFunnels] = useState<{ name: string; value: number }[]>([]);
  const [tasks, setTasks] = useState<{ idTarget: string; namaTarget: string; statusTerkini: string; nextAction: string; dueDate: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // ===== BYPASS BACKEND MOCK =====
        await new Promise(r => setTimeout(r, 400));
        setSummary({ totalSiswa: 1250, totalSekolah: 45, totalTasks: 18, totalTerdaftar: 86 });
        setFunnels([
          { name: 'Lead', value: 1250 },
          { name: 'Follow Up', value: 850 },
          { name: 'Konsultasi', value: 420 },
          { name: 'Daftar', value: 86 }
        ]);
        setTasks([
          { idTarget: '1', namaTarget: 'SMA N 1 Kota', statusTerkini: 'Follow Up', nextAction: 'Visit Awal', dueDate: 'Hari ini' },
          { idTarget: '2', namaTarget: 'Budi Santoso', statusTerkini: 'Konsultasi', nextAction: 'Telepon Ortu', dueDate: 'Besok' },
        ]);
        // ==============================
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards: StatCard[] = [
    { label: 'Total Siswa Aktif', value: summary.totalSiswa ?? '-', sub: 'periode ini', icon: Users, color: 'text-primary', trend: 12 },
    { label: 'Sekolah Di-handle', value: summary.totalSekolah ?? '-', sub: 'aktif', icon: School, color: 'text-violet-400' },
    { label: 'Tasks Hari Ini', value: summary.totalTasks ?? '-', sub: 'perlu tindak lanjut', icon: CheckSquare, color: 'text-amber-400' },
    { label: 'Konversi Bulan Ini', value: summary.totalTerdaftar ?? '-', sub: 'terdaftar', icon: TrendingUp, color: 'text-emerald-400', trend: 5 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-xl p-4 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2 rounded-lg bg-secondary', card.color)}>
                  <Icon size={16} />
                </div>
                {card.trend && (
                  <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium">
                    <ArrowUpRight size={12} />
                    {card.trend}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              {card.sub && <p className="text-[10px] text-muted-foreground/70">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col h-[380px] lg:h-[360px]">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <Activity size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Funnel Siswa</h2>
          </div>
          <div className="flex-1 min-h-0">
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
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada data funnel</div>
            )}
          </div>
        </div>

        {/* Funnel Donut */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-[380px] lg:h-[360px]">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex-shrink-0">Distribusi Status</h2>
          <div className="flex-1 min-h-0">
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
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada data distribusi</div>
            )}
          </div>
          {funnels.length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-border/50 flex-shrink-0">
              {funnels.slice(0, 4).map((f, i) => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FUNNEL_COLORS[i] }} />
                  <span className="text-muted-foreground truncate flex-1">{f.name}</span>
                  <span className="text-foreground font-medium">{isNaN(f.value) ? 0 : f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tasks Prioritas</h2>
          </div>
          <a href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
            Lihat semua <ArrowUpRight size={11} />
          </a>
        </div>
        <div className="overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Tidak ada task hari ini 🎉</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Target (Sekolah/Siswa)</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Next Action</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 text-foreground font-medium">{t.namaTarget}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">
                        {t.statusTerkini}
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
