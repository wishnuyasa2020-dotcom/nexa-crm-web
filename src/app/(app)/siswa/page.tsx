'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, ChevronLeft, ChevronRight, Users,
  UserPlus, ChevronRight as ArrowRight, SlidersHorizontal,
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { AddSiswaModal }    from '@/components/siswa/AddSiswaModal';
import { EditSiswaModal }   from '@/components/siswa/EditSiswaModal';
import { ImportSiswaModal } from '@/components/siswa/ImportSiswaModal';

interface Siswa {
  idRecord:   string;
  id:         string;
  nama:       string;
  kelas:      string;
  cro:        string;
  status:     string;
  nextAction: string;
  prioritas:  string;
  dueDate:    string;
  namaSekolah: string;
  wa?:        string;
  bsuid?:     string;
}

const STATUS_COLORS: Record<string, string> = {
  'Data Masuk':       'bg-slate-500/15 text-slate-400 border-slate-500/20',
  'Calon Prospek':    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Prospek Aktif':    'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'Konsultasi':       'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Layak Home Visit': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Home Visit':       'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Siap Daftar':      'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Terdaftar':        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Tidak Lanjut':     'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

const PRIORITY_BADGE: Record<string, string> = {
  'A': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'B': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'C': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

// ── Skeleton Mobile Card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border border-border/50 rounded-xl p-3 space-y-2">
      <div className="flex justify-between">
        <div className="space-y-1.5 w-2/3">
          <div className="h-4 bg-secondary animate-pulse rounded w-full" />
          <div className="h-3 bg-secondary animate-pulse rounded w-3/4" />
        </div>
        <div className="h-5 w-16 bg-secondary animate-pulse rounded" />
      </div>
      <div className="h-3 bg-secondary animate-pulse rounded w-1/2" />
    </div>
  );
}

export default function SiswaPage() {
  const router = useRouter();
  const [siswaList,        setSiswaList]        = useState<Siswa[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [page,             setPage]             = useState(1);
  const [total,            setTotal]            = useState(0);
  const [filterStatus,     setFilterStatus]     = useState('');
  const [filterKelas,      setFilterKelas]      = useState('');
  const [isAddModalOpen,   setIsAddModalOpen]   = useState(false);
  const [isImportModalOpen,setIsImportModalOpen]= useState(false);
  const [isEditModalOpen,  setIsEditModalOpen]  = useState(false);
  const [selectedSiswaId,  setSelectedSiswaId]  = useState<string | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const pageSize = 20;

  const loadSiswa = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (page > 1) query.append('page', page.toString());
      if (search) query.append('search', search);
      if (filterStatus) query.append('status', filterStatus);
      if (filterKelas)  query.append('kelas', filterKelas);

      const res = await apiClient.get(`/api/v1/siswa?${query.toString()}`);
      if (res.data?.status === 'ok') {
        setSiswaList(res.data.data.data);
        setTotal(res.data.data.total);
      }
    } catch (e) {
      console.error('Error loading siswa:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterKelas]);

  useEffect(() => {
    const timer = setTimeout(() => loadSiswa(), 300);
    return () => clearTimeout(timer);
  }, [loadSiswa]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 pb-24 md:pb-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Data Siswa</h1>
            <p className="text-xs text-muted-foreground">{total} siswa ditemukan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter toggle — mobile only */}
          <button
            onClick={() => setShowMobileFilter(v => !v)}
            className={cn(
              'sm:hidden p-2 rounded-lg border border-border text-muted-foreground transition-colors',
              showMobileFilter && 'bg-primary/10 text-primary border-primary/40'
            )}
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 active:scale-[0.98] transition-all border border-border"
          >
            Import Excel
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Tambah Siswa</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* ── Search (always visible) ──────────────────────────────────────────── */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama siswa..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
        />
      </div>

      {/* ── Filters — desktop always visible, mobile toggleable ─────────────── */}
      <div className={cn('flex-col sm:flex-row gap-3', showMobileFilter ? 'flex' : 'hidden sm:flex')}>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
        >
          <option value="">Semua Status</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterKelas}
          onChange={e => { setFilterKelas(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
        >
          <option value="">Semua Kelas</option>
          <option value="XII-IPA-1">XII-IPA-1</option>
          <option value="XII-IPS-2">XII-IPS-2</option>
        </select>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP TABLE — hidden on mobile
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Nama Siswa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sekolah</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kelas</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Prioritas</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">CRO</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-secondary animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                    Tidak ada data siswa ditemukan
                  </td>
                </tr>
              ) : (
                siswaList.map((s) => (
                  <tr
                    key={s.idRecord}
                    onClick={() => router.push(`/siswa/${s.id}`)}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {s.nama}
                      <div className="mt-1">
                        {!s.wa && s.bsuid ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-secondary/50 text-muted-foreground border border-border">
                            📱 Hidden by User
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-36 truncate">{s.namaSekolah}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.kelas}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-md text-[11px] border font-medium', STATUS_COLORS[s.status] || 'bg-secondary text-muted-foreground border-border')}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-md text-[11px] border font-bold', PRIORITY_BADGE[s.prioritas] || 'bg-secondary text-muted-foreground border-border')}>
                        {s.prioritas}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.nextAction}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.cro}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.dueDate || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination desktop */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages} · {total} total</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE CARD LIST — hidden on desktop
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : siswaList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Tidak ada data siswa ditemukan
          </div>
        ) : (
          siswaList.map((s) => (
            <button
              key={s.idRecord}
              onClick={() => router.push(`/siswa/${s.id}`)}
              className="w-full text-left bg-card border border-border rounded-xl p-3.5 hover:bg-secondary/20 active:scale-[0.98] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Nama & Sekolah */}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{s.nama}</p>
                    {!s.wa && s.bsuid && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-secondary/50 text-muted-foreground border border-border">
                        📱 Hidden by User
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{s.namaSekolah}</p>
                  {/* Kelas & CRO */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.kelas && <span className="mr-2">{s.kelas}</span>}
                    {s.cro && <span className="text-primary/70">{s.cro}</span>}
                  </p>
                </div>
                {/* Prioritas badge di kanan */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn('px-2 py-0.5 rounded-md text-[10px] border font-bold', PRIORITY_BADGE[s.prioritas] || 'bg-secondary text-muted-foreground border-border')}>
                    {s.prioritas || '–'}
                  </span>
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </div>

              {/* Status & Due date di bawah */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                <span className={cn('px-2 py-0.5 rounded-md text-[10px] border font-medium', STATUS_COLORS[s.status] || 'bg-secondary text-muted-foreground border-border')}>
                  {s.status}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {s.dueDate ? `📅 ${s.dueDate}` : s.nextAction || ''}
                </span>
              </div>
            </button>
          ))
        )}

        {/* Pagination mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-1">
            <p className="text-xs text-muted-foreground">Hal. {page} / {totalPages} · {total} total</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AddSiswaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => { setPage(1); loadSiswa(); }}
      />
      <EditSiswaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        idSiswa={selectedSiswaId}
        onSuccess={() => loadSiswa()}
      />
      <ImportSiswaModal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); loadSiswa(); }}
      />
    </div>
  );
}
