'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, Search, Ban, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { nurturingApi, SnoozeStats, SnoozeLead } from '@/lib/nurturingApi';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import WhatsAppGatingBanner from '@/components/common/WhatsAppGatingBanner';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-secondary animate-pulse rounded-md w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCardMobile() {
  return (
    <div className="border border-border/50 rounded-lg p-3 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-1 w-1/2">
          <div className="h-4 bg-secondary animate-pulse rounded-md w-full" />
          <div className="h-3 bg-secondary animate-pulse rounded-md w-3/4" />
        </div>
        <div className="h-5 bg-secondary animate-pulse rounded-md w-16" />
      </div>
      <div className="h-3 bg-secondary animate-pulse rounded-md w-1/2" />
      <div className="h-11 bg-secondary animate-pulse rounded-md w-full" />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SnoozeLevelBadge({ level }: { level: number }) {
  const colorMap: Record<number, string> = {
    1: 'border-blue-500/20 text-blue-500 bg-blue-500/10',
    2: 'border-orange-500/20 text-orange-500 bg-orange-500/10',
    3: 'border-rose-500/20 text-rose-500 bg-rose-500/10',
  };
  return (
    <Badge variant="outline" className={`font-medium text-xs whitespace-nowrap ${colorMap[level] || 'border-slate-500/20 text-slate-400 bg-slate-500/10'}`}>
      Snooze {level}
    </Badge>
  );
}

function SisaHariLabel({ hari }: { hari: number }) {
  if (hari <= 0) return <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Hari ini!</span>;
  if (hari <= 7) return <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">{hari} hari lagi</span>;
  return <span className="text-xs text-muted-foreground">{hari} hari lagi</span>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SnoozeCampaignPage() {
  const { data: waData, isConnected: isWaConnected, loading: waLoading } = useWhatsAppStatus();
  const router                          = useRouter();
  const [stats, setStats]               = useState<SnoozeStats | null>(null);
  const [leads, setLeads]               = useState<SnoozeLead[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [error, setError]               = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [selectedLead, setSelectedLead]   = useState<SnoozeLead | null>(null);

  // Add snooze form
  const [addIdSiswa, setAddIdSiswa]       = useState('');
  const [intervalDays, setIntervalDays]   = useState<number>(90);
  const [addAlasan, setAddAlasan]         = useState('');
  const [addLoading, setAddLoading]       = useState(false);

  // Stop snooze
  const [stopLoading, setStopLoading]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await nurturingApi.getSnoozeStats();
      setStats(res.data.data);
    } catch {
      setError('Gagal memuat statistik snooze.');
    }
  }, []);

  const fetchLeads = useCallback(async (p = 1, q = search) => {
    setLeadsLoading(true);
    try {
      const res = await nurturingApi.getSnoozeLeads({ page: p, limit: 15, search: q || undefined });
      setLeads(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      setError('Gagal memuat daftar snooze.');
    } finally {
      setLeadsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchLeads(1)]).finally(() => setLoading(false));
  }, [fetchStats, fetchLeads]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    fetchLeads(1, searchInput);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchLeads(p);
  };

  const handleStopSnooze = (lead: SnoozeLead) => {
    setSelectedLead(lead);
    setShowStopModal(true);
  };

  const confirmStopSnooze = async () => {
    if (!selectedLead) return;
    setStopLoading(true);
    try {
      await nurturingApi.wakeupSnooze(selectedLead.id);
      setShowStopModal(false);
      await Promise.all([fetchStats(), fetchLeads(page)]);
    } catch {
      alert('Gagal membangunkan siswa dari snooze. Coba lagi.');
    } finally {
      setStopLoading(false);
    }
  };

  const handleAddSnooze = async () => {
    if (!isWaConnected) {
      alert('Nomor WhatsApp Bisnis belum aktif. Hubungkan nomor di menu Pengaturan.');
      return;
    }
    if (!addIdSiswa.trim()) return;
    setAddLoading(true);
    try {
      await nurturingApi.requestSnooze({
        idSiswa: addIdSiswa.trim(),
        interval_days: intervalDays,
        alasan: addAlasan,
      });
      setShowAddModal(false);
      setAddIdSiswa('');
      setAddAlasan('');
      setIntervalDays(90);
      await Promise.all([fetchStats(), fetchLeads(page)]);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(errorMsg || 'Gagal menambahkan snooze. Pastikan ID Siswa benar dan izin WhatsApp aktif.');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Error State ──────────────────────────────────────────────────────────────

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
        <AlertCircle size={32} className="text-rose-500" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => { setError(null); fetchStats(); fetchLeads(1); }}>
          <RefreshCw size={14} className="mr-1" /> Coba Lagi
        </Button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6 pb-20 w-full min-w-0">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
          <Clock size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Snooze Campaign</h1>
          <p className="text-xs md:text-sm text-muted-foreground truncate">Monitoring antrean prospek yang ditunda (30 / 60 / 90 Hari)</p>
        </div>
      </div>

      {/* Gating Banner jika WhatsApp belum terhubung */}
      {!isWaConnected && !waLoading && (
        <WhatsAppGatingBanner
          featureName="Snooze Campaign WhatsApp"
          status={waData?.whatsappStatus}
        />
      )}

      {/* ── STAT CARDS + TOMBOL AKSI ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Total Sedang Tunda */}
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-xs text-muted-foreground font-medium mb-1">Total Sedang Tunda</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <span className="inline-block w-10 h-7 bg-secondary animate-pulse rounded" /> : (stats?.total_sedang_tunda ?? 0)}
              </p>
            </CardContent>
          </Card>

          {/* Bangun Minggu Ini */}
          <Card className="border shadow-sm bg-orange-500/5">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-xs text-orange-500 font-medium mb-1">Bangun Minggu Ini</p>
              <p className="text-2xl font-bold text-orange-500">
                {loading ? <span className="inline-block w-10 h-7 bg-orange-200 animate-pulse rounded" /> : (stats?.bangun_minggu_ini ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Tambah Snooze */}
        <div className="col-span-1 flex items-center justify-start lg:justify-end">
          <Button
            className={cn(
              "w-full lg:w-auto h-12 md:h-10 rounded-xl text-white shadow-lg text-sm transition-all",
              !isWaConnected
                ? "bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
                : "gradient-primary shadow-primary/20 hover:opacity-90"
            )}
            onClick={() => {
              if (!isWaConnected) {
                alert('Nomor WhatsApp Bisnis belum terhubung. Silakan hubungkan nomor terlebih dahulu di Pengaturan.');
                return;
              }
              setShowAddModal(true);
            }}
            disabled={!isWaConnected}
            id="btn-tambah-snooze"
          >
            <Plus size={18} className="mr-2 shrink-0" /> Tambah Snooze Manual
          </Button>
        </div>
      </div>

      {/* ── DAFTAR SNOOZE ───────────────────────────────────────────────────── */}
      <Card className="border shadow-sm overflow-hidden flex flex-col min-w-0">
        <CardHeader className="p-3 md:p-4 border-b bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            📋 Daftar Snooze Aktif
            {!leadsLoading && <span className="text-xs font-normal text-muted-foreground">({total} total)</span>}
          </CardTitle>
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative w-full sm:w-56 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary transition-all"
              id="input-search-snooze"
            />
          </form>
        </CardHeader>

        {/* ── MOBILE VIEW (CARD LIST) ────────────────────────────────────────── */}
        <div className="block md:hidden p-3 space-y-3 bg-secondary/5">
          {leadsLoading ? (
            [...Array(3)].map((_, i) => <SkeletonCardMobile key={i} />)
          ) : leads.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm bg-background rounded-lg border border-dashed">
              {search ? `Tidak ada hasil untuk "${search}".` : 'Belum ada antrean snooze aktif.'}
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="border border-border/60 rounded-xl p-4 bg-background shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">{lead.nama}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.noWa}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.sekolah}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-xs font-medium">
                        {lead.commercialState || 'Lead'}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500 font-medium">
                        <ShieldCheck size={11} /> Consent Aktif
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <SnoozeLevelBadge level={lead.snoozeLevel} />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-foreground">
                      {lead.intervalDays ? `${lead.intervalDays} Hari` : '90 Hari'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs bg-secondary/30 p-2.5 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Tgl Bangun</p>
                    <p className="font-medium text-foreground">{lead.snoozeUntil}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">Sisa Waktu</p>
                    <SisaHariLabel hari={lead.sisaHari} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 h-11 text-xs rounded-lg font-medium"
                    title="Lihat Chat"
                    onClick={() => router.push(`/live-chat?leadId=${lead.id}`)}
                  >
                    <MessageSquare size={14} className="mr-1.5 text-primary" /> Chat
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 text-xs border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors rounded-lg font-medium"
                    onClick={() => handleStopSnooze(lead)}
                    id={`btn-stop-snooze-mobile-${lead.id}`}
                  >
                    <Ban size={14} className="mr-1.5" /> Bangunkan Paksa
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── DESKTOP VIEW (TABLE) ───────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-sm border-collapse min-w-160">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama Siswa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asal Sekolah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status Komersial</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Consent</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Level Snooze</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tgl Bangun</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sisa Waktu</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {leadsLoading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground text-sm">
                    {search ? `Tidak ada hasil untuk "${search}".` : 'Belum ada antrean snooze aktif.'}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="min-w-0">
                        <p className="truncate max-w-48 lg:max-w-72">{lead.nama}</p>
                        <p className="text-xs text-muted-foreground font-normal truncate max-w-48 lg:max-w-72">{lead.noWa}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      <p className="truncate max-w-36 lg:max-w-64">{lead.sekolah}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-xs font-medium">
                        {lead.commercialState || 'Lead'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck size={12} /> Aktif
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SnoozeLevelBadge level={lead.snoozeLevel} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{lead.snoozeUntil}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SisaHariLabel hari={lead.sisaHari} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-primary transition-colors"
                          title="Lihat Chat"
                          onClick={() => router.push(`/live-chat?leadId=${lead.id}`)}
                          id={`btn-chat-${lead.id}`}
                        >
                          <MessageSquare size={14} className="text-primary" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs hover:text-rose-500 hover:border-rose-500/40 transition-colors whitespace-nowrap"
                          onClick={() => handleStopSnooze(lead)}
                          id={`btn-stop-snooze-${lead.id}`}
                        >
                          <Ban size={14} className="mr-1 opacity-70" /> Bangunkan Paksa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PRIVACY & CONSENT NOTICE FOOTER ───────────────────────────────── */}
        <div className="px-4 py-2.5 bg-emerald-500/5 border-t flex items-center justify-between text-xs text-emerald-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
            <span><strong>Consent Engine Aktif:</strong> Siswa yang mencabut izin komunikasi WhatsApp otomatis didepak dari antrean Snooze.</span>
          </span>
        </div>

        {/* ── PAGINATION ─────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 md:gap-2 p-3 md:p-4 border-t bg-secondary/10">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft size={16} />
            </Button>
            
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1 max-w-48 md:max-w-none">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <Button key={p} variant={page === p ? 'default' : 'ghost'} size="icon" className="h-8 w-8 text-xs shrink-0 rounded-full" onClick={() => handlePageChange(p)}>
                    {p}
                  </Button>
                );
              })}
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </Card>

      {/* ── MODAL TAMBAH SNOOZE ─────────────────────────────────────────────── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md w-full p-4 md:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus size={20} className="text-primary" /> Tambah Snooze Manual
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs md:text-sm">
              Pilih durasi penundaan follow-up untuk prospek yang belum siap dihubungi saat ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">ID Siswa <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Contoh: STD-096303-810"
                value={addIdSiswa}
                onChange={(e) => setAddIdSiswa(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary transition-shadow"
                id="input-add-siswa-id"
              />
            </div>

            {/* Durasi Interval Dropdown / Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Berapa Lama Ditunda? <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setIntervalDays(days)}
                    className={cn(
                      'h-11 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center',
                      intervalDays === days
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                    )}
                  >
                    <span>{days} Hari</span>
                    {days === 90 && <span className="text-xs font-normal opacity-80">(Default)</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Alasan Snooze (Opsional)</label>
              <textarea
                className="w-full px-3 py-2.5 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary resize-none h-20 md:h-24 transition-shadow"
                placeholder="Belum siap sekarang, minta dihubungi lagi setelah wisuda..."
                value={addAlasan}
                onChange={(e) => setAddAlasan(e.target.value)}
                id="textarea-add-alasan"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2 sm:mt-0">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl sm:rounded-lg" disabled={addLoading}>
              Batal
            </Button>
            <Button
              className="w-full sm:w-auto h-11 sm:h-10 gradient-primary text-white rounded-xl sm:rounded-lg shadow-md"
              onClick={handleAddSnooze}
              disabled={addLoading || !addIdSiswa.trim()}
              id="btn-confirm-add-snooze"
            >
              {addLoading ? 'Menyimpan...' : 'Simpan Snooze'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL HENTIKAN SNOOZE ───────────────────────────────────────────── */}
      <Dialog open={showStopModal} onOpenChange={setShowStopModal}>
        <DialogContent className="sm:max-w-md w-full p-4 md:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-lg">
              <Ban size={20} /> Bangunkan Paksa dari Snooze
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs md:text-sm">
              Anda akan menghentikan masa tunda untuk <strong className="text-foreground">{selectedLead?.nama}</strong> lebih awal dari jadwal.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-500/10 p-3 md:p-4 rounded-xl border border-rose-500/20 mt-2">
            <p className="text-xs md:text-sm text-rose-600 font-medium leading-relaxed">
              Tindakan ini akan memicu event <strong>SnoozeAborted (Reason: Woke Up)</strong> dan mengembalikan siswa ke antrean kerja Follow Up CRO hari ini.
            </p>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => setShowStopModal(false)} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl sm:rounded-lg" disabled={stopLoading}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmStopSnooze}
              className="w-full sm:w-auto h-11 sm:h-10 rounded-xl sm:rounded-lg shadow-md"
              disabled={stopLoading}
              id="btn-confirm-stop-snooze"
            >
              {stopLoading ? 'Memproses...' : 'Ya, Bangunkan Paksa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
