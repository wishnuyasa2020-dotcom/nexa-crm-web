import apiClient from '@/lib/apiClient';

export interface CreditBalanceData {
  tenant_id: string;
  balance: number;
  threshold: number;
  is_blocked: boolean;
  usable_balance: number;
  status_label: 'OK' | 'WARNING' | 'BLOCKED';
  last_topup_at: string | null;
  min_topup: number;
  is_first_topup: boolean;
}

export interface CreditPricesData {
  marketing: number;
  utility: number;
  authentication: number;
  service: number;
  threshold: number;
  min_topup_first: number;
  min_topup_next: number;
}

export interface TopupRequestItem {
  id: string;
  tenant_id: string;
  amount: number;
  transfer_ref: string | null;
  transfer_proof: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by?: string | null;
}

export interface CreditTransactionItem {
  id: string;
  tenant_id: string;
  type: 'topup' | 'deduction' | 'refund' | 'adjustment';
  message_type?: 'marketing' | 'utility' | 'authentication' | 'service' | null;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference?: string | null;
  wa_message_id?: string | null;
  recipient_phone?: string | null;
  note?: string | null;
  created_at: string;
}

export interface SubmitTopupPayload {
  amount: number;
  transfer_ref: string;
  transfer_proof?: string;
  notes?: string;
}

export const creditBillingApi = {
  // Ambil saldo dan status kredit WA tenant saat ini
  getBalance: async (): Promise<CreditBalanceData> => {
    const res = await apiClient.get('/billing/balance');
    return res.data?.data;
  },

  // Ambil daftar tarif pesan per kategori
  getPrices: async (): Promise<CreditPricesData> => {
    const res = await apiClient.get('/billing/prices');
    return res.data?.data;
  },

  // Kirim formulir pengajuan top-up kredit manual
  submitTopupRequest: async (payload: SubmitTopupPayload): Promise<{ request_id: string; message: string }> => {
    const res = await apiClient.post('/billing/topup/request', payload);
    return res.data?.data;
  },

  // Ambil riwayat pengajuan top-up tenant
  getTopupRequests: async (): Promise<TopupRequestItem[]> => {
    const res = await apiClient.get('/billing/topup/requests');
    return res.data?.data || [];
  },

  // Ambil riwayat transaksi dan pemotongan pesan
  getTransactions: async (page = 1, limit = 20): Promise<{ data: CreditTransactionItem[]; total: number }> => {
    const res = await apiClient.get(`/billing/transactions?page=${page}&limit=${limit}`);
    return {
      data: res.data?.data || [],
      total: res.data?.pagination?.total || 0,
    };
  },
};
