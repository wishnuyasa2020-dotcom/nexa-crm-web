'use strict';
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CommercialState } from '@/lib/types/siswa.types';

interface CommercialStateBadgeProps {
  state: CommercialState | string;
  size?: 'sm' | 'md';
}

const STATE_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  'Audience':              { label: 'Audience',          dot: '⚫', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  'Known':                 { label: 'Known Profile',      dot: '⚪', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  'Lead':                  { label: 'Lead',               dot: '🟡', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'Prospect':              { label: 'Prospect',           dot: '🔵', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  'Opportunity':           { label: 'Opportunity',        dot: '🟣', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  'Registered Opportunity':{ label: 'Reg. Opportunity',  dot: '🟣', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  'Customer':              { label: 'Customer',           dot: '🟢', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  'Disqualified':          { label: 'Disqualified',       dot: '🔴', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },

  // Status legacy aliases:
  'Opportunity Terbuka':   { label: 'Opportunity',        dot: '🟣', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  'Calon Prospek':         { label: 'Lead',               dot: '🟡', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'Prospek Aktif':         { label: 'Prospect',           dot: '🔵', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  'Konsultasi':            { label: 'Lead',               dot: '🟡', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'Data Masuk':            { label: 'Known Profile',      dot: '⚪', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  'Tidak Lanjut':          { label: 'Disqualified',       dot: '🔴', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  'Terdaftar':             { label: 'Customer',           dot: '🟢', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
};

export function CommercialStateBadge({ state, size = 'sm' }: CommercialStateBadgeProps) {
  const trimmed = (state || '').trim();
  const config = STATE_CONFIG[trimmed] ?? { 
    label: trimmed || '–', 
    dot: '⚪', 
    className: 'bg-secondary text-muted-foreground border-border' 
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium tracking-wide uppercase shrink-0',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className
      )}
    >
      <span className="text-xs shrink-0 leading-none">{config.dot}</span>
      <span>{config.label}</span>
    </span>
  );
}
