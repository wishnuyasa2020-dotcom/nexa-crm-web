import { useState, useEffect } from 'react';
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
  user?: { id: string; nama: string; role: string; status: string } | null;
  onSuccess?: () => void;
}

export function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [nama, setNama] = useState('');
  const [role, setRole] = useState('CRO');
  const [status, setStatus] = useState('Aktif');

  useEffect(() => {
    if (user && isOpen) {
      setNama(user.nama);
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to actual API
    console.log("Edit user:", { id: user?.id, nama, role, status });
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 size={20} className="text-primary" /> Edit Data Staf
          </DialogTitle>
          <DialogDescription className="pt-2">
            Ubah profil dasar atau hak akses staf di bawah ini.
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11">Batal</Button>
            <Button type="submit" className="flex-1 sm:flex-none h-11 gradient-primary text-white">Simpan Perubahan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
