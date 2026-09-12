// siswa.types.ts — Type definitions untuk Modul Siswa (Event-Sourcing Fase 1)

export type CommercialState =
  | 'Audience'
  | 'Known'
  | 'Lead'
  | 'Prospect'
  | 'Opportunity'
  | 'Registered Opportunity'
  | 'Customer'
  | 'Disqualified';

export type SiswaIntent = 'High' | 'Mid' | 'Low';

export type InteractionOutcome =
  | 'Connected'
  | 'No Response'
  | 'Information Delivered'
  | 'Interest Observed'
  | 'Commitment Proposed'
  | 'Commitment Confirmed'
  | 'Objection Identified'
  | 'Next Action Agreed';

export type InteractionChannel = 'WhatsApp' | 'Telepon' | 'Visit Langsung' | 'Form';

export type FNARResult = 'pass' | 'fail' | 'pending';

export type EventType =
  | 'InteractionLogged'
  | 'QualificationAssessmentSubmitted'
  | 'StateTransitionedToProspect'
  | 'LeadDisqualified'
  | 'ManualStateOverridden';

// ── List & Detail Types ───────────────────────────────────────────────────────

export interface Siswa {
  idRecord:       string;
  id:             string;
  nama:           string;
  kelas:          string;
  cro:            string;
  // Legacy (backward compat)
  status:         string;
  nextAction:     string;
  prioritas:      string;
  dueDate:        string;
  namaSekolah:    string;
  wa?:            string;
  bsuid?:         string;
  // Event-Sourcing Fase 1
  commercialState: CommercialState;
  intent:         SiswaIntent | '';
  priorityScore:  number;
}

export interface AktivitasSiswa {
  id:                    number;
  jenis_aktivitas:       string;
  tanggal:               string;
  hasil_aktivitas:       string;
  status_sebelum:        string;
  status_sesudah:        string;
  next_action:           string;
  due_date:              string | null;
  catatan:               string | null;
  alasan_tidak_lanjut:   string | null;
  pj_cro:                string;
  event_type:            EventType;
  channel:               InteractionChannel;
  created_at:            string;
}

export interface SiswaDetail {
  id_siswa:            string;
  nama_lengkap:        string;
  wa:                  string | null;
  bsuid:               string | null;
  kelas:               string;
  minat_awal:          string;
  rencana_lulus:       string;
  prioritas:           string;
  status_terkini:      string;
  commercial_state:    CommercialState;
  intent:              SiswaIntent | null;
  next_action:         string;
  due_date:            string | null;
  pj_cro:              string;
  orangtua_tahu:       string | null;
  alasan_tidak_lanjut: string | null;
  nama_sekolah:        string;
  logs:                AktivitasSiswa[];
}

// ── API Payload Types ─────────────────────────────────────────────────────────

export interface LogInteraksiPayload {
  outcome:     InteractionOutcome;
  channel:     InteractionChannel;
  catatan?:    string;
  next_action?: string;
  due_date?:   string;
}

export interface AssessmentFNARPayload {
  fit:                FNARResult;
  need:               FNARResult;
  ability:            FNARResult;
  readiness:          FNARResult;
  catatan_fit?:       string;
  catatan_need?:      string;
  catatan_ability?:   string;
  catatan_readiness?: string;
}

// ── List Query Params ─────────────────────────────────────────────────────────

export interface SiswaListParams {
  page?:           number;
  search?:         string;
  status?:         string;
  commercialState?: CommercialState;
  intent?:         SiswaIntent;
  kelas?:          string;
  cro?:            string;
}

// ── Class Assignment Types (Chief CRO 1 Kelas 1 CRO) ──────────────────────────

export interface SekolahSosialisasiOption {
  id_sekolah:    string;
  nama_sekolah:  string;
  status_terkini: string;
  pj_sekolah:    string;
  total_siswa:   number;
}

export interface KelasOption {
  nama_kelas:    string;
  kelas_id:      number | null;
  student_count: number;
  current_cro:   string | null;
}

export interface AssignKelasPayload {
  id_sekolah:  string;
  nama_kelas:  string;
  kelas_id?:   number | null;
  target_cro:  string;
  alasan?:     string;
}

