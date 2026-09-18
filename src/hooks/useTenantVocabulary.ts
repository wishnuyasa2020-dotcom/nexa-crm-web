'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { 
  TenantType, 
  getDisplayLabel, 
  resolveEntityLabel,
  CANONICAL_STATES,
  type CanonicalState
} from '@/lib/constants/lifecycle';

export interface UseTenantVocabularyReturn {
  tenantType: TenantType;
  isLpk: boolean;
  isGeneral: boolean;
  getEntityLabel: (channel?: string | null) => 'Siswa' | 'Kontak';
  getStateLabel: (state?: string | null, channel?: string | null) => string;
  navLabels: {
    studentMenu: string;
    schoolMenu: string;
    homeVisitMenu: string;
  };
  pageLabels: {
    siswaPageTitle: string;
    siswaPageSubtitle: string;
    addBtn: string;
    searchPlaceholder: string;
    entityColumn: string;
    schoolColumn: string;
  };
}

/**
 * useTenantVocabulary
 * Hook terpusat untuk adaptasi antarmuka (Adaptive UI Layer) NexaMOS.
 * Sesuai aturan ontologi di AGENTS.md:
 * - Tenant LPK: Mendukung dual-label (Siswa untuk jalur sekolah, Kontak untuk jalur non-sekolah).
 * - Tenant General: Konsisten menggunakan single-label (Kontak, Pelanggan, dsb.).
 */
export function useTenantVocabulary(): UseTenantVocabularyReturn {
  const user = useAuthStore((s) => s.user);
  const tenantType: TenantType = user?.tenant_type === 'general' ? 'general' : 'lpk';
  const isLpk = tenantType === 'lpk';
  const isGeneral = tenantType === 'general';

  /**
   * Mendapatkan label entitas (Siswa vs Kontak) berdasarkan channel intake
   */
  const getEntityLabel = (channel?: string | null): 'Siswa' | 'Kontak' => {
    return resolveEntityLabel(tenantType, channel);
  };

  /**
   * Mendapatkan display label untuk canonical state berdasar tenantType & channel
   */
  const getStateLabel = (state?: string | null, channel?: string | null): string => {
    return getDisplayLabel(state, tenantType, channel);
  };

  const navLabels = {
    studentMenu: isGeneral ? 'Data Kontak' : 'Data Siswa',
    schoolMenu: isGeneral ? 'Mitra / Institusi' : 'Data Sekolah',
    homeVisitMenu: isGeneral ? 'Kunjungan Lapangan' : 'Home Visit',
  };

  const pageLabels = {
    siswaPageTitle: isGeneral ? 'Database Kontak' : 'Data Siswa & Kontak',
    siswaPageSubtitle: isGeneral
      ? 'Daftar seluruh kontak prospek dan pelanggan bisnis.'
      : 'Daftar siswa jalur sekolah dan kontak inbound digital.',
    addBtn: isGeneral ? 'Tambah Kontak' : 'Tambah Siswa / Kontak',
    searchPlaceholder: isGeneral
      ? 'Cari nama kontak, nomor WA...'
      : 'Cari nama siswa/kontak, asal sekolah...',
    entityColumn: isGeneral ? 'Nama Kontak' : 'Nama Siswa / Kontak',
    schoolColumn: isGeneral ? 'Institusi / Asal' : 'Asal Sekolah',
  };

  return {
    tenantType,
    isLpk,
    isGeneral,
    getEntityLabel,
    getStateLabel,
    navLabels,
    pageLabels,
  };
}
