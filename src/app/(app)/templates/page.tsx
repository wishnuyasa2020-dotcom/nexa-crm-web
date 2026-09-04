'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Plus, Search, MessageSquare, Phone,
  RefreshCw, Loader2, ToggleLeft, ToggleRight, Pencil, Trash2,
  ChevronDown, ExternalLink, Eye, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchTemplates, syncTemplatesFromMeta, updateTemplate, deleteTemplate,
  WaTemplate, MetaStatus,
} from '@/lib/chatApi';
import { TemplateFormModal } from '@/components/templates/TemplateFormModal';
import { TemplatePreviewBubble, PreviewButton, ButtonType, buildPreviewText } from '@/components/templates/TemplatePreviewBubble';

// ── Konstanta ─────────────────────────────────────────────────────────────────
const STATUS_TABS: { label: string; value: MetaStatus | '' }[] = [
  { label: 'Semua',       value: '' },
  { label: '✅ Approved', value: 'APPROVED' },
  { label: '⏳ Pending',  value: 'PENDING' },
  { label: '❌ Rejected', value: 'REJECTED' },
  { label: '📋 Lokal',   value: 'LOCAL_ONLY' },
];

const PIPELINE_OPTIONS = [
  { value: '',            label: 'Semua Pipeline' },
  { value: 'PROBING',     label: '🔍 Probing' },
  { value: 'HOT_LEAD',    label: '🔥 Hot Lead' },
  { value: 'REGISTRASI',  label: '📝 Registrasi' },
  { value: 'NURTURING',   label: '🌱 Nurturing' },
  { value: 'SNOOZE',      label: '😴 Snooze' },
  { value: 'ALUMNI',      label: '🎓 Alumni' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse buttons dari kolom parameters JSON template.
 * Mengembalikan array PreviewButton untuk preview/badge.
 */
function parseButtonsFromParams(parametersStr: string | null | undefined): PreviewButton[] {
  if (!parametersStr) return [];
  try {
    const schema = JSON.parse(parametersStr);
    if (!Array.isArray(schema.buttons)) return [];
    return schema.buttons.map((b: Record<string, string>) => ({
      type:  (b.type?.toUpperCase() || 'QUICK_REPLY') as ButtonType,
      label: b.label || b.text || '(label)',
    }));
  } catch {
    return [];
  }
}

// ── Page Component ────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [templates,    setTemplates]    = useState<WaTemplate[]>([]);
  const [total,        setTotal]        = useState(0);
  const [approvedTotal, setApprovedTotal] = useState<number | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [activeTab,    setActiveTab]    = useState<MetaStatus | ''>('');
  const [pipeline,     setPipeline]     = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editTemplate, setEditTemplate] = useState<WaTemplate | undefined>();

  // ── Fetch jumlah APPROVED sekali saat mount (tidak ikut filter) ──────────────
  useEffect(() => {
    fetchTemplates({ status: 'APPROVED', limit: 1 })
      .then(r => setApprovedTotal(r.total))
      .catch(() => {});
  }, []);

  // ── Load templates ──────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchTemplates({
        status:   activeTab || undefined,
        pipeline: pipeline  || undefined,
        search,
      });
      setTemplates(result.data);
      setTotal(result.total);
    } catch {
      toast.error('Gagal memuat template.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pipeline, search]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // ── Sync dari Meta ──────────────────────────────────────────────────────────
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncTemplatesFromMeta();
      toast.success(`Sinkronisasi selesai: ${result.synced} template diperbarui.`);
      loadTemplates();
    } catch {
      toast.error('Gagal sinkronisasi dengan Meta.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Toggle Active/Inactive ──────────────────────────────────────────────────
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

  // ── Soft Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (t: WaTemplate) => {
    if (!confirm(`Hapus template "${t.nama_template}"? Aksi ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteTemplate(t.id_template);
      toast.success(`Template "${t.nama_template}" dihapus.`);
      setTemplates(prev => prev.filter(x => x.id_template !== t.id_template));
    } catch {
      toast.error('Gagal menghapus template.');
    }
  };

  // ── Edit Modal ──────────────────────────────────────────────────────────────
  const handleEdit = (t: WaTemplate) => {
    setEditTemplate(t);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTemplate(undefined);
  };

  const handleSaved = () => {
    handleCloseModal();
    loadTemplates();
  };

  // ── Filter lokal (backup filter di atas server filter) ─────────────────────
  const filtered = templates.filter(t =>
    t.nama_template.toLowerCase().includes(search.toLowerCase()) ||
    t.body_text.toLowerCase().includes(search.toLowerCase())
  );

  // ── Hitung badge ringkasan ─────────────────────────────────────────────────
  const activePipelineLabel = PIPELINE_OPTIONS.find(p => p.value === pipeline)?.label || 'Semua Pipeline';

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">Template Manager</h1>
              {approvedTotal !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {approvedTotal} Approved
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola sinkronisasi Meta &amp; CRM template &mdash; {total} template terdaftar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="hidden sm:inline">Sync Meta</span>
          </button>
          <button
            onClick={() => { setEditTemplate(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all"
          >
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

      {/* Search + Pipeline Filter */}
      <div className="bg-card border border-border p-4 rounded-xl">
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama atau isi template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
            />
          </div>
          {/* Pipeline Filter */}
          <div className="relative">
            <select
              value={pipeline}
              onChange={e => setPipeline(e.target.value)}
              className={cn(
                'appearance-none pl-3 pr-8 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none cursor-pointer transition-colors',
                pipeline
                  ? 'border-primary/50 text-foreground'
                  : 'border-border text-muted-foreground'
              )}
            >
              {PIPELINE_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        {/* Active filter pills */}
        {(pipeline || activeTab) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {pipeline && (
              <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex items-center gap-1">
                {activePipelineLabel}
                <button onClick={() => setPipeline('')} className="opacity-60 hover:opacity-100">×</button>
              </span>
            )}
            {activeTab && (
              <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex items-center gap-1">
                {STATUS_TABS.find(t => t.value === activeTab)?.label}
                <button onClick={() => setActiveTab('')} className="opacity-60 hover:opacity-100">×</button>
              </span>
            )}
          </div>
        )}
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
              onEdit={() => handleEdit(t)}
              onDelete={() => handleDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <TemplateFormModal
          template={editTemplate}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// TemplateCard
// -----------------------------------------------------------------------------
function TemplateCard({
  template: t,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  template: WaTemplate;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLocal    = !t.meta_template_id;
  const isActive   = t.status_crm === 'ACTIVE';
  const buttons    = parseButtonsFromParams(t.parameters);
  const hasButtons = buttons.length > 0;

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const statusColors: Record<string, string> = {
    APPROVED:   'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    PENDING:    'bg-amber-500/10 text-amber-500 border-amber-500/20',
    REJECTED:   'bg-rose-500/10 text-rose-500 border-rose-500/20',
    LOCAL_ONLY: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };

  return (
    <>
      <div
        className={cn(
          'bg-card border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors group',
          isActive ? 'border-border' : 'border-border/40'
        )}
      >
        {/* Card Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {isLocal
              ? <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md"><MessageSquare size={14} /></div>
              : <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md"><Phone size={14} /></div>}
            <h3 className="font-bold text-sm text-white truncate max-w-32.5">{t.nama_template}</h3>
          </div>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border', statusColors[t.meta_status] || statusColors.LOCAL_ONLY)}>
            {t.meta_status === 'LOCAL_ONLY' ? 'Lokal' : t.meta_status}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] px-2 py-0.5 border border-white/20 text-white/80 rounded-full">{t.kategori}</span>
          {t.pipeline && <span className="text-[10px] px-2 py-0.5 border border-white/20 text-white/80 rounded-full">{t.pipeline}</span>}
          {t.language_code && <span className="text-[10px] px-2 py-0.5 border border-white/20 text-white/80 rounded-full">{t.language_code.toUpperCase()}</span>}
          {t.header_type && t.header_type !== 'none' && (
            <span className="text-[10px] px-2 py-0.5 border border-amber-500/30 text-amber-500 rounded-full">header: {t.header_type}</span>
          )}
          {hasButtons && (
            <span className="text-[10px] px-2 py-0.5 border border-primary/30 text-primary rounded-full flex items-center gap-0.5">
              <ExternalLink size={8} /> {buttons.length} btn
            </span>
          )}
        </div>

        {/* Body preview */}
        <div className="flex-1 bg-white/5 rounded-lg p-3 text-xs text-white/75 line-clamp-3">
          {t.body_text}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              isActive ? 'text-emerald-400' : 'text-white/50'
            )}
            title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} className="text-white/40" />}
            {isActive ? 'Aktif' : 'Nonaktif'}
          </button>

          <div className="flex gap-2 items-center">
            {/* Preview — always visible */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowPreviewModal(true); }}
              className="flex items-center gap-1 text-sky-400 font-medium hover:text-sky-300 transition-colors"
            >
              <Eye size={12} /> Preview
            </button>
            {/* Edit & Hapus — visible on hover */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-rose-500 font-medium hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} /> Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <TemplatePreviewModal
          template={t}
          buttons={buttons}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// TemplatePreviewModal
// -----------------------------------------------------------------------------
function TemplatePreviewModal({
  template: t,
  buttons,
  onClose,
}: {
  template: WaTemplate;
  buttons: PreviewButton[];
  onClose: () => void;
}) {
  const statusColorText: Record<string, string> = {
    APPROVED:   'text-emerald-400',
    PENDING:    'text-amber-400',
    REJECTED:   'text-rose-400',
    LOCAL_ONLY: 'text-sky-400',
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-base text-foreground">{t.nama_template}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{t.template_name_api}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta info */}
        {/* Body: 2 kolom — kiri info+params, kanan preview */}
        {(() => {
          // Parse parameters sekali, dipakai kolom kiri & kanan
          let parsed: {
            header?:       { type?: string; params?: string[]; url?: string };
            body?:         string[];
            meta_buttons?: { type: string; index: number; text: string; url?: string }[];
          } = {};
          try { parsed = JSON.parse(t.parameters || '{}'); } catch { parsed = {}; }

          const pHeader   = parsed.header       || null;
          const bodyVars  = parsed.body          || [];
          const metaBtns  = parsed.meta_buttons  || [];
          const isEmpty   = !pHeader && bodyVars.length === 0 && metaBtns.length === 0;

          // Resolve header untuk bubble preview
          // Priority: parameters.header.url > t.header_url (kolom DB)
          const bubbleHeaderType = (pHeader?.type || t.header_type || 'none') as 'text' | 'image' | 'video' | 'document' | 'none';
          const bubbleHeaderValue = pHeader?.url || t.header_url || null;
          const bubbleHeaderText  = pHeader?.params?.[0] || null;

          // Buttons untuk bubble
          const bubbleButtons = metaBtns.map(b => ({
            type:  (b.type || 'QUICK_REPLY') as ButtonType,
            label: b.text,
          }));

          // Substitute variabel body dengan nilai dummy agar preview lebih realistis
          const bubbleBodyText = buildPreviewText(t.body_text || '', bodyVars);

          return (
            <div className="flex flex-col md:flex-row gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

              {/* ── Kolom Kiri: Meta info + Parameters ────────────── */}
              <div className="md:w-1/2 px-5 py-4 flex flex-col gap-4">

                {/* Status pills */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className={cn('font-semibold', statusColorText[t.meta_status] || 'text-sky-400')}>
                    {t.meta_status === 'LOCAL_ONLY' ? 'Lokal' : t.meta_status}
                  </span>
                  <span className="text-muted-foreground px-2 py-0.5 bg-white/5 rounded-full">{t.kategori}</span>
                  {t.pipeline && <span className="text-muted-foreground px-2 py-0.5 bg-white/5 rounded-full">{t.pipeline}</span>}
                  {t.language_code && <span className="text-muted-foreground px-2 py-0.5 bg-white/5 rounded-full">{t.language_code.toUpperCase()}</span>}
                  {bubbleHeaderType && bubbleHeaderType !== 'none' && (
                    <span className="text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-full">header: {bubbleHeaderType}</span>
                  )}
                </div>

                {/* Body text lengkap */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Body Pesan</p>
                  <div className="bg-white/5 rounded-lg p-3 text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                    {t.body_text || <span className="opacity-40 italic">Tidak ada body</span>}
                  </div>
                </div>

                {/* Header parameter */}
                {pHeader && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Header</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0',
                          pHeader.type === 'image' ? 'bg-amber-500/20 text-amber-400' :
                          pHeader.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                                                     'bg-white/10 text-white/60'
                        )}>
                          {pHeader.type || 'text'}
                        </span>
                        {pHeader.params && pHeader.params.length > 0 && (
                          <span className="text-white/70">{pHeader.params.join(', ')}</span>
                        )}
                      </div>
                      {pHeader.url && (
                        <a href={pHeader.url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-sky-400 hover:underline truncate">
                          {pHeader.url}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Variabel body */}
                {bodyVars.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                      Variabel Body ({bodyVars.length})
                    </p>
                    <div className="flex flex-col gap-1">
                      {bodyVars.map((v: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono shrink-0">
                            {`{{${i + 1}}}`}
                          </span>
                          <span className="text-white/70">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta buttons */}
                {metaBtns.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                      Tombol ({metaBtns.length})
                    </p>
                    <div className="flex flex-col gap-1">
                      {metaBtns.map((btn: { type: string; index: number; text: string; url?: string }, i: number) => (
                        <div key={i} className="flex flex-col gap-0.5 bg-white/5 rounded-lg px-3 py-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0',
                              btn.type === 'QUICK_REPLY' ? 'bg-sky-500/20 text-sky-400' :
                              btn.type === 'URL'         ? 'bg-blue-500/20 text-blue-400' :
                                                          'bg-emerald-500/20 text-emerald-400'
                            )}>
                              {btn.type === 'QUICK_REPLY' ? 'Reply' : btn.type === 'URL' ? 'URL' : 'Phone'}
                            </span>
                            <span className="text-white/80 truncate">{btn.text}</span>
                          </div>
                          {btn.url && (
                            <a href={btn.url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-sky-400 hover:underline truncate pl-0.5">
                              {btn.url}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEmpty && (
                  <p className="text-xs text-muted-foreground italic">Tidak ada variabel atau tombol.</p>
                )}
              </div>

              {/* ── Kolom Kanan: WA Preview ────────────────────────── */}
              <div className="md:w-1/2 px-5 py-4">
                <p className="text-[10px] text-muted-foreground mb-3 font-medium uppercase tracking-wider">Preview WhatsApp</p>
                <div className="rounded-xl p-4 bg-[#0b141a] min-h-48">
                  <TemplatePreviewBubble
                    bodyText={bubbleBodyText}
                    headerType={bubbleHeaderType !== 'none' ? bubbleHeaderType : null}
                    headerValue={bubbleHeaderValue}
                    headerText={bubbleHeaderText}
                    buttonObjects={bubbleButtons}
                  />
                </div>
              </div>

            </div>
          );
        })()}


      </div>
    </div>,
    document.body
  );
}
