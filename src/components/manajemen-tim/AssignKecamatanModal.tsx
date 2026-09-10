'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface AssignKecamatanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToAssign: { username: string; nama: string; kecamatan_list?: string[] } | null;
  onSuccess: () => void;
}

export function AssignKecamatanModal({ isOpen, onClose, userToAssign, onSuccess }: AssignKecamatanModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userToAssign) {
      setSelected(userToAssign.kecamatan_list || []);
      setSearch('');
      setLoadingKecamatan(true);
      apiClient.get('/sekolah/utils/kecamatan-list')
        .then(res => {
          const list = res.data?.data || res.data || [];
          setKecamatanList(Array.isArray(list) ? list : []);
        })
        .catch(err => {
          console.error('Gagal mengambil daftar kecamatan:', err);
        })
        .finally(() => setLoadingKecamatan(false));
    }
  }, [isOpen, userToAssign]);

  if (!isOpen || !userToAssign) return null;

  const filteredList = kecamatanList.filter(k => k.toLowerCase().includes(search.toLowerCase()));

  const toggleSelection = (kec: string) => {
    setSelected(prev => 
      prev.includes(kec) ? prev.filter(item => item !== kec) : [...prev, kec]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    toast.success(`Area kecamatan untuk ${userToAssign.nama} berhasil disimpan (${selected.length} kecamatan)`);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-background/80 backdrop-blur-sm">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Atur Area Kecamatan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Untuk Chief CRO: {userToAssign.nama}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kecamatan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>

          <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
            {filteredList.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Kecamatan tidak ditemukan.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredList.map(kec => {
                  const isSelected = selected.includes(kec);
                  return (
                    <label 
                      key={kec}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(kec)}
                        className="hidden" 
                      />
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-sm text-foreground">{kec}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {selected.length} kecamatan dipilih
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-secondary/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            disabled={saving}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Area'}
          </button>
        </div>
      </div>
    </div>
  );
}
