import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsDemo } from '@/hooks/useIsDemo';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; nama: string } | null;
  onSuccess?: () => void;
}

export function ResetPasswordModal({ isOpen, onClose, user, onSuccess }: ResetPasswordModalProps) {
  const { t } = useTranslation();
  const isDemo = useIsDemo();
  const userAuth = useAuthStore(s => s.user);
  const isDemoMode = isDemo || userAuth?.tenant_id === 'crm-demo';

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isDemoMode) {
      toast.error(t('team.resetPasswordDisabledDemo'));
      return;
    }
    try {
      setLoading(true);
      await apiClient.patch(`/users/${user.id}/reset-password`, { new_password: newPassword });
      toast.success(t('team.resetPasswordSuccess'));
      if (onSuccess) onSuccess();
      onClose();
      setNewPassword(''); // clean up
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('team.resetPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl w-11/12">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            {isDemoMode ? <ShieldAlert size={20} /> : <KeyRound size={20} />} {t('team.resetPasswordTitle')}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t('team.resetPasswordDescPrefix')} <strong>{user?.nama}</strong>.
          </DialogDescription>
        </DialogHeader>

        {isDemoMode && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{t('team.demoNoticeTitle')}</p>
              <p className="text-muted-foreground">{t('team.resetPasswordDisabledDemo')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock size={14} /> {t('team.newPassword')}
            </label>
            <div className="relative">
              <input 
                required
                disabled={loading || isDemoMode}
                type={showPassword ? "text" : "password"} 
                placeholder={t('team.newPasswordPlaceholder')} 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 pr-10 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isDemoMode}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('team.resetSecurityNotice')}
            </p>
          </div>

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11" disabled={loading}>{t('common.cancel')}</Button>
            <Button 
              type="submit" 
              className="flex-1 sm:flex-none h-11 bg-amber-500 hover:bg-amber-600 text-white" 
              disabled={loading || isDemoMode}
              title={isDemoMode ? t('team.resetPasswordDisabledDemo') : undefined}
            >
              {loading ? t('team.processing') : t('team.resetPasswordBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
