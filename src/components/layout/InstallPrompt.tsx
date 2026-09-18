'use client';

// ============================================================
// NexaMOS CRM — PWA Install Prompt
// Intercepts browser's `beforeinstallprompt` event and shows
// a custom in-app install banner/button.
//
// Placement:
//   - Mobile: floating bottom banner (above BottomNav, 3-row layout)
//   - Desktop: compact button in Header actions area
// ============================================================

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// localStorage key — user yang dismiss tidak diganggu lagi selama 7 hari
const DISMISS_KEY = 'nexa_pwa_dismiss_until';

export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [installing, setInstalling]         = useState(false);
  const [installed, setInstalled]           = useState(false);
  const [iconError, setIconError]           = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan sebagai PWA standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Cek apakah user pernah dismiss (cooldown 7 hari)
    const dismissUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissUntil && Date.now() < Number(dismissUntil)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Tunda 3 detik setelah halaman load agar tidak terlalu agresif
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Deteksi jika sudah diinstall melalui cara lain
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Jangan tampilkan lagi selama 7 hari
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  // Jangan render apa-apa jika tidak ada prompt / sudah installed
  if (!showBanner || installed) return null;

  return (
    <>
      {/* ── Mobile: Floating Bottom Banner (di atas BottomNav h-16) ── */}
      <div
        className={cn(
          'md:hidden fixed bottom-20 left-3 right-3 z-40',
          'animate-in slide-in-from-bottom-4 fade-in duration-300'
        )}
      >
        <div className="bg-slate-800/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-md p-4 flex flex-col gap-2.5 ring-1 ring-white/10">
          {/* ── Row 1: Ikon, Tombol Install & Close Button ── */}
          <div className="flex items-center justify-between">
            {/* Ikon Aplikasi */}
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30 overflow-hidden">
              {iconError ? (
                <Smartphone size={20} className="text-white" />
              ) : (
                <img
                  src="/icon-192.png"
                  alt="NexaMOS CRM"
                  className="w-full h-full object-cover"
                  onError={() => setIconError(true)}
                />
              )}
            </div>

            {/* Aksi: Install & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="px-3.5 py-1.5 rounded-lg gradient-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/25 disabled:opacity-50"
              >
                {installing ? t('pwa.installing') : t('pwa.install')}
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 active:scale-95 transition-colors"
                title={t('pwa.close')}
                aria-label={t('pwa.close')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Row 2: Instruksi Utama ── */}
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {t('pwa.instruction')}
            </h4>
          </div>

          {/* ── Row 3: Sub Deskripsi ── */}
          <div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('pwa.description')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Separate compact button variant for Desktop Header ──────────────────────
export function InstallPromptDesktopButton() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling]         = useState(false);
  const [installed, setInstalled]           = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setDeferredPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setInstalling(false);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || installed) return null;

  return (
    <button
      onClick={handleInstall}
      disabled={installing}
      title={t('pwa.desktopTitle')}
      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50"
    >
      <Download size={13} />
      <span>{installing ? t('pwa.desktopInstalling') : t('pwa.desktopInstall')}</span>
    </button>
  );
}
