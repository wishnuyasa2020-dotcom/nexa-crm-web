'use client';

import { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileUser {
  nama?: string;
  username: string;
  role: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser | null;
}

const ROLE_COLOR: Record<string, string> = {
  Admin: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  Manager: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  CRO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [tab, setTab] = useState<'profil' | 'password'>('profil');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const initials = (user?.nama || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleClass = ROLE_COLOR[user?.role ?? ''] ?? 'bg-secondary text-muted-foreground border-border';

  const handleChangePassword = () => {
    setErrorMsg('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatus('error');
      setErrorMsg('Semua field harus diisi.');
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
    // TODO: integrate with real API
    setStatus('success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col overflow-hidden">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-foreground">Akun Saya</h2>
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
        <div className="flex flex-col items-center pt-10 pb-8 px-6 bg-gradient-to-b from-primary/8 to-transparent">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-primary/25 mb-4">
            {initials}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-0.5">{user?.nama || user?.username}</h3>
          <p className="text-sm text-muted-foreground mb-3">@{user?.username}</p>
          <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full border', roleClass)}>
            {user?.role}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 bg-secondary/40 rounded-xl p-1 mb-6">
          {(['profil', 'password'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                tab === t
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'profil' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <User size={14} /> Profil
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Lock size={14} /> Ganti Password
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Profil */}
        {tab === 'profil' && (
          <div className="px-5 pb-10 space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              <InfoRow label="Nama Lengkap" value={user?.nama || '—'} />
              <InfoRow label="Username" value={`@${user?.username}`} />
              <InfoRow label="Role" value={user?.role ?? '—'} />
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Untuk mengubah data profil seperti nama atau role,<br />
                silakan hubungi <span className="text-primary font-medium">Administrator</span>.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Password */}
        {tab === 'password' && (
          <div className="px-5 pb-10 space-y-4">
            {status === 'success' && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl">
                <Check size={16} className="flex-shrink-0" />
                <span>Password berhasil diubah.</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              <PasswordField
                label="Password Lama"
                value={oldPassword}
                show={showOld}
                onToggle={() => setShowOld(v => !v)}
                onChange={setOldPassword}
              />
              <PasswordField
                label="Password Baru"
                value={newPassword}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                onChange={setNewPassword}
              />
              <PasswordField
                label="Konfirmasi Password"
                value={confirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                onChange={setConfirmPassword}
              />
            </div>

            <button
              onClick={handleChangePassword}
              className="w-full py-3.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              Simpan Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function PasswordField({
  label, value, show, onToggle, onChange
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-4 py-4">
      <label className="text-xs text-muted-foreground mb-2 block font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          placeholder="Masukkan password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
