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
import { KeyRound, Lock } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; nama: string } | null;
  onSuccess?: () => void;
}

export function ResetPasswordModal({ isOpen, onClose, user, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to actual API
    console.log("Reset password for user:", user?.id, "New:", newPassword);
    if (onSuccess) onSuccess();
    onClose();
    setNewPassword(''); // clean up
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-[90%] md:w-full">
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
            <input 
              required
              type="password" 
              placeholder="Masukkan password baru..." 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11">Batal</Button>
            <Button type="submit" className="flex-1 sm:flex-none h-11 bg-amber-500 hover:bg-amber-600 text-white">Reset Password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
