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
import { KeyRound, Lock, Eye, EyeOff } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; nama: string } | null;
  onSuccess?: () => void;
}

export function ResetPasswordModal({ isOpen, onClose, user, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await apiClient.patch(`/users/${user.id}/reset-password`, { new_password: newPassword });
      toast.success('Password staf berhasil direset');
      if (onSuccess) onSuccess();
      onClose();
      setNewPassword(''); // clean up
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-11/12">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <KeyRound size={20} /> Reset Password
          </DialogTitle>
          <DialogDescription className="pt-2">
            Anda akan melakukan *reset password* untuk staf atas nama <strong>{user?.nama}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock size={14} /> Password Baru
            </label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"} 
                placeholder="Masukkan password baru..." 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 pr-10 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
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
            <Button type="submit" className="flex-1 sm:flex-none h-11 bg-amber-500 hover:bg-amber-600 text-white" disabled={loading}>
              {loading ? 'Memproses...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
