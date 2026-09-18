// channel.ts — Metadata & konvensi 7 Channel Source Gate NexaMOS
// Sesuai pedoman-nexa/ip-wt/ip-channel other.md dan AGENTS.md

import { normalizeLifecycleState, CANONICAL_STATES } from './lifecycle';

export type ChannelSource =
  | 'sekolah'
  | 'relasi'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'website'
  | 'whatsapp';

export interface ChannelMeta {
  key: ChannelSource;
  label: string;
  icon: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
}

export const CHANNEL_CONFIG: Record<ChannelSource, ChannelMeta> = {
  sekolah: {
    key: 'sekolah',
    label: 'Kunjungan Sekolah',
    icon: '🏫',
    color: '#8b5cf6', // Violet
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    borderClass: 'border-violet-500',
    bgClass: 'bg-violet-500/10',
  },
  relasi: {
    key: 'relasi',
    label: 'Relasi / Alumni',
    icon: '🤝',
    color: '#3b82f6', // Blue
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-500/10',
  },
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    icon: '📸',
    color: '#ec4899', // Pink
    badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    borderClass: 'border-pink-500',
    bgClass: 'bg-pink-500/10',
  },
  facebook: {
    key: 'facebook',
    label: 'Facebook',
    icon: '📘',
    color: '#2563eb', // Indigo
    badgeClass: 'bg-blue-600/10 text-blue-500 border-blue-600/20',
    borderClass: 'border-blue-600',
    bgClass: 'bg-blue-600/10',
  },
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    color: '#14b8a6', // Teal
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    borderClass: 'border-teal-500',
    bgClass: 'bg-teal-500/10',
  },
  website: {
    key: 'website',
    label: 'Website',
    icon: '🌐',
    color: '#06b6d4', // Cyan
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    borderClass: 'border-cyan-500',
    bgClass: 'bg-cyan-500/10',
  },
  whatsapp: {
    key: 'whatsapp',
    label: 'Direct WhatsApp',
    icon: '💬',
    color: '#10b981', // Emerald
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
};

export function getChannelConfig(channel?: string | null): ChannelMeta {
  if (!channel) return CHANNEL_CONFIG.sekolah;
  const key = channel.toLowerCase() as ChannelSource;
  return (
    CHANNEL_CONFIG[key] || {
      key: 'sekolah',
      label: channel,
      icon: '📌',
      color: '#94a3b8',
      badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      borderClass: 'border-slate-500',
      bgClass: 'bg-slate-500/10',
    }
  );
}

/**
 * Aturan Kosakata & Konvensi Istilah Repositori NexaMOS:
 * - Stage Closing (Customer / Pelanggan Resmi):
 *   - LPK: "Kandidat"
 *   - Bisnis Umum: "Klien"
 * - Stage Funnel:
 *   - LPK Jalur Sekolah: "Siswa"
 *   - LPK Jalur Non-Sekolah (Relasi, Sosmed, Web, WA): "Calon Kandidat"
 *   - Bisnis Umum: "Kontak"
 */
export function getAdaptiveSiswaLabel(
  channel?: string | null,
  commercialState?: string | null,
  tenantType: 'lpk' | 'general' = 'lpk'
): string {
  const norm = normalizeLifecycleState(commercialState);
  const isCustomer = norm === CANONICAL_STATES.CUSTOMER || norm === CANONICAL_STATES.POST_CUSTOMER;
  if (tenantType === 'lpk') {
    if (isCustomer) return 'Kandidat';
    if (channel && channel.toLowerCase() !== 'sekolah') return 'Calon Kandidat';
    return 'Siswa';
  } else {
    if (isCustomer) return 'Klien';
    return 'Kontak';
  }
}
