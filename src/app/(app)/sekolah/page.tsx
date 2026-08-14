'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, School, Download, Upload,
  ChevronLeft, ChevronRight, SlidersHorizontal, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatusBadge, AgingBadge,
  AddSekolahModal, ImportMassalModal
} from '@/components/sekolah';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getMockSekolahList,
  getMockKecamatanList,
  getMockCROList,
  getMockStatSummary,
  type MockSekolah,
} from '@/lib/mock/sekolah';

const PAGE_SIZE = 20;

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
  active: boolean;
}

function StatCard({ label, value, color, onClick, active }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 px-4 py-3 rounded-xl border text-left transition-all duration-150',
        active
          ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/10'
          : 'bg-card border-border hover:border-primary/20 hover:bg-card/80',
      )}
    >
      <span className={cn('text-2xl font-bold tabular-nums', color)}>{value}</span>
      <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
    </button>
  );
}

export default function SekolahPage() {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterCro, setFilterCro] = useState('');
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { user } = useAuthStore();
  const isCRO = user?.role === 'CRO';

  // Derived lists for dropdowns
  const kecamatanList = useMemo(() => getMockKecamatanList(), []);
  const croList = useMemo(() => getMockCROList(), []);
  const stats = useMemo(() => getMockStatSummary(), []);

  // Filter + paginate
  const { data: sekolahList, total } = useMemo(() =>
    getMockSekolahList({ search, filterStatus, filterKecamatan, filterCro, page, pageSize: PAGE_SIZE }),
    [search, filterStatus, filterKecamatan, filterCro, page]
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilterStatus('');
    setFilterKecamatan('');
    setFilterCro('');
    setPage(1);
  }, []);

  const hasFilters = search || filterStatus || filterKecamatan || filterCro;

  const handleStatClick = (status: string) => {
    setFilterStatus(prev => prev === status ? '' : status);
    setPage(1);
  };

  const STATUS_GROUPS: Record<string, string[]> = {
    '': [],
    proses: ['Tunggu Visit Ulang', 'Tunggu Keputusan', 'Tunggu Jadwal Sosialisasi', 'Sosialisasi Terjadwal'],
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 flex-shrink-0">
            <School size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Master Sekolah</h1>
            <p className="text-xs text-muted-foreground">{stats.total} sekolah terdaftar · Periode 2026/2027</p>
          </div>
        </div>

        {!isCRO && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all"
              title="Import Massal"
            >
              <Upload size={13} />
              <span>Import Massal</span>
            </button>
            <button
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all"
              title="Export Excel"
            >
              <Download size={13} />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <Plus size={14} />
              Tambah Sekolah
            </button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <StatCard label="Total" value={stats.total} color="text-foreground"
          onClick={() => handleStatClick('')}
          active={filterStatus === '' && !hasFilters} />
        <StatCard label="Belum Visit" value={stats.belumVisit} color="text-slate-400"
          onClick={() => handleStatClick('Belum Visit')}
          active={filterStatus === 'Belum Visit'} />
        <StatCard label="Dalam Proses" value={stats.proses} color="text-amber-400"
          onClick={() => { setFilterStatus(''); setPage(1); }}
          active={false} />
        <StatCard label="Sudah Sosialisasi" value={stats.sosialisasi} color="text-emerald-400"
          onClick={() => handleStatClick('Sudah Sosialisasi')}
          active={filterStatus === 'Sudah Sosialisasi'} />
        <StatCard label="Lead Captured 🎯" value={stats.leadCaptured} color="text-emerald-300"
          onClick={() => handleStatClick('Lead Captured')}
          active={filterStatus === 'Lead Captured'} />
        <StatCard label="Tidak Bisa" value={stats.tidakBisa} color="text-rose-400"
          onClick={() => handleStatClick('Tidak Bisa Sosialisasi')}
          active={filterStatus === 'Tidak Bisa Sosialisasi'} />
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama sekolah, ID, kecamatan..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:flex-shrink-0">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          >
            <option value="">Semua Status</option>
            <option value="Belum Visit">Belum Visit</option>
            <option value="Tunggu Visit Ulang">Tunggu Visit Ulang</option>
            <option value="Tunggu Keputusan">Tunggu Keputusan</option>
            <option value="Tunggu Jadwal Sosialisasi">Tunggu Jadwal Sos.</option>
            <option value="Sosialisasi Terjadwal">Sos. Terjadwal</option>
            <option value="Sudah Sosialisasi">Sudah Sosialisasi</option>
            <option value="Lead Captured">Lead Captured</option>
            <option value="Tidak Bisa Sosialisasi">Tidak Bisa Sos.</option>
            <option value="Nonaktif / Tutup / Merger">Nonaktif</option>
          </select>

          <select
            value={filterKecamatan}
            onChange={e => { setFilterKecamatan(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          >
            <option value="">Semua Kecamatan</option>
            {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>

          <select
            value={filterCro}
            onChange={e => { setFilterCro(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          >
            <option value="">Semua CRO</option>
            {croList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="w-full sm:w-auto justify-center px-3 py-2.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm flex items-center gap-1"
              title="Reset filter"
            >
              <X size={14} /> <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Nama Sekolah</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Jenjang</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kecamatan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status CRM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">PJ CRO</th>
              </tr>
            </thead>
            <tbody>
              {sekolahList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
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
                    <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono">{s.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {s.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{s.tingkat}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.kecamatan}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} showDot />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.nextAction ?? '—'}</td>
                    <td className="px-4 py-3">
                      <AgingBadge dueDate={s.dueDate} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.pjCro}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages} · {total} sekolah
            </p>
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

      {/* ── Modal Tambah ── */}
      <AddSekolahModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => setIsAddModalOpen(false)}
      />
      <ImportMassalModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
