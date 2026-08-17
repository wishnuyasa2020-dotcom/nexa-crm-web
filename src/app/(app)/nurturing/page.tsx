'use client';

import { useState } from 'react';
import { TrendingUp, MessageSquare, StopCircle, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// MOCK DATA
const mockMetrik = {
  total: 1240,
  baru: 45,
  dalamPutaran: 890,
  perluFollowUp: 12,
};

const mockData = [
  { id: 1, nama: 'Budi Santoso', sekolah: 'SMAN 1 Jakarta', status: 'H+1 Edukasi', tglMasuk: '2023-10-01', actionNeeded: false },
  { id: 2, nama: 'Andi Wijaya', sekolah: 'SMKN 2 Bandung', status: 'H+3 Tanya Jawab', tglMasuk: '2023-09-28', actionNeeded: true },
  { id: 3, nama: 'Siti Aminah', sekolah: 'SMA Budi Utomo', status: 'H+7 Penawaran', tglMasuk: '2023-09-24', actionNeeded: false },
  { id: 4, nama: 'Rina Nose', sekolah: 'SMAN 5 Surabaya', status: 'H+14 Follow Up', tglMasuk: '2023-09-17', actionNeeded: true },
  { id: 5, nama: 'Joko Anwar', sekolah: 'SMK Telkom', status: 'H+1 Edukasi', tglMasuk: '2023-10-01', actionNeeded: false },
];

export default function NurturingPage() {
  const [filterActive, setFilterActive] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);

  const displayedData = filterActive ? mockData.filter(d => d.actionNeeded) : mockData;

  const handleTakeover = (siswa: any) => {
    setSelectedSiswa(siswa);
    setShowTakeoverModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nurturing Campaign</h1>
          <p className="text-sm text-muted-foreground">Otomatisasi probing & edukasi (WhatsApp)</p>
        </div>
      </div>

      {/* METRIK TERKINI (Top Level) - Stacking on Mobile, Grid on Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Calon Prospek</p>
            <p className="text-2xl font-bold text-foreground">{mockMetrik.total}</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1">Antrean Baru</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockMetrik.baru}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1">Sedang Nurturing</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mockMetrik.dalamPutaran}</p>
          </CardContent>
        </Card>

        {/* Actionable Stat Card */}
        <Card 
          className={`border-border/50 shadow-sm cursor-pointer transition-all ${filterActive ? 'ring-2 ring-rose-500 bg-rose-500/5' : 'hover:bg-secondary/50'}`}
          onClick={() => setFilterActive(!filterActive)}
        >
          <CardContent className="p-4 flex flex-col justify-center h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <AlertCircle size={48} className="text-rose-500" />
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1 flex items-center gap-1 z-10">
              <AlertCircle size={12} /> Perlu Follow Up
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 z-10">{mockMetrik.perluFollowUp}</p>
          </CardContent>
        </Card>
      </div>

      {/* DAFTAR AUDIENS (Middle Level) */}
      <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b border-border/50 bg-secondary/20 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            📋 Daftar Audiens {filterActive && <Badge variant="destructive" className="ml-2 text-[10px]">Filter: Follow Up</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFilterActive(!filterActive)}>
            <Filter size={14} className="mr-1" /> {filterActive ? 'Clear' : 'Filter'}
          </Button>
        </CardHeader>
        
        {/* Horizontal Scroll Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 z-10 bg-secondary/90 backdrop-blur-sm shadow-[1px_0_0_0_theme(colors.border)]">Nama Siswa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asal Sekolah</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Posisi Nurturing</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Tidak ada audiens yang sesuai filter.
                  </td>
                </tr>
              ) : (
                displayedData.map((siswa) => (
                  <tr key={siswa.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground sticky left-0 z-10 bg-background/95 backdrop-blur-sm shadow-[1px_0_0_0_theme(colors.border)]">
                      <div className="flex items-center gap-2">
                        {siswa.actionNeeded && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                        {siswa.nama}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{siswa.sekolah}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium text-[10px] whitespace-nowrap">
                        {siswa.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-lg" title="Lihat Chat">
                          <MessageSquare size={16} className="text-primary" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg border-rose-500/20 text-rose-500 hover:bg-rose-500/10" 
                          title="Takeover / Stop Bot"
                          onClick={() => handleTakeover(siswa)}
                        >
                          <StopCircle size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* TAKEOVER MODAL (Action Oriented UX) */}
      <Dialog open={showTakeoverModal} onOpenChange={setShowTakeoverModal}>
        <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <StopCircle size={20} /> Konfirmasi Takeover
            </DialogTitle>
            <DialogDescription className="pt-2">
              Anda akan menghentikan *bot nurturing* untuk <strong>{selectedSiswa?.nama}</strong>. Apakah Anda yakin ingin mengambil alih percakapan ini secara manual?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
            <p className="text-xs text-rose-600 font-medium flex items-center gap-2">
              <AlertCircle size={14} /> Siswa ini tidak akan menerima pesan edukasi otomatis lagi.
            </p>
          </div>
          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button variant="outline" onClick={() => setShowTakeoverModal(false)} className="flex-1 sm:flex-none h-11">Batal</Button>
            <Button variant="destructive" onClick={() => setShowTakeoverModal(false)} className="flex-1 sm:flex-none h-11">Takeover Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
