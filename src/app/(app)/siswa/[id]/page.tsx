'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MessageCircle, Plus, Edit2, Trash2, 
  Calendar, User, Phone, MapPin, School, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputAktivitasModal } from '@/components/InputAktivitasModal';
import { EditAktivitasModal } from '@/components/EditAktivitasModal';
import { DeleteSiswaModal } from '@/components/DeleteSiswaModal';

// Data Mock
const mockSiswaDetail = {
  id: 'S-001',
  nama: 'Ahmad Faisal',
  sekolah: 'SMA N 1 Kota',
  kelas: 'XII-IPA-1',
  prioritas: 'Tinggi',
  status: 'Prospek Aktif',
  nextAction: 'Konsultasi',
  dueDate: '2026-08-15',
  noWa: '', // Kosong untuk simulasi transisi BSUID
  bsuid: '1234abcd5678efgh',
  rencanaLulus: 'Kuliah - Teknik Informatika',
  minatAwal: 'Ya',
  orangtuaTahu: 'Ya',
  pjCro: 'Budi Santoso',
};

const mockAktivitas = [
  {
    id: 'A-01',
    tanggal: '12/08/2026 10:30',
    jenis: 'WhatsApp',
    status: 'Prospek Aktif',
    catatan: 'Siswa sangat tertarik, tapi masih ragu masalah biaya. Minta dihubungi lagi lusa.',
    pj: 'Budi Santoso'
  },
  {
    id: 'A-02',
    tanggal: '10/08/2026 09:15',
    jenis: 'Form Publik',
    status: 'Data Masuk',
    catatan: 'Mengisi form sosialisasi di kelas.',
    pj: 'Sistem'
  }
];

export default function SiswaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isInputAktivitasOpen, setIsInputAktivitasOpen] = useState(false);
  const [isEditAktivitasOpen, setIsEditAktivitasOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAktivitas, setSelectedAktivitas] = useState<string | null>(null);

  const isNoWaHidden = !mockSiswaDetail.noWa;

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* HEADER NAV */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {mockSiswaDetail.nama}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <School size={14} /> {mockSiswaDetail.sekolah} • {mockSiswaDetail.id}
          </p>
        </div>
      </div>

      {/* STATUS & BADGES (Mobile Scrollable) */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar gap-2 sm:gap-3">
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs sm:text-sm font-semibold">
          🔥 {mockSiswaDetail.prioritas}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs sm:text-sm font-semibold">
          🟢 {mockSiswaDetail.status}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-foreground text-xs sm:text-sm">
          Next: <span className="font-medium">{mockSiswaDetail.nextAction}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-foreground text-xs sm:text-sm">
          <Calendar size={14} className="text-muted-foreground" />
          {mockSiswaDetail.dueDate}
        </div>
      </div>

      {/* PROFILE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom Kiri: Kontak & Info Transisi BSUID */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Informasi Kontak</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nomor WhatsApp</p>
              {isNoWaHidden ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-sm flex-1">
                    <AlertCircle size={16} />
                    <span>[📱 Nomor Disembunyikan]</span>
                  </div>
                  <button className="flex justify-center items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity w-full sm:w-auto">
                    Minta No. WA
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Phone size={16} className="text-muted-foreground" />
                  {mockSiswaDetail.noWa}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Kelas</p>
                <p className="text-sm font-medium text-foreground">{mockSiswaDetail.kelas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Penanggung Jawab (CRO)</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <User size={14} />
                  {mockSiswaDetail.pjCro}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Info Akademik & Minat */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Informasi Lanjutan</h2>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Rencana Lulus</p>
              <p className="text-sm font-medium text-foreground">{mockSiswaDetail.rencanaLulus}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Minat Awal</p>
              <p className="text-sm font-medium text-foreground">{mockSiswaDetail.minatAwal}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Orangtua Tahu Minat ke Jepang?</p>
              <select className="bg-secondary border border-border text-sm rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[100px]">
                <option>Ya</option>
                <option>Tidak</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS (Mobile: Fixed bottom, Desktop: normal row) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 sm:relative sm:p-0 sm:bg-transparent sm:border-t-0 sm:backdrop-blur-none flex gap-2">
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <MessageCircle size={16} />
          <span className="hidden sm:inline">Chat Siswa</span>
          <span className="sm:hidden">Chat</span>
        </button>
        <button 
          onClick={() => setIsInputAktivitasOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Input Aktivitas</span>
          <span className="sm:hidden">Aktivitas</span>
        </button>
        
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg text-sm font-medium transition-colors">
            <Edit2 size={16} /> Edit Data
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center justify-center p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* TIMELINE AKTIVITAS */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mt-4 sm:mt-0">
        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3 mb-4">Riwayat Aktivitas</h2>
        
        <div className="space-y-6">
          {mockAktivitas.map((act, idx) => (
            <div key={act.id} className="relative flex gap-4">
              {/* Garis vertikal timeline */}
              {idx !== mockAktivitas.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border z-0" />
              )}
              
              {/* Ikon bulat */}
              <div className="relative z-10 w-6 h-6 flex-shrink-0 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              {/* Konten aktivitas */}
              <div className="flex-1 bg-secondary/30 border border-border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{act.jenis}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {act.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {act.tanggal}
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{act.catatan}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User size={12} /> {act.pj}
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedAktivitas(act.id);
                      setIsEditAktivitasOpen(true);
                    }}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Koreksi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      <InputAktivitasModal isOpen={isInputAktivitasOpen} onClose={() => setIsInputAktivitasOpen(false)} />
      <EditAktivitasModal isOpen={isEditAktivitasOpen} onClose={() => setIsEditAktivitasOpen(false)} aktivitasId={selectedAktivitas} />
      <DeleteSiswaModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        siswaName={mockSiswaDetail.nama} 
      />
    </div>
  );
}
