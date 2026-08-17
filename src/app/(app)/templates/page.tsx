'use client';

import { useState } from 'react';
import { FileText, Plus, Search, MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
const mockTemplates = [
  { id: '1', name: 'promo_kemerdekaan', type: 'Meta', category: 'Marketing', status: 'Approved', content: 'Halo {{1}}, rayakan kemerdekaan dengan diskon 17%!' },
  { id: '2', name: 'Follow Up Santai', type: 'CRM', category: 'Service', status: 'Active', content: 'Siang [Nama Siswa], mau ngingetin aja nih...' },
  { id: '3', name: 'undangan_event', type: 'Meta', category: 'Utility', status: 'Pending', content: 'Hai {{1}}, event akan dimulai besok di {{2}}.' },
];

export default function TemplatesPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-20">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Template Manager</h1>
            <p className="text-xs text-muted-foreground">Kelola sinkronisasi Meta & CRM template</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all">
          <Plus size={16} /> <span className="hidden sm:inline">Buat Template</span>
        </button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-card border border-border p-4 rounded-xl flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Cari nama template..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none" 
          />
        </div>
        <select className="px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none hidden sm:block">
          <option>Semua Tipe</option>
          <option>Meta Template</option>
          <option>CRM Template</option>
        </select>
      </div>

      {/* ── Grid/List ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map(t => (
          <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {t.type === 'Meta' ? (
                  <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md"><Phone size={14} /></div>
                ) : (
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md"><MessageSquare size={14} /></div>
                )}
                <h3 className="font-bold text-sm text-foreground">{t.name}</h3>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-1 rounded-md font-bold uppercase",
                t.status === 'Approved' || t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              )}>
                {t.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground rounded-full font-medium">
                Type: {t.type}
              </span>
              <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground rounded-full font-medium">
                Cat: {t.category}
              </span>
            </div>

            <div className="flex-1 bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground line-clamp-3">
              {t.content}
            </div>
            
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-primary font-medium hover:underline">Edit</button>
              <button className="text-rose-500 font-medium hover:underline">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
