'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
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
  getEntityLabel: (channel?: string | null) => string;
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
  const { lang, t } = useTranslation();
  const isEn = lang === 'en';
  const tenantType: TenantType = user?.tenant_type === 'general' ? 'general' : 'lpk';
  const isLpk = tenantType === 'lpk';
  const isGeneral = tenantType === 'general';

  /**
   * Mendapatkan label entitas (Siswa vs Kontak atau Student vs Contact) berdasarkan channel intake
   */
  const getEntityLabel = (channel?: string | null): string => {
    return resolveEntityLabel(tenantType, channel, lang);
  };

  /**
   * Mendapatkan display label untuk canonical state berdasar tenantType & channel & active lang
   */
  const getStateLabel = (state?: string | null, channel?: string | null): string => {
    return getDisplayLabel(state, tenantType, channel, lang);
  };

  const navLabels = {
    studentMenu: isGeneral ? t('nav.contacts') : t('nav.student'),
    schoolMenu: isGeneral ? t('nav.partners') : t('nav.school'),
    homeVisitMenu: isGeneral ? t('nav.fieldVisits') : t('nav.homeVisit'),
  };

  const pageLabels = {
    siswaPageTitle: isGeneral
      ? (isEn ? 'Contacts Database' : 'Database Kontak')
      : (isEn ? 'Students & Contacts Data' : 'Data Siswa & Kontak'),
    siswaPageSubtitle: isGeneral
      ? (isEn ? 'List of all prospect contacts and business customers.' : 'Daftar seluruh kontak prospek dan pelanggan bisnis.')
      : (isEn ? 'List of school-track students and digital inbound contacts.' : 'Daftar siswa jalur sekolah dan kontak inbound digital.'),
    addBtn: isGeneral
      ? (isEn ? 'Add Contact' : 'Tambah Kontak')
      : (isEn ? 'Add Student / Contact' : 'Tambah Siswa / Kontak'),
    searchPlaceholder: isGeneral
      ? (isEn ? 'Search contact name, WA number...' : 'Cari nama kontak, nomor WA...')
      : (isEn ? 'Search student/contact name, school origin...' : 'Cari nama siswa/kontak, asal sekolah...'),
    entityColumn: isGeneral
      ? (isEn ? 'Contact Name' : 'Nama Kontak')
      : (isEn ? 'Student / Contact Name' : 'Nama Siswa / Kontak'),
    schoolColumn: isGeneral
      ? (isEn ? 'Institution / Origin' : 'Institusi / Asal')
      : (isEn ? 'School Origin' : 'Asal Sekolah'),
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
