/**
 * nurturingApi.ts
 * Helper API calls untuk Modul Automated Nurturing & Snooze Campaign.
 * Sesuai endpoint di nexa-os: /api/v1/nurturing/*
 */

import apiClient from './apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NurturingStats {
  total_calon_prospek:      number;
  antrean_baru_probe_1:     number;
  dalam_putaran_probe_1_4:  number;
  menunggu_followup_manual: number;
}

export interface SnoozeStats {
  total_sedang_tunda: number;
  bangun_minggu_ini:  number;
}

export interface NurturingLead {
  id:               string;
  nama:             string;
  noWa:             string;
  sekolah:          string;
  commercialState?: string;
  status:           string;
  consent?:         'Granted' | 'Withdrawn' | 'Denied' | string;
  cro:              string;
  probeLevel:       number;
  lastProbeSentAt:  string | null;
  sisaHari:         number;
  isSwOpen?:        boolean;
}

export interface SnoozeLead {
  id:              string;
  nama:            string;
  noWa:            string;
  sekolah:         string;
  cro:             string;
  snoozeLevel:     number;
  snoozeUntil:     string;
  sisaHari:        number;
  intervalDays?:   number;
  commercialState?: string;
  consent?:        string;
  isSwOpen?:       boolean;
}

export interface PaginatedResponse<T> {
  status:     string;
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface ForceTriggerResult {
  status:  string;
  message: string;
  result: {
    nurturing: { sent: number; escalated: number };
    snooze:    { woken: number; terminated: number };
  };
}

// ── API Object ────────────────────────────────────────────────────────────────

export const nurturingApi = {
  // ─── Nurturing Dashboard ──────────────────────────────────────────────────

  /**
   * GET /api/v1/nurturing/stats
   * Metrik summary untuk 4 stat cards Nurturing Dashboard.
   */
  getStats: () =>
    apiClient.get<{ status: string; data: NurturingStats }>('/api/v1/nurturing/stats'),

  /**
   * GET /api/v1/nurturing/leads
   * Daftar leads yang sedang aktif dalam campaign probing.
   */
  getLeads: (params?: { page?: number; limit?: number; search?: string; period?: string }) =>
    apiClient.get<PaginatedResponse<NurturingLead>>('/api/v1/nurturing/leads', { params }),

  // ─── Snooze Campaign Dashboard ────────────────────────────────────────────

  /**
   * GET /api/v1/nurturing/snooze/stats
   * Metrik summary untuk 2 stat cards Snooze Dashboard.
   */
  getSnoozeStats: () =>
    apiClient.get<{ status: string; data: SnoozeStats }>('/api/v1/nurturing/snooze/stats'),

  /**
   * GET /api/v1/nurturing/snooze/leads
   * Daftar leads yang sedang dalam antrean snooze.
   */
  getSnoozeLeads: (params?: { page?: number; limit?: number; search?: string; period?: string }) =>
    apiClient.get<PaginatedResponse<SnoozeLead>>('/api/v1/nurturing/snooze/leads', { params }),

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/nurturing/force-trigger
   * Jalankan cron job probing & snooze saat ini juga (untuk testing).
   */
  forceTrigger: () =>
    apiClient.post<ForceTriggerResult>('/api/v1/nurturing/force-trigger'),

  /**
   * POST /api/v1/nurturing/takeover/:id
   * Hentikan bot nurturing untuk satu siswa, CRO ambil alih.
   */
  takeover: (idSiswa: string) =>
    apiClient.post<{ status: string; message: string }>(`/api/v1/nurturing/takeover/${idSiswa}`),

  /**
   * POST /api/v1/nurturing/start/:id
   * Daftarkan siswa ke kampanye probing (Event: NurturingStarted).
   */
  startNurturing: (idSiswa: string, reason?: string) =>
    apiClient.post<{ status: string; message: string }>(`/api/v1/nurturing/start/${idSiswa}`, { reason }),

  /**
   * POST /api/v1/nurturing/snooze/request
   * Tambahkan siswa ke antrean snooze (30/60/90 hari) secara manual.
   */
  requestSnooze: (payload: { idSiswa: string; interval_days?: number; alasan?: string }) =>
    apiClient.post<{ status: string; message: string; snoozeUntil: string; intervalDays?: number }>(
      '/api/v1/nurturing/snooze/request',
      payload
    ),

  addSnooze: (payload: { idSiswa: string; interval_days?: number; alasan?: string }) =>
    apiClient.post<{ status: string; message: string; snoozeUntil: string; intervalDays?: number }>(
      '/api/v1/nurturing/snooze/request',
      payload
    ),

  /**
   * POST /api/v1/nurturing/snooze/wakeup & DELETE /api/v1/nurturing/snooze/:id
   * Bangunkan siswa dari snooze lebih awal dari jadwal (Bangunkan Paksa).
   */
  wakeupSnooze: (idSiswa: string) =>
    apiClient.post<{ status: string; message: string }>('/api/v1/nurturing/snooze/wakeup', { idSiswa }),

  stopSnooze: (idSiswa: string) =>
    apiClient.delete<{ status: string; message: string }>(`/api/v1/nurturing/snooze/${idSiswa}`),
};
