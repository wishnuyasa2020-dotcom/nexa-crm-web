'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfileTab() {
  const { t } = useTranslation();
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
      setError(t('settings.calendarConnectFailed'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchStatus();
  }, [t]);

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
      setError(err.message || t('settings.calendarStatusFailed'));
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
      setError(err.message || t('settings.calendarDisconnectFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-xs">
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">{t('settings.calendarTitle')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('settings.calendarSubtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-background/50">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${connected ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
            <Calendar className={`w-6 h-6 ${connected ? 'text-emerald-500' : 'text-primary'}`} />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Google Calendar</h4>
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> {t('settings.calendarChecking')}</span>
              ) : connected ? (
                <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3 h-3" /> {t('settings.calendarConnected')}</span>
              ) : (
                t('settings.calendarNotConnected')
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
              {t('settings.calendarConnectBtn')}
            </a>
          )}
          {!loading && connected && (
            <button 
              onClick={handleDisconnect}
              className="inline-flex w-full sm:w-auto items-center justify-center h-9 px-4 text-sm font-medium rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              {t('settings.calendarDisconnectBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
