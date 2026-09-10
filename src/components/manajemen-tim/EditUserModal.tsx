import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, User, Tag, ToggleLeft, ToggleRight } from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; nama: string; email: string; role: string; status: string; supervisor_id?: number | null } | null;
  onSuccess?: () => void;
}

export function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CRO');
  const [status, setStatus] = useState('Aktif');
  const [supervisorId, setSupervisorId] = useState('');
  const [chiefCros, setChiefCros] = useState<any[]>([]);
  const [quotaErrorMsg, setQuotaErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setNama(user.nama);
      setEmail(user.email || '');
      setRole(user.role);
      setStatus(user.status);
      setSupervisorId(user.supervisor_id ? String(user.supervisor_id) : '');
      setQuotaErrorMsg(null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/users?role=Chief CRO').then(res => {
        setChiefCros(res.data.data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setQuotaErrorMsg(null);
    try {
      setLoading(true);
      await apiClient.put(`/users/${user.id}`, { 
        nama, 
        email,
        role, 
        status_aktif: status,
        supervisor_id: role === 'CRO' && supervisorId ? Number(supervisorId) : null 
      });
      toast.success('Data staf berhasil diperbarui');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const isQuota = err.response?.data?.isQuotaError || err.response?.status === 403;
      const msg = err.response?.data?.message || 'Gagal mengubah staf';
      if (isQuota) {
        setQuotaErrorMsg(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-11/12">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 size={20} className="text-primary" /> Edit Data Staf
          </DialogTitle>
          <DialogDescription className="pt-2">
            Ubah profil dasar atau hak akses staf di bawah ini.
          </DialogDescription>
        </DialogHeader>

        {quotaErrorMsg && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 mt-2">
            <p className="font-bold text-amber-500 flex items-center gap-1.5">
              ⚠️ Batas Kuota Tercapai
            </p>
            <p className="leading-relaxed text-muted-foreground">{quotaErrorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User size={14} /> Nama Lengkap
            </label>
            <input 
              required
              type="text" 
              placeholder="Ketik nama lengkap..." 
              value={nama}
              onChange={e => setNama(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User size={14} /> Alamat Email
            </label>
            <input 
              required
              type="email" 
              placeholder="Ketik alamat email..." 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag size={14} /> Role / Hak Akses
            </label>
            <select 
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Chief CRO">Chief CRO</option>
              <option value="CRO">CRO</option>
            </select>
          </div>

          {role === 'CRO' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User size={14} /> Atasan (Chief CRO)
              </label>
              <select 
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                value={supervisorId}
                onChange={e => setSupervisorId(e.target.value)}
              >
                <option value="">-- Tidak ada atasan --</option>
                {chiefCros.map(c => (
                  <option key={c.id} value={c.id}>{c.nama}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Status Akun</label>
                <p className="text-xs text-muted-foreground">Aktifkan atau nonaktifkan akun staf ini.</p>
              </div>
              <button
                type="button"
                onClick={() => setStatus(status === 'Aktif' ? 'Nonaktif' : 'Aktif')}
                className={`flex items-center transition-colors ${status === 'Aktif' ? 'text-emerald-500' : 'text-muted-foreground'}`}
              >
                {status === 'Aktif' ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11" disabled={loading}>Batal</Button>
            <Button type="submit" className="flex-1 sm:flex-none h-11 gradient-primary text-white" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
