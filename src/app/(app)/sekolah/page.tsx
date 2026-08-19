'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, School, Download, Upload,
  ChevronLeft, ChevronRight, X
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
        'flex flex-col gap-1 px-3 py-3 rounded-xl border text-left transition-all duration-150',
        active
          ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/10'
          : 'bg-card border-border hover:border-primary/20 hover:bg-card/80',
      )}
    >
      <span className={cn('text-xl font-bold tabular-nums', color)}>{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </button>
  );
}

export default function SekolahPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterCro, setFilterCro] = useState('');
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { user } = useAuthStore();
  const isCRO = user?.role === 'CRO';

  const kecamatanList = useMemo(() => getMockKecamatanList(), []);
  const croList = useMemo(() => getMockCROList(), []);
  const stats = useMemo(() => getMockStatSummary(), []);

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 flex-shrink-0">
            <School size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Master Sekolah</h1>
            <p className="text-[11px] text-muted-foreground truncate">{stats.total} sekolah · 2026/2027</p>
          </div>
        </div>

        {!isCRO && (
          <div className="flex items-center gap-2 flex-shrink-0">
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <Plus size={14} />
              <span className="hidden xs:inline">Tambah</span>
              <span className="inline xs:hidden">+</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard label="Total" value={stats.total} color="text-foreground"
          onClick={() => handleStatClick('')}
          active={filterStatus === '' && !hasFilters} />
        <StatCard label="Belum Visit" value={stats.belumVisit} color="text-slate-400"
          onClick={() => handleStatClick('Belum Visit')}
          active={filterStatus === 'Belum Visit'} />
        <StatCard label="Dalam Proses" value={stats.proses} color="text-amber-400"
          onClick={() => { setFilterStatus(''); setPage(1); }}
          active={false} />
        <StatCard label="Sosialisasi" value={stats.sosialisasi} color="text-emerald-400"
          onClick={() => handleStatClick('Sudah Sosialisasi')}
          active={filterStatus === 'Sudah Sosialisasi'} />
        <StatCard label="Lead 🎯" value={stats.leadCaptured} color="text-emerald-300"
          onClick={() => handleStatClick('Lead Captured')}
          active={filterStatus === 'Lead Captured'} />
        <StatCard label="Tidak Bisa" value={stats.tidakBisa} color="text-rose-400"
          onClick={() => handleStatClick('Tidak Bisa Sosialisasi')}
          active={filterStatus === 'Tidak Bisa Sosialisasi'} />
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama sekolah, ID, kecamatan..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="grid grid-cols-2 sm:flex gap-2">
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
            className="w-full sm:w-auto justify-center px-3 py-2.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm flex items-center gap-1.5"
          >
            <X size={14} /><span>Reset</span>
          </button>
        )}
      </div>

      {/* ── Table (desktop) / Card List (mobile) ── */}

      {/* Desktop Table */}
      <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Nama Sekolah</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Jenjang</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Kecamatan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Status CRM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">PJ CRO</th>
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
                    <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{s.id}</td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {s.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{s.tingkat}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.kecamatan}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={s.status} showDot />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.nextAction ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AgingBadge dueDate={s.dueDate} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.pjCro}</td>
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

      {/* Mobile Card List */}
      <div className="sm:hidden space-y-2">
        {sekolahList.length === 0 ? (
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
              {/* Row 1: Nama + Jenjang badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-medium text-sm text-foreground leading-snug flex-1">
                  {s.nama}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex-shrink-0 mt-0.5">
                  {s.tingkat}
                </span>
              </div>
              {/* Row 2: Status + Aging */}
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={s.status} showDot />
                <AgingBadge dueDate={s.dueDate} />
              </div>
              {/* Row 3: Meta */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{s.kecamatan}</span>
                {s.pjCro && <><span>·</span><span>{s.pjCro}</span></>}
                {s.nextAction && <><span>·</span><span className="truncate">{s.nextAction}</span></>}
              </div>
            </button>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {page}/{totalPages} · {total} sekolah
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors border border-border"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
