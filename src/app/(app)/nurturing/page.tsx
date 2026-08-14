'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface NurturingSiswa {
  idSiswa: string;
  namaSiswa: string;
  statusTerkini: string;
  nextAction: string;
  dueDate: string;
  cro: string;
  catatanSnooze?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Calon Prospek': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Prospek Aktif': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'Konsultasi': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
};

export default function NurturingPage() {
  const [data, setData] = useState<NurturingSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.post('/nurturing/dashboard', { args: [] });
      const d = res.data?.data || {};
      setData(d.siswa || d.list || []);
      setSummary(d.summary || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-400" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Nurturing Campaign</h1>
            <p className="text-xs text-muted-foreground">Pantau progres dan snooze siswa</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary).slice(0, 4).map(([key, val]) => (
            <div key={key} className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-foreground">{val}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{key}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Nama Siswa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">CRO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-secondary animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">Tidak ada data nurturing</td></tr>
              ) : (
                data.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.namaSiswa}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-md text-[11px] border font-medium', STATUS_COLORS[s.statusTerkini] || 'bg-secondary text-muted-foreground border-border')}>
                        {s.statusTerkini}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.nextAction}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.dueDate || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.cro}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
