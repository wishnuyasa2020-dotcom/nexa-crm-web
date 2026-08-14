'use client';

import { useState } from 'react';
import { Users, Search, Map } from 'lucide-react';
import { AssignKecamatanModal } from '@/components/manajemen-tim/AssignKecamatanModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

// Mock data for users
const MOCK_USERS = [
  { id: '1', username: 'budi_cro', nama: 'Budi Santoso', role: 'CRO', status: 'Aktif' },
  { id: '2', username: 'andi_chief', nama: 'Andi M', role: 'Chief CRO', status: 'Aktif', kecamatan_list: ['Cibeunying Kidul', 'Coblong'] },
  { id: '3', username: 'siti_cro', nama: 'Siti Aminah', role: 'CRO', status: 'Aktif' },
  { id: '4', username: 'faisal_chief', nama: 'Ahmad Faisal', role: 'Chief CRO', status: 'Aktif', kecamatan_list: [] },
];

export default function ManajemenTimPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const router = useRouter();
  const { user } = useAuthStore();
  const isFullAdmin = user?.role === 'Admin' || user?.role === 'Manager';

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
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (user: typeof MOCK_USERS[0]) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 flex-shrink-0">
          <Users size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Manajemen Tim</h1>
          <p className="text-xs text-muted-foreground">Kelola role dan area tanggung jawab Chief CRO</p>
        </div>
      </div>

      {/* Filter */}
      <div className="relative w-full md:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama atau role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Username</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Area Kecamatan</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Tidak ada tim ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{user.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{user.username}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-emerald-400">● {user.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'Chief CRO' ? (
                        <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                          {user.kecamatan_list && user.kecamatan_list.length > 0 ? (
                            <span>{user.kecamatan_list.join(', ')}</span>
                          ) : (
                            <span className="text-amber-400 italic">Belum di-assign</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role === 'Chief CRO' && (
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                        >
                          <Map size={13} /> Atur Area
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssignKecamatanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToAssign={selectedUser}
        onSuccess={() => {
          setIsModalOpen(false);
          // TODO: reload users from API
        }}
      />
    </div>
  );
}
