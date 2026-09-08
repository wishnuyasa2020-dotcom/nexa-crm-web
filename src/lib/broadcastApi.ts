/**
 * broadcastApi.ts
 * Helper API calls untuk Modul Broadcast.
 * Types disesuaikan dengan schema DB asli (tabel `broadcast` & `broadcast_queue`).
 */

import apiClient from './apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AudienceItem {
  id: string;
  nama: string;
  sekolah: string;
  phone: string;
  statusPipeline: string;
  isSwOpen: boolean;
}

export interface AudienceMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AudienceResponse {
  status: string;
  data: AudienceItem[];
  meta: AudienceMeta;
}

/** Schema dari tabel `broadcast` */
export interface BroadcastCampaign {
  id: string;                   // id_broadcast
  templateName: string;         // template_display_name
  templateNameApi: string;      // template_name_api
  marketingPeriod: string;      // marketing_period
  statusPipeline: string | null;
  targetCount: number;          // total_target
  sentCount: number;            // total_success
  failedCount: number;          // total_failed
  pendingCount: number;         // total_pending
  status: 'antri' | 'proses' | 'selesai' | 'gagal';
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface HistoryResponse {
  status: string;
  data: BroadcastCampaign[];
  meta: AudienceMeta;
}

/** Schema dari tabel wa_templates (status_meta = APPROVED) */
export interface MetaTemplate {
  id: string;                   // id_template
  name: string;                 // nama_template
  templateNameApi: string;      // template_name_api
  language: string;             // language_code
  kategori: string;
  bodyText: string;             // body_text
  headerType?: string;          // header_type
  header_type?: string;
  headerUrl?: string;           // header_url
  header_url?: string;
  headerFilename?: string;      // header_filename
  header_filename?: string;
  meta_buttons?: string;
  parameters: string | null;
  status: string;               // status_meta
  qualityRating: string | null; // meta_quality_rating
}

/** Schema dari tabel wa_templates (CRM / service message) */
export interface CrmTemplate {
  id: string;
  name: string;
  templateNameApi: string;
  previewText: string | null;   // body_text
  pipeline?: string;
}

export interface SendBroadcastPayload {
  targetIds: string[];
  metaTemplateId: string | null;
  crmTemplateId: string | null;
  namaCampaign?: string;
}

export interface SendBroadcastResponse {
  status: string;
  data: {
    jobId: string;
    message: string;
    targetCount: number;
  };
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const broadcastApi = {
  /**
   * GET /api/v1/broadcast/audience
   * Daftar siswa sebagai target broadcast.
   * isSwOpen dihitung di backend (NOW() - last_inbound_at <= 24 jam).
   */
  getAudience: (params?: {
    search?: string;
    statusPipeline?: string;
    page?: number;
    limit?: number;
    period?: string;
  }) =>
    apiClient.get<AudienceResponse>('/api/v1/broadcast/audience', { params }),

  /**
   * GET /api/v1/broadcast/history
   * Riwayat campaign dari tabel `broadcast`.
   */
  getHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<HistoryResponse>('/api/v1/broadcast/history', { params }),

  /**
   * GET /api/v1/broadcast/templates/meta
   * Template Meta yang sudah APPROVED di wa_templates.
   */
  getMetaTemplates: () =>
    apiClient.get<{ status: string; data: MetaTemplate[] }>('/api/v1/broadcast/templates/meta'),

  /**
   * GET /api/v1/broadcast/templates/crm
   * Template CRM internal (service message) dari wa_templates.
   */
  getCrmTemplates: () =>
    apiClient.get<{ status: string; data: CrmTemplate[] }>('/api/v1/broadcast/templates/crm'),

  /**
   * GET /api/v1/broadcast/audience/schools
   * Daftar sekolah unik yang memiliki siswa di period aktif.
   * Dipakai untuk autocomplete filter di wizard broadcast.
   */
  getSchoolList: () =>
    apiClient.get<{ status: string; data: { id: string; name: string }[] }>('/api/v1/broadcast/audience/schools'),

  /**
   * POST /api/v1/broadcast/send → 202 Accepted
   * Membuat broadcast job:
   * - SW Tertutup → pakai metaTemplateId
   * - SW Terbuka  → pakai crmTemplateId
   * GAS Worker mengambil data dari broadcast_queue.
   */
  sendBroadcast: (payload: SendBroadcastPayload) =>
    apiClient.post<SendBroadcastResponse>('/api/v1/broadcast/send', payload),
};
