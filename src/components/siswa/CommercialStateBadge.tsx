'use client';

import { cn } from '@/lib/utils';
import type { CommercialState } from '@/lib/types/siswa.types';

interface CommercialStateBadgeProps {
  state: CommercialState | string;
  size?: 'sm' | 'md';
}

const STATE_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  'Audience':              { label: 'Audience',          dot: '⚫', className: 'bg-slate-600/15 text-slate-500 border-slate-600/20' },
  'Known':                 { label: 'Known Profile',      dot: '⚪', className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  'Lead':                  { label: 'Lead',               dot: '🟡', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  'Prospect':              { label: 'Prospect',           dot: '🔵', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  'Opportunity':           { label: 'Opportunity',        dot: '🟣', className: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  'Registered Opportunity':{ label: 'Reg. Opportunity',  dot: '🟣', className: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  'Customer':              { label: 'Customer',           dot: '🟢', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'Disqualified':          { label: 'Disqualified',       dot: '🔴', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
};

export function CommercialStateBadge({ state, size = 'sm' }: CommercialStateBadgeProps) {
  const config = STATE_CONFIG[state] ?? { label: state, dot: '⚪', className: 'bg-secondary text-muted-foreground border-border' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        config.className
      )}
    >
      <span className="text-[10px]">{config.dot}</span>
      {config.label}
    </span>
  );
}
