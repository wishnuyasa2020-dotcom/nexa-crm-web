'use client';

// ============================================================
// NexaMOS CRM — PWA Install Prompt
// Intercepts browser's `beforeinstallprompt` event and shows
// a custom in-app install banner/button.
//
// Placement:
//   - Mobile: floating bottom banner (above BottomNav)
//   - Desktop: compact button in Header actions area
// ============================================================

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// localStorage key — user yang dismiss tidak diganggu lagi selama 7 hari
const DISMISS_KEY = 'nexa_pwa_dismiss_until';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [installing, setInstalling]         = useState(false);
  const [installed, setInstalled]           = useState(false);

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
          'md:hidden fixed bottom-16 left-3 right-3 z-40',
          'animate-in slide-in-from-bottom-4 fade-in duration-300'
        )}
      >
        <div className="bg-card border border-primary/30 rounded-2xl shadow-xl shadow-primary/10 p-3.5 flex items-center gap-3">
          {/* App icon */}
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
            <Smartphone size={20} className="text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Install NexaMOS CRM</p>
            <p className="text-xs text-muted-foreground">Akses cepat seperti app native</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {installing ? 'Install...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop: Compact Header Button (rendered inside Header via portal-less sibling) ── */}
      {/* Note: Desktop version rendered as a subtle pill — see Header.tsx for placement */}
    </>
  );
}

// ── Separate compact button variant for Desktop Header ──────────────────────
export function InstallPromptDesktopButton() {
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
      title="Install NexaMOS CRM sebagai app"
      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer disabled:opacity-50"
    >
      <Download size={13} />
      <span>{installing ? 'Installing...' : 'Install App'}</span>
    </button>
  );
}
