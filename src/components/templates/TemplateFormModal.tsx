'use client';

/**
 * TemplateFormModal.tsx
 * Modal terpadu untuk Create, Edit & Bilingual Duplicate wa_template
 *
 * SECTIONS:
 *  1. Info Dasar   — Nama internal, API Name (auto-slug), Kategori, Pipeline, Language, Urutan
 *  2. Header       — Tipe: None | Teks | Gambar | Video | Dokumen
 *  3. Body         — Textarea + variabel picker (STUDENT_NAME, SCHOOL_NAME, STUDENT_ID, dll)
 *  4. Buttons/CTA  — Quick Reply / URL / Phone Number (max 3 buttons, sesuai batas Meta)
 *  5. Live Preview — Real-time WA bubble dengan dummy context (kanan layar)
 *  6. JSON Schema  — Raw JSON output (collapsible debug panel)
 *  7. Footer       — "Simpan Lokal" | "Simpan & Daftarkan ke Meta"
 */

import { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronDown, ChevronUp, Loader2, Eye, Code2,
  Type, Image as ImageIcon, Video, FileText, Minus,
  Plus, Trash2, ExternalLink, Phone, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createTemplate, updateTemplate, WaTemplate } from '@/lib/chatApi';
import { useTranslation } from '@/hooks/useTranslation';
import {
  TemplatePreviewBubble, buildPreviewText, PreviewButton, ButtonType,
} from '@/components/templates/TemplatePreviewBubble';

// ── Konstanta ─────────────────────────────────────────────────────────────────

/**
 * Variabel yang dikenal engine backend (templateEngine.service.js → KNOWN_VARIABLES).
 * Sinkronkan dengan backend jika menambah variabel baru.
 */
const KNOWN_VARS = [
  { key: 'STUDENT_NAME', label: 'Nama Siswa', example: 'Budi Santoso' },
  { key: 'SCHOOL_NAME', label: 'Nama Sekolah', example: 'SMA Negeri 1 Jakarta' },
  { key: 'STUDENT_ID', label: 'ID Siswa', example: 'SIS-000001' },
  { key: 'CONSULTATION_DATE', label: 'Tgl. Konsultasi', example: 'Senin, 8 Sep 2026' },
  { key: 'HOME_VISIT_DATE', label: 'Tgl. Home Visit', example: 'Rabu, 10 Sep 2026' },
  { key: 'SNOOZE_LEVEL', label: 'Level Snooze', example: '2' },
] as const;

type KnownVarKey = (typeof KNOWN_VARS)[number]['key'];

const HEADER_TYPES = [
  { value: 'none', labelKey: 'templates.headerNone', icon: Minus },
  { value: 'text', labelKey: 'templates.headerText', icon: Type },
  { value: 'image', labelKey: 'templates.headerImage', icon: ImageIcon },
  { value: 'video', labelKey: 'templates.headerVideo', icon: Video },
  { value: 'document', labelKey: 'templates.headerDocument', icon: FileText },
] as const;

const BUTTON_TYPES: { value: ButtonType; labelKey: 'templates.buttonQuickReply' | 'templates.buttonUrl' | 'templates.buttonPhone'; icon: React.ElementType }[] = [
  { value: 'QUICK_REPLY', labelKey: 'templates.buttonQuickReply', icon: MessageSquare },
  { value: 'URL', labelKey: 'templates.buttonUrl', icon: ExternalLink },
  { value: 'PHONE_NUMBER', labelKey: 'templates.buttonPhone', icon: Phone },
];

const KATEGORI_OPTIONS = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const PIPELINE_OPTIONS = ['', 'PROBING', 'HOT_LEAD', 'REGISTRASI', 'NURTURING', 'SNOOZE', 'ALUMNI'];

// ── Types ─────────────────────────────────────────────────────────────────────
interface TemplateFormModalProps {
  /** Jika diisi → mode Edit. Jika undefined → mode Create */
  template?: WaTemplate;
  /** Data awal jika menduplikasi / membuat varian bahasa */
  initialData?: Partial<WaTemplate>;
  onClose: () => void;
  onSaved: () => void;
}

interface ButtonDef {
  type: ButtonType;
  label: string;
  /** Untuk QUICK_REPLY: payload string. Untuk URL: URL-nya. Untuk PHONE_NUMBER: nomor. */
  value: string;
  /** Untuk URL saja: apakah suffix URL dinamis dari variabel */
  urlSuffixVar?: string;
}

