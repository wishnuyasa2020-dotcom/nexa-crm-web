'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { AddSiswaModal } from '@/components/AddSiswaModal';
import { EditSiswaModal } from '@/components/EditSiswaModal';

interface Siswa {
  idRecord: string;
  id: string;        // backend: id_siswa as id
  nama: string;      // backend: nama_lengkap as nama
  kelas: string;     // Kelas siswa (e.g., XII-IPA-1)
  cro: string;
  status: string;    // backend: status_terkini as status
  nextAction: string;
  prioritas: string;
  dueDate: string;
  namaSekolah: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Data Masuk': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  'Calon Prospek': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Prospek Aktif': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'Konsultasi': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Layak Home Visit': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Home Visit': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Siap Daftar': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Terdaftar': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Tidak Lanjut': 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

const PRIORITY_BADGE: Record<string, string> = {
  'A': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'B': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'C': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const pageSize = 20;

  const loadSiswa = useCallback(async () => {
    setLoading(true);
    try {
      // ===== BYPASS BACKEND MOCK =====
      await new Promise(r => setTimeout(r, 400));
      const mockData: Siswa[] = [
        { idRecord: '1', id: 'S-001', nama: 'Ahmad Faisal', kelas: 'XII-IPA-1', cro: 'Budi Santoso', status: 'Calon Prospek', nextAction: 'Telepon perkenalan', prioritas: 'B', dueDate: '2026-08-15', namaSekolah: 'SMA N 1 Kota' },
        { idRecord: '2', id: 'S-002', nama: 'Siti Aminah', kelas: 'XII-IPS-2', cro: 'Andi M', status: 'Konsultasi', nextAction: 'Undang kampus', prioritas: 'A', dueDate: '2026-08-16', namaSekolah: 'SMK Bisa' },
        { idRecord: '3', id: 'S-003', nama: 'Bagus Prakoso', kelas: 'XII-IPA-1', cro: 'Budi Santoso', status: 'Siap Daftar', nextAction: 'Follow up pendaftaran', prioritas: 'A', dueDate: '2026-08-14', namaSekolah: 'SMA N 2 Kota' },
      ];
      setSiswaList(mockData);
      setTotal(mockData.length);
      // ==============================
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
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Data Siswa</h1>
            <p className="text-xs text-muted-foreground">{total} siswa ditemukan</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
        >
          <Plus size={15} />
          Tambah Siswa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors min-w-40"
        >
          <option value="">Semua Status</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterKelas}
          onChange={e => { setFilterKelas(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors min-w-40"
        >
          <option value="">Semua Kelas</option>
          <option value="XII-IPA-1">XII-IPA-1</option>
          <option value="XII-IPS-2">XII-IPS-2</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
                    onClick={() => {
                      setSelectedSiswaId(s.id);
                      setIsEditModalOpen(true);
                    }}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{s.nama}</td>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages} · {total} total
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

      <AddSiswaModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setPage(1);
          loadSiswa();
        }}
      />

      <EditSiswaModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        idSiswa={selectedSiswaId}
        onSuccess={() => loadSiswa()}
      />
    </div>
  );
}
