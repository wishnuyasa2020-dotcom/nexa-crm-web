'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, MessageSquare, StopCircle, Filter, AlertCircle, Zap, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
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
import { nurturingApi, NurturingStats, NurturingLead } from '@/lib/nurturingApi';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import WhatsAppGatingBanner from '@/components/common/WhatsAppGatingBanner';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProbeBadge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    0: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    1: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    2: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    3: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    4: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    5: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };
  const label = level === 0 ? 'Antrean' : `Probe ${level}`;
  return (
    <Badge variant="outline" className={`font-medium text-xs whitespace-nowrap ${colors[level] || colors[5]}`}>
      {label}
    </Badge>
  );
}

function SisaHariBadge({ hari, needFollowUp }: { hari: number; needFollowUp: boolean }) {
  if (needFollowUp) return <span className="text-xs font-bold text-rose-500 animate-pulse bg-rose-500/10 px-2 py-0.5 rounded">⚠️ Follow Up!</span>;
  if (hari === 0)   return <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Hari ini</span>;
  return <span className="text-xs text-muted-foreground">{hari} hari lagi</span>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[...Array(5)].map((_, i) => (
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
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 w-2/3">
          <div className="h-4 bg-secondary animate-pulse rounded-md w-full" />
          <div className="h-3 bg-secondary animate-pulse rounded-md w-3/4" />
          <div className="h-3 bg-secondary animate-pulse rounded-md w-1/2" />
        </div>
        <div className="h-5 bg-secondary animate-pulse rounded-md w-16" />
      </div>
      <div className="h-8 bg-secondary animate-pulse rounded-md w-full" />
      <div className="flex gap-2">
        <div className="h-9 bg-secondary animate-pulse rounded-md w-1/2" />
        <div className="h-9 bg-secondary animate-pulse rounded-md w-1/2" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NurturingPage() {
  const { data: waData, isConnected: isWaConnected, loading: waLoading } = useWhatsAppStatus();
  const router                          = useRouter();
  const [stats, setStats]               = useState<NurturingStats | null>(null);
  const [leads, setLeads]               = useState<NurturingLead[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Filter
  const [filterFollowUp, setFilterFollowUp] = useState(false);

  // Modals
  const [selectedLead, setSelectedLead]       = useState<NurturingLead | null>(null);
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);

  // Force trigger
  const [triggerLoading, setTriggerLoading]   = useState(false);
  const [triggerResult, setTriggerResult]     = useState<string | null>(null);

  // ── Fetch Stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await nurturingApi.getStats();
      setStats(res.data.data);
    } catch {
      setError('Gagal memuat statistik nurturing.');
    }
  }, []);

  // ── Fetch Leads ─────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (p = 1) => {
    setLeadsLoading(true);
    try {
      const res = await nurturingApi.getLeads({ page: p, limit: 15 });
      setLeads(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      setError('Gagal memuat daftar leads.');
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchLeads(1)]).finally(() => setLoading(false));
  }, [fetchStats, fetchLeads]);

  // ── Displayed Data ──────────────────────────────────────────────────────────
  const displayedLeads = filterFollowUp
    ? leads.filter(l => l.probeLevel === 5 && l.sisaHari === 0)
    : leads;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTakeover = (lead: NurturingLead) => {
    setSelectedLead(lead);
    setShowTakeoverModal(true);
  };

  const confirmTakeover = async () => {
    if (!selectedLead) return;
    setTakeoverLoading(true);
    try {
      await nurturingApi.takeover(selectedLead.id);
      setShowTakeoverModal(false);
      // Refresh data
      await Promise.all([fetchStats(), fetchLeads(page)]);
    } catch {
      alert('Gagal melakukan takeover. Coba lagi.');
    } finally {
      setTakeoverLoading(false);
    }
  };

  const handleForceTrigger = async () => {
    if (!isWaConnected) {
      setTriggerResult('❌ Nomor WhatsApp Bisnis belum terhubung atau belum aktif. Hubungkan nomor di menu Pengaturan.');
      return;
    }
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const res = await nurturingApi.forceTrigger();
      const { nurturing, snooze } = res.data.result;
      setTriggerResult(`✅ Selesai — Probe terkirim: ${nurturing.sent}, Eskalasi: ${nurturing.escalated}, Snooze dibangunkan: ${snooze.woken}`);
      // Refresh data
      await Promise.all([fetchStats(), fetchLeads(page)]);
    } catch {
      setTriggerResult('❌ Gagal menjalankan cron. Cek log server.');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchLeads(p);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
        <AlertCircle size={32} className="text-rose-400" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => { setError(null); fetchStats(); fetchLeads(1); }}>
          <RefreshCw size={14} className="mr-1" /> Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 w-full min-w-0">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg">
            <TrendingUp size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Nurturing Campaign</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Otomatisasi probing &amp; edukasi (Smart Routing &amp; Consent Engine)</p>
          </div>
        </div>

        {/* Force Trigger Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 md:h-10 text-xs md:text-sm gap-1.5 border-primary/30 text-primary hover:bg-primary/10 shrink-0 shadow-sm disabled:opacity-50"
          onClick={handleForceTrigger}
          disabled={triggerLoading || !isWaConnected}
          id="btn-force-trigger"
        >
          {triggerLoading
            ? <RefreshCw size={14} className="animate-spin shrink-0" />
            : <Zap size={14} className="shrink-0" />
          }
          <span className="hidden sm:inline">Force Trigger</span>
        </Button>
      </div>

      {/* Gating Banner jika WhatsApp belum terhubung */}
      {!isWaConnected && !waLoading && (
        <WhatsAppGatingBanner
          featureName="Automated Nurturing WhatsApp"
          status={waData?.whatsappStatus}
        />
      )}

      {/* Force trigger result */}
      {triggerResult && (
        <div className={cn('text-xs p-3 rounded-lg border shadow-sm', triggerResult.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500')}>
          {triggerResult}
        </div>
      )}

      {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Calon Prospek */}
        <Card className="border shadow-sm">
          <CardContent className="p-3 md:p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1 truncate">Total Prospek</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {loading ? <span className="inline-block w-8 h-6 bg-secondary animate-pulse rounded" /> : (stats?.total_calon_prospek ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Antrean Baru */}
        <Card className="border shadow-sm">
          <CardContent className="p-3 md:p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1 truncate">Antrean Baru (Probe 1)</p>
            <p className="text-xl md:text-2xl font-bold text-blue-500">
              {loading ? <span className="inline-block w-8 h-6 bg-secondary animate-pulse rounded" /> : (stats?.antrean_baru_probe_1 ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Sedang Nurturing */}
        <Card className="border shadow-sm">
          <CardContent className="p-3 md:p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1 truncate">Sedang Nurturing (Probe 1-4)</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-500">
              {loading ? <span className="inline-block w-8 h-6 bg-secondary animate-pulse rounded" /> : (stats?.dalam_putaran_probe_1_4 ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Perlu Follow Up — Actionable Card */}
        <Card
          className={cn('border shadow-sm cursor-pointer transition-all', filterFollowUp ? 'ring-2 ring-rose-500 bg-rose-500/5' : 'hover:bg-secondary/50')}
          onClick={() => setFilterFollowUp(!filterFollowUp)}
          id="card-perlu-followup"
        >
          <CardContent className="p-3 md:p-4 flex flex-col justify-center h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <AlertCircle size={40} className="text-rose-500" />
            </div>
            <p className="text-xs text-rose-500 font-bold mb-1 flex items-center gap-1 z-10 truncate">
              <AlertCircle size={12} className="shrink-0" /> Perlu Follow Up
            </p>
            <p className="text-xl md:text-2xl font-bold text-rose-500 z-10">
              {loading ? <span className="inline-block w-8 h-6 bg-rose-200 animate-pulse rounded" /> : (stats?.menunggu_followup_manual ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── DAFTAR LEADS ───────────────────────────────────────────────────── */}
      <Card className="border shadow-sm overflow-hidden flex flex-col min-w-0">
        <CardHeader className="p-3 md:p-4 border-b bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            📋 Daftar Audiens Nurturing
            {filterFollowUp && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">Filter: Follow Up</Badge>}
            {!leadsLoading && <span className="text-xs font-normal text-muted-foreground">({total} total)</span>}
          </CardTitle>
          <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 sm:h-8 text-xs shrink-0" onClick={() => setFilterFollowUp(!filterFollowUp)}>
            <Filter size={14} className="mr-1.5" /> {filterFollowUp ? 'Hapus Filter' : 'Filter Follow Up'}
          </Button>
        </CardHeader>

        {/* ── MOBILE VIEW (CARD LIST) ────────────────────────────────────────── */}
        <div className="block md:hidden p-3 space-y-3 bg-secondary/5">
          {leadsLoading ? (
            [...Array(3)].map((_, i) => <SkeletonCardMobile key={i} />)
          ) : displayedLeads.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm bg-background rounded-lg border border-dashed">
              {filterFollowUp ? 'Tidak ada leads yang perlu follow up.' : 'Tidak ada leads aktif dalam nurturing campaign.'}
            </div>
          ) : (
            displayedLeads.map((lead) => {
              const needFollowUp = lead.probeLevel === 5 && lead.sisaHari === 0;
              return (
                <div key={lead.id} className="border border-border/60 rounded-xl p-4 bg-background shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {needFollowUp && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                        <p className="font-bold text-sm text-foreground truncate">{lead.nama}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.noWa}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.sekolah}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-xs font-medium">
                          {lead.commercialState || lead.status}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500 font-medium">
                          <ShieldCheck size={11} /> Consent Aktif
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <ProbeBadge level={lead.probeLevel} />
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold', lead.isSwOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                        {lead.isSwOpen ? 'SW Buka' : 'SW Tutup'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs bg-secondary/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground font-medium">Sisa Waktu:</span>
                    <SisaHariBadge hari={lead.sisaHari} needFollowUp={needFollowUp} />
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
                      onClick={() => handleTakeover(lead)}
                    >
                      <StopCircle size={14} className="mr-1.5" /> Takeover
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP VIEW (TABLE) ───────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-sm border-collapse min-w-180">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama Siswa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asal Sekolah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status Komersial</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Consent</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Level Probe</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Sisa Hari</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">SW</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {leadsLoading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : displayedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground text-sm">
                    {filterFollowUp ? 'Tidak ada leads yang perlu follow up.' : 'Tidak ada leads aktif dalam nurturing campaign.'}
                  </td>
                </tr>
              ) : (
                displayedLeads.map((lead) => {
                  const needFollowUp = lead.probeLevel === 5 && lead.sisaHari === 0;
                  return (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          {needFollowUp && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                          <div className="min-w-0">
                            <p className="truncate max-w-44 lg:max-w-64">{lead.nama}</p>
                            <p className="text-xs text-muted-foreground font-normal truncate max-w-44 lg:max-w-64">{lead.noWa}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        <p className="truncate max-w-36 lg:max-w-64">{lead.sekolah}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-xs font-medium">
                          {lead.commercialState || lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-500">
                          <ShieldCheck size={12} /> Aktif
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ProbeBadge level={lead.probeLevel} />
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <SisaHariBadge hari={lead.sisaHari} needFollowUp={needFollowUp} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold', lead.isSwOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                          {lead.isSwOpen ? 'Terbuka' : 'Tertutup'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:text-primary transition-colors"
                            title="Lihat Chat"
                            onClick={() => router.push('/live-chat?leadId=' + lead.id)}
                            id={`btn-chat-${lead.id}`}
                          >
                            <MessageSquare size={14} className="text-primary" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors"
                            title="Takeover / Stop Bot"
                            onClick={() => handleTakeover(lead)}
                            id={`btn-takeover-${lead.id}`}
                          >
                            <StopCircle size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PRIVACY & CONSENT NOTICE FOOTER ───────────────────────────────── */}
        <div className="px-4 py-2.5 bg-emerald-500/5 border-t flex items-center justify-between text-xs text-emerald-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
            <span><strong>Consent Engine Aktif:</strong> Siswa yang menolak atau mencabut izin WhatsApp otomatis dihentikan dan disaring dari antrean Probing.</span>
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
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 text-xs shrink-0 rounded-full"
                    onClick={() => handlePageChange(p)}
                  >
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

      {/* ── TAKEOVER MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={showTakeoverModal} onOpenChange={setShowTakeoverModal}>
        <DialogContent className="sm:max-w-md w-full p-4 md:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-lg">
              <StopCircle size={20} /> Konfirmasi Takeover
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs md:text-sm">
              Anda akan menghentikan bot nurturing untuk <strong className="text-foreground">{selectedLead?.nama}</strong>. Apakah Anda yakin ingin mengambil alih percakapan ini secara manual?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-500/10 p-3 md:p-4 rounded-xl border border-rose-500/20 mt-2">
            <p className="text-xs md:text-sm text-rose-600 font-medium flex items-start gap-2 leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
              <span>Siswa ini tidak akan menerima pesan otomatis lagi dan akan kembali ke daftar Backlog.</span>
            </p>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => setShowTakeoverModal(false)} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl sm:rounded-lg" disabled={takeoverLoading}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmTakeover} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl sm:rounded-lg shadow-md" disabled={takeoverLoading}>
              {takeoverLoading ? 'Memproses...' : 'Takeover Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
