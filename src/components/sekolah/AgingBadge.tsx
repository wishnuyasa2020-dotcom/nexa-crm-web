'use client';

import { cn } from '@/lib/utils';
import { getOverdueCategory, OVERDUE_COLORS } from '@/lib/constants/sekolah';

interface AgingBadgeProps {
  dueDate: string | null;
  className?: string;
}

export function AgingBadge({ dueDate, className }: AgingBadgeProps) {
  if (!dueDate) return <span className="text-muted-foreground text-xs">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);

  const cat = getOverdueCategory(dueDate);
  const color = OVERDUE_COLORS[cat];

  // Format the date for display (DD/MM)
  const day = due.getDate().toString().padStart(2, '0');
  const month = (due.getMonth() + 1).toString().padStart(2, '0');
  const dateStr = `${day}/${month}`;

  if (cat === 'ok') {
    // Not overdue — show plain date, optionally "hari ini"
    const isToday = diff === 0;
    return (
      <span className={cn('text-xs', isToday ? 'text-amber-400 font-semibold' : 'text-muted-foreground', className)}>
        {isToday ? `⚡ ${dateStr}` : dateStr}
      </span>
    );
  }

  const agingText = diff === 1 ? '1 hr' : `${diff} hr`;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', color.text, className)}>
      {color.label} {dateStr}
      <span className="text-foreground/70">({agingText})</span>
    </span>
  );
}
