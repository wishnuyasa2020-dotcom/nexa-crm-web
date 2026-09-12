'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, Eye, EyeOff, Check, AlertCircle, Loader2, ShieldCheck, Mail, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

interface ProfileUser {
  nama?: string;
  username: string;
  role: string;
  email?: string;
  tenant_id?: string;
  supervisor_nama?: string | null;
  status?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser | null;
}

const ROLE_COLOR: Record<string, string> = {
  Admin: 'bg-rose-500/15 text-rose-500 border-rose-500/20',
  Manager: 'bg-violet-500/15 text-violet-500 border-violet-500/20',
  'Chief CRO': 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  CRO: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
};

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [tab, setTab] = useState<'profil' | 'password'>('profil');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [liveUser, setLiveUser] = useState<ProfileUser | null>(user);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const updateUser = useAuthStore(state => state.updateUser);

  // Fetch live profile from backend on open
  useEffect(() => {
    if (isOpen) {
      setLiveUser(user);
      setStatus('idle');
      setErrorMsg('');
      setFetchingProfile(true);

      apiClient.get('/api/v1/auth/profile')
        .then(res => {
          if (res.data?.data) {
            const data = res.data.data;
            setLiveUser(prev => ({
              ...prev,
              ...data,
              tenant_id: prev?.tenant_id || user?.tenant_id
            }));
            updateUser(data);
          }
        })
        .catch(() => {
          // Fallback to initial user prop
        })
        .finally(() => {
          setFetchingProfile(false);
        });
    }
  }, [isOpen, user, updateUser]);

  if (!isOpen) return null;

  const activeUser = liveUser || user;
  const initials = (activeUser?.nama || activeUser?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleClass = ROLE_COLOR[activeUser?.role ?? ''] ?? 'bg-secondary text-muted-foreground border-border';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatus('error');
      setErrorMsg('Semua field password wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setStatus('error');
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setStatus('loading');
    try {
      await apiClient.put('/api/v1/auth/profile/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      setStatus('success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatus('idle'), 3500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Gagal mengubah password. Pastikan password lama sesuai.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Dialog Card Container */}
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Pengaturan Akun</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Profile Hero */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-linear-to-b from-primary/10 via-primary/5 to-transparent">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-primary/25 mb-3">
              {initials}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-0.5 text-center">
              {activeUser?.nama || activeUser?.username}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">@{activeUser?.username}</p>
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', roleClass)}>
                {activeUser?.role}
              </span>
              {activeUser?.status && (
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border',
                  activeUser.status === 'Aktif' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    activeUser.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'
                  )} />
                  {activeUser.status}
                </span>
              )}
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex mx-5 bg-secondary/40 rounded-xl p-1 mb-5">
            {(['profil', 'password'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-lg transition-all',
                  tab === t
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'profil' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <User size={14} /> Informasi Profil
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Lock size={14} /> Ganti Password
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: Profil */}
          {tab === 'profil' && (
            <div className="px-5 pb-6 space-y-4">
              <div className="bg-card border rounded-2xl overflow-hidden divide-y divide-border">
                <InfoRow label="Nama Lengkap" value={activeUser?.nama || '—'} />
                <InfoRow label="Username" value={`@${activeUser?.username}`} />
                <InfoRow 
                  label="Email" 
                  value={activeUser?.email || '—'} 
                  icon={<Mail size={13} className="text-muted-foreground shrink-0" />} 
                />
                <InfoRow label="Role / Hak Akses" value={activeUser?.role ?? '—'} />
                {activeUser?.role === 'CRO' && activeUser.supervisor_nama && (
                  <InfoRow label="Atasan Langsung" value={`Chief ${activeUser.supervisor_nama}`} />
                )}
                {activeUser?.tenant_id && (
                  <InfoRow 
                    label="Tenant" 
                    value={activeUser.tenant_id} 
                    icon={<Building size={13} className="text-muted-foreground shrink-0" />} 
                  />
                )}
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-secondary/40 border rounded-xl text-xs text-muted-foreground">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <span>Sistem proteksi aktif: Mutasi username/password dicatat dalam audit log dan dilaporkan via email ke Admin CRM.</span>
              </div>

              <div className="bg-secondary/30 border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Untuk memperbarui identitas utama atau izin akses akun,<br />
                  silakan menghubungi <span className="text-primary font-medium">Administrator</span>.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Password */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="px-5 pb-6 space-y-4">
              <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500">
                <ShieldCheck size={16} className="shrink-0" />
                <span>Pemberitahuan keamanan otomatis akan dikirimkan ke email Admin CRM saat password diperbarui.</span>
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs px-3.5 py-3 rounded-xl">
                  <Check size={16} className="shrink-0" />
                  <span>Password berhasil diperbarui. Email security alert telah dikirim ke Admin CRM.</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-3.5 py-3 rounded-xl">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="bg-card border rounded-2xl overflow-hidden divide-y divide-border">
                <PasswordField
                  label="Password Lama"
                  value={oldPassword}
                  show={showOld}
                  onToggle={() => setShowOld(v => !v)}
                  onChange={setOldPassword}
                  placeholder="Ketik password saat ini..."
                />
                <PasswordField
                  label="Password Baru"
                  value={newPassword}
                  show={showNew}
                  onToggle={() => setShowNew(v => !v)}
                  onChange={setNewPassword}
                  placeholder="Minimal 6 karakter..."
                />
                <PasswordField
                  label="Konfirmasi Password Baru"
                  value={confirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(v => !v)}
                  onChange={setConfirmPassword}
                  placeholder="Ulangi password baru..."
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan Sandi...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-1.5 shrink-0">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold text-foreground text-right truncate">{value}</span>
    </div>
  );
}

function PasswordField({
  label, value, show, onToggle, onChange, placeholder
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="px-4 py-3">
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 pr-10 h-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          placeholder={placeholder || "Masukkan password"}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
