import { useState } from 'react';
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
import { UserX, AlertTriangle } from "lucide-react";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; nama: string } | null;
  onSuccess?: () => void;
}

export function DeleteUserModal({ isOpen, onClose, user, onSuccess }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await apiClient.delete(`/users/${user.id}`);
      toast.success('Staf berhasil dinonaktifkan');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menonaktifkan staf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-500">
            <UserX size={20} /> Nonaktifkan Staf
          </DialogTitle>
          <DialogDescription className="pt-2">
            Anda akan menonaktifkan akun staf <strong>{user?.nama}</strong>. Apakah Anda yakin?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
          <p className="text-xs text-rose-600 font-medium flex gap-2">
            <AlertTriangle size={16} className="flex-shrink-0" /> 
            <span>Akun yang dinonaktifkan tidak akan bisa login ke dalam Nexa CRM lagi, namun riwayat datanya akan tetap tersimpan (*soft delete*).</span>
          </p>
        </div>

        <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11" disabled={loading}>Batal</Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} className="flex-1 sm:flex-none h-11" disabled={loading}>
            {loading ? 'Memproses...' : 'Ya, Nonaktifkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
