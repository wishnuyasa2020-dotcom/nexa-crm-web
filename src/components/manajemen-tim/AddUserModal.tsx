import { useState, useEffect } from 'react';
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
import { UserPlus, User, Lock, Tag, Eye, EyeOff } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const { t } = useTranslation();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('CRO');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');
  const [chiefCros, setChiefCros] = useState<any[]>([]);
  const [quotaErrorMsg, setQuotaErrorMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuotaErrorMsg(null);
      apiClient.get('/users?role=Chief CRO').then(res => {
        setChiefCros(res.data.data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaErrorMsg(null);
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
      toast.success(t('team.addSuccess'));
      if (onSuccess) onSuccess();
      onClose();
      // Reset
      setNama('');
      setEmail('');
      setUsername('');
      setPassword('');
      setRole('CRO');
      setSupervisorId('');
      setQuotaErrorMsg(null);
    } catch (err: any) {
      const isQuota = err.response?.data?.isQuotaError || err.response?.status === 403;
      const msg = err.response?.data?.message || t('team.addFailed');
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
        <DialogHeader className="sticky -top-4 bg-popover z-10 pt-4 pb-2 -mt-4 -mx-4 px-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" /> {t('team.addModalTitle')}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t('team.addModalDesc')}
          </DialogDescription>
        </DialogHeader>

        {quotaErrorMsg && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 mt-2">
            <p className="font-bold text-amber-500 flex items-center gap-1.5">
              {t('team.quotaLimitReached')}
            </p>
            <p className="leading-relaxed text-muted-foreground">{quotaErrorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User size={14} /> {t('team.fullName')}
            </label>
            <input 
              required
              type="text" 
              placeholder={t('team.fullNamePlaceholder')} 
              value={nama}
              onChange={e => setNama(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User size={14} /> {t('team.emailAddress')}
            </label>
            <input 
              required
              type="email" 
              placeholder={t('team.emailPlaceholder')} 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User size={14} /> {t('team.username')}
            </label>
            <input 
              required
              type="text" 
              placeholder={t('team.usernamePlaceholder')} 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag size={14} /> {t('team.roleLabel')}
            </label>
            <select 
              className="w-full px-3 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
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
                <User size={14} /> {t('team.supervisorChief')}
              </label>
              <select 
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                value={supervisorId}
                onChange={e => setSupervisorId(e.target.value)}
              >
                <option value="">{t('team.noSupervisor')}</option>
                {chiefCros.map(c => (
                  <option key={c.id} value={c.id}>{c.nama}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock size={14} /> {t('team.password')}
            </label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"} 
                placeholder={t('team.passwordPlaceholder')} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 pr-10 py-2 text-sm bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
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

          <DialogFooter className="sticky -bottom-4 bg-popover z-10 pt-4 pb-4 -mb-4 -mx-4 px-4 border-t border-border/50 mt-4 flex flex-row gap-2 justify-end sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-11" disabled={loading}>{t('common.cancel')}</Button>
            <Button type="submit" className="flex-1 sm:flex-none h-11 gradient-primary text-white" disabled={loading}>
              {loading ? t('team.saving') : t('team.saveData')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
