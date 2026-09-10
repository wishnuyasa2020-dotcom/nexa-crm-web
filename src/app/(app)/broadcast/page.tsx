'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Radio, Send, Search, ArrowLeft, Loader2, Info, RotateCcw, X, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, School, FileText, ShieldCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { broadcastApi, type AudienceItem, type BroadcastCampaign, type MetaTemplate, type CrmTemplate } from '@/lib/broadcastApi';
import { TemplatePreviewBubble, buildPreviewText, type ButtonType } from '@/components/templates/TemplatePreviewBubble';

// Status dari GAS Worker: antri, proses, selesai, gagal
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  selesai:     { label: 'Selesai',   cls: 'bg-emerald-500/10 text-emerald-500' },
  proses:      { label: 'Berjalan',  cls: 'bg-blue-500/10 text-blue-500'      },
  antri:       { label: 'Antri',     cls: 'bg-amber-500/10 text-amber-500'    },
  gagal:       { label: 'Gagal',     cls: 'bg-rose-500/10 text-rose-500'      },
  // Alias backward-compat (dari versi baru Node.js jika ada)
  completed:   { label: 'Selesai',   cls: 'bg-emerald-500/10 text-emerald-500' },
  in_progress: { label: 'Berjalan',  cls: 'bg-blue-500/10 text-blue-500'      },
  pending:     { label: 'Antri',     cls: 'bg-amber-500/10 text-amber-500'    },
  failed:      { label: 'Gagal',     cls: 'bg-rose-500/10 text-rose-500'      },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed bottom-24 lg:bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border max-w-xs transition-all',
      type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    )}>
      {type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BroadcastPage() {
  const [view, setView] = useState<'history' | 'new'>('history');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
            <Radio size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">Broadcast Pesan</h1>
            <p className="text-xs text-muted-foreground">Kirim pesan massal (Smart Routing &amp; Consent Engine)</p>
          </div>
        </div>
        {view === 'history' ? (
          <button
            onClick={() => setView('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all shrink-0"
          >
            <Send size={16} /> Broadcast Baru
          </button>
        ) : (
          <button
            onClick={() => setView('history')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-all shrink-0"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        )}
      </div>

      {view === 'history'
        ? <HistoryView onNewBroadcast={() => setView('new')} />
        : <NewBroadcastWizard onBack={() => { setView('history'); }} onSuccess={(msg) => { showToast(msg, 'success'); setView('history'); }} />
      }

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==========================================
// HISTORY VIEW
// ==========================================
function HistoryView({ onNewBroadcast }: { onNewBroadcast: () => void }) {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async (p = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await broadcastApi.getHistory({ page: p, limit: 20 });
      const payload = res.data;
      setCampaigns(payload.data ?? []);
      setTotalPages(payload.meta?.totalPages ?? 1);
      setPage(p);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat riwayat broadcast.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const statusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-secondary text-muted-foreground' };
    return (
      <span className={cn('px-2 py-1 rounded-md text-xs font-bold uppercase', cfg.cls)}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Riwayat Broadcast</h2>
        <button
          onClick={() => fetchHistory(page)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Memuat riwayat...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3 text-rose-500">
          <AlertCircle size={24} />
          <p className="text-sm">{error}</p>
          <button onClick={() => fetchHistory(1)} className="text-xs underline">Coba lagi</button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-muted-foreground">
          <Radio size={32} className="opacity-20" />
          <p className="text-sm">Belum ada riwayat broadcast.</p>
          <button
            onClick={onNewBroadcast}
            className="mt-2 text-xs text-primary underline"
          >
            Buat broadcast pertama
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/10">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Template</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Sukses / Target</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Gagal</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground text-xs">{b.templateName}</td>
                    <td className="px-5 py-3">{statusBadge(b.status)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs font-semibold text-primary">{b.sentCount} / {b.targetCount}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('text-xs font-semibold', b.failedCount > 0 ? 'text-rose-500' : 'text-muted-foreground')}>{b.failedCount}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Date(b.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {campaigns.map((b) => (
              <div key={b.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{b.templateName}</p>
                  {statusBadge(b.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Sukses: <span className="font-semibold text-emerald-500">{b.sentCount}</span>
                    {b.failedCount > 0 && <> · Gagal: <span className="font-semibold text-rose-500">{b.failedCount}</span></>}
                    {' '}/ {b.targetCount}
                  </span>
                  <span>{new Date(b.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-border bg-secondary/10">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page <= 1}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary disabled:opacity-40 hover:bg-secondary/70 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-muted-foreground">Hal {page} / {totalPages}</span>
              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={page >= totalPages}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary disabled:opacity-40 hover:bg-secondary/70 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// SCHOOL COMBOBOX
// Ketik manual + dropdown suggestion dari daftar sekolah
// ==========================================
function SchoolCombobox({
  value,
  onChange,
  schools,
  isLoading,
}: {
  value: string;
  onChange: (val: string) => void;
  schools: { id: string; name: string }[];
  isLoading: boolean;
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState(value);
  const wrapRef               = useRef<HTMLDivElement>(null);

  // Sync external value → input (misal saat Reset)
  useEffect(() => { setQuery(value); }, [value]);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? schools.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : schools;

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val);       // debounce terjadi di parent
    setOpen(true);
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative flex-1">
      {/* Input ketik manual */}
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <input
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Cari nama siswa / sekolah..."
        className="w-full pl-9 pr-16 py-2 bg-background border rounded-lg text-sm focus:border-primary outline-none"
      />
      {/* Tombol clear ✕ */}
      {query && (
        <button
          onMouseDown={e => { e.preventDefault(); handleClear(); }}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          <X size={13} />
        </button>
      )}
      {/* Toggle dropdown ▼ */}
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        title="Lihat daftar sekolah"
      >
        {isLoading
          ? <Loader2 size={13} className="animate-spin" />
          : <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
        }
      </button>

      {/* Dropdown suggestion */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-3 py-1.5 bg-secondary/30 border-b flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <School size={12} />
              {query ? `${filtered.length} sekolah ditemukan` : `${schools.length} sekolah tersedia`}
            </span>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center py-5 text-xs text-muted-foreground">Tidak ada sekolah yang cocok</p>
            ) : (
              filtered.map(s => (
                <button
                  key={s.id}
                  onMouseDown={e => { e.preventDefault(); handleSelect(s.name); }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2 border-b border-border/30 last:border-0',
                    query.toLowerCase() === s.name.toLowerCase() && 'bg-primary/5 text-primary font-medium'
                  )}
                >
                  <School size={12} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{s.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// NEW BROADCAST WIZARD
// ==========================================
function NewBroadcastWizard({ onBack, onSuccess }: { onBack: () => void; onSuccess: (msg: string) => void }) {
  // ── Audience state ──
  const [audience, setAudience]         = useState<AudienceItem[]>([]);
  const [audienceMeta, setAudienceMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [isLoadingAudience, setIsLoadingAudience] = useState(true);
  const [audienceError, setAudienceError]         = useState<string | null>(null);

  const resolveMediaUrl = useCallback((url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Relative path dari server CRM
    const base = process.env.NEXT_PUBLIC_API_URL || '/api/crm';
    const token = typeof window !== 'undefined' ? (document.cookie.match(/nexa_token=([^;]+)/) || [])[1] || '' : '';
    return `${base}${url}${token ? `?token=${token}` : ''}`;
  }, []);

  // ── School list state (untuk combobox) ──
  const [schools, setSchools]               = useState<{ id: string; name: string }[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  // ── Template state ──
  const [metaTemplates, setMetaTemplates]   = useState<MetaTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // ── Filter state ──
  const [searchQuery, setSearchQuery]                     = useState('');
  const [commercialStateFilter, setCommercialStateFilter] = useState('');
  const [audiencePage, setAudiencePage]                   = useState(1);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Form state ──
  const [metaTemplate, setMetaTemplate] = useState('');
  const [namaCampaign, setNamaCampaign] = useState('');
  const [isSending, setIsSending]       = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // ── Derived ──
  const hasActiveFilter = !!searchQuery || !!commercialStateFilter;
  const hasSchoolSelected = !!searchQuery.trim();
  const swOpenCount   = audience.filter(a => selectedIds.has(a.id) && a.isSwOpen).length;
  const swClosedCount = selectedIds.size - swOpenCount;

  // ── Fetch audience ──
  const fetchAudience = useCallback(async (sq: string, cs: string, p: number) => {
    setIsLoadingAudience(true);
    setAudienceError(null);
    try {
      const res = await broadcastApi.getAudience({
        search: sq || undefined,
        commercialState: cs || undefined,
        page: p,
        limit: 50,
      });
      const payload = res.data;
      setAudience(payload.data ?? []);
      setAudienceMeta({
        total: payload.meta?.total ?? 0,
        totalPages: payload.meta?.totalPages ?? 1,
        page: p,
      });
      // Auto-select semua yang baru load
      if (p === 1 && !sq && !cs) {
        setSelectedIds(new Set((payload.data ?? []).map((a: AudienceItem) => a.id)));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar audiens.';
      setAudienceError(msg);
    } finally {
      setIsLoadingAudience(false);
    }
  }, []);

  // ── Fetch schools untuk combobox ──
  const fetchSchools = useCallback(async () => {
    setIsLoadingSchools(true);
    try {
      const res = await broadcastApi.getSchoolList();
      setSchools(res.data?.data ?? []);
    } catch (_) {
      // Gagal load sekolah — combobox tetap bisa ketik manual
    } finally {
      setIsLoadingSchools(false);
    }
  }, []);

  // ── Fetch templates ──
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const metaRes = await broadcastApi.getMetaTemplates();
      setMetaTemplates(metaRes.data?.data ?? []);
    } catch (_) {
      // Template gagal load — biarkan dropdown kosong
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Initial load — sekolah belum dipilih, audience sengaja dikosongkan
  useEffect(() => {
    fetchTemplates();
    fetchSchools();
    // fetchAudience TIDAK dipanggil di sini.
    // Audience baru di-load setelah user memilih sekolah.
    setIsLoadingAudience(false);
  }, [fetchTemplates, fetchSchools]);

  // Debounce search input — hanya fetch jika sekolah sudah dipilih (searchQuery tidak kosong)
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);

    if (!searchQuery.trim()) {
      // Kosongkan list jika input dihapus
      setAudience([]);
      setAudienceMeta({ total: 0, totalPages: 1, page: 1 });
      return;
    }

    searchRef.current = setTimeout(() => {
      setAudiencePage(1);
      fetchAudience(searchQuery, commercialStateFilter, 1);
    }, 350);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleApplyFilter = () => {
    if (!searchQuery.trim()) return; // Jangan fetch jika sekolah belum dipilih
    setAudiencePage(1);
    fetchAudience(searchQuery, commercialStateFilter, 1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setCommercialStateFilter('');
    setAudiencePage(1);
    // Kosongkan list saat reset
    setAudience([]);
    setAudienceMeta({ total: 0, totalPages: 1, page: 1 });
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) audience.forEach(a => next.add(a.id));
    else audience.forEach(a => next.delete(a.id));
    setSelectedIds(next);
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return;
    setIsSending(true);
    try {
      await broadcastApi.sendBroadcast({
        targetIds: Array.from(selectedIds),
        metaTemplateId: metaTemplate || null,
        namaCampaign: namaCampaign || undefined,
      });
      onSuccess(`Broadcast ke ${selectedIds.size} audiens berhasil dimasukkan ke antrian!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim broadcast.';
      // Tampilkan error inline
      setAudienceError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const allVisibleSelected = audience.length > 0 && audience.every(a => selectedIds.has(a.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">

      {/* ── KIRI: Form Wizard ── */}
      <div className="lg:col-span-2 space-y-6 pb-40 lg:pb-0">

        {/* Step 1: Nama Campaign (opsional tapi disarankan) */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-secondary/30">
            <h2 className="font-semibold text-foreground">1. Nama Campaign (Opsional)</h2>
          </div>
          <div className="p-4">
            <input
              type="text"
              value={namaCampaign}
              onChange={e => setNamaCampaign(e.target.value)}
              placeholder={`Campaign ${new Date().toLocaleDateString('id-ID')}`}
              className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Step 2: Target Audiens */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-secondary/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">2. Pilih Audiens (Targeting)</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">
              {selectedIds.size} Terpilih
            </span>
          </div>

          {/* Filter bar */}
          <div className="p-4 bg-secondary/10 flex flex-col sm:flex-row gap-3">
            {/* Combobox: ketik + dropdown sekolah */}
            <SchoolCombobox
              value={searchQuery}
              onChange={setSearchQuery}
              schools={schools}
              isLoading={isLoadingSchools}
            />
            <div className="flex-1">
              <select
                value={commercialStateFilter}
                onChange={e => setCommercialStateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:border-primary outline-none text-muted-foreground"
              >
                <option value="">-- Semua Status Komersial --</option>
                <option value="Known Profile">Known Profile</option>
                <option value="Lead">Lead</option>
                <option value="Prospect">Prospect</option>
                <option value="Opportunity">Opportunity</option>
                <option value="Registered Opportunity">Registered Opportunity</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilter}
                className="flex-1 sm:flex-none px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Terapkan
              </button>
              {hasActiveFilter && (
                <button
                  onClick={handleReset}
                  title="Reset semua filter"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-400/5 transition-all"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Audience table/cards */}
          <div className="max-h-72 overflow-y-auto hide-scrollbar">
            {/* State 1: Belum pilih sekolah — tampilkan panduan */}
            {!hasSchoolSelected && !isLoadingAudience ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <School size={22} className="opacity-40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70">Pilih sekolah terlebih dahulu</p>
                  <p className="text-xs mt-1 text-muted-foreground">Ketik atau pilih nama sekolah dari dropdown di atas untuk menampilkan daftar siswa.</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/60">
                  <span className="w-5 h-px bg-border" />
                  <span>Siswa yang menolak WhatsApp (Consent Withdrawn) otomatis disaring</span>
                  <span className="w-5 h-px bg-border" />
                </div>
              </div>
            ) : isLoadingAudience ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Memuat siswa...</span>
              </div>
            ) : audienceError ? (
              <div className="flex flex-col items-center py-8 gap-2 text-rose-500">
                <AlertCircle size={18} />
                <p className="text-xs">{audienceError}</p>
                <button onClick={() => fetchAudience(searchQuery, commercialStateFilter, audiencePage)} className="text-xs underline">Coba lagi</button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <table className="w-full text-sm hidden md:table">
                  <thead className="sticky top-0 bg-secondary/50 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-2 w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={e => handleSelectAll(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Siswa</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Sekolah</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Status Komersial</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Consent</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">SW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audience.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            {commercialStateFilter
                              ? `Tidak ada siswa dengan status "${commercialStateFilter}" di sekolah ini.`
                              : 'Tidak ada siswa ditemukan untuk sekolah ini.'}
                          </p>
                          {commercialStateFilter && (
                            <button onClick={() => { setCommercialStateFilter(''); fetchAudience(searchQuery, '', 1); }} className="text-xs text-primary underline mt-1">
                              Hapus filter status
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      audience.map(a => (
                        <tr
                          key={a.id}
                          className="border-t border-border hover:bg-secondary/20 cursor-pointer"
                          onClick={() => toggleSelect(a.id)}
                        >
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(a.id)} readOnly className="rounded border-border text-primary focus:ring-primary" />
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {a.nama}<br />
                            <span className="text-xs text-muted-foreground">{a.phone}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.sekolah}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-xs font-medium">
                              {a.commercialState || a.statusPipeline}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-500">
                              <ShieldCheck size={12} />
                              Aktif
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn('text-xs px-2 py-1 rounded-full font-bold', a.isSwOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                              {a.isSwOpen ? 'Terbuka' : 'Tertutup'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-2">
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    Pilih Semua ({audience.length})
                  </label>
                  {audience.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground">Tidak ada data yang cocok</p>
                  ) : (
                    audience.map(a => (
                      <div
                        key={a.id}
                        onClick={() => toggleSelect(a.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                          selectedIds.has(a.id) ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'
                        )}
                      >
                        <input type="checkbox" checked={selectedIds.has(a.id)} readOnly className="w-4 h-4 rounded border-border text-primary focus:ring-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm text-foreground truncate">{a.nama}</h4>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold shrink-0', a.isSwOpen ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                              {a.isSwOpen ? 'SW Buka' : 'SW Tutup'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{a.sekolah} · {a.phone}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded">
                              {a.commercialState || a.statusPipeline}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500 font-medium">
                              <ShieldCheck size={11} />
                              Consent Aktif
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Privacy & Consent Notice footer */}
          <div className="px-4 py-2.5 bg-emerald-500/5 border-t flex items-center justify-between text-xs text-emerald-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
              <span><strong>Consent Engine:</strong> Hanya siswa berstatus consent valid yang dimuat. Penolakan WhatsApp otomatis disaring.</span>
            </span>
          </div>

          {/* Pagination audiens */}
          {audienceMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-secondary/10 text-xs text-muted-foreground">
              <span>Total: {audienceMeta.total} audiens</span>
              <div className="flex gap-2">
                <button
                  disabled={audienceMeta.page <= 1}
                  onClick={() => { setAudiencePage(p => p - 1); fetchAudience(searchQuery, commercialStateFilter, audiencePage - 1); }}
                  className="px-2 py-1 rounded bg-secondary disabled:opacity-40"
                >← Prev</button>
                <span>Hal {audienceMeta.page} / {audienceMeta.totalPages}</span>
                <button
                  disabled={audienceMeta.page >= audienceMeta.totalPages}
                  onClick={() => { setAudiencePage(p => p + 1); fetchAudience(searchQuery, commercialStateFilter, audiencePage + 1); }}
                  className="px-2 py-1 rounded bg-secondary disabled:opacity-40"
                >Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Template Selection */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-secondary/30">
            <h2 className="font-semibold text-foreground">3. Pilih Template Pesan</h2>
            <p className="text-xs text-muted-foreground mt-1">Variabel otomatis diisi berdasarkan nama target (Smart Routing Meta/Interactive).</p>
          </div>
          <div className="p-5 space-y-5">
            {isLoadingTemplates ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Memuat template...</span>
              </div>
            ) : (
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Pilih Template Meta</label>
                    <span className="text-xs text-muted-foreground">{metaTemplates.length} tersedia</span>
                  </div>
                  <select
                    value={metaTemplate}
                    onChange={e => setMetaTemplate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm focus:border-primary outline-none"
                  >
                    <option value="">-- Pilih Template Meta --</option>
                    {metaTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>

                  {/* Mobile Preview Toggle */}
                  {metaTemplate && (
                    <div className="md:hidden pt-1">
                      <button
                        type="button"
                        onClick={() => setShowMobilePreview(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/60 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Eye size={13} />
                          {showMobilePreview ? 'Sembunyikan Preview Pesan' : 'Lihat Preview Pesan WhatsApp'}
                        </span>
                        {showMobilePreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  )}

                  {(() => {
                    const selectedMetaTmpl = metaTemplate ? metaTemplates.find(t => t.id === metaTemplate) : null;
                    if (!selectedMetaTmpl || !selectedMetaTmpl.bodyText) return null;

                    let parsed: any = {};
                    try { parsed = JSON.parse(selectedMetaTmpl.parameters || '{}'); } catch { parsed = {}; }
                    
                    const pHeader = parsed.header || null;
                    const bodyVars = parsed.body || [];
                    let metaBtns: any[] = [];
                    try { 
                        metaBtns = JSON.parse(selectedMetaTmpl.meta_buttons || '[]'); 
                        const rawButtons = parsed.buttons || parsed.meta_buttons;
                        if (metaBtns.length === 0 && rawButtons) {
                            metaBtns = rawButtons.map((b: any) => ({
                                type: b.type,
                                text: b.label || b.text
                            }));
                        }
                    } catch { metaBtns = []; }

                    // Meta Console Source of Truth
                    let structureHeaderType = (selectedMetaTmpl.headerType || selectedMetaTmpl.header_type || '').toLowerCase();
                    if (!structureHeaderType || structureHeaderType === 'none') {
                      const parsedType = (pHeader?.type || '').toLowerCase();
                      if (['image', 'video', 'document'].includes(parsedType)) {
                        structureHeaderType = parsedType;
                      } else {
                        structureHeaderType = 'none';
                      }
                    }
                    const bubbleHeaderType = structureHeaderType;
                    const bubbleHeaderValueRaw = bubbleHeaderType !== 'none' && bubbleHeaderType !== 'text' 
                        ? pHeader?.link || selectedMetaTmpl.headerUrl || selectedMetaTmpl.header_url 
                        : pHeader?.text || selectedMetaTmpl.headerFilename || selectedMetaTmpl.header_filename;
                    
                    const bubbleHeaderValue = bubbleHeaderType !== 'none' && bubbleHeaderType !== 'text' 
                        ? resolveMediaUrl(bubbleHeaderValueRaw)
                        : bubbleHeaderValueRaw;

                    const firstSelectedId = Array.from(selectedIds)[0];
                    const sampleTarget = audience.find(a => a.id === firstSelectedId) || audience[0];
                    const previewContext: Record<string, string> = sampleTarget ? {
                      STUDENT_NAME: sampleTarget.nama || 'Siswa',
                      SCHOOL_NAME: sampleTarget.sekolah || 'Sekolah',
                      PHONE_NUMBER: sampleTarget.phone || '08xxx',
                    } : {
                      STUDENT_NAME: 'Budi',
                      SCHOOL_NAME: 'SMA N 1',
                      PHONE_NUMBER: '081234567890',
                    };

                    let bubbleBodyText = selectedMetaTmpl.bodyText || '';
                    bodyVars.forEach((v: string, i: number) => {
                      const resolvedVal = previewContext[v] || `[${v}]`;
                      bubbleBodyText = bubbleBodyText.split(`{{${i+1}}}`).join(String(resolvedVal));
                    });

                    return (
                      <div className={cn('mt-4', !showMobilePreview && 'hidden md:block')}>
                        <div className="flex flex-col gap-2 p-4 bg-[#E2FDC4] rounded-xl text-sm text-[#111B21] shadow-sm max-w-sm ml-auto border border-black/5 relative">
                          {/* Tail/Tip SVG */}
                          <div className="absolute top-0 -right-2 text-[#E2FDC4]">
                            <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                              <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                            </svg>
                          </div>

                          {bubbleHeaderType === 'image' && bubbleHeaderValue && (
                            <div className="w-full aspect-video bg-black/10 rounded-lg overflow-hidden flex items-center justify-center">
                              <img src={bubbleHeaderValue} alt="Header" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {bubbleHeaderType === 'video' && bubbleHeaderValue && (
                            <div className="w-full aspect-video bg-black/10 rounded-lg overflow-hidden flex items-center justify-center">
                              <video src={bubbleHeaderValue} controls className="w-full h-full object-cover" />
                            </div>
                          )}
                          {bubbleHeaderType === 'document' && bubbleHeaderValue && (
                            <div className="w-full p-3 bg-black/5 rounded-lg flex items-center gap-2">
                              <FileText size={20} className="text-[#00A884]" />
                              <span className="text-xs font-semibold text-black/70 truncate">{bubbleHeaderValue.split('/').pop() || 'Document'}</span>
                            </div>
                          )}
                          {bubbleHeaderType === 'text' && bubbleHeaderValue && (
                            <p className="font-bold text-sm">{bubbleHeaderValue}</p>
                          )}
                          
                          <p className="whitespace-pre-wrap leading-relaxed">{bubbleBodyText}</p>
                          
                          {metaBtns.length > 0 && (
                            <div className="flex flex-col gap-1 mt-2 border-t border-black/10 pt-2">
                              {metaBtns.map((btn, idx) => (
                                <button key={idx} disabled className="py-1.5 text-[#00A884] font-medium hover:bg-black/5 rounded-md transition-colors text-sm">
                                  {btn.text || btn.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KANAN: Summary Desktop ── */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-card border rounded-xl p-4 shadow-xl lg:shadow-sm hidden lg:block">
          <h3 className="font-bold mb-3">Ringkasan Eksekusi</h3>

          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Audiens</span>
              <span className="font-bold">{selectedIds.size}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-500">SW Terbuka (Otomatis Routing — Gratis)</span>
              <span className="font-bold">{swOpenCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-500">SW Tertutup (Berbayar)</span>
              <span className="font-bold">{swClosedCount}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full shrink-0', metaTemplate ? 'bg-emerald-500' : 'bg-border')} />
              <span>Template Meta: <span className={metaTemplate ? 'text-foreground font-medium' : ''}>{metaTemplate ? metaTemplates.find(t => t.id === metaTemplate)?.name : 'Belum dipilih'}</span></span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
            <Info size={14} className="mt-0.5 text-primary shrink-0" />
            <p>Pengiriman akan dimasukkan ke dalam <strong>Queue (Antrean)</strong> di latar belakang agar aman dari limitasi Meta API.</p>
          </div>

          <button
            onClick={handleSend}
            disabled={isSending || selectedIds.size === 0}
            className="w-full mt-4 py-3 rounded-xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending
              ? <><Loader2 size={18} className="animate-spin" /> Memproses...</>
              : <><Send size={18} /> Kirim Broadcast Instan</>
            }
          </button>
        </div>
      </div>

      {/* ── Mobile: Sticky Bottom Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-foreground">{selectedIds.size}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">Gratis:</span>
              <span className="font-bold">{swOpenCount}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <span className="text-rose-500">Berbayar:</span>
              <span className="font-bold">{swClosedCount}</span>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={isSending || selectedIds.size === 0}
            className="w-full py-3 rounded-xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSending
              ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              : <><Send size={16} /> Kirim Broadcast ({selectedIds.size})</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
