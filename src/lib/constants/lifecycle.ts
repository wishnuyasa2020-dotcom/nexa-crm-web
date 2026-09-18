'use strict';

/**
 * lifecycle.ts
 * Sumber kebenaran baku 8 Canonical Lifecycle States & Tenant Vocabulary Layer NexaMOS (Frontend).
 * Selaras dengan: AGENTS.md, ONTHOLOGY.md, dan NexaMOS_Canonical_Lifecycle_Tenant_Mapping_v2.md
 */

export const CANONICAL_STATES = {
  AUDIENCE:       'AUDIENCE',
  KNOWN_PROFILE:  'KNOWN_PROFILE',
  LEAD:           'LEAD',
  PROSPECT:       'PROSPECT',
  OPPORTUNITY:    'OPPORTUNITY',
  REGISTERED:     'REGISTERED',
  CUSTOMER:       'CUSTOMER',
  POST_CUSTOMER:  'POST_CUSTOMER',
} as const;

export type CanonicalState = typeof CANONICAL_STATES[keyof typeof CANONICAL_STATES];

export const CANONICAL_STATE_PIPELINE: CanonicalState[] = [
  CANONICAL_STATES.AUDIENCE,
  CANONICAL_STATES.KNOWN_PROFILE,
  CANONICAL_STATES.LEAD,
  CANONICAL_STATES.PROSPECT,
  CANONICAL_STATES.OPPORTUNITY,
  CANONICAL_STATES.REGISTERED,
  CANONICAL_STATES.CUSTOMER,
  CANONICAL_STATES.POST_CUSTOMER,
];

export type TenantType = 'lpk' | 'general';

/**
 * Pemetaan Domain Vocabulary per Tipe Tenant:
 * - LPK: Derma & institusi vokasi/magang luar negeri
 * - General: Bisnis umum, SaaS, B2B, retail
 */
export const TENANT_VOCABULARIES: Record<TenantType, Record<CanonicalState, string>> = {
  lpk: {
    AUDIENCE:       'Siswa Dingin',
    KNOWN_PROFILE:  'Siswa Teridentifikasi',
    LEAD:           'Siswa Hangat',
    PROSPECT:       'Siswa Potensial',
    OPPORTUNITY:    'Siswa Serius',
    REGISTERED:     'Siswa Terdaftar',
    CUSTOMER:       'Siswa / Peserta',
    POST_CUSTOMER:  'Alumni',
  },
  general: {
    AUDIENCE:       'Kontak Dingin',
    KNOWN_PROFILE:  'Kontak Teridentifikasi',
    LEAD:           'Kontak Hangat',
    PROSPECT:       'Kontak Potensial',
    OPPORTUNITY:    'Kontak Serius',
    REGISTERED:     'Kontak Terdaftar',
    CUSTOMER:       'Pelanggan',
    POST_CUSTOMER:  'Mantan Pelanggan',
  },
};

/**
 * Normalisasi string input/database ke nilai Canonical State.
 * Menjamin kompatibilitas dengan varian legacy seperti 'Registered Opportunity', 'Known', dll.
 */
export function normalizeLifecycleState(input?: string | null): CanonicalState | 'Disqualified' {
  if (!input) return CANONICAL_STATES.LEAD;
  const cleaned = String(input).trim().toUpperCase();

  switch (cleaned) {
    case 'AUDIENCE':
      return CANONICAL_STATES.AUDIENCE;
    case 'KNOWN':
    case 'KNOWN PROFILE':
    case 'KNOWN_PROFILE':
    case 'DATA MASUK':
      return CANONICAL_STATES.KNOWN_PROFILE;
    case 'LEAD':
    case 'CALON PROSPEK':
    case 'KONSULTASI':
      return CANONICAL_STATES.LEAD;
    case 'PROSPECT':
    case 'PROSPEK AKTIF':
      return CANONICAL_STATES.PROSPECT;
    case 'OPPORTUNITY':
    case 'OPPORTUNITY TERBUKA':
    case 'LAYAK HOME VISIT':
    case 'HOME VISIT':
      return CANONICAL_STATES.OPPORTUNITY;
    case 'REGISTERED':
    case 'REGISTERED OPPORTUNITY':
    case 'REGISTERED_OPPORTUNITY':
    case 'SIAP DAFTAR':
    case 'TERDAFTAR FORMULIR':
      return CANONICAL_STATES.REGISTERED;
    case 'CUSTOMER':
    case 'CLOSING':
    case 'SISWA / PESERTA':
      return CANONICAL_STATES.CUSTOMER;
    case 'POST_CUSTOMER':
    case 'POST CUSTOMER':
    case 'POSTCUSTOMER':
    case 'ALUMNI':
    case 'MANTAN PELANGGAN':
      return CANONICAL_STATES.POST_CUSTOMER;
    case 'DISQUALIFIED':
    case 'TIDAK LANJUT':
      return 'Disqualified';
    default:
      if (CANONICAL_STATE_PIPELINE.includes(cleaned as CanonicalState)) {
        return cleaned as CanonicalState;
      }
      return CANONICAL_STATES.LEAD;
  }
}

/**
 * Mendapatkan display label antarmuka sesuai tipe tenant (default: 'lpk')
 */
export function getDisplayLabel(state?: string | null, tenantType: TenantType = 'lpk'): string {
  const norm = normalizeLifecycleState(state);
  if (norm === 'Disqualified') return 'Tidak Lanjut / Disqualified';
  const vocab = TENANT_VOCABULARIES[tenantType] || TENANT_VOCABULARIES.lpk;
  return vocab[norm] || norm;
}

/**
 * Styling tema visual dan icon dot untuk setiap state.
 * Mematuhi Tailwind CSS v4 (menggunakan token semantik universal yang aman di light/dark mode).
 */
export const CANONICAL_STATE_THEMES: Record<
  CanonicalState | 'Disqualified',
  { dot: string; className: string; defaultLabel: string }
> = {
  AUDIENCE: {
    dot: '⚫',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    defaultLabel: 'Audience',
  },
  KNOWN_PROFILE: {
    dot: '⚪',
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    defaultLabel: 'Known Profile',
  },
  LEAD: {
    dot: '🟡',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    defaultLabel: 'Lead',
  },
  PROSPECT: {
    dot: '🔵',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    defaultLabel: 'Prospect',
  },
  OPPORTUNITY: {
    dot: '🟣',
    className: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    defaultLabel: 'Opportunity',
  },
  REGISTERED: {
    dot: '🟣',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    defaultLabel: 'Registered',
  },
  CUSTOMER: {
    dot: '🟢',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    defaultLabel: 'Customer',
  },
  POST_CUSTOMER: {
    dot: '🎓',
    className: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    defaultLabel: 'Post-Customer',
  },
  Disqualified: {
    dot: '🔴',
    className: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    defaultLabel: 'Disqualified',
  },
};
