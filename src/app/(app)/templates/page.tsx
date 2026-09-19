'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Plus, Search, MessageSquare, Phone,
  RefreshCw, Loader2, ToggleLeft, ToggleRight, Pencil, Trash2,
  ChevronDown, ExternalLink, Eye, X, Copy, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchTemplates, syncTemplatesFromMeta, updateTemplate, deleteTemplate,
  WaTemplate, MetaStatus,
} from '@/lib/chatApi';
import { useTranslation } from '@/hooks/useTranslation';
import { TemplateFormModal } from '@/components/templates/TemplateFormModal';
import { TemplatePreviewBubble, PreviewButton, ButtonType, buildPreviewText } from '@/components/templates/TemplatePreviewBubble';

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
  const { t } = useTranslation();

  const [templates,      setTemplates]      = useState<WaTemplate[]>([]);
  const [total,          setTotal]          = useState(0);
  const [approvedTotal,  setApprovedTotal]  = useState<number | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSyncing,      setIsSyncing]      = useState(false);
  const [search,         setSearch]         = useState('');
  const [activeTab,      setActiveTab]      = useState<MetaStatus | ''>('');
  const [pipeline,       setPipeline]       = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [showModal,      setShowModal]      = useState(false);
  const [editTemplate,   setEditTemplate]   = useState<WaTemplate | undefined>();
  const [duplicateData,  setDuplicateData]  = useState<Partial<WaTemplate> | undefined>();

  // ── Konstanta Status Tabs ───────────────────────────────────────────────────
  const statusTabs: { label: string; value: MetaStatus | '' }[] = [
    { label: t('templates.tabAll'),      value: '' },
    { label: `✅ ${t('templates.tabApproved')}`, value: 'APPROVED' },
    { label: `⏳ ${t('templates.tabPending')}`,  value: 'PENDING' },
    { label: `❌ ${t('templates.tabRejected')}`, value: 'REJECTED' },
    { label: `📋 ${t('templates.tabLocal')}`,   value: 'LOCAL_ONLY' },
  ];

  const pipelineOptions = [
    { value: '',           label: t('templates.allPipelines') },
    { value: 'PROBING',    label: t('templates.pipelineProbing') },
    { value: 'HOT_LEAD',   label: t('templates.pipelineHotLead') },
    { value: 'REGISTRASI', label: t('templates.pipelineRegistrasi') },
    { value: 'NURTURING',  label: t('templates.pipelineNurturing') },
    { value: 'SNOOZE',     label: t('templates.pipelineSnooze') },
    { value: 'ALUMNI',     label: t('templates.pipelineAlumni') },
  ];

  const languageOptions = [
    { value: '',      label: t('templates.allLanguages') },
    { value: 'id',    label: t('templates.langId') },
    { value: 'en_US', label: t('templates.langEn') },
  ];

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
      toast.error(t('templates.toastLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pipeline, search, t]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // ── Sync dari Meta ──────────────────────────────────────────────────────────
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncTemplatesFromMeta();
      toast.success(t('templates.toastSyncSuccess').replace('{count}', String(result.synced)));
      loadTemplates();
    } catch {
      toast.error(t('templates.toastSyncFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Toggle Active/Inactive ──────────────────────────────────────────────────
  const handleToggleActive = async (tpl: WaTemplate) => {
    const newStatus = tpl.status_crm === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateTemplate(tpl.id_template, { status_crm: newStatus });
      setTemplates(prev => prev.map(x =>
        x.id_template === tpl.id_template ? { ...x, status_crm: newStatus } : x
      ));
    } catch {
      toast.error(t('templates.toastStatusFailed'));
    }
  };

  // ── Soft Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (tpl: WaTemplate) => {
    const msg = t('templates.confirmDelete').replace('{name}', tpl.nama_template);
    if (!confirm(msg)) return;
    try {
      await deleteTemplate(tpl.id_template);
      toast.success(t('templates.toastDeleted').replace('{name}', tpl.nama_template));
      setTemplates(prev => prev.filter(x => x.id_template !== tpl.id_template));
    } catch {
      toast.error(t('templates.toastDeleteFailed'));
    }
  };

  // ── Edit Modal ──────────────────────────────────────────────────────────────
  const handleEdit = (tpl: WaTemplate) => {
    setDuplicateData(undefined);
    setEditTemplate(tpl);
    setShowModal(true);
  };

  // ── Duplicate (Bilingual Translation) ───────────────────────────────────────
  const handleDuplicate = (tpl: WaTemplate) => {
    const targetLang = tpl.language_code === 'en_US' ? 'id' : 'en_US';
    const langSuffix = targetLang === 'en_US' ? ' (EN)' : ' (ID)';
    setDuplicateData({
      nama_template: `${tpl.nama_template}${langSuffix}`,
      template_name_api: tpl.template_name_api, // API name SAMA persis sesuai aturan Meta untuk terjemahan
      language_code: targetLang,
      kategori: tpl.kategori,
      pipeline: tpl.pipeline,
      urutan: tpl.urutan,
      header_type: tpl.header_type,
      header_url: tpl.header_url,
      header_filename: tpl.header_filename,
      parameters: tpl.parameters,
      body_text: tpl.body_text,
    });
    setEditTemplate(undefined);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTemplate(undefined);
    setDuplicateData(undefined);
  };

  const handleSaved = () => {
    handleCloseModal();
    loadTemplates();
  };

  // ── Filter lokal (termasuk filter bahasa) ───────────────────────────────────
  let filtered = templates.filter(tpl =>
    tpl.nama_template.toLowerCase().includes(search.toLowerCase()) ||
    tpl.body_text.toLowerCase().includes(search.toLowerCase()) ||
    tpl.template_name_api.toLowerCase().includes(search.toLowerCase())
  );

  if (languageFilter) {
    filtered = filtered.filter(tpl => tpl.language_code === languageFilter);
  }

  // ── Hitung badge ringkasan ─────────────────────────────────────────────────
  const activePipelineLabel = pipelineOptions.find(p => p.value === pipeline)?.label || t('templates.allPipelines');

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
              <h1 className="text-xl font-bold text-foreground">{t('templates.title')}</h1>
              {approvedTotal !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {t('templates.approvedBadge').replace('{count}', String(approvedTotal))}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('templates.subtitle').replace('{total}', String(total))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="hidden sm:inline">{t('templates.btnSync')}</span>
          </button>
          <button
            onClick={() => { setEditTemplate(undefined); setDuplicateData(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t('templates.btnCreate')}</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all',
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground hover:border-primary/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Pipeline Filter + Language Filter */}
      <div className="bg-card border p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('templates.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
            />
          </div>

          {/* Pipeline Filter */}
          <div className="relative shrink-0">
            <select
              value={pipeline}
              onChange={e => setPipeline(e.target.value)}
              className={cn(
                'appearance-none pl-3 pr-8 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none transition-colors w-full sm:w-auto',
                pipeline
                  ? 'border-primary/50 text-foreground'
                  : 'border-border text-muted-foreground'
              )}
            >
              {pipelineOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Language Filter */}
          <div className="relative shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Globe size={13} />
            </div>
            <select
              value={languageFilter}
              onChange={e => setLanguageFilter(e.target.value)}
              className={cn(
                'appearance-none pl-8 pr-8 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none transition-colors w-full sm:w-auto',
                languageFilter
                  ? 'border-primary/50 text-foreground'
                  : 'border-border text-muted-foreground'
              )}
            >
              {languageOptions.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Active filter pills */}
        {(pipeline || activeTab || languageFilter) && (
          <div className="flex gap-2 pt-1 flex-wrap">
            {pipeline && (
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex items-center gap-1">
                {activePipelineLabel}
                <button onClick={() => setPipeline('')} className="opacity-60 hover:opacity-100">×</button>
              </span>
            )}
            {activeTab && (
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex items-center gap-1">
                {statusTabs.find(st => st.value === activeTab)?.label}
                <button onClick={() => setActiveTab('')} className="opacity-60 hover:opacity-100">×</button>
              </span>
            )}
            {languageFilter && (
              <span className="text-xs px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20 flex items-center gap-1">
                {languageOptions.find(lo => lo.value === languageFilter)?.label}
                <button onClick={() => setLanguageFilter('')} className="opacity-60 hover:opacity-100">×</button>
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
              {t('templates.noTemplates')}
            </div>
          )}
          {filtered.map(tpl => (
            <TemplateCard
              key={tpl.id_template}
              template={tpl}
              onToggleActive={() => handleToggleActive(tpl)}
              onEdit={() => handleEdit(tpl)}
              onDuplicate={() => handleDuplicate(tpl)}
              onDelete={() => handleDelete(tpl)}
            />
          ))}
        </div>
      )}

      {/* Modal Create/Edit/Duplicate */}
      {showModal && (
        <TemplateFormModal
          template={editTemplate}
          initialData={duplicateData}
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
  template: tpl,
  onToggleActive,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: WaTemplate;
  onToggleActive: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isLocal    = !tpl.meta_template_id;
  const isActive   = tpl.status_crm === 'ACTIVE';
  const buttons    = parseButtonsFromParams(tpl.parameters);
  const hasButtons = buttons.length > 0;

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const statusColors: Record<string, string> = {
    APPROVED:   'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    PENDING:    'bg-amber-500/10 text-amber-500 border-amber-500/20',
    REJECTED:   'bg-rose-500/10 text-rose-500 border-rose-500/20',
    LOCAL_ONLY: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };

  const isEnglish = tpl.language_code === 'en_US' || tpl.language_code?.toLowerCase().startsWith('en');

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
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground truncate max-w-36">{tpl.nama_template}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-36">{tpl.template_name_api}</p>
            </div>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold uppercase border', statusColors[tpl.meta_status] || statusColors.LOCAL_ONLY)}>
            {tpl.meta_status === 'LOCAL_ONLY' ? t('templates.statusLocal') : tpl.meta_status}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-xs px-2 py-0.5 border border-border text-foreground/80 rounded-full">{tpl.kategori}</span>
          {tpl.pipeline && <span className="text-xs px-2 py-0.5 border border-border text-foreground/80 rounded-full">{tpl.pipeline}</span>}
          {tpl.language_code && (
            <span className={cn(
              'text-xs px-2 py-0.5 border rounded-full font-medium',
              isEnglish
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            )}>
              {isEnglish ? '🇬🇧 EN' : '🇮🇩 ID'}
            </span>
          )}
          {tpl.header_type && tpl.header_type !== 'none' && (
            <span className="text-xs px-2 py-0.5 border border-amber-500/30 text-amber-500 rounded-full">
              {t('templates.tagHeader').replace('{type}', tpl.header_type)}
            </span>
          )}
          {hasButtons && (
            <span className="text-xs px-2 py-0.5 border border-primary/30 text-primary rounded-full flex items-center gap-0.5">
              <ExternalLink size={8} /> {t('templates.tagButtons').replace('{count}', String(buttons.length))}
            </span>
          )}
        </div>

        {/* Body preview */}
        <div className="flex-1 bg-secondary/30 rounded-lg p-3 text-xs text-foreground/80 line-clamp-3 leading-relaxed">
          {tpl.body_text}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              isActive ? 'text-emerald-400' : 'text-muted-foreground'
            )}
            title={isActive ? t('templates.tooltipDeactivate') : t('templates.tooltipActivate')}
          >
            {isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} className="text-muted-foreground" />}
            {isActive ? t('templates.activeStatus') : t('templates.inactiveStatus')}
          </button>

          <div className="flex gap-2 items-center">
            {/* Preview — always visible */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowPreviewModal(true); }}
              className="flex items-center gap-1 text-sky-400 font-medium hover:text-sky-300 transition-colors"
            >
              <Eye size={12} /> {t('templates.actionPreview')}
            </button>

            {/* Actions visible on hover */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                className="text-sky-400 font-medium hover:underline flex items-center gap-1"
                title={t('templates.btnDuplicateTo').replace('{lang}', isEnglish ? 'ID' : 'EN')}
              >
                <Copy size={12} /> {t('templates.btnDuplicate')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                <Pencil size={12} /> {t('templates.actionEdit')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-rose-500 font-medium hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} /> {t('templates.actionDelete')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <TemplatePreviewModal
          template={tpl}
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
  template: tpl,
  buttons,
  onClose,
}: {
  template: WaTemplate;
  buttons: PreviewButton[];
  onClose: () => void;
}) {
  const { t } = useTranslation();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 bg-card border rounded-2xl shadow-2xl w-full max-w-4xl max-h-dvh overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — sticky supaya tidak ikut scroll */}
        <div className="sticky top-0 z-10 bg-card rounded-t-2xl flex items-start justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-base text-foreground">{tpl.nama_template}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{tpl.template_name_api}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta info */}
        {(() => {
          let parsed: {
            header?:       { type?: string; params?: string[]; url?: string };
            body?:         string[];
            meta_buttons?: { type: string; index: number; text: string; url?: string }[];
          } = {};
          try { parsed = JSON.parse(tpl.parameters || '{}'); } catch { parsed = {}; }

          const pHeader   = parsed.header       || null;
          const bodyVars  = parsed.body          || [];
          const metaBtns  = parsed.meta_buttons  || [];
          const isEmpty   = !pHeader && bodyVars.length === 0 && metaBtns.length === 0;

          const bubbleHeaderType = (pHeader?.type || tpl.header_type || 'none') as 'text' | 'image' | 'video' | 'document' | 'none';
          const bubbleHeaderValue = pHeader?.url || tpl.header_url || null;
          const bubbleHeaderText  = pHeader?.params?.[0] || null;

          const bubbleButtons = metaBtns.map(b => ({
            type:  (b.type || 'QUICK_REPLY') as ButtonType,
            label: b.text,
          }));

          const bubbleBodyText = buildPreviewText(tpl.body_text || '', bodyVars);

          return (
            <div className="flex flex-col md:flex-row gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

              {/* ── Kolom Kiri: Meta info + Parameters ────────────── */}
              <div className="md:w-1/2 px-5 py-4 flex flex-col gap-4">

                {/* Status pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={cn('font-semibold', statusColorText[tpl.meta_status] || 'text-sky-400')}>
                    {tpl.meta_status === 'LOCAL_ONLY' ? t('templates.statusLocal') : tpl.meta_status}
                  </span>
                  <span className="text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded-full">{tpl.kategori}</span>
                  {tpl.pipeline && <span className="text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded-full">{tpl.pipeline}</span>}
                  {tpl.language_code && (
                    <span className="text-sky-400 px-2 py-0.5 bg-sky-500/10 rounded-full font-medium">
                      {tpl.language_code === 'en_US' ? '🇬🇧 English (en_US)' : '🇮🇩 Indonesia (id)'}
                    </span>
                  )}
                  {bubbleHeaderType && bubbleHeaderType !== 'none' && (
                    <span className="text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-full">
                      {t('templates.tagHeader').replace('{type}', bubbleHeaderType)}
                    </span>
                  )}
                </div>

                {/* Body text lengkap */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    {t('templates.previewBodyTitle')}
                  </p>
                  <div className="bg-secondary/30 rounded-lg p-3 text-xs text-foreground/85 whitespace-pre-wrap leading-relaxed">
                    {tpl.body_text || <span className="opacity-40 italic">{t('templates.previewNoBody')}</span>}
                  </div>
                </div>

                {/* Header parameter */}
                {pHeader && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                      {t('templates.previewHeaderTitle')}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-semibold uppercase shrink-0',
                          pHeader.type === 'image' ? 'bg-amber-500/20 text-amber-400' :
                          pHeader.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                                                     'bg-secondary text-foreground/70'
                        )}>
                          {pHeader.type || 'text'}
                        </span>
                        {pHeader.params && pHeader.params.length > 0 && (
                          <span className="text-foreground/75">{pHeader.params.join(', ')}</span>
                        )}
                      </div>
                      {pHeader.url && (
                        <a href={pHeader.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:underline truncate">
                          {pHeader.url}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Variabel body */}
                {bodyVars.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                      {t('templates.previewVarsTitle').replace('{count}', String(bodyVars.length))}
                    </p>
                    <div className="flex flex-col gap-1">
                      {bodyVars.map((v: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono shrink-0">
                            {`{{${i + 1}}}`}
                          </span>
                          <span className="text-foreground/80">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta buttons */}
                {metaBtns.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                      {t('templates.previewBtnsTitle').replace('{count}', String(metaBtns.length))}
                    </p>
                    <div className="flex flex-col gap-1">
                      {metaBtns.map((btn: { type: string; index: number; text: string; url?: string }, i: number) => (
                        <div key={i} className="flex flex-col gap-0.5 bg-secondary/30 rounded-lg px-3 py-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-semibold uppercase shrink-0',
                              btn.type === 'QUICK_REPLY' ? 'bg-sky-500/20 text-sky-400' :
                              btn.type === 'URL'         ? 'bg-blue-500/20 text-blue-400' :
                                                          'bg-emerald-500/20 text-emerald-400'
                            )}>
                              {btn.type === 'QUICK_REPLY' ? 'Reply' : btn.type === 'URL' ? 'URL' : 'Phone'}
                            </span>
                            <span className="text-foreground/80 truncate">{btn.text}</span>
                          </div>
                          {btn.url && (
                            <a href={btn.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-sky-400 hover:underline truncate pl-0.5">
                              {btn.url}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEmpty && (
                  <p className="text-xs text-muted-foreground italic">{t('templates.previewEmptyVars')}</p>
                )}
              </div>

              {/* ── Kolom Kanan: WA Preview ────────────────────────── */}
              <div className="md:w-1/2 px-5 py-4">
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                  {t('templates.previewWaTitle')}
                </p>
                <div className="rounded-xl p-4 bg-zinc-950 min-h-48">
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
