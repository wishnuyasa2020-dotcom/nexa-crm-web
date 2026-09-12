import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

export interface WhatsAppConfigData {
  tenantId: string;
  brandName: string;
  whatsappPhoneId: string | null;
  whatsappWabaId: string | null;
  whatsappNumber: string | null;
  whatsappDisplayName: string | null;
  whatsappStatus: 'NOT_CONFIGURED' | 'PENDING_PROVISIONING' | 'CONNECTED' | 'REJECTED' | string;
  whatsappBusinessCategory: string | null;
  whatsappRequestedAt: string | null;
  whatsappConnectedAt: string | null;
  whatsappNotes: string | null;
}

export function useWhatsAppStatus() {
  const [data, setData] = useState<WhatsAppConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/settings/whatsapp');
      if (res.data?.status === 'ok') {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('[useWhatsAppStatus] Gagal mengambil status WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isConnected = data?.whatsappStatus === 'CONNECTED' || data?.tenantId === 'derma-indonesia';

  return {
    data,
    loading,
    isConnected,
    refetch: fetchStatus,
  };
}
