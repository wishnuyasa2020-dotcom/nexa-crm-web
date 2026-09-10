/**
 * weeklyApi.ts
 * API client untuk modul Weekly Planning.
 */

import apiClient from './apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskJenis = 'sekolah' | 'siswa' | 'home_visit' | 'ekstra';

/** Item di Backlog (belum dijadwalkan) */
export interface BacklogItem {
  taskId: string;           // format: "as:123" | "asi:45" | "hv:7" | "ae:12"
  jenis: TaskJenis;
  judul: string;
  next_action: string | null;
  status: string | null;
  owner: string | null;     // pic / pj_aktivitas
  marketing_period: string;
  date_val?: string | null; // due_date or tanggal_rencana
  commercialState?: string | null;
  intent?: string | null;
}

/** Item di Board (sudah dijadwalkan, dari weekly_planning) */
export interface BoardItem {
  dbId: number;
  id_agenda: string;        // UUID — dipakai untuk reschedule & unschedule
  referensi_id: string;     // ID di source table
  jenis_agenda: string;     // prefix: as / asi / hv / ae
  judul: string;
  tanggal: string;          // YYYY-MM-DD
  jam_mulai: string | null;
  jam_selesai: string | null;
  lokasi: string | null;
  cro: string;
  catatan: string | null;
}

export interface WeeklyBoardResponse {
  status: string;
  data: BoardItem[];
}

export interface BacklogResponse {
  status: string;
  data: BacklogItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export const weeklyApi = {
  /**
   * GET /api/v1/weekly/backlog
   * Daftar aktivitas belum terjadwal dari 4 tabel sumber.
   */
  getBacklog: (params?: { search?: string; period?: string }) =>
    apiClient.get<BacklogResponse>('/api/v1/weekly/backlog', { params }),

  /**
   * GET /api/v1/weekly/board?startDate=&endDate=
   * Daftar agenda dari weekly_planning dalam rentang minggu.
   */
  getBoardItems: (params: { startDate: string; endDate: string; period?: string }) =>
    apiClient.get<WeeklyBoardResponse>('/api/v1/weekly/board', { params }),

  /**
   * POST /api/v1/weekly/schedule
   * Jadwalkan task ke hari tertentu (drag backlog → hari).
   */
  scheduleTask: (body: { taskId: string; tanggal: string }) =>
    apiClient.post<{ status: string; data: BoardItem }>('/api/v1/weekly/schedule', body),

  /**
   * PATCH /api/v1/weekly/agenda/:agendaId/reschedule
   * Pindah jadwal ke hari lain (drag hari → hari).
   */
  rescheduleTask: (agendaId: string, body: { newTanggal: string }) =>
    apiClient.patch<{ status: string; data: { success: boolean; newTanggal: string } }>(
      `/api/v1/weekly/agenda/${agendaId}/reschedule`,
      body
    ),

  /**
   * DELETE /api/v1/weekly/agenda/:agendaId
   * Kembalikan ke backlog (drag hari → backlog).
   */
  unscheduleTask: (agendaId: string) =>
    apiClient.delete<{ status: string; data: { success: boolean } }>(
      `/api/v1/weekly/agenda/${agendaId}`
    ),
};
