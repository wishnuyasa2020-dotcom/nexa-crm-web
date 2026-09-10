'use client';

import { cn } from '@/lib/utils';
import { STATUS_BADGE } from '@/lib/constants/sekolah';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function StatusBadge({ status, size = 'sm', showDot = false }: StatusBadgeProps) {
  const colors = STATUS_BADGE[status] ?? {
    bg: 'bg-secondary',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  };

  const isIdentityCaptured = status === 'Identity Captured' || status === 'Lead Captured';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium',
        colors.bg, colors.text, colors.border,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', colors.dot)} />
      )}
      {isIdentityCaptured && '🎯 '}
      {status}
    </span>
  );
}
