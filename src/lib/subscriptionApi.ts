import apiClient from '@/lib/apiClient';

export interface PlanPricing {
  price: number;
  periodDays: number;
  label: string;
  originalPrice?: number;
  discount?: string | null;
}

export interface TierPlan {
  tier: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  description: string;
  badge?: string;
  pricing: {
    MONTHLY: PlanPricing;
    YEARLY: PlanPricing;
  };
  limits: {
    MONTHLY: { limit_siswa: number; limit_sekolah: number };
    YEARLY: { limit_siswa: number; limit_sekolah: number };
  };
  roles: {
    max_admin: number;
    max_manager: number;
    max_chief_cro: number;
    max_cro: number;
  };
  features: string[];
}

export interface InvoiceItem {
  invoice_id: string;
  amount: string | number;
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  plan_tier?: string;
  billing_cycle?: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  payment_date?: string | null;
  payment_type?: string | null;
  invoice_url?: string | null;
  created_at: string;
}

export interface BillingOverviewData {
  subscription: {
    tenantId: string;
    brandName: string;
    tier: string;
    status: string;
    billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    nextQuotaReset: string | null;
    daysRemaining: number;
    limits: {
      siswa: { limit: number; used: number };
      sekolah: { limit: number; used: number };
      users: { limit: number; used: number };
    };
  };
  invoices: InvoiceItem[];
  plans: TierPlan[];
}

export interface CreateSnapTransactionResponse {
  invoiceId: string;
  token: string;
  redirectUrl: string;
  amount: number;
  tier: string;
  billingCycle: string;
  periodDays: number;
  planName: string;
}

export const subscriptionApi = {
  getPlans: async (): Promise<TierPlan[]> => {
    const res = await apiClient.get('/api/v1/subscription/plans');
    return res.data.data;
  },

  getBillingOverview: async (): Promise<BillingOverviewData> => {
    const res = await apiClient.get('/api/v1/subscription/overview');
    return res.data.data;
  },

  createTransaction: async (targetTier: string, billingCycle: 'MONTHLY' | 'YEARLY'): Promise<CreateSnapTransactionResponse> => {
    const res = await apiClient.post('/api/v1/subscription/create-transaction', {
      targetTier,
      billingCycle,
    });
    return res.data.data;
  },

  checkStatus: async (invoiceId: string): Promise<{ invoiceId: string; transactionStatus: string; isPaid: boolean; overview?: BillingOverviewData }> => {
    const res = await apiClient.get(`/api/v1/subscription/check-status/${invoiceId}`);
    return res.data.data;
  },
};