interface FormState {
  nama_template: string;
  template_name_api: string;
  kategori: string;
  pipeline: string;
  language_code: string;
  urutan: number;
  header_type: string;
  header_url: string;
  header_text: string;
  header_filename: string;
  body_text: string;
  body_vars: KnownVarKey[];
  buttons: ButtonDef[];
  submitToMeta: boolean;
}

// ── Init State ────────────────────────────────────────────────────────────────
function getInitialState(tpl?: WaTemplate, initialData?: Partial<WaTemplate>): FormState {
  if (tpl) {
    // Mode Edit
    let bodyVars: KnownVarKey[] = [];
    let buttons: ButtonDef[] = [];
    try {
      const schema = JSON.parse(tpl.parameters || '{"body":[]}');
      const knownKeys = KNOWN_VARS.map(v => v.key);
      bodyVars = (schema.body || [])
        .map((v: string) => v.toUpperCase() as KnownVarKey)
        .filter((v: KnownVarKey) => knownKeys.includes(v));

      if (Array.isArray(schema.buttons)) {
        buttons = schema.buttons.map((b: Record<string, string>) => ({
          type: (b.type?.toUpperCase() || 'QUICK_REPLY') as ButtonType,
          label: b.label || b.text || '',
          value: b.payload || b.url || b.phone_number || '',
          urlSuffixVar: b.url_suffix_var || '',
        }));
      }
    } catch { /* ignore */ }

    return {
      nama_template: tpl.nama_template,
      template_name_api: tpl.template_name_api,
      kategori: tpl.kategori,
      pipeline: tpl.pipeline || '',
      language_code: tpl.language_code || 'id',
      urutan: tpl.urutan,
      header_type: tpl.header_type || 'none',
      header_url: tpl.header_url || '',
      header_text: '',
      header_filename: tpl.header_filename || '',
      body_text: tpl.body_text,
      body_vars: bodyVars,
      buttons,
      submitToMeta: false,
    };
  }

  if (initialData) {
    // Mode Duplicate / Pre-filled Create
    let bodyVars: KnownVarKey[] = [];
    let buttons: ButtonDef[] = [];
    try {
      const schema = JSON.parse(initialData.parameters || '{"body":[]}');
      const knownKeys = KNOWN_VARS.map(v => v.key);
      bodyVars = (schema.body || [])
        .map((v: string) => v.toUpperCase() as KnownVarKey)
        .filter((v: KnownVarKey) => knownKeys.includes(v));

      if (Array.isArray(schema.buttons)) {
        buttons = schema.buttons.map((b: Record<string, string>) => ({
          type: (b.type?.toUpperCase() || 'QUICK_REPLY') as ButtonType,
          label: b.label || b.text || '',
          value: b.payload || b.url || b.phone_number || '',
          urlSuffixVar: b.url_suffix_var || '',
        }));
      }
    } catch { /* ignore */ }

    return {
      nama_template: initialData.nama_template || '',
      template_name_api: initialData.template_name_api || '',
      kategori: initialData.kategori || 'UTILITY',
      pipeline: initialData.pipeline || '',
      language_code: initialData.language_code || 'en_US',
      urutan: initialData.urutan ?? 99,
      header_type: initialData.header_type || 'none',
      header_url: initialData.header_url || '',
      header_text: '',
      header_filename: initialData.header_filename || '',
      body_text: initialData.body_text || '',
      body_vars: bodyVars,
      buttons,
      submitToMeta: false,
    };
  }

  return {
    nama_template: '', template_name_api: '', kategori: 'UTILITY',
    pipeline: '', language_code: 'id', urutan: 99,
    header_type: 'none', header_url: '', header_text: '', header_filename: '',
    body_text: '', body_vars: [], buttons: [], submitToMeta: false,
  };
}

