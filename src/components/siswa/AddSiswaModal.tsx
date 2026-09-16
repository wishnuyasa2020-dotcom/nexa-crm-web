'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface SekolahDropdown {
  value: string;
  text: string;
}

export function AddSiswaModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [sekolahList, setSekolahList] = useState<SekolahDropdown[]>([]);
  const [consentWa, setConsentWa] = useState(true);
  const [waChecking, setWaChecking] = useState(false);
  const [waDuplicate, setWaDuplicate] = useState<{ isDuplicate: boolean; student?: any } | null>(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    sourceChannel: 'sekolah',
    sourceDetail: '',
    kebutuhanLayanan: '',
    idSekolah: '',
    kelas: '',
    wa: '',
    bsuid: '',
    email: '',
    alamat: '',
    minatAwal: '',
    rencanaLulus: '',
    orangtuaTahu: '',
    dueDate: '',
    catatan: ''
  });

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/api/crm/utils/sekolah-dropdown')
        .then(res => {
          const raw = res.data?.data || res.data || [];
          setSekolahList(Array.isArray(raw) ? raw : []);
        })
        .catch(err => console.error('Gagal fetch dropdown sekolah', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'wa' && waDuplicate) {
      setWaDuplicate(null);
    }
  };

  const handleWaBlur = async () => {
    const phone = formData.wa.trim();
    if (!phone || phone.length < 8) {
      setWaDuplicate(null);
      return;
    }
    setWaChecking(true);
    try {
      const res = await apiClient.get(`/api/v1/audience/check?phone=${encodeURIComponent(phone)}`);
      if (res.data?.status === 'ok') {
        setWaDuplicate({
          isDuplicate: res.data.data.isDuplicate,
          student: res.data.data.student
        });
      }
    } catch (err) {
      console.error('Check duplicate phone error', err);
    } finally {
      setWaChecking(false);
    }
  };

  const isSekolahChannel = formData.sourceChannel === 'sekolah';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return alert('Nama lengkap wajib diisi');
    if (isSekolahChannel && !formData.idSekolah) {
      return alert('Pilihan sekolah wajib diisi untuk jalur Kunjungan Sekolah');
    }
    
    setLoading(true);
    try {
      const payload = {
        nama_lengkap: formData.nama,
        source_channel: formData.sourceChannel,
        source_detail: formData.sourceDetail || null,
        kebutuhan_layanan: formData.kebutuhanLayanan || null,
        id_sekolah: formData.idSekolah || null,
        kelas: formData.kelas,
        no_wa: formData.wa,
        bsuid: formData.bsuid,
        email: formData.email,
        alamat: formData.alamat,
        minat_awal: formData.minatAwal || 'Ya',
        rencana_lulus: formData.rencanaLulus || 'Kerja',
        orangtua_tahu: formData.orangtuaTahu,
        due_date: formData.dueDate,
        catatan: formData.catatan,
        consent_wa: consentWa,
        opt_in_wa: consentWa ? 'Ya' : 'Belum'
      };
      await apiClient.post('/api/v1/siswa', payload);
      setFormData({
        nama: '', sourceChannel: 'sekolah', sourceDetail: '', kebutuhanLayanan: '',
        idSekolah: '', kelas: '', wa: '', bsuid: '', email: '', alamat: '',
        minatAwal: '', rencanaLulus: '', orangtuaTahu: '', dueDate: '', catatan: ''
      });
      setConsentWa(true);
      setWaDuplicate(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan siswa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-card w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-xl border flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-foreground">Tambah Siswa Baru</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5 custom-scrollbar flex-1">
          <form id="addSiswaForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Sumber Lead / Intake Channel */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Sumber Lead / Intake Channel *</label>
              <select 
                name="sourceChannel" 
                value={formData.sourceChannel} 
                onChange={handleChange} 
                className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="sekolah">🏫 Kunjungan Sekolah / Sosialisasi (Default)</option>
                <option value="relasi">🤝 Relasi / Rekomendasi Alumni (Referral)</option>
                <option value="instagram">📸 Instagram</option>
                <option value="facebook">📘 Facebook</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="website">🌐 Website / Landing Page</option>
                <option value="whatsapp">💬 WhatsApp Langsung</option>
              </select>
            </div>

            {/* Input Tambahan Khusus Jalur Digital / Relasi */}
            {!isSekolahChannel && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/30 rounded-xl border border-border/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {formData.sourceChannel === 'relasi' ? 'Perekomendasi / Nama Relasi' : 'Detail Kampanye / Akun'}
                  </label>
                  <input 
                    name="sourceDetail" 
                    value={formData.sourceDetail} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" 
                    placeholder={formData.sourceChannel === 'relasi' ? 'Misal: Alumni Bayu (Batch 12)' : 'Misal: Promo Reels Maret'} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Pilihan Program / Layanan</label>
                  <input 
                    name="kebutuhanLayanan" 
                    value={formData.kebutuhanLayanan} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" 
                    placeholder="Misal: Magang Jepang Kaigo" 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nama Lengkap *</label>
                <input required name="nama" value={formData.nama} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Budi Santoso" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {isSekolahChannel ? 'Asal Sekolah *' : 'Asal Sekolah / Almamater (Opsional)'}
                </label>
                <select 
                  required={isSekolahChannel} 
                  name="idSekolah" 
                  value={formData.idSekolah} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none"
                >
                  <option value="">{isSekolahChannel ? '-- Pilih Sekolah --' : '-- Pilih Sekolah (Jika Diketahui) --'}</option>
                  {sekolahList.map((s, i) => (
                    <option key={s.value || i} value={s.value}>{s.text}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">No. WhatsApp</label>
                  {waChecking && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Memeriksa...</span>}
                </div>
                <input 
                  name="wa" 
                  value={formData.wa} 
                  onChange={handleChange} 
                  onBlur={handleWaBlur}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" 
                  placeholder="081234567890" 
                />
                {waDuplicate?.isDuplicate && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500">
                    ⚠️ Nomor ini sudah tercatat atas nama <strong>{waDuplicate.student?.nama_lengkap}</strong> ({waDuplicate.student?.status_terkini || 'Data Masuk'}). Data baru akan diperbarui.
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">BSUID (Opsional)</label>
                <input name="bsuid" value={formData.bsuid} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" placeholder="ID Meta..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Kelas</label>
              <input name="kelas" value={formData.kelas} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" placeholder="12 IPA 1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Minat Kerja ke Jepang</label>
                <select name="minatAwal" value={formData.minatAwal} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none">
                  <option value="">-- Pilih --</option>
                  <option value="Ya">Ya, saya berminat</option>
                  <option value="Ragu">Masih ragu-ragu</option>
                  <option value="Tidak">Tidak berminat</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Rencana Setelah Lulus</label>
                <select name="rencanaLulus" value={formData.rencanaLulus} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none">
                  <option value="">-- Pilih --</option>
                  <option value="Kerja">Kerja</option>
                  <option value="Kuliah">Kuliah</option>
                  <option value="Bisnis">Bisnis</option>
                  <option value="Belum Tahu">Belum Tahu</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Orangtua Tahu LPK?</label>
                <select name="orangtuaTahu" value={formData.orangtuaTahu} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none">
                  <option value="">-- Pilih --</option>
                  <option value="Sudah">Sudah</option>
                  <option value="Belum">Belum</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Jadwal Kontak Lanjut (Due Date)</label>
                <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Alamat</label>
              <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows={2} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Alamat lengkap" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Catatan Awal</label>
              <textarea name="catatan" value={formData.catatan} onChange={handleChange} rows={2} className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none" placeholder="Info tambahan..." />
            </div>

            {/* WhatsApp Consent Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentWa}
                  onChange={e => setConsentWa(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-primary text-primary focus:ring-primary shrink-0"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground">
                    Opt-In WhatsApp Consent (Izin Kontak)
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Siswa telah memberikan persetujuan untuk dihubungi melalui pesan WhatsApp (kepatuhan Meta & Nexa Evidence Engine).
                  </p>
                </div>
              </label>
            </div>
          </form>
        </div>

        <div className="p-5 border-t flex justify-end gap-3 bg-secondary/10">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors">Batal</button>
          <button type="submit" form="addSiswaForm" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-70 transition-all">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Simpan Siswa
          </button>
        </div>
      </div>
    </div>
  );
}
