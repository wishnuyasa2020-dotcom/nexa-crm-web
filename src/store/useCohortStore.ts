import { create } from 'zustand';
import apiClient from '@/lib/apiClient';

export interface Cohort {
  id_period: string;
  raw_id?: string;
  nama_period: string;
  start_date: string | null;
  end_date: string | null;
  status: 'aktif' | 'draft' | 'arsip';
  is_active: boolean;
  total_siswa: number;
  total_sekolah: number;
  created_date?: string | null;
  created_by?: string | null;
}

interface CohortStore {
  cohorts: Cohort[];
  activeCohort: Cohort | null;
  selectedCohort: Cohort | null;
  isHistoricalReadOnly: boolean;
  loading: boolean;
  error: string | null;

  fetchCohorts: () => Promise<void>;
  selectCohort: (cohortIdOrName: string) => void;
  createCohort: (data: { nama_period: string; start_date?: string; end_date?: string }) => Promise<Cohort>;
  setActiveCohort: (id: string) => Promise<void>;
  archiveCohort: (id: string) => Promise<void>;
}

export const useCohortStore = create<CohortStore>((set, get) => ({
  cohorts: [],
  activeCohort: null,
  selectedCohort: null,
  isHistoricalReadOnly: false,
  loading: false,
  error: null,

  fetchCohorts: async () => {
    try {
      set({ loading: true, error: null });
      const res = await apiClient.get('/api/v1/cohorts');
      if (res.data?.status === 'ok') {
        const list: Cohort[] = res.data.data || [];
        const active = list.find((c) => c.status === 'aktif' || c.is_active) || null;

        // Cek jika ada session cohort sebelumnya yang tersimpan di localStorage
        let selected = active;
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('nexa_selected_cohort');
          if (saved) {
            const matched = list.find((c) => c.id_period === saved || c.nama_period === saved);
            if (matched) selected = matched;
          }
        }

        const isHistoricalReadOnly = selected ? selected.status === 'arsip' : false;

        set({
          cohorts: list,
          activeCohort: active,
          selectedCohort: selected,
          isHistoricalReadOnly,
          loading: false,
        });
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || 'Gagal memuat data Cohort',
        loading: false,
      });
    }
  },

  selectCohort: (cohortIdOrName: string) => {
    const { cohorts, activeCohort } = get();
    const chosen = cohorts.find(
      (c) => c.id_period === cohortIdOrName || c.nama_period === cohortIdOrName
    );
    if (chosen) {
      const isHistoricalReadOnly = chosen.status === 'arsip';
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexa_selected_cohort', chosen.id_period);
      }
      set({ selectedCohort: chosen, isHistoricalReadOnly });
    }
  },

  createCohort: async (data) => {
    const res = await apiClient.post('/api/v1/cohorts', data);
    await get().fetchCohorts();
    return res.data?.data;
  },

  setActiveCohort: async (id: string) => {
    await apiClient.post(`/api/v1/cohorts/${id}/set-active`);
    await get().fetchCohorts();
  },

  archiveCohort: async (id: string) => {
    await apiClient.post(`/api/v1/cohorts/${id}/archive`);
    await get().fetchCohorts();
  },
}));
