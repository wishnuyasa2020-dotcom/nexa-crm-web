'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, School, Building2, Info } from 'lucide-react';
import { TINGKAT_OPTIONS } from '@/lib/constants/sekolah';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_CLASS =
  'w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';

export function AddSekolahModal({ isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
  const [loading, setLoading] = useState(false);
  const [kotaList, setKotaList] = useState<{id: number, kota: string}[]>([]);
  const [kecamatanList, setKecamatanList] = useState<{id: number, kecamatan: string, kota_id: number}[]>([]);
  
  const [form, setForm] = useState({
    namaSekolah: '',
    tingkat: '',
    kota: '',
    kecamatan: '',
    alamat: '',
  });

  // Fetch Master Kota & Kecamatan when modal opens
  useEffect(() => {
    if (isOpen) {
      import('@/lib/apiClient').then(({ default: apiClient }) => {
        Promise.all([
          apiClient.get('/api/v1/settings/kota'),
          apiClient.get('/api/v1/settings/kecamatan')
        ]).then(([kotaRes, kecRes]) => {
          setKotaList(kotaRes.data?.data || []);
          setKecamatanList(kecRes.data?.data || []);
        }).catch(err => console.error('Failed to load master data', err));
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      // Jika kota diganti, reset kecamatan
      if (name === 'kota') {
        return { ...prev, kota: value, kecamatan: '' };
      }
      // Jika kecamatan dipilih dan kota belum ada, set kota otomatis
      if (name === 'kecamatan' && !prev.kota && value) {
        const kecMatch = kecamatanList.find(k => k.kecamatan === value);
        if (kecMatch) {
          const kotaMatch = kotaList.find(k => k.id == kecMatch.kota_id);
          if (kotaMatch) {
            return { ...prev, kecamatan: value, kota: kotaMatch.kota };
          }
        }
      }
      return { ...prev, [name]: value };
    });
  };

  const isValid = form.namaSekolah.trim() && form.tingkat && form.kecamatan.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const { tambahSekolah } = await import('@/lib/api/sekolah.api');
      await tambahSekolah({
        namaSekolah: form.namaSekolah,
        tingkat: form.tingkat,
        kecamatan: form.kecamatan,
        alamat: form.alamat || undefined,
      });
      setForm({ namaSekolah: '', tingkat: '', kota: '', kecamatan: '', alamat: '' });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm shadow-primary/20">
              {isGeneral ? <Building2 size={15} className="text-white" /> : <School size={15} className="text-white" />}
            </div>
            <h2 className="text-base font-bold text-foreground">
              {isGeneral ? t('sekolah.modalAddPartnerTitle') : t('sekolah.modalAddSchoolTitle')}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form id="addSekolahFormNew" onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Nama Sekolah */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {isGeneral ? t('sekolah.partnerName') : t('sekolah.schoolName')} <span className="text-rose-400">*</span>
            </label>
            <input
              required
              name="namaSekolah"
              value={form.namaSekolah}
              onChange={handleChange}
              placeholder={isGeneral ? t('sekolah.inputPartnerPlaceholder') : t('sekolah.inputSchoolPlaceholder')}
              className={FIELD_CLASS}
            />
          </div>

          {/* Tingkat + Kota */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t('sekolah.level')} <span className="text-rose-400">*</span>
              </label>
              <select
                required
                name="tingkat"
                value={form.tingkat}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option value="">{t('sekolah.selectDefault')}</option>
                {TINGKAT_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t('sekolah.cityLabel')} <span className="text-rose-400">*</span>
              </label>
              <select
                required
                name="kota"
                value={form.kota}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option value="">{t('sekolah.selectCity')}</option>
                {kotaList.map(k => (
                  <option key={k.id} value={k.kota}>{k.kota}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kecamatan + Alamat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t('sekolah.district')} <span className="text-rose-400">*</span>
              </label>
              <select
                required
                name="kecamatan"
                value={form.kecamatan}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option value="">{form.kota ? t('sekolah.selectDistrict') : t('sekolah.allDistrictOption')}</option>
                {kecamatanList
                  .filter(kec => !form.kota || kotaList.find(k => k.kota === form.kota)?.id == kec.kota_id)
                  .map(kec => (
                    <option key={kec.id} value={kec.kecamatan}>{kec.kecamatan}</option>
                  ))
                }
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                {t('sekolah.address')}
                <span className="text-xs text-muted-foreground font-normal">{t('sekolah.addressOptional')}</span>
              </label>
              <input
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder={t('sekolah.addressPlaceholder')}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          {/* Preview Status Otomatis */}
          <div className="rounded-xl border bg-secondary/30 p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sekolah.autoCrmStatusTitle')}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">{t('sekolah.colState')}</p>
                <p className="font-medium text-slate-400">Belum Visit</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('sekolah.colNextAction')}</p>
                <p className="font-medium text-foreground">Visit Awal</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('sekolah.colDueDate')}</p>
                <p className="font-medium text-muted-foreground italic">null (Weekly Plan)</p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 pt-0 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            {t('sekolah.cancelBtn')}
          </button>
          <button
            type="submit"
            form="addSekolahFormNew"
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isGeneral ? t('sekolah.savePartnerBtn') : t('sekolah.saveSchoolBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
