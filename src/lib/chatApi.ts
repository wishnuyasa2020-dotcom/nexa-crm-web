/**
 * chatApi.ts
 * API client functions untuk modul Chat & Template Manager
 * Menggunakan apiClient (axios instance) yang sudah ada.
 */

import apiClient from './apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type ServiceWindowStatus = 'OPEN' | 'CLOSED';
export type MessageDirection    = 'incoming' | 'outgoing';
export type MetaStatus          = 'APPROVED' | 'PENDING' | 'REJECTED' | 'LOCAL_ONLY';

export interface Conversation {
  conv_id:           number | string;
  id_siswa:          number | null;
  wa_number:         string;
  student_name:      string;
  status:            string;
  window_status:     ServiceWindowStatus;
  window_opened_at:  string | null;
  window_expires_at: string | null;
  last_message_type: string;
  last_message_prev: string;
  last_sender:       string;
  last_msg_ts:       string;
  pipeline_status:   string | null;
  unread_count:      number;
}

export interface ChatMessage {
  message_id:  number;
  conv_id:     number | string;
  timestamp:   number | string;  // Unix ms — bisa number atau string dari legacy DB
  datetime:    string | null;
  direction:   MessageDirection;
  from_phone:  string;
  from_name:   string;
  type:        string;
  body:        string | null;
  media_id:    string | null;
  media_url:   string | null;
  mime_type:   string | null;
  status:      string | null;
  reaction:    string | null;
}

export interface WaTemplate {
  id_template:            string;    // varchar(50) di DB
  pipeline:               string | null;
  nama_template:          string;
  template_name_api:      string;
  language_code:          string;
  body_text:              string;
  kategori:               string;
  urutan:                 number;
  status_crm:             'ACTIVE' | 'INACTIVE' | 'DELETED';
  meta_status:            MetaStatus;
  meta_template_id:       string | null;
  meta_status_updated_at: string | null;
  meta_quality_rating:    string | null;
  meta_buttons:           string | null;  // JSON string: buttons dari Meta (read-only)
  parameters:             string;         // JSON string schema {body:[], header:{}, buttons:[]}
  header_type:            'none' | 'text' | 'image' | 'video' | 'document' | null;
  header_url:             string | null;
  header_filename:        string | null;
  supports_bsuid:         0 | 1;
  created_date:           string;
  last_updated:           string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT API
// ─────────────────────────────────────────────────────────────────────────────

/** Daftar percakapan aktif (dipakai untuk polling) */
export async function fetchConversations(params: {
  tab?:    'all' | 'unread' | 'waiting';
  search?: string;
  page?:   number;
  limit?:  number;
} = {}): Promise<{ data: Conversation[]; total: number }> {
  const res = await apiClient.get('/api/v1/chats', { 
    params: { ...params, _t: Date.now() } 
  });
  return res.data;
}

/** Riwayat pesan dalam satu percakapan */
export async function fetchMessages(
  convId: number | string,
  params: { limit?: number; before?: number } = {}
): Promise<ChatMessage[]> {
  const res = await apiClient.get(`/api/v1/chats/${convId}/messages`, { 
    params: { ...params, _t: Date.now() } 
  });
  return res.data.data;
}

/** Kirim pesan — teks biasa, template, lokasi, atau media */
export async function sendMessage(
  convId: number | string,
  payload: { text?: string; templateId?: string | number; type?: string; latitude?: number; longitude?: number; location_name?: string; location_address?: string; targetMessageId?: string | number; emoji?: string } | FormData
): Promise<{ success: boolean; sentAs: string; body: string }> {
  const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await apiClient.post(`/api/v1/chats/${convId}/send`, payload, { headers });
  return res.data;
}

/** Tandai semua pesan dalam percakapan sudah dibaca */
export async function markConversationAsRead(convId: number | string): Promise<void> {
  await apiClient.patch(`/api/v1/chats/${convId}/read`);
}

/** Inisiasi atau dapatkan percakapan berdasarkan ID Siswa */
export async function initiateConversation(idSiswa: string): Promise<{ conv_id: number | string }> {
  const res = await apiClient.post('/api/v1/chats/initiate', { id_siswa: idSiswa });
  return res.data.data;
}

/** Subscribe Web Push Notification */
export async function subscribeToWebPush(subscription: any): Promise<void> {
  await apiClient.post('/api/v1/web-push/subscribe', subscription);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE API
// ─────────────────────────────────────────────────────────────────────────────

/** List semua template dari wa_templates */
export async function fetchTemplates(params: {
  status?:   MetaStatus;
  pipeline?: string;
  search?:   string;
  page?:     number;
  limit?:    number;
} = {}): Promise<{ data: WaTemplate[]; total: number; page: number; limit: number }> {
  const res = await apiClient.get('/api/v1/templates', { params });
  return res.data;
}

/** Ambil satu template berdasarkan ID */
export async function getTemplateById(id: string): Promise<WaTemplate> {
  const res = await apiClient.get(`/api/v1/templates/${id}`);
  return res.data.data;
}

/** Buat template baru */
export async function createTemplate(data: {
  nama_template:      string;
  body_text:          string;
  template_name_api?: string;
  language_code?:     string;
  kategori?:          string;
  urutan?:            number;
  pipeline?:          string;
  parameters?:        string;
  header_type?:       string;
  header_url?:        string;
  header_filename?:   string;
  submitToMeta?:      boolean;
}): Promise<{ id_template: string; meta_status: MetaStatus }> {
  const res = await apiClient.post('/api/v1/templates', data);
  return res.data;
}

/** Update info dasar template */
export async function updateTemplate(
  id: string,
  data: Partial<Pick<WaTemplate,
    'nama_template' | 'body_text' | 'kategori' | 'urutan' | 'status_crm' |
    'header_type' | 'header_url' | 'header_filename' | 'parameters'
  >>
): Promise<void> {
  await apiClient.put(`/api/v1/templates/${id}`, data);
}

/** Update hanya JSON parameters schema */
export async function updateParameters(
  id: string,
  parameters: object | string
): Promise<void> {
  await apiClient.patch(`/api/v1/templates/${id}/parameters`, { parameters });
}

/** Soft delete template (set status_crm = 'DELETED') */
export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/templates/${id}`);
}

/** Sinkronisasi status template dari Meta */
export async function syncTemplatesFromMeta(): Promise<{ synced: number; total_from_meta: number }> {
  const res = await apiClient.post('/api/v1/templates/sync');
  return res.data;
}
