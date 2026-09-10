'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, School, Download, Upload,
  ChevronLeft, ChevronRight, X, Loader2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatusBadge, AgingBadge,
  AddSekolahModal, ImportMassalModal,
} from '@/components/sekolah';
import { IntentBadge } from '@/components/sekolah/IntentBadge';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getSekolahList,
  getSekolahStats,
  getKecamatanList,
  getCROList,
} from '@/lib/api/sekolah.api';
import type { Sekolah, SekolahStatsResponse } from '@/lib/types/sekolah.types';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-border/50 animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-secondary rounded w-full max-w-30" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 animate-pulse space-y-2">
      <div className="h-3.5 bg-secondary rounded w-3/4" />
      <div className="flex gap-2"><div className="h-5 bg-secondary rounded w-24" /><div className="h-5 bg-secondary rounded w-16" /></div>
      <div className="h-3 bg-secondary rounded w-1/2" />
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
  active: boolean;
  loading?: boolean;
}

function StatCard({ label, value, color, onClick, active, loading }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 px-3 py-3 rounded-xl border text-left transition-all duration-150',
        active
          ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/10'
          : 'bg-card border-border hover:border-primary/20 hover:bg-card/80',
      )}
    >
      {loading ? (
        <div className="h-6 w-10 bg-secondary rounded animate-pulse" />
      ) : (
        <span className={cn('text-xl font-bold tabular-nums', color)}>{value}</span>
      )}
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </button>
  );
}

