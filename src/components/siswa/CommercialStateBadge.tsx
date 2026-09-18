'use strict';
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CommercialState } from '@/lib/types/siswa.types';
import { 
  normalizeLifecycleState, 
  getDisplayLabel, 
  CANONICAL_STATE_THEMES,
  type TenantType,
  type CanonicalState
} from '@/lib/constants/lifecycle';

interface CommercialStateBadgeProps {
  state: CommercialState | string;
  size?: 'sm' | 'md';
  tenantType?: TenantType;
  useTenantVocabulary?: boolean;
}

export function CommercialStateBadge({ 
  state, 
  size = 'sm',
  tenantType = 'lpk',
  useTenantVocabulary = true
}: CommercialStateBadgeProps) {
  const normState = normalizeLifecycleState(state);
  const theme = CANONICAL_STATE_THEMES[normState] ?? {
    dot: '⚪',
    className: 'bg-secondary text-muted-foreground border-border',
    defaultLabel: String(state || '–')
  };

  const label = useTenantVocabulary 
    ? getDisplayLabel(state, tenantType)
    : theme.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium tracking-wide uppercase shrink-0 transition-colors',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        theme.className
      )}
      title={`Canonical State: ${normState}`}
    >
      <span className="text-xs shrink-0 leading-none">{theme.dot}</span>
      <span>{label}</span>
    </span>
  );
}
