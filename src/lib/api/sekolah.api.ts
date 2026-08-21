/**
 * sekolah.api.ts
 * Centralized API layer untuk Modul Sekolah
 * Semua calls ke nexa-os backend melalui file ini.
 */

import apiClient from '@/lib/apiClient';
import type {
  Sekolah,
  SekolahDetail,
  SekolahListResponse,
  SekolahStatsResponse,
  SekolahListParams,
  TambahSekolahPayload,
  EditSekolahPayload,
  InputAktivitasPayload,
  BuatEkstraPayload,
  SelesaikanEkstraPayload,
  BatalkanEkstraPayload,
} from '@/lib/types/sekolah.types';

// ── Helper: unwrap response ───────────────────────────────────────────────────
function unwrap<T>(res: { data: { status: string; data: T } }): T {
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST — GET /api/v1/sekolah
// ─────────────────────────────────────────────────────────────────────────────
export async function getSekolahList(
  params: SekolahListParams = {}
): Promise<SekolahListResponse> {
  const res = await apiClient.get<{ status: string; data: SekolahListResponse }>('/sekolah', {
    params: {
      ...(params.period    && { period:    params.period }),
      ...(params.page      && { page:      params.page }),
      ...(params.status    && { status:    params.status }),
      ...(params.kecamatan && { kecamatan: params.kecamatan }),
      ...(params.pjCro     && { pjCro:     params.pjCro }),
      ...(params.search    && { search:    params.search }),
    },
  });
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS — GET /api/v1/sekolah/stats
// ─────────────────────────────────────────────────────────────────────────────
export async function getSekolahStats(period?: string): Promise<SekolahStatsResponse> {
  const res = await apiClient.get<{ status: string; data: SekolahStatsResponse }>('/sekolah/stats', {
    params: period ? { period } : {},
  });
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL — GET /api/v1/sekolah/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function getSekolahDetail(id: string, period?: string): Promise<SekolahDetail> {
  const res = await apiClient.get<{ status: string; data: SekolahDetail }>(`/sekolah/${id}`, {
    params: period ? { period } : {},
  });
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — POST /api/v1/sekolah
// ─────────────────────────────────────────────────────────────────────────────
export async function tambahSekolah(
  payload: TambahSekolahPayload
): Promise<{ id: string; status: string; nextAction: string }> {
  const res = await apiClient.post<{ status: string; data: { id: string; status: string; nextAction: string } }>(
    '/sekolah',
    payload
  );
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — PUT /api/v1/sekolah/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function editSekolah(id: string, payload: EditSekolahPayload): Promise<void> {
  await apiClient.put(`/sekolah/${id}`, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — DELETE /api/v1/sekolah/:id
// ─────────────────────────────────────────────────────────────────────────────
export interface DeleteSekolahError {
  reason: 'has_activity' | 'lead_captured' | 'active_task';
  message: string;
}

export async function hapusSekolah(id: string, alasan?: string): Promise<void> {
  await apiClient.delete(`/sekolah/${id}`, { data: { alasan } });
}

// ─────────────────────────────────────────────────────────────────────────────
// REASSIGN — PATCH /api/v1/sekolah/:id/reassign
// ─────────────────────────────────────────────────────────────────────────────
export async function reassignCRO(
  id: string,
  croBaru: string,
  alasan?: string
): Promise<{ croLama: string; croBaru: string }> {
  const res = await apiClient.patch<{ status: string; data: { croLama: string; croBaru: string } }>(
    `/sekolah/${id}/reassign`,
    { croBaru, alasan }
  );
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT AKTIVITAS — POST /api/v1/sekolah/:id/aktivitas
// ─────────────────────────────────────────────────────────────────────────────
export async function inputAktivitas(
  sekolahId: string,
  payload: InputAktivitasPayload
): Promise<SekolahDetail> {
  const res = await apiClient.post<{ status: string; data: SekolahDetail }>(
    `/sekolah/${sekolahId}/aktivitas`,
    payload
  );
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// AKTIVITAS EKSTRA: Create
// POST /api/v1/sekolah/:id/aktivitas-ekstra
// ─────────────────────────────────────────────────────────────────────────────
export async function buatAktivitasEkstra(
  sekolahId: string,
  payload: BuatEkstraPayload
): Promise<{ id: string; statusAktivitas: string }> {
  const res = await apiClient.post<{ status: string; data: { id: string; statusAktivitas: string } }>(
    `/sekolah/${sekolahId}/aktivitas-ekstra`,
    payload
  );
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// AKTIVITAS EKSTRA: Selesai
// PATCH /api/v1/aktivitas-ekstra/:aeId/selesai
// ─────────────────────────────────────────────────────────────────────────────
export async function selesaikanEkstra(
  aeId: string,
  payload: SelesaikanEkstraPayload
): Promise<void> {
  await apiClient.patch(`/aktivitas-ekstra/${aeId}/selesai`, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// AKTIVITAS EKSTRA: Batalkan
// PATCH /api/v1/aktivitas-ekstra/:aeId/batalkan
// ─────────────────────────────────────────────────────────────────────────────
export async function batalkanEkstra(
  aeId: string,
  payload: BatalkanEkstraPayload = {}
): Promise<void> {
  await apiClient.patch(`/aktivitas-ekstra/${aeId}/batalkan`, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS: Kecamatan list — GET /api/v1/sekolah/utils/kecamatan-list
// ─────────────────────────────────────────────────────────────────────────────
export async function getKecamatanList(): Promise<string[]> {
  const res = await apiClient.get<{ status: string; data: string[] }>('/sekolah/utils/kecamatan-list');
  return unwrap(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS: CRO list — GET /api/v1/sekolah/utils/cro-list
// ─────────────────────────────────────────────────────────────────────────────
export async function getCROList(): Promise<string[]> {
  const res = await apiClient.get<{ status: string; data: string[] }>('/sekolah/utils/cro-list');
  return unwrap(res);
}