// ── Helper: Buat JSON parameters dari form state ──────────────────────────────
function buildParametersJson(state: FormState): string {
  const schema: Record<string, unknown> = {};

  // Header
  if (state.header_type && state.header_type !== 'none') {
    const header: Record<string, unknown> = { type: state.header_type };
    if (state.header_type === 'text' && state.header_text) {
      header.params = state.body_vars.slice(0, 1);
    } else if (['image', 'video', 'document'].includes(state.header_type)) {
      header.url = state.header_url;
      if (state.header_type === 'document' && state.header_filename) {
        header.filename = state.header_filename;
      }
    }
    schema.header = header;
  }

  // Body vars
  schema.body = state.body_vars;

  // Buttons — hanya sertakan jika ada & bukan kosong
  if (state.buttons.length > 0) {
    schema.buttons = state.buttons.map((btn, idx) => {
      const b: Record<string, string | number> = {
        type: btn.type,
        label: btn.label,
        index: idx,
      };
      if (btn.type === 'QUICK_REPLY') {
        b.payload = btn.value;
      } else if (btn.type === 'URL') {
        b.url = btn.value;
        if (btn.urlSuffixVar) b.url_suffix_var = btn.urlSuffixVar;
      } else if (btn.type === 'PHONE_NUMBER') {
        b.phone_number = btn.value;
      }
      return b;
    });
  }

  return JSON.stringify(schema, null, 2);
}

