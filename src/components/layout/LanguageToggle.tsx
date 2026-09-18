'use client';

// ============================================================
// NexaMOS CRM — LanguageToggle Component
// Pill switch: ID ↔ EN
// Variants:
//   "compact" → small pill for mobile header Row 1
//   "default" → standard size for desktop header
// ============================================================

import { useLanguageStore, type Language } from '@/store/useLanguageStore';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  variant?: 'compact' | 'default';
  className?: string;
}

export function LanguageToggle({ variant = 'default', className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageStore();

  const isCompact = variant === 'compact';

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={cn(
        'inline-flex items-center rounded-full border transition-colors shrink-0',
        isCompact
          ? 'h-5 p-0.5 border-border/60 bg-muted/40 gap-0'
          : 'h-7 p-0.5 border-border bg-muted/30 gap-0',
        className
      )}
    >
      {(['id', 'en'] as Language[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            aria-pressed={isActive}
            title={lang === 'id' ? 'Bahasa Indonesia' : 'English'}
            className={cn(
              'rounded-full font-semibold uppercase tracking-widest transition-all duration-200 cursor-pointer',
              isCompact
                ? 'h-4 w-6 text-[9px]'
                : 'h-6 w-8 text-[10px]',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
