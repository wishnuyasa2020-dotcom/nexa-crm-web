// ============================================================
// NexaMOS CRM — Language Store (Zustand + localStorage persist)
// Manages active UI language: 'id' (Indonesian) | 'en' (English)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'id' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (lang) => set({ language: lang }),

      toggleLanguage: () => {
        const next = get().language === 'id' ? 'en' : 'id';
        set({ language: next });
      },
    }),
    {
      name: 'nexa-crm-language', // localStorage key
    }
  )
);
