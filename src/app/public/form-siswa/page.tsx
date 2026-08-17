'use client';

import { useState, useEffect } from 'react';
import { Send, User, Phone, School, BookOpen, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMockSekolahList } from '@/lib/mock/sekolah';

export default function FormSosialisasiPage() {
  const [formData, setFormData] = useState({
    namaLengkap: '',
    noWa: '',
    kelas: '',
    rencanaLulus: '',
    minatAwal: '',
  });
  const [namaSekolah, setNamaSekolah] = useState('');

  useEffect(() => {
    // Simulasi pengambilan nama sekolah berdasarkan ID di URL
    const params = new URLSearchParams(window.location.search);
    const sekolahId = params.get('sekolahId');
    if (sekolahId) {
      const res = getMockSekolahList({ search: '', page: 1, pageSize: 100 });
      const sekolah = res.data.find(s => s.id === sekolahId);
      if (sekolah) {
        setNamaSekolah(sekolah.nama);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Di backend nyata, ambil ID dari URL:
    // const params = new URLSearchParams(window.location.search);
    // const croId = params.get('croId');
    // Payload form ini disubmit beserta croId tersebut.
    
    // Simulate WhatsApp Redirect
    const text = `Halo, saya ${formData.namaLengkap} dari kelas ${formData.kelas}. Saya berminat untuk bergabung.`;
    const waUrl = `https://wa.me/628123456789?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 sm:pb-0">
      {/* Mobile-first Container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-background sm:border-x border-border shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Dekorasi Latar Atas */}
        <div className="absolute top-0 left-0 right-0 h-48 gradient-primary -z-10 rounded-b-[40px] opacity-90 shadow-inner" />

        {/* Header Logo & Info */}
        <div className="pt-12 pb-8 px-6 text-center text-white z-10">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <School size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Konfirmasi Kehadiran
          </h1>
          {namaSekolah ? (
            <p className="text-white/90 text-sm font-medium mb-1">{namaSekolah}</p>
          ) : null}
          <p className="text-white/80 text-sm mt-1">Silakan isi biodata kamu sebagai bukti kehadiran sosialisasi.</p>
        </div>

        {/* Form Card */}
        <div className="flex-1 bg-card rounded-t-[32px] px-6 py-8 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Nama Lengkap <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text"
                  required
                  placeholder="Ketik nama lengkap kamu"
                  value={formData.namaLengkap}
                  onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex justify-between">
                <span>Nomor WhatsApp Aktif</span>
                <span className="text-rose-500 normal-case">*Wajib</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.noWa}
                  onChange={e => setFormData({ ...formData, noWa: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Kelas <span className="text-rose-500">*</span></label>
              <div className="relative">
                <School size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text"
                  required
                  placeholder="Ketik nama kelasmu (Misal: XII IPA 1)"
                  value={formData.kelas}
                  onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Rencana Setelah Lulus <span className="text-rose-500">*</span></label>
              <div className="relative">
                <BookOpen size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select 
                  required
                  value={formData.rencanaLulus}
                  onChange={e => setFormData({ ...formData, rencanaLulus: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none"
                >
                  <option value="" disabled>Pilih rencana...</option>
                  <option value="Kerja">Kerja</option>
                  <option value="Kuliah">Kuliah</option>
                  <option value="Bisnis">Bisnis</option>
                  <option value="Belum Tahu">Belum Tahu</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Minat Kerja ke Jepang? <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {['Ya', 'Ragu', 'Tidak'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, minatAwal: opt })}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm font-medium transition-all",
                      formData.minatAwal === opt 
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                        : "bg-background border-border text-foreground hover:bg-secondary"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 pb-6">
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 gradient-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all"
              >
                <Send size={18} />
                Kirim & Konfirmasi via WhatsApp
              </button>
              <p className="text-center text-[10px] text-muted-foreground mt-4 leading-relaxed px-4">
                Dengan menekan tombol di atas, Anda akan dialihkan ke aplikasi WhatsApp untuk menyelesaikan konfirmasi kehadiran secara otomatis.
              </p>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
