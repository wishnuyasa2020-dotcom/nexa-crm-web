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
import { UserPlus, User, Lock, Tag, Eye, EyeOff } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('CRO');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');
  const [chiefCros, setChiefCros] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/users?role=Chief CRO').then(res => {
        setChiefCros(res.data.data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.post('/users', { 
        nama, 
        email,
        username, 
        role, 
        password,
        supervisor_id: role === 'CRO' && supervisorId ? Number(supervisorId) : null
      });
      toast.success('Staf baru berhasil ditambahkan');
      if (onSuccess) onSuccess();
      onClose();
      // Reset
      setNama('');
      setEmail('');
      setUsername('');
      setPassword('');
      setRole('CRO');
      setSupervisorId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan staf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" /> Tambah Staf Baru
          </DialogTitle>
          <DialogDescription className="pt-2">
            Isi formulir di bawah ini untuk mendaftarkan akun staf baru ke dalam sistem.
          </DialogDescription>
        </DialogHeader>

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
              <User size={14} /> Username
            </label>
            <input 
              required
              type="text" 
              placeholder="Ketik username..." 
              value={username}
              onChange={e => setUsername(e.target.value)}
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock size={14} /> Password
            </label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"} 
                placeholder="Masukkan password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 pr-10 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11" disabled={loading}>Batal</Button>
            <Button type="submit" className="flex-1 sm:flex-none h-11 gradient-primary text-white" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
