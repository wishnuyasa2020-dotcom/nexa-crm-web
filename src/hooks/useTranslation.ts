// ============================================================
// NexaMOS CRM — useTranslation Hook
// Usage: const { t, lang } = useTranslation();
//        t('nav.dashboard') → 'Dashboard' | 'Dashboard'
//        t('nav.student')   → 'Data Siswa' | 'Student Data'
// ============================================================

import { useCallback } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import id from '@/locales/id';
import en from '@/locales/en';

type DeepKeyOf<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? DeepKeyOf<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`>
    : `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`;
}[keyof T];

type DotPath = DeepKeyOf<typeof id>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const dict = language === 'id' ? id : en;

  const t = useCallback(
    (key: DotPath): string => {
      return getNestedValue(dict as unknown as Record<string, unknown>, key);
    },
    [dict]
  );

  return { t, lang: language };
}

