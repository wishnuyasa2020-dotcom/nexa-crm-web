'use client';

/**
 * TemplatePreviewBubble.tsx
 * Komponen reusable untuk preview bubble pesan WhatsApp
 * Digunakan di: TemplateFormModal, TemplateCard hover, BroadcastWizard
 *
 * v2 — Upgrade:
 *  - Diferensiasi tipe button (QUICK_REPLY, URL, PHONE_NUMBER) dengan ikon & warna
 *  - Prop `buttonObjects` untuk data button yang lebih kaya (tipe + label)
 *  - Max-width bubble fix untuk mobile
 */

import { Image as ImageIcon, Video, FileText, ExternalLink, Phone, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

export interface PreviewButton {
  type: ButtonType;
  label: string;
}

interface TemplatePreviewBubbleProps {
  /** Teks body template, dengan {{1}} {{2}} sudah disubstitusi atau masih placeholder */
  bodyText: string;
  /** Tipe header: none | text | image | video | document */
  headerType?: 'none' | 'text' | 'image' | 'video' | 'document' | null;
  /** Nilai/URL header */
  headerValue?: string | null;
  /** Judul header teks */
  headerText?: string | null;
  /**
   * Daftar button (array string untuk backward-compat, atau array PreviewButton untuk tipe penuh)
   * @deprecated Gunakan `buttonObjects` untuk rendering tipe yang lebih akurat
   */
  buttons?: string[];
  /** Daftar button dengan tipe untuk rendering yang lebih akurat */
  buttonObjects?: PreviewButton[];
  /** Nama pengirim */
  brandName?: string;
  /** Class tambahan untuk container */
  className?: string;
}

// ── Icon & warna per tipe button ──────────────────────────────────────────────
const BUTTON_CONFIG: Record<ButtonType, { icon: React.ElementType; color: string; bg: string }> = {
  QUICK_REPLY:   { icon: MessageSquare, color: 'text-[#009de2]',  bg: 'bg-white/80' },
  URL:           { icon: ExternalLink,  color: 'text-[#009de2]',  bg: 'bg-white/80' },
  PHONE_NUMBER:  { icon: Phone,         color: 'text-[#25d366]',  bg: 'bg-white/80' },
};

export function TemplatePreviewBubble({
  bodyText,
  headerType,
  headerValue,
  headerText,
  buttons = [],
  buttonObjects,
  brandName = 'Nexa CRM',
  className,
}: TemplatePreviewBubbleProps) {

  // Normalisasi ke PreviewButton array — prioritaskan buttonObjects
  const resolvedButtons: PreviewButton[] = buttonObjects
    ? buttonObjects
    : buttons.map(label => ({ type: 'QUICK_REPLY' as ButtonType, label }));

  return (
    <div className={cn('flex flex-col items-end gap-1 select-none', className)}>
      {/* WA Background */}
      <div className="w-full flex flex-col gap-0.5">
        {/* Bubble */}
        <div className="rounded-lg rounded-tr-none bg-[#dcf8c6] shadow-sm overflow-hidden">

          {/* ── Header ──────────────────────────────────────── */}
          {headerType && headerType !== 'none' && (
            <div className="w-full">
              {headerType === 'image' && (
                headerValue
                  ? <img src={headerValue} alt="Header" className="w-full max-h-40 object-cover" />
                  : <div className="w-full h-28 bg-emerald-900/20 flex items-center justify-center">
                      <ImageIcon size={32} className="text-emerald-600 opacity-60" />
                    </div>
              )}
              {headerType === 'video' && (
                <div className="w-full h-28 bg-emerald-900/20 flex items-center justify-center gap-2">
                  <Video size={32} className="text-emerald-600 opacity-60" />
                  <span className="text-xs text-emerald-700">Video</span>
                </div>
              )}
              {headerType === 'document' && (
                <div className="w-full h-16 bg-blue-900/10 flex items-center gap-2 px-3">
                  <FileText size={24} className="text-blue-500 shrink-0" />
                  <span className="text-xs text-blue-700 truncate">
                    {headerValue || 'Document.pdf'}
                  </span>
                </div>
              )}
              {headerType === 'text' && headerText && (
                <div className="px-3 pt-2.5">
                  <p className="text-sm font-bold text-[#111b21]">{headerText}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Body ─────────────────────────────────────────── */}
          <div className="px-3 pb-1 pt-2">
            <p className="text-sm text-[#111b21] whitespace-pre-wrap leading-relaxed">
              {bodyText || <span className="opacity-40 italic">Body pesan akan tampil di sini...</span>}
            </p>
          </div>

          {/* ── Timestamp ────────────────────────────────────── */}
          <div className="flex justify-end items-center gap-1 px-3 pb-1.5">
            <span className="text-[10px] text-emerald-700 opacity-70">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Double-check (delivered) */}
            <svg viewBox="0 0 16 11" className="w-3.5 h-3.5 text-[#53bdeb]" fill="currentColor">
              <path d="M11.071.653a.56.56 0 0 0-.794 0L5.633 5.297 3.723 3.387a.56.56 0 0 0-.794.794l2.307 2.307a.56.56 0 0 0 .794 0L11.07 1.447a.56.56 0 0 0 0-.794z"/>
              <path d="M15.071.653a.56.56 0 0 0-.794 0L9.633 5.297 9.01 4.674a.56.56 0 0 0-.794.794l1.02 1.02a.56.56 0 0 0 .794 0L15.07 1.447a.56.56 0 0 0 0-.794z"/>
            </svg>
          </div>
        </div>

        {/* ── Buttons ──────────────────────────────────────────── */}
        {resolvedButtons.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {resolvedButtons.map((btn, i) => {
              const config = BUTTON_CONFIG[btn.type] || BUTTON_CONFIG.QUICK_REPLY;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-full rounded-lg border border-white/30 text-center px-3 py-1.5 shadow-sm flex items-center justify-center gap-1.5',
                    config.bg
                  )}
                >
                  <Icon size={11} className={config.color} />
                  <span className={cn('text-xs font-medium', config.color)}>{btn.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sender label */}
      <span className="text-[10px] text-muted-foreground mt-1">{brandName}</span>
    </div>
  );
}

// ── Utility: preview substitusi dari parameters schema ────────────────────────
/**
 * Substitusi {{1}}, {{2}}, dst di bodyText dengan nilai dummy atau context riil.
 * Digunakan untuk preview di form tanpa perlu call ke backend.
 */
export function buildPreviewText(
  bodyText: string,
  bodyVarNames: string[],
  context: Record<string, string> = {}
): string {
  const DUMMY_VALUES: Record<string, string> = {
    STUDENT_NAME:      context.STUDENT_NAME      || 'Budi Santoso',
    SCHOOL_NAME:       context.SCHOOL_NAME       || 'SMA Negeri 1 Jakarta',
    STUDENT_ID:        context.STUDENT_ID        || 'SIS-000001',
    CONSULTATION_DATE: context.CONSULTATION_DATE || 'Senin, 8 Sep 2026',
    HOME_VISIT_DATE:   context.HOME_VISIT_DATE   || 'Rabu, 10 Sep 2026',
    SNOOZE_LEVEL:      context.SNOOZE_LEVEL      || '2',
  };

  let text = bodyText;
  bodyVarNames.forEach((varName, i) => {
    const placeholder = `{{${i + 1}}}`;
    const value = DUMMY_VALUES[varName.toUpperCase()] || `[${varName}]`;
    text = text.split(placeholder).join(value);
  });
  return text;
}
