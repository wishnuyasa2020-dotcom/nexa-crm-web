'use strict';
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CommercialState, RelationshipLevel } from '@/lib/types/siswa.types';
import { 
  normalizeLifecycleState, 
  getDisplayLabel, 
  CANONICAL_STATE_THEMES,
  type TenantType
} from '@/lib/constants/lifecycle';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';

interface CommercialStateBadgeProps {
  state: CommercialState | string;
  size?: 'sm' | 'md';
  tenantType?: TenantType;
  channel?: string | null;
  relationshipLevel?: RelationshipLevel;
  useTenantVocabulary?: boolean;
}

export function CommercialStateBadge({ 
  state, 
  size = 'sm',
  tenantType: tenantTypeProp,
  channel,
  relationshipLevel,
  useTenantVocabulary = true
}: CommercialStateBadgeProps) {
  const authTenantType = useAuthStore((s) => s.user?.tenant_type);
  const { lang } = useTranslation();
  const effectiveTenantType: TenantType = 
    tenantTypeProp ?? (authTenantType === 'general' ? 'general' : 'lpk');

  const normState = normalizeLifecycleState(state);
  const theme = CANONICAL_STATE_THEMES[normState] ?? {
    dot: '⚪',
    className: 'bg-secondary text-muted-foreground border-border',
    defaultLabel: String(state || '–')
  };

  const label = useTenantVocabulary 
    ? getDisplayLabel(state, effectiveTenantType, channel, lang)
    : theme.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium tracking-wide uppercase shrink-0 transition-colors',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        theme.className
      )}
      title={`Canonical State: ${normState}${relationshipLevel ? ` | Relationship: ${relationshipLevel}` : ''}`}
    >
      <span className="text-xs shrink-0 leading-none">{theme.dot}</span>
      <span>{label}</span>
      {relationshipLevel && relationshipLevel !== 'STANDARD' && (
        <span
          className={cn(
            'ml-1 px-1 py-0.5 rounded text-xs font-semibold tracking-wider',
            relationshipLevel === 'ADVOCATE'
              ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
              : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
          )}
        >
          {relationshipLevel}
        </span>
      )}
    </span>
  );
}
