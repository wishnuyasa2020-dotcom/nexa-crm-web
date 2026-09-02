'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, Send, School } from 'lucide-react';

function FormSiswaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sekolahId = params.sekolahId as string;
  const croId = searchParams.get('croId') || '';
  const kelasParam = searchParams.get('kelas') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sekolah, setSekolah] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    no_wa: '',
    kelas: kelasParam,
    minat_awal: '',
    rencana_lulus: '',
    pj_cro: croId
  });

  useEffect(() => {
    // Fetch info sekolah dari public API
    if (sekolahId) {
      fetch(`http://localhost:3001/api/public/sekolah/${sekolahId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok') {
            setSekolah(data.data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [sekolahId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.no_wa || !formData.pj_cro) {
      return alert('Mohon lengkapi data yang bertanda bintang (*)');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/public/form-siswa/${sekolahId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.status === 'ok') {
        setSuccess(true);
      } else {
        alert(data.message || 'Gagal menyimpan data');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!sekolah) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="bg-card border border-border rounded-xl p-6 shadow-md max-w-sm w-full">
          <p className="font-semibold text-rose-500 mb-2">Akses Ditolak</p>
          <p className="text-sm text-muted-foreground">Tautan form tidak valid atau sekolah tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card border border-border rounded-xl p-8 shadow-md max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Terima Kasih!</h2>
          <p className="text-muted-foreground">
            Data Anda telah berhasil direkam. Tim kami akan segera menghubungi Anda melalui WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Header Mobile */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-[2.5rem] shadow-lg mb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Form Data Siswa</h1>
          <p className="text-primary-foreground/90 text-sm flex items-center gap-2 mb-1">
            <School size={16} />
            {sekolah.nama_sekolah}
          </p>
          {kelasParam && (
            <p className="text-primary-foreground/80 text-xs font-medium bg-black/10 inline-block px-2 py-1 rounded-md">
              Kelas: {kelasParam}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-12 max-w-md w-full mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Mohon lengkapi formulir di bawah ini dengan data yang valid.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nama Lengkap <span className="text-rose-500">*</span></label>
              <input 
                required 
                name="nama_lengkap" 
                value={formData.nama_lengkap} 
                onChange={handleChange} 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm transition-all" 
                placeholder="Masukkan nama lengkap Anda" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nomor WhatsApp <span className="text-rose-500">*</span></label>
              <input 
                required 
                type="tel"
                name="no_wa" 
                value={formData.no_wa} 
                onChange={handleChange} 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm transition-all" 
                placeholder="0812xxxx..." 
              />
            </div>

            {/* Kelas and CRO are now pre-bound from URL parameters */}
            <input type="hidden" name="kelas" value={formData.kelas} />
            <input type="hidden" name="pj_cro" value={formData.pj_cro} />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Minat Kerja / Magang ke Jepang</label>
              <select 
                name="minat_awal" 
                value={formData.minat_awal} 
                onChange={handleChange} 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm transition-all"
              >
                <option value="">-- Pilih --</option>
                <option value="Ya">Ya, saya sangat berminat</option>
                <option value="Ragu">Masih ragu-ragu / Ingin tahu lebih lanjut</option>
                <option value="Tidak">Tidak berminat</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Rencana Setelah Lulus</label>
              <select 
                name="rencana_lulus" 
                value={formData.rencana_lulus} 
                onChange={handleChange} 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm transition-all"
              >
                <option value="">-- Pilih --</option>
                <option value="Kerja">Langsung Kerja</option>
                <option value="Kuliah">Lanjut Kuliah</option>
                <option value="Belum Tahu">Belum Tahu</option>
              </select>
            </div>


            <div className="pt-4">
              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full flex justify-center items-center gap-2 px-4 py-3.5 text-white font-semibold gradient-primary rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Kirim Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nexa OS · Sistem PPDB
        </div>
      </div>
    </div>
  );
}

export default function FormSiswaPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <FormSiswaContent />
    </React.Suspense>
  );
}
