'use client';

import { useState } from 'react';
import KelasMapping from '@/components/settings/KelasMapping';
import KotaMapping from '@/components/settings/KotaMapping';
import KecamatanMapping from '@/components/settings/KecamatanMapping';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'kelas' | 'kota' | 'kecamatan'>('kelas');

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <header className="flex-shrink-0 h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Konfigurasi Sistem & Mapping
            </p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button
              onClick={() => setActiveTab('kelas')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'kelas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              Master Kelas
            </button>
            <button
              onClick={() => setActiveTab('kota')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'kota'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              Master Kota
            </button>
            <button
              onClick={() => setActiveTab('kecamatan')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'kecamatan'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              Master Kecamatan
            </button>
          </div>

          <div className="mt-6">
            {activeTab === 'kelas' && <KelasMapping />}
            {activeTab === 'kota' && <KotaMapping />}
            {activeTab === 'kecamatan' && <KecamatanMapping />}
          </div>
        </div>
      </main>
    </div>
  );
}
