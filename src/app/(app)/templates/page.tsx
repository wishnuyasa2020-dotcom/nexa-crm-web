'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, MessageSquare, Phone, RefreshCw, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchTemplates, syncTemplatesFromMeta, updateTemplate,
  WaTemplate, MetaStatus,
} from '@/lib/chatApi';

const STATUS_TABS: { label: string; value: MetaStatus | '' }[] = [
  { label: 'Semua',     value: '' },
  { label: '✅ Approved', value: 'APPROVED' },
  { label: '⏳ Pending',  value: 'PENDING' },
  { label: '❌ Rejected', value: 'REJECTED' },
  { label: '📋 Lokal',   value: 'LOCAL_ONLY' },
];

export default function TemplatesPage() {
  const [templates,  setTemplates]  = useState<WaTemplate[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSyncing,  setIsSyncing]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [activeTab,  setActiveTab]  = useState<MetaStatus | ''>('');

  // ── Load templates ─────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTemplates({ status: activeTab || undefined, search });
      setTemplates(data);
    } catch (err) {
      toast.error('Gagal memuat template.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // ── Sync dari Meta ─────────────────────────────────────────────────────
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncTemplatesFromMeta();
      toast.success(`Sinkronisasi selesai: ${result.synced} template diperbarui.`);
      loadTemplates();
    } catch (err) {
      toast.error('Gagal sinkronisasi dengan Meta.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Toggle Active/Inactive ─────────────────────────────────────────────
  const handleToggleActive = async (t: WaTemplate) => {
    const newStatus = t.status_crm === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateTemplate(t.id_template, { status_crm: newStatus });
      setTemplates(prev => prev.map(x =>
        x.id_template === t.id_template ? { ...x, status_crm: newStatus } : x
      ));
    } catch {
      toast.error('Gagal mengubah status template.');
    }
  };

  const filtered = templates.filter(t =>
    t.nama_template.toLowerCase().includes(search.toLowerCase()) ||
    t.body_text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Template Manager</h1>
            <p className="text-xs text-muted-foreground">
              Kelola sinkronisasi Meta &amp; CRM template &mdash; {templates.length} template aktif
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-50"
          >
            {isSyncing
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} />}
            <span className="hidden sm:inline">Sync Meta</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all">
            <Plus size={16} /> <span className="hidden sm:inline">Buat Template</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all',
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card border border-border p-4 rounded-xl">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau isi template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Template Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              Tidak ada template yang ditemukan.
            </div>
          )}
          {filtered.map(t => (
            <TemplateCard
              key={t.id_template}
              template={t}
              onToggleActive={() => handleToggleActive(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TemplateCard
// ─────────────────────────────────────────────────────────────────────────────
function TemplateCard({ template: t, onToggleActive }: { template: WaTemplate; onToggleActive: () => void }) {
  const isLocal = !t.meta_template_id;
  const isActive = t.status_crm === 'ACTIVE';

  const statusColors: Record<string, string> = {
    APPROVED:   'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    PENDING:    'bg-amber-500/10 text-amber-500 border-amber-500/20',
    REJECTED:   'bg-rose-500/10 text-rose-500 border-rose-500/20',
    LOCAL_ONLY: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };

  return (
    <div className={cn(
      'bg-card border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors cursor-pointer group',
      isActive ? 'border-border' : 'border-border opacity-60'
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {isLocal
            ? <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md"><MessageSquare size={14} /></div>
            : <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md"><Phone size={14} /></div>}
          <h3 className="font-bold text-sm text-foreground truncate max-w-[140px]">{t.nama_template}</h3>
        </div>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border', statusColors[t.meta_status] || statusColors.LOCAL_ONLY)}>
          {t.meta_status === 'LOCAL_ONLY' ? 'Lokal' : t.meta_status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground rounded-full">{t.kategori}</span>
        {t.pipeline && <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground rounded-full">{t.pipeline}</span>}
        {t.language_code && <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground rounded-full">{t.language_code.toUpperCase()}</span>}
      </div>

      <div className="flex-1 bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground line-clamp-3">
        {t.body_text}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs">
        {/* Toggle Active */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium transition-colors',
            isActive ? 'text-emerald-500' : 'text-muted-foreground'
          )}
          title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {isActive
            ? <ToggleRight size={18} className="text-emerald-500" />
            : <ToggleLeft size={18} />}
          {isActive ? 'Aktif' : 'Nonaktif'}
        </button>
        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-primary font-medium hover:underline">Edit</button>
        </div>
      </div>
    </div>
  );
}
