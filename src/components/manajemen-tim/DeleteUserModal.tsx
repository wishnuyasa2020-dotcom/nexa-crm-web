import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await apiClient.delete(`/users/${user.id}`);
      toast.success(t('team.deactivateSuccess'));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('team.deactivateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-11/12">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-500">
            <UserX size={20} /> {t('team.deactivateStaffTitle')}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t('team.deactivateDescPrefix')} <strong>{user?.nama}</strong>. {t('team.deactivateDescSuffix')}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
          <p className="text-xs text-rose-600 font-medium flex gap-2">
            <AlertTriangle size={16} className="shrink-0" /> 
            <span>{t('team.deactivateWarning')}</span>
          </p>
        </div>

        <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11" disabled={loading}>{t('common.cancel')}</Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} className="flex-1 sm:flex-none h-11" disabled={loading}>
            {loading ? t('team.processing') : t('team.confirmDeactivate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
