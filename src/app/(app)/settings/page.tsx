'use client';

import { useState } from 'react';
import Link from 'next/link';
import KelasMapping from '@/components/settings/KelasMapping';
import KotaMapping from '@/components/settings/KotaMapping';
import KecamatanMapping from '@/components/settings/KecamatanMapping';
import ProfileTab from '@/components/settings/ProfileTab';
import { Settings as SettingsIcon, BookOpen, MapPin, Building2, Calendar, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'kelas' | 'kota' | 'kecamatan' | 'calendar'>('kelas');
  const { user } = useAuthStore();

  const isAuthorized = !user || user.role === 'Admin' || user.role === 'Manager';

  if (user && !isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Akses Dibatasi</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Halaman Pengaturan Master Data hanya dapat diakses oleh <span className="font-semibold text-foreground">Administrator</span> dan <span className="font-semibold text-foreground">Manager</span>.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'kelas', label: 'Master Kelas', icon: BookOpen },
    { id: 'kota', label: 'Master Kota', icon: Building2 },
    { id: 'kecamatan', label: 'Master Kecamatan', icon: MapPin },
    { id: 'calendar', label: 'Integrasi Kalender', icon: Calendar },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <header className="shrink-0 h-16 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Settings & Master Data</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Pusat standardisasi data referensi formulir pendaftaran dan operasional
            </p>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Tab Navigation */}
          <div className="flex border-b overflow-x-auto whitespace-nowrap gap-1 pb-px scrollbar-thin">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-all shrink-0',
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  )}
                >
                  <Icon size={16} className={cn(isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="mt-6">
            {activeTab === 'kelas' && <KelasMapping />}
            {activeTab === 'kota' && <KotaMapping />}
            {activeTab === 'kecamatan' && <KecamatanMapping />}
            {activeTab === 'calendar' && <ProfileTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
