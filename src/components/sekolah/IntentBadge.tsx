'use client';

import { cn } from '@/lib/utils';
import { INTENT_BADGE, type IntentLevel } from '@/lib/constants/sekolah';

interface IntentBadgeProps {
  intent:    IntentLevel | null | undefined;
  size?:     'sm' | 'md';
  showIcon?: boolean;
}

export function IntentBadge({ intent, size = 'sm', showIcon = true }: IntentBadgeProps) {
  if (!intent) return null;

  const cfg = INTENT_BADGE[intent];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        cfg.bg, cfg.text, cfg.border,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
      )}
    >
      {showIcon && <span className="text-[10px]">{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}
