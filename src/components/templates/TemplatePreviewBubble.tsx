'use client';

/**
 * TemplatePreviewBubble.tsx
 * Komponen reusable untuk preview bubble pesan WhatsApp
 * Digunakan di: TemplateFormModal, TemplateCard hover, BroadcastWizard
 */

import { Image as ImageIcon, Video, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplatePreviewBubbleProps {
  /** Teks body template, dengan {{1}} {{2}} sudah disubstitusi atau masih placeholder */
  bodyText: string;
  /** Tipe header: none | text | image | video | document */
  headerType?: 'none' | 'text' | 'image' | 'video' | 'document' | null;
  /** Nilai/URL header */
  headerValue?: string | null;
  /** Judul header teks */
  headerText?: string | null;
  /** Daftar button label (untuk preview visual) */
  buttons?: string[];
  /** Nama pengirim */
  brandName?: string;
  /** Class tambahan untuk container */
  className?: string;
}

export function TemplatePreviewBubble({
  bodyText,
  headerType,
  headerValue,
  headerText,
  buttons = [],
  brandName = 'Nexa CRM',
  className,
}: TemplatePreviewBubbleProps) {
  return (
    <div className={cn('flex flex-col items-end gap-1 select-none', className)}>
      {/* WA Background */}
      <div className="w-full max-w-70 flex flex-col gap-0.5">
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
                <div className="w-full h-28 bg-emerald-900/20 flex items-center justify-center">
                  <Video size={32} className="text-emerald-600 opacity-60" />
                  <span className="ml-2 text-xs text-emerald-700">Video</span>
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
        {buttons.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {buttons.map((label, i) => (
              <div
                key={i}
                className="w-full rounded-lg bg-white/80 border border-white/20 text-center px-3 py-1.5 shadow-sm"
              >
                <span className="text-xs font-medium text-[#009de2]">{label}</span>
              </div>
            ))}
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
    STUDENT_NAME:  context.STUDENT_NAME  || 'Budi Santoso',
    SCHOOL_NAME:   context.SCHOOL_NAME   || 'SMA Negeri 1 Jakarta',
    STUDENT_ID:    context.STUDENT_ID    || 'SIS-000001',
  };

  let text = bodyText;
  bodyVarNames.forEach((varName, i) => {
    const placeholder = `{{${i + 1}}}`;
    const value = DUMMY_VALUES[varName.toUpperCase()] || `[${varName}]`;
    text = text.split(placeholder).join(value);
  });
  return text;
}