export default function SekolahPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isCRO = user?.role === 'CRO';

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [search, setSearch]                   = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterCro, setFilterCro]             = useState('');
  const [filterIntent, setFilterIntent]       = useState('');
  const [page, setPage]                       = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen]       = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ── Data state ───────────────────────────────────────────────────────────────
  const [sekolahList, setSekolahList]   = useState<Sekolah[]>([]);
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [stats, setStats]               = useState<SekolahStatsResponse | null>(null);
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [croList, setCroList]           = useState<string[]>([]);

  // ── Loading / Error ──────────────────────────────────────────────────────────
  const [loadingList, setLoadingList]   = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ── Debounce search ──────────────────────────────────────────────────────────
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  // ── Fetch list ───────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await getSekolahList({
        page,
        status:    filterStatus    || undefined,
        kecamatan: filterKecamatan || undefined,
        pjCro:     filterCro       || undefined,
        search:    debouncedSearch || undefined,
        intent:    filterIntent    || undefined,
      });
      setSekolahList(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Gagal memuat data sekolah.');
      setSekolahList([]);
    } finally {
      setLoadingList(false);
    }
  }, [page, filterStatus, filterKecamatan, filterCro, debouncedSearch]);

  // ── Fetch stats + utils (sekali mount) ──────────────────────────────────────
  useEffect(() => {
    setLoadingStats(true);
    Promise.all([
      getSekolahStats(),
      getKecamatanList(),
      getCROList(),
    ]).then(([s, kec, cro]) => {
      setStats(s);
      setKecamatanList(kec);
      setCroList(cro);
    }).catch(console.error).finally(() => setLoadingStats(false));
  }, []);

  // Refetch list setiap kali filter / page berubah
  useEffect(() => { fetchList(); }, [fetchList]);

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setFilterStatus('');
    setFilterKecamatan('');
    setFilterCro('');
    setFilterIntent('');
    setPage(1);
  };

  const hasFilters = search || filterStatus || filterKecamatan || filterCro || filterIntent;

  const handleStatClick = (status: string) => {
    setFilterStatus(prev => prev === status ? '' : status);
    setPage(1);
  };

  // Dipanggil setelah tambah berhasil
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchList();
    // Refresh stats juga
    getSekolahStats().then(setStats).catch(console.error);
  };

  return (
    <div className="w-full space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
            <School size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Master Sekolah</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {loadingStats ? '…' : `${stats?.total ?? 0} sekolah`}
              {user?.selectedPeriod ? ` · ${user.selectedPeriod}` : ''}
            </p>
          </div>
        </div>

        {!isCRO && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all"
            >
              <Upload size={13} />
              <span>Import</span>
            </button>
            <button
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Tambah Sekolah</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard label="Total" value={stats?.total ?? 0} color="text-foreground"
          onClick={() => handleStatClick('')}
          active={filterStatus === '' && !hasFilters}
          loading={loadingStats} />
        <StatCard label="Belum Visit" value={stats?.belumVisit ?? stats?.cold ?? 0} color="text-slate-400"
          onClick={() => handleStatClick('Identified')}
          active={filterStatus === 'Identified'}
          loading={loadingStats} />
        <StatCard label="Dalam Proses" value={stats?.proses ?? stats?.engaged ?? 0} color="text-amber-400"
          onClick={() => handleStatClick('Engaged')}
          active={filterStatus === 'Engaged'}
          loading={loadingStats} />
        <StatCard label="Sos. Terjadwal" value={stats?.sosialisasiTerjadwal ?? 0} color="text-blue-400"
          onClick={() => handleStatClick('Sosialisasi Terjadwal')}
          active={filterStatus === 'Sosialisasi Terjadwal'}
          loading={loadingStats} />
        <StatCard label="Identity 🎯" value={stats?.identityCaptured ?? stats?.leadCaptured ?? 0} color="text-emerald-300"
          onClick={() => handleStatClick('Identity Captured')}
          active={filterStatus === 'Identity Captured'}
          loading={loadingStats} />
        <StatCard label="Tidak Bisa" value={stats?.tidakBisa ?? 0} color="text-rose-400"
          onClick={() => handleStatClick('Disqualified')}
          active={filterStatus === 'Disqualified'}
          loading={loadingStats} />
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama sekolah, ID, kecamatan..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
        {loadingList && search && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="grid grid-cols-2 sm:flex gap-2">
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="w-full px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          <option value="">Semua State</option>
          <option value="Identified">Identified (Belum Visit)</option>
          <option value="Engaged">Engaged (Dalam Proses)</option>
          <option value="Sosialisasi Terjadwal">Sosialisasi Terjadwal</option>
          <option value="Sudah Sosialisasi">Sudah Sosialisasi</option>
          <option value="Identity Captured">🎯 Identity Captured</option>
          <option value="Disqualified">Disqualified (Tidak Bisa / Nonaktif)</option>
        </select>
        <select
          value={filterKecamatan}
          onChange={e => { setFilterKecamatan(e.target.value); setPage(1); }}
          className="w-full px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          <option value="">Semua Kecamatan</option>
          {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        {!isCRO && (
          <select
            value={filterCro}
            onChange={e => { setFilterCro(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          >
            <option value="">Semua CRO</option>
            {croList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {/* Filter Intent */}
        <select
          value={filterIntent}
          onChange={e => { setFilterIntent(e.target.value); setPage(1); }}
          className="w-full px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          <option value="">Semua Intent</option>
          <option value="High">🔥 High Intent</option>
          <option value="Mid">🟢 Mid Intent</option>
          <option value="Low">⚪ Low Intent</option>
        </select>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="w-full sm:w-auto justify-center px-3 py-2.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm flex items-center gap-1.5"
          >
            <X size={14} /><span>Reset</span>
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && !loadingList && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button onClick={fetchList} className="ml-auto text-xs underline hover:no-underline">Coba lagi</button>
        </div>
      )}

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Nama Sekolah</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Jenjang</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Kecamatan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Intent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">PJ CRO</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sekolahList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <School size={32} className="opacity-20" />
                      <p>Tidak ada sekolah ditemukan</p>
                      {hasFilters && (
                        <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                          Reset filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sekolahList.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/sekolah/${s.id}`)}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{s.id}</td>
                    <td className="px-4 py-3 min-w-50">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {s.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{s.tingkat}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.kecamatan}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={s.pipelineState ?? s.status} showDot />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <IntentBadge intent={s.intent} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.nextAction ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AgingBadge dueDate={s.dueDate} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.pjCro || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages} · {total} sekolah
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loadingList}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loadingList}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Card List ── */}
      <div className="sm:hidden space-y-2">
        {loadingList ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : sekolahList.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">
            <div className="flex flex-col items-center gap-2">
              <School size={32} className="opacity-20" />
              <p>Tidak ada sekolah ditemukan</p>
              {hasFilters && (
                <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                  Reset filter
                </button>
              )}
            </div>
          </div>
        ) : (
          sekolahList.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/sekolah/${s.id}`)}
              className="w-full text-left bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 hover:bg-card/80 active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-medium text-sm text-foreground leading-snug flex-1">{s.nama}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0 mt-0.5">
                  {s.tingkat}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <StatusBadge status={s.pipelineState ?? s.status} showDot />
                <IntentBadge intent={s.intent} />
                <AgingBadge dueDate={s.dueDate} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{s.kecamatan}</span>
                {s.pjCro && <><span>·</span><span>{s.pjCro}</span></>}
                {s.nextAction && <><span>·</span><span className="truncate">{s.nextAction}</span></>}
              </div>
            </button>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">{page}/{totalPages} · {total} sekolah</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loadingList}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors border border-border"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loadingList}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors border border-border"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AddSekolahModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      <ImportMassalModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
