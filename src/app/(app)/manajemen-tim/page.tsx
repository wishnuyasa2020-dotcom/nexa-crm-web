'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Map, Plus, Edit2, KeyRound, UserX, MoreVertical } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { AssignKecamatanModal } from '@/components/manajemen-tim/AssignKecamatanModal';
import { AddUserModal } from '@/components/manajemen-tim/AddUserModal';
import { EditUserModal } from '@/components/manajemen-tim/EditUserModal';
import { ResetPasswordModal } from '@/components/manajemen-tim/ResetPasswordModal';
import { DeleteUserModal } from '@/components/manajemen-tim/DeleteUserModal';

export default function ManajemenTimPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [quota, setQuota] = useState<{
    tier: string;
    roles: Record<string, { role: string; max: number; used: number; available: number }>;
  } | null>(null);
  
  // Modal States
  const [isAssignAreaOpen, setIsAssignAreaOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  
  const router = useRouter();
  const { user } = useAuthStore();
  const isFullAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchQuota = async () => {
    try {
      const res = await apiClient.get('/users/quota');
      if (res.data?.status === 'ok') {
        setQuota(res.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat data kuota tim:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users');
      setUsers(res.data.data || []);
      fetchQuota();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat daftar staf');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFullAdmin) {
      fetchUsers();
    }
  }, [isFullAdmin]);

  if (!isFullAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <p className="text-sm">Akses Ditolak: Halaman ini hanya untuk Admin dan Manager.</p>
        <button onClick={() => router.push('/dashboard')} className="text-xs text-primary hover:underline">
          ← Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.nama.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to open specific actions
  const openAction = (action: 'edit' | 'reset' | 'delete' | 'area', u: any) => {
    setSelectedUser(u);
    setMobileMenuOpen(null);
    if (action === 'edit') setIsEditOpen(true);
    if (action === 'reset') setIsResetOpen(true);
    if (action === 'delete') setIsDeleteOpen(true);
    if (action === 'area') setIsAssignAreaOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'Admin': return 'bg-blue-500/15 text-blue-500';
      case 'Manager': return 'bg-purple-500/15 text-purple-500';
      case 'Chief CRO': return 'bg-amber-500/15 text-amber-500';
      case 'CRO': return 'bg-emerald-500/15 text-emerald-500';
      default: return 'bg-secondary text-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Header Mobile-First */}
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg text-white">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Manajemen Tim</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Kelola pengguna, hak akses, dan area tugas</p>
          </div>
        </div>

        {/* Sticky-like Button for Mobile/Desktop */}
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="w-full sm:w-auto gradient-primary text-white shadow-lg shadow-primary/20 h-11 sm:h-10 rounded-xl"
        >
          <Plus size={18} className="mr-2" /> Tambah Staf Baru
        </Button>
      </div>

      {/* Quota & Capacity Overview Bar */}
      {quota && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kapasitas Kursi Staf</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Tier {quota.tier}
              </span>
            </div>
            {Object.values(quota.roles).some(r => r.available === 0) && (
              <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                ⚠️ Beberapa role telah mencapai batas maksimal tier
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(quota.roles).map(([roleKey, r]) => {
              const isFull = r.available === 0;
              return (
                <div 
                  key={roleKey}
                  className={cn(
                    "p-3 rounded-xl border transition-colors",
                    isFull ? "bg-amber-500/5 border-amber-500/20" : "bg-secondary/30 border-border/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{r.role}</span>
                    <span className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      isFull ? "bg-amber-500/20 text-amber-500" : "bg-primary/10 text-primary"
                    )}>
                      {r.used} / {r.max}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        isFull ? "bg-amber-500" : "gradient-primary"
                      )} 
                      style={{ width: `${Math.min(100, (r.used / (r.max || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-right">
                    {r.available === 0 ? (
                      <span className="text-amber-500 font-medium">Penuh</span>
                    ) : (
                      <span>Tersedia: {r.available}</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Search */}
      <div className="sticky top-14 sm:top-0 z-10 w-full bg-background/95 backdrop-blur-sm py-2 sm:py-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, username atau role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-card border rounded-xl sm:rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Mobile Card View (Hidden on sm and up) */}
      <div className="sm:hidden space-y-3 mt-2">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada staf ditemukan.</div>
        ) : (
          filteredUsers.map(u => (
            <div key={u.id} className="bg-card border rounded-xl p-4 flex gap-3 relative">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                {u.nama.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate">{u.nama}</h3>
                  <button onClick={() => setMobileMenuOpen(mobileMenuOpen === u.id ? null : u.id)} className="p-1 -mr-1 text-muted-foreground hover:text-foreground">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <span>@{u.username}</span>
                  {u.email && <span className="mx-1">•</span>}
                  {u.email && <span>{u.email}</span>}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getRoleColor(u.role)}`}>
                    {u.role}
                  </span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${u.status === 'Aktif' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {u.status}
                  </span>
                </div>

                {u.role === 'CRO' && u.supervisor_nama && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1 bg-secondary/40 px-2 py-1 rounded-md">
                    <span>Atasan:</span>
                    <span className="font-semibold text-foreground">{u.supervisor_nama}</span>
                    <span className="text-primary text-xs">(Chief CRO)</span>
                  </div>
                )}

                {/* More Menu Dropdown for Mobile */}
                {mobileMenuOpen === u.id && (
                  <div className="absolute right-4 top-12 bg-background border rounded-lg shadow-xl z-20 w-40 flex flex-col py-1 overflow-hidden">
                    <button onClick={() => openAction('edit', u)} className="flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary transition-colors"><Edit2 size={14} /> Edit Staf</button>
                    {u.role === 'Chief CRO' && (
                      <button onClick={() => openAction('area', u)} className="flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary transition-colors"><Map size={14} /> Atur Area</button>
                    )}
                    <button onClick={() => openAction('reset', u)} className="flex items-center gap-2 px-3 py-2 text-xs text-amber-500 text-left hover:bg-amber-500/10 transition-colors"><KeyRound size={14} /> Reset Pass</button>
                    <div className="h-px bg-border my-1" />
                    <button onClick={() => openAction('delete', u)} className="flex items-center gap-2 px-3 py-2 text-xs text-rose-500 text-left hover:bg-rose-500/10 transition-colors"><UserX size={14} /> {u.status === 'Aktif' ? 'Nonaktifkan' : 'Hapus Permanen'}</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden sm:block bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Info Staf</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Area Kecamatan</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">Tidak ada tim ditemukan.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {u.nama.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.nama}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>@{u.username}</span>
                            {u.role === 'CRO' && u.supervisor_nama && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-medium">Chief: {u.supervisor_nama}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.email || <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getRoleColor(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium flex items-center gap-1.5 ${u.status === 'Aktif' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'Chief CRO' ? (
                        <div className="text-xs text-muted-foreground truncate max-w-36">
                          {u.kecamatan_list?.length ? u.kecamatan_list.join(', ') : <span className="text-amber-500 italic">Belum diatur</span>}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/30">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.role === 'Chief CRO' && (
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => openAction('area', u)} title="Atur Area"><Map size={14} /></Button>
                        )}
                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => openAction('edit', u)} title="Edit Profil"><Edit2 size={14} /></Button>
                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-amber-500/20 text-amber-500 hover:bg-amber-500/10" onClick={() => openAction('reset', u)} title="Reset Password"><KeyRound size={14} /></Button>
                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-rose-500/20 text-rose-500 hover:bg-rose-500/10" onClick={() => openAction('delete', u)} title="Nonaktifkan"><UserX size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render All Modals */}
      <AddUserModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchUsers} />
      <EditUserModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} user={selectedUser} onSuccess={fetchUsers} />
      <ResetPasswordModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} user={selectedUser} onSuccess={fetchUsers} />
      <DeleteUserModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} user={selectedUser} onSuccess={fetchUsers} />
      <AssignKecamatanModal 
        isOpen={isAssignAreaOpen}
        onClose={() => setIsAssignAreaOpen(false)}
        userToAssign={selectedUser as any} 
        onSuccess={() => setIsAssignAreaOpen(false)}
      />

    </div>
  );
}
