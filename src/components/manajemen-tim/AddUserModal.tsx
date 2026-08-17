import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, User, Lock, Tag } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('CRO');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to actual API
    console.log("Submit new user:", { nama, username, role, password });
    if (onSuccess) onSuccess();
    onClose();
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock size={14} /> Password
            </label>
            <input 
              required
              type="password" 
              placeholder="*********" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11">Batal</Button>
            <Button type="submit" className="flex-1 sm:flex-none h-11 gradient-primary text-white">Simpan Data</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
