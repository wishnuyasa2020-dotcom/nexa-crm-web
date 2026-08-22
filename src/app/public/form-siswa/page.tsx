'use client';

import { useState, useEffect, Suspense } from 'react';
import { Send, User, Phone, School, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/apiClient';

function FormSosialisasiContent() {
  const searchParams = useSearchParams();
  const sekolahId = searchParams.get('sekolahId') || '';
  const croId = searchParams.get('croId') || '';
  const kelasParam = searchParams.get('kelas') || '';

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    no_wa: '',
    kelas: kelasParam,
    rencana_lulus: '',
    minat_awal: '',
    pj_cro: croId
  });
  
  const [namaSekolah, setNamaSekolah] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (sekolahId) {
      apiClient.get(`/api/public/sekolah/${sekolahId}`)
        .then(res => {
          if (res.data.status === 'ok') {
            setNamaSekolah(res.data.data.nama_sekolah);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [sekolahId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.no_wa || !formData.pj_cro) {
      return alert('Mohon lengkapi data yang bertanda bintang (*)');
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/public/form-siswa/${sekolahId}`, formData);
      if (res.data.status === 'ok') {
        setSuccess(true);
        
        // Redirect to WhatsApp to open Service Window
        const text = `Halo, saya ${formData.nama_lengkap} dari kelas ${formData.kelas}. Saya hadir di sosialisasi.`;
        // TODO: Get actual WABA number from tenant settings, for now using placeholder or env var
        const wabaNumber = process.env.NEXT_PUBLIC_WABA_NUMBER || '628123456789';
        const waUrl = `https://wa.me/${wabaNumber}?text=${encodeURIComponent(text)}`;
        
        // Use window.location.href to redirect directly on mobile
        window.location.href = waUrl;
      } else {
        alert(res.data.message || 'Gagal menyimpan data');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <div className="bg-card border border-border rounded-3xl p-10 shadow-2xl max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Terima Kasih!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Data kehadiran kamu telah berhasil direkam.
          </p>
          <p className="text-xs text-muted-foreground">
            Jika kamu tidak dialihkan ke WhatsApp secara otomatis, silakan klik tombol di bawah ini:
          </p>
          <button 
            onClick={() => {
              const text = `Halo, saya ${formData.nama_lengkap} dari kelas ${formData.kelas}. Saya hadir di sosialisasi.`;
              const wabaNumber = process.env.NEXT_PUBLIC_WABA_NUMBER || '628123456789';
              window.location.href = `https://wa.me/${wabaNumber}?text=${encodeURIComponent(text)}`;
            }}
            className="mt-6 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Send size={16} /> Buka WhatsApp
          </button>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {kelasParam && (
              <div className="px-3 py-1 bg-black/20 rounded-lg backdrop-blur-sm">
                <p className="text-white/90 text-xs font-semibold">Kelas: {kelasParam}</p>
              </div>
            )}
            {croId && (
              <div className="px-3 py-1 bg-black/20 rounded-lg backdrop-blur-sm">
                <p className="text-white/90 text-xs font-semibold">CRO: {croId}</p>
              </div>
            )}
          </div>
          <p className="text-white/80 text-sm mt-3">Silakan isi biodata kamu sebagai bukti kehadiran sosialisasi.</p>
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
                  name="nama_lengkap"
                  placeholder="Ketik nama lengkap kamu"
                  value={formData.nama_lengkap}
                  onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
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
                  name="no_wa"
                  placeholder="Contoh: 081234567890"
                  value={formData.no_wa}
                  onChange={e => setFormData({ ...formData, no_wa: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Hidden fields for pre-bound data */}
            <input type="hidden" name="kelas" value={formData.kelas} />
            <input type="hidden" name="pj_cro" value={formData.pj_cro} />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Rencana Setelah Lulus <span className="text-rose-500">*</span></label>
              <div className="relative">
                <BookOpen size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select 
                  required
                  name="rencana_lulus"
                  value={formData.rencana_lulus}
                  onChange={e => setFormData({ ...formData, rencana_lulus: e.target.value })}
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
                    onClick={() => setFormData({ ...formData, minat_awal: opt })}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm font-medium transition-all",
                      formData.minat_awal === opt 
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
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 gradient-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Kirim Data
              </button>
              <p className="text-center text-[10px] text-muted-foreground mt-4 leading-relaxed px-4">
                Data yang Anda kirimkan akan direkam ke dalam sistem Nexa OS.
              </p>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default function FormSosialisasiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <FormSosialisasiContent />
    </Suspense>
  );
}
