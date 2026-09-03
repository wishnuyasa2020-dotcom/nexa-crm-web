'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if gcal param is in URL (from callback redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gcal') === 'success') {
      // Clear the url param
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('gcal') === 'error') {
      setError('Gagal menghubungkan ke Google Calendar.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/calendar/status');
      setConnected(res.data.data.connected);
      if (!res.data.data.connected) {
        const authRes = await apiClient.get('/calendar/auth-url');
        setAuthUrl(authRes.data.data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil status kalender');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await apiClient.post('/calendar/disconnect');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Gagal memutuskan koneksi');
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Integrasi Kalender</h3>
        <p className="text-sm text-muted-foreground">Hubungkan akun Nexa CRM dengan Google Calendar untuk otomatisasi penjadwalan.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${connected ? 'bg-green-500/10' : 'bg-primary/10'}`}>
            <Calendar className={`w-6 h-6 ${connected ? 'text-green-500' : 'text-primary'}`} />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Google Calendar</h4>
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Memeriksa status...</span>
              ) : connected ? (
                <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3" /> Terhubung</span>
              ) : (
                'Belum terhubung'
              )}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex sm:justify-end">
          {!loading && !connected && authUrl && (
            <a 
              href={authUrl}
              className="inline-flex w-full sm:w-auto items-center justify-center h-9 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Hubungkan
            </a>
          )}
          {!loading && connected && (
            <button 
              onClick={handleDisconnect}
              className="inline-flex w-full sm:w-auto items-center justify-center h-9 px-4 text-sm font-medium rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              Putuskan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
