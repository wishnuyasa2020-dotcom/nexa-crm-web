'use client';

import { useState } from 'react';
import { Clock, Plus, Search, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
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
  total: 145,
  bangunMingguIni: 20,
};

const mockData = [
  { id: 1, nama: 'Budi Santoso', sekolah: 'SMAN 1 Jakarta', lvl: 1, sisaWaktu: '5 Hari lagi', tglBangun: '2023-11-01', tglSnooze: '2023-10-01' },
  { id: 2, nama: 'Andi Wijaya', sekolah: 'SMKN 2 Bandung', lvl: 2, sisaWaktu: '12 Hari lagi', tglBangun: '2023-11-08', tglSnooze: '2023-09-08' },
  { id: 3, nama: 'Siti Aminah', sekolah: 'SMA Budi Utomo', lvl: 1, sisaWaktu: 'Hari ini!', tglBangun: '2023-10-27', tglSnooze: '2023-09-27' },
  { id: 4, nama: 'Rina Nose', sekolah: 'SMAN 5 Surabaya', lvl: 3, sisaWaktu: '45 Hari lagi', tglBangun: '2023-12-10', tglSnooze: '2023-09-10' },
  { id: 5, nama: 'Joko Anwar', sekolah: 'SMK Telkom', lvl: 1, sisaWaktu: '20 Hari lagi', tglBangun: '2023-11-16', tglSnooze: '2023-10-16' },
];

export default function SnoozeCampaignPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  const handleStopSnooze = (siswa: any) => {
    setSelectedSiswa(siswa);
    setShowStopModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
          <Clock size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Snooze Campaign</h1>
          <p className="text-sm text-muted-foreground">Monitoring antrean prospek yang ditunda (90 Hari)</p>
        </div>
      </div>

      {/* METRIK TERKINI & TOMBOL AKSI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-xs text-muted-foreground font-medium mb-1">Total Sedang Tunda</p>
              <p className="text-2xl font-bold text-foreground">{mockMetrik.total}</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm bg-orange-500/5">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Bangun Minggu Ini</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{mockMetrik.bangunMingguIni}</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 flex items-end justify-end">
          <Button 
            className="w-full md:w-auto h-12 md:h-10 rounded-xl gradient-primary text-white shadow-lg shadow-primary/20"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} className="mr-2" /> Tambah Snooze Manual
          </Button>
        </div>
      </div>

      {/* DAFTAR SNOOZE */}
      <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b border-border/50 bg-secondary/20 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            📋 Daftar Snooze Aktif
          </CardTitle>
          <div className="relative w-32 md:w-48">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari nama..." 
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </CardHeader>
        
        {/* Horizontal Scroll Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 z-10 bg-secondary/90 backdrop-blur-sm shadow-[1px_0_0_0_theme(colors.border)]">Nama Siswa</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Lvl Snooze</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal Tunda</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sisa Waktu</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mockData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Belum ada antrean snooze.
                  </td>
                </tr>
              ) : (
                mockData.map((siswa) => (
                  <tr key={siswa.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground sticky left-0 z-10 bg-background/95 backdrop-blur-sm shadow-[1px_0_0_0_theme(colors.border)]">
                      <div>
                        <p>{siswa.nama}</p>
                        <p className="text-[10px] text-muted-foreground font-normal">{siswa.sekolah}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`font-mono text-xs ${siswa.lvl === 3 ? 'border-rose-500 text-rose-500' : siswa.lvl === 2 ? 'border-orange-500 text-orange-500' : 'border-blue-500 text-blue-500'}`}>
                        Lvl {siswa.lvl}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{siswa.tglSnooze}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${siswa.sisaWaktu === 'Hari ini!' ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {siswa.sisaWaktu}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg text-xs" 
                        onClick={() => handleStopSnooze(siswa)}
                      >
                        <Ban size={14} className="mr-1 text-muted-foreground" /> Hentikan
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL TAMBAH SNOOZE MANUAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={20} className="text-primary" /> Tambah Snooze Manual
            </DialogTitle>
            <DialogDescription className="pt-2">
              Masukkan ID Siswa atau cari nama siswa untuk dipindahkan paksa ke antrean Snooze.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Pencarian Siswa</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Ketik nama atau ID siswa..." 
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Alasan Snooze</label>
              <textarea 
                className="w-full p-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary resize-none h-24"
                placeholder="Contoh: Orang tua minta dihubungi bulan depan karena sedang di luar kota."
              ></textarea>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-end sm:justify-end">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 sm:flex-none h-11">Batal</Button>
            <Button className="flex-1 sm:flex-none h-11 gradient-primary text-white" onClick={() => setShowAddModal(false)}>Simpan Snooze</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL HENTIKAN SNOOZE */}
      <Dialog open={showStopModal} onOpenChange={setShowStopModal}>
        <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Ban size={20} /> Hentikan Snooze
            </DialogTitle>
            <DialogDescription className="pt-2">
              Anda akan menghentikan masa tunda (Snooze) untuk <strong>{selectedSiswa?.nama}</strong> lebih awal dari jadwal.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
            <p className="text-xs text-rose-600 font-medium">
              Tindakan ini akan mengembalikan siswa ke daftar "Backlog" Task List agar bisa segera dikerjakan oleh CRO.
            </p>
          </div>
          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button variant="outline" onClick={() => setShowStopModal(false)} className="flex-1 sm:flex-none h-11">Batal</Button>
            <Button variant="destructive" onClick={() => setShowStopModal(false)} className="flex-1 sm:flex-none h-11">Ya, Bangunkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