// ── Helper: Auto-slugify nama → api name ──────────────────────────────────────
function toApiName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// ── Komponen Utama ────────────────────────────────────────────────────────────
export function TemplateFormModal({ template: tpl, initialData, onClose, onSaved }: TemplateFormModalProps) {
  const { t } = useTranslation();
  const isEdit = !!tpl;
  const isDuplicate = !isEdit && !!initialData;

  const [form, setForm] = useState<FormState>(() => getInitialState(tpl, initialData));
  const [isSaving, setIsSaving] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [apiNameManual, setApiNameManual] = useState(isEdit || isDuplicate);

  const paramsJson = buildParametersJson(form);
  const previewText = buildPreviewText(form.body_text, form.body_vars);

  // Preview buttons untuk TemplatePreviewBubble
  const previewButtonObjects: PreviewButton[] = form.buttons
    .filter(b => b.label.trim())
    .map(b => ({ type: b.type, label: b.label || '(label kosong)' }));

  const handleClose = useCallback(() => {
    if (isSaving) return;
    onClose();
  }, [isSaving, onClose]);

  // Auto-slug nama → api name (hanya jika user belum edit manual)
  useEffect(() => {
    if (!apiNameManual && form.nama_template) {
      setForm(f => ({ ...f, template_name_api: toApiName(f.nama_template) }));
    }
  }, [form.nama_template, apiNameManual]);

  // ── Simpan ────────────────────────────────────────────────────────────────
  const handleSave = async (submitToMeta: boolean) => {
    if (!form.nama_template.trim()) return toast.error(t('templates.errNameRequired'));
    if (!form.body_text.trim()) return toast.error(t('templates.errBodyRequired'));
    if (form.buttons.length > 3) return toast.error(t('templates.errMaxButtons'));

    const emptyBtn = form.buttons.find(b => !b.label.trim());
    if (emptyBtn) return toast.error(t('templates.errButtonLabelRequired'));

    setIsSaving(true);
    try {
      const payload = {
        nama_template: form.nama_template.trim(),
        template_name_api: form.template_name_api || toApiName(form.nama_template),
        body_text: form.body_text,
        kategori: form.kategori,
        pipeline: form.pipeline || undefined,
        language_code: form.language_code,
        urutan: form.urutan,
        parameters: paramsJson,
        header_type: (form.header_type !== 'none' ? form.header_type : undefined) as 'text' | 'image' | 'video' | 'document' | undefined,
        header_url: form.header_url || undefined,
        header_filename: form.header_filename || undefined,
        submitToMeta,
      };

      if (isEdit) {
        await updateTemplate(tpl!.id_template, payload);
        toast.success(t('templates.successUpdated'));
      } else {
        await createTemplate({ ...payload, header_type: payload.header_type ?? undefined, submitToMeta });
        toast.success(submitToMeta ? t('templates.successCreatedMeta') : t('templates.successCreatedLocal'));
      }

      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('templates.errSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Variabel body ─────────────────────────────────────────────────────────
  const insertVar = (varKey: KnownVarKey) => {
    if (form.body_vars.includes(varKey)) return;
    const idx = form.body_vars.length + 1;
    setForm(f => ({
      ...f,
      body_vars: [...f.body_vars, varKey],
      body_text: f.body_text + `{{${idx}}}`,
    }));
  };

  const removeVar = (varKey: KnownVarKey) => {
    setForm(f => {
      const newVars = f.body_vars.filter(v => v !== varKey);
      const oldIdx = f.body_vars.indexOf(varKey) + 1;
      let newBody = f.body_text.replace(`{{${oldIdx}}}`, '');
      for (let i = oldIdx + 1; i <= f.body_vars.length; i++) {
        newBody = newBody.split(`{{${i}}}`).join(`{{${i - 1}}}`);
      }
      return { ...f, body_vars: newVars, body_text: newBody };
    });
  };

  // ── Button CTA management ─────────────────────────────────────────────────
  const addButton = (type: ButtonType) => {
    if (form.buttons.length >= 3) {
      toast.error(t('templates.errMaxButtons'));
      return;
    }
    setForm(f => ({
      ...f,
      buttons: [...f.buttons, { type, label: '', value: '' }],
    }));
  };

  const removeButton = (idx: number) => {
    setForm(f => ({ ...f, buttons: f.buttons.filter((_, i) => i !== idx) }));
  };

  const updateButton = (idx: number, patch: Partial<ButtonDef>) => {
    setForm(f => ({
      ...f,
      buttons: f.buttons.map((b, i) => i === idx ? { ...b, ...patch } : b),
    }));
  };

  // Modal Title
  const modalTitle = isEdit
    ? t('templates.modalEditTitle')
    : isDuplicate
      ? t('templates.modalDuplicateTitle')
      : t('templates.modalCreateTitle');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-dvh flex flex-col overflow-hidden">

        {/* ── Header Modal ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">{modalTitle}</h2>
            <p className="text-xs text-muted-foreground">{t('templates.modalSubtitle')}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Body: 2 kolom (Form | Preview) ───────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ─ Kolom Kiri: Form ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* 1. Info Dasar */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('templates.sectionBasicInfo')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('templates.labelTemplateName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('templates.placeholderTemplateName')}
                    value={form.nama_template}
                    onChange={e => setForm(f => ({ ...f, nama_template: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('templates.labelApiName')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('templates.placeholderApiName')}
                    value={form.template_name_api}
                    onChange={e => { setApiNameManual(true); setForm(f => ({ ...f, template_name_api: e.target.value })); }}
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-mono focus:ring-1 focus:ring-primary/60 outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('templates.hintApiName')}
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('templates.labelCategory')}
                    </label>
                    <select
                      value={form.kategori}
                      onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                    >
                      {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('templates.labelPipeline')}
                    </label>
                    <select
                      value={form.pipeline}
                      onChange={e => setForm(f => ({ ...f, pipeline: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                    >
                      {PIPELINE_OPTIONS.map(p => (
                        <option key={p} value={p}>{p || t('templates.pipelineNone')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('templates.labelLanguage')}
                    </label>
                    <select
                      value={form.language_code}
                      onChange={e => setForm(f => ({ ...f, language_code: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                    >
                      <option value="id">{t('templates.langId')}</option>
                      <option value="en_US">{t('templates.langEn')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('templates.labelUrutan')}
                    </label>
                    <input
                      type="number"
                      value={form.urutan}
                      onChange={e => setForm(f => ({ ...f, urutan: parseInt(e.target.value) || 99 }))}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Header */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('templates.sectionHeader')}
              </h3>
              <div className="flex gap-2 flex-wrap mb-3">
                {HEADER_TYPES.map(({ value, labelKey, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, header_type: value }))}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      form.header_type === value
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <Icon size={12} /> {t(labelKey)}
                  </button>
                ))}
              </div>
              {form.header_type === 'text' && (
                <input
                  type="text"
                  placeholder={t('templates.placeholderHeaderText')}
                  value={form.header_text}
                  onChange={e => setForm(f => ({ ...f, header_text: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                />
              )}
              {['image', 'video', 'document'].includes(form.header_type) && (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder={t('templates.placeholderHeaderUrl')}
                    value={form.header_url}
                    onChange={e => setForm(f => ({ ...f, header_url: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                  />
                  {form.header_type === 'document' && (
                    <input
                      type="text"
                      placeholder={t('templates.placeholderHeaderFilename')}
                      value={form.header_filename}
                      onChange={e => setForm(f => ({ ...f, header_filename: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none"
                    />
                  )}
                </div>
              )}
            </section>

            {/* 3. Body + Variabel Picker */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('templates.sectionBody')} <span className="text-rose-500">*</span>
              </h3>

              {/* Var picker */}
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1.5">
                  {t('templates.bodyVarsHelper')}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {KNOWN_VARS.map(v => {
                    const idx = form.body_vars.indexOf(v.key);
                    const isUsed = idx !== -1;
                    return (
                      <button
                        key={v.key}
                        onClick={() => isUsed ? removeVar(v.key) : insertVar(v.key)}
                        title={`Contoh: ${v.example}`}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                          isUsed
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        {isUsed && <span className="text-xs opacity-70">{'{{' + (idx + 1) + '}}'}</span>}
                        {v.label}
                        {isUsed && <X size={10} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                rows={5}
                placeholder={t('templates.placeholderBody')}
                value={form.body_text}
                onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:ring-1 focus:ring-primary/60 outline-none resize-none leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('templates.charCount').replace('{count}', String(form.body_text.length))}
              </p>
            </section>

            {/* 4. Buttons/CTA */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('templates.sectionButtons')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('templates.buttonsMetaLimit')}
                  </p>
                </div>
                {/* Add button options */}
                <div className="flex items-center gap-1.5">
                  {form.buttons.length < 3 && BUTTON_TYPES.map(bt => (
                    <button
                      key={bt.value}
                      onClick={() => addButton(bt.value)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                    >
                      <Plus size={10} />
                      <bt.icon size={10} />
                      {t(bt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {form.buttons.length === 0 ? (
                <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                  {t('templates.emptyButtons')}
                </div>
              ) : (
                <div className="space-y-2">
                  {form.buttons.map((btn, idx) => {
                    const cfg = BUTTON_TYPES.find(b => b.value === btn.type);
                    return (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-secondary/20 border rounded-lg">
                        {/* Tipe badge */}
                        <div className="shrink-0 mt-0.5">
                          {cfg && <cfg.icon size={14} className="text-primary" />}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {/* Label */}
                          <input
                            type="text"
                            placeholder={t('templates.placeholderBtnLabel')}
                            value={btn.label}
                            onChange={e => updateButton(idx, { label: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:ring-1 focus:ring-primary/60 outline-none"
                          />
                          {/* Value */}
                          {btn.type === 'QUICK_REPLY' && (
                            <input
                              type="text"
                              placeholder={t('templates.placeholderBtnPayload')}
                              value={btn.value}
                              onChange={e => updateButton(idx, { value: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs font-mono focus:ring-1 focus:ring-primary/60 outline-none"
                            />
                          )}
                          {btn.type === 'URL' && (
                            <input
                              type="url"
                              placeholder={t('templates.placeholderBtnUrl')}
                              value={btn.value}
                              onChange={e => updateButton(idx, { value: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:ring-1 focus:ring-primary/60 outline-none"
                            />
                          )}
                          {btn.type === 'PHONE_NUMBER' && (
                            <input
                              type="tel"
                              placeholder={t('templates.placeholderBtnPhone')}
                              value={btn.value}
                              onChange={e => updateButton(idx, { value: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:ring-1 focus:ring-primary/60 outline-none"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => removeButton(idx)}
                          className="shrink-0 p-1 text-muted-foreground hover:text-rose-500 transition-colors mt-0.5"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 5. JSON Debug (collapsible) */}
            <section>
              <button
                onClick={() => setShowJson(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Code2 size={12} />
                {showJson ? t('templates.hideJsonSchema') : t('templates.showJsonSchema')}
                {showJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showJson && (
                <pre className="mt-2 p-3 bg-secondary/30 rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto">
                  {paramsJson}
                </pre>
              )}
            </section>
          </div>

          {/* ─ Kolom Kanan: Preview ─────────────────────────────────────── */}
          <div className="w-72 lg:w-80 border-l bg-secondary/20 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Eye size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {t('templates.livePreviewTitle')}
              </span>
              {previewButtonObjects.length > 0 && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                  {previewButtonObjects.length} btn
                </span>
              )}
            </div>
            {/* Simulated WA background */}
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,128,64,0.04) 0%, transparent 100%)' }}
            >
              <TemplatePreviewBubble
                bodyText={previewText}
                headerType={form.header_type !== 'none' ? form.header_type as 'text' | 'image' | 'video' | 'document' : null}
                headerValue={form.header_url || null}
                headerText={form.header_text || null}
                buttonObjects={previewButtonObjects}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:border-primary/50 transition-all"
          >
            {t('templates.btnCancel')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {t('templates.btnSaveLocal')}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || isEdit}
              title={isEdit ? 'Daftarkan ke Meta hanya tersedia saat Create. Gunakan Meta Business Manager untuk update.' : ''}
              className="px-4 py-2 text-sm gradient-primary text-white rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? t('templates.btnSave') : t('templates.btnSaveMeta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
