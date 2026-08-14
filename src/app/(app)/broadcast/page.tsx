'use client';

import { useEffect, useState } from 'react';
import { Radio, RefreshCw, Send } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface BroadcastHistory {
  idBroadcast: string;
  templateName: string;
  namaSekolah: string;
  targetCount: number;
  sentCount: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  'completed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'in_progress': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'pending': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'failed': 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

export default function BroadcastPage() {
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.post('/broadcast/history', { args: [] });
      setHistory(res.data?.data?.history || res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-violet-400" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Broadcast Pesan</h1>
            <p className="text-xs text-muted-foreground">Kirim pesan massal WhatsApp ke siswa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-primary/20">
            <Send size={14} /> Broadcast Baru
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Riwayat Broadcast</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Template</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sekolah</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Target</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Terkirim</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-secondary animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">Belum ada riwayat broadcast</td></tr>
              ) : (
                history.map((b, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground text-xs">{b.templateName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{b.namaSekolah || 'Semua'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-md text-[11px] border font-medium', STATUS_COLORS[b.status] || 'bg-secondary text-muted-foreground border-border')}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs text-center">{b.targetCount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs text-center">{b.sentCount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{b.createdAt}</td>
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
