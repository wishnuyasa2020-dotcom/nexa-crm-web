'use client';

import { useState } from 'react';
import { useIsDemo } from '@/hooks/useIsDemo';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, X, ExternalLink, GraduationCap, Building2 } from 'lucide-react';

export function DemoBanner() {
  const isDemo = useIsDemo();
  const [dismissed, setDismissed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const isGeneral = user?.tenant_type === 'general';

  if (!isDemo || dismissed) {
    return null;
  }

  function handleSwitchSector(type: 'lpk' | 'general') {
    updateUser({ tenant_type: type });
  }

  return (
    <aside aria-label="Demo Mode Notice" className="w-full bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs text-foreground shrink-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-500 shrink-0">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>NexaMOS Demo</span>
          </span>

          {/* Quick Realtime Sector Switcher */}
          <div className="inline-flex items-center gap-0.5 bg-background/80 border rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchSector('lpk')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                !isGeneral
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Aktifkan simulasi kosakata LPK & Vokasi (Siswa, Sekolah, Alumni)"
            >
              <GraduationCap className="w-3 h-3 shrink-0" />
              <span>LPK</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchSector('general')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                isGeneral
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Aktifkan simulasi kosakata Bisnis Umum (Kontak, Klien, Pelanggan)"
            >
              <Building2 className="w-3 h-3 shrink-0" />
              <span>Bisnis Umum</span>
            </button>
          </div>

          <p className="truncate text-xs text-muted-foreground hidden lg:inline">
            Simulasi CRM interaktif. Data di-reset otomatis setiap Minggu 21:00 WIB.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://nexamos.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 transition-colors"
          >
            <span>Daftar NexaMOS</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Tutup banner demo"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}
