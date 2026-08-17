'use client';

import { useState, useEffect } from 'react';
import { Radio, RefreshCw, Send, CheckCircle2, Search, ArrowLeft, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/sekolah/StatusBadge';

// --- MOCK DATA ---
const mockHistory = [
  { id: '1', templateName: 'promo_kemerdekaan', targetCount: 150, sentCount: 150, status: 'completed', createdAt: '2026-08-14' },
  { id: '2', templateName: 'info_pendaftaran', targetCount: 50, sentCount: 0, status: 'pending', createdAt: '2026-08-15' },
];

const mockAudience = [
  { id: 's1', nama: 'Budi Santoso', sekolah: 'SMA N 1 Kota', phone: '628123456789', swOpen: true },
  { id: 's2', nama: 'Siti Aminah', sekolah: 'SMA N 1 Kota', phone: '628987654321', swOpen: false },
  { id: 's3', nama: 'Andi Wijaya', sekolah: 'SMK Budi Utama', phone: '628111222333', swOpen: false },
  { id: 's4', nama: 'Rina Nose', sekolah: 'SMA Taruna', phone: '628444555666', swOpen: true },
];

const mockTemplatesMeta = ['promo_kemerdekaan', 'reminder_pendaftaran', 'undangan_event'];
const mockTemplatesCRM = ['Follow Up Santai', 'Info Biaya Diskon', 'Sapaan Pagi'];

export default function BroadcastPage() {
  const [view, setView] = useState<'history' | 'new'>('history');

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
            <Radio size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Broadcast Pesan</h1>
            <p className="text-xs text-muted-foreground">Kirim pesan massal (Dual-Template)</p>
          </div>
        </div>
        {view === 'history' ? (
          <button onClick={() => setView('new')} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all">
            <Send size={16} /> Broadcast Baru
          </button>
        ) : (
          <button onClick={() => setView('history')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-all">
            <ArrowLeft size={16} /> Kembali
          </button>
        )}
      </div>

      {view === 'history' ? <HistoryView /> : <NewBroadcastWizard onBack={() => setView('history')} />}
    </div>
  );
}

// ==========================================
// HISTORY VIEW
// ==========================================
function HistoryView() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-secondary/30">
        <h2 className="text-sm font-semibold text-foreground">Riwayat Broadcast</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/10">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Template Name</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Progress</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((b) => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground text-xs">{b.templateName}</td>
                <td className="px-5 py-3">
                  <span className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-bold uppercase',
                    b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  )}>
                    {b.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="text-xs font-semibold text-primary">{b.sentCount} / {b.targetCount}</span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{b.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// NEW BROADCAST WIZARD
// ==========================================
function NewBroadcastWizard({ onBack }: { onBack: () => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(mockAudience.map(a => a.id)));
  const [metaTemplate, setMetaTemplate] = useState('');
  const [crmTemplate, setCrmTemplate] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onBack();
    }, 1500);
  };

  const swOpenCount = mockAudience.filter(a => selectedIds.has(a.id) && a.swOpen).length;
  const swClosedCount = selectedIds.size - swOpenCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      
      {/* KIRI: Form Wizard */}
      <div className="lg:col-span-2 space-y-6 pb-24 lg:pb-0">
        
        {/* Step 1: Target Audiens */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">1. Pilih Audiens (Targeting)</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">{selectedIds.size} Terpilih</span>
          </div>
          <div className="p-4 bg-secondary/10 flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <input type="text" placeholder="Cari nama sekolah..." className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none" />
             </div>
             <div className="flex-1">
               <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none text-muted-foreground">
                 <option value="">-- Semua Status Pipeline --</option>
                 <option value="Data Masuk">Data Masuk</option>
                 <option value="Calon Prospek">Calon Prospek</option>
                 <option value="Prospek Aktif">Prospek Aktif</option>
                 <option value="Konsultasi">Konsultasi</option>
                 <option value="Layak Home Visit">Layak Home Visit</option>
                 <option value="Siap Daftar">Siap Daftar</option>
               </select>
             </div>
             <button className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
               Terapkan
             </button>
          </div>
          
          {/* Mobile-First: Table on Desktop, Cards on Mobile */}
          <div className="max-h-60 overflow-y-auto hide-scrollbar">
            {/* Desktop Table */}
            <table className="w-full text-sm hidden md:table">
              <thead className="sticky top-0 bg-secondary/50 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-2 w-10">
                    <input type="checkbox" checked={selectedIds.size === mockAudience.length} onChange={(e) => setSelectedIds(e.target.checked ? new Set(mockAudience.map(a=>a.id)) : new Set())} className="rounded border-border text-primary focus:ring-primary" />
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Siswa</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Sekolah</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Service Window</th>
                </tr>
              </thead>
              <tbody>
                {mockAudience.map(a => (
                  <tr key={a.id} className="border-t border-border hover:bg-secondary/20 cursor-pointer" onClick={() => toggleSelect(a.id)}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(a.id)} readOnly className="rounded border-border text-primary focus:ring-primary" /></td>
                    <td className="px-4 py-3 font-medium">{a.nama}<br/><span className="text-[10px] text-muted-foreground">{a.phone}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.sekolah}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold", a.swOpen ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                        {a.swOpen ? 'Terbuka' : 'Tertutup'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden p-3 space-y-2">
              {mockAudience.map(a => (
                <div key={a.id} onClick={() => toggleSelect(a.id)} className={cn("flex items-start gap-3 p-3 rounded-xl border transition-all", selectedIds.has(a.id) ? "border-primary bg-primary/5" : "border-border bg-background")}>
                  <input type="checkbox" checked={selectedIds.has(a.id)} readOnly className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{a.nama}</h4>
                    <p className="text-xs text-muted-foreground">{a.sekolah} • {a.phone}</p>
                    <span className={cn("inline-block mt-2 text-[10px] px-2 py-1 rounded-md font-bold", a.swOpen ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                      SW {a.swOpen ? 'Terbuka' : 'Tertutup'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Template Selection */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h2 className="font-semibold text-foreground">2. Pilih Template Pesan (Dual-Template)</h2>
            <p className="text-xs text-muted-foreground mt-1">Variabel otomatis diisi berdasarkan nama target.</p>
          </div>
          <div className="p-5 space-y-5">
            {/* Meta Template */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center justify-between">
                <span>Meta Template <span className="text-rose-500 text-xs">(Untuk SW Tertutup)</span></span>
              </label>
              <select value={metaTemplate} onChange={(e) => setMetaTemplate(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none">
                <option value="">-- Pilih Template Meta --</option>
                {mockTemplatesMeta.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            {/* CRM Template */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center justify-between">
                <span>CRM Template <span className="text-emerald-500 text-xs">(Untuk SW Terbuka / Gratis)</span></span>
              </label>
              <select value={crmTemplate} onChange={(e) => setCrmTemplate(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none">
                <option value="">-- Pilih Template Internal --</option>
                {mockTemplatesCRM.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* KANAN: Sticky Summary & Preview */}
      <div className="lg:col-span-1 space-y-4 fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-xl border-t border-border lg:relative lg:p-0 lg:bg-transparent lg:border-t-0 z-50">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xl lg:shadow-sm">
          <h3 className="font-bold mb-3 hidden lg:block">Ringkasan Eksekusi</h3>
          
          <div className="flex items-center justify-between lg:mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Audiens</span>
                <span className="font-bold">{selectedIds.size}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-emerald-500">SW Terbuka (Gratis)</span>
                <span className="font-bold">{swOpenCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-500">SW Tertutup (Berbayar)</span>
                <span className="font-bold">{swClosedCount}</span>
              </div>
            </div>
            
            {/* Mobile Send Button */}
            <button onClick={handleSend} disabled={isSending || selectedIds.size === 0} className="lg:hidden ml-4 px-6 py-3 rounded-xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Kirim</>}
            </button>
          </div>

          <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground flex items-start gap-2 hidden lg:flex">
            <Info size={14} className="mt-0.5 text-primary flex-shrink-0" />
            <p>Pengiriman akan dimasukkan ke dalam <strong>Queue (Antrean)</strong> di latar belakang agar aman dari limitasi Meta API.</p>
          </div>

          {/* Desktop Send Button */}
          <button onClick={handleSend} disabled={isSending || selectedIds.size === 0} className="w-full mt-4 py-3 rounded-xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all hidden lg:flex items-center justify-center gap-2">
            {isSending ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : <><Send size={18} /> Kirim Broadcast Instan</>}
          </button>
        </div>
      </div>
    </div>
  );
}
