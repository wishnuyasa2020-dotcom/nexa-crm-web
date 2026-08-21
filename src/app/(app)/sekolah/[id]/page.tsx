'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDragScroll } from '@/hooks/useDragScroll';
import {
  ArrowLeft, Edit2, UserCheck, Plus, Trash2,
  Phone, MapPin, Users, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle,
  MessageSquare, PhoneCall, Handshake, Loader2,
  Play, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatusBadge, AgingBadge, InputAktivitasModal,
  AktivitasEkstraModal, ReassignCROModal, DeleteSekolahModal,
  EditSekolahModal, EditAktivitasModal
} from '@/components/sekolah';
import { getSekolahDetail } from '@/lib/api/sekolah.api';
import type { SekolahDetail, Aktivitas, AktivitasEkstra } from '@/lib/types/sekolah.types';
import { isManagerOrAdmin } from '@/lib/constants/sekolah';
import { useAuthStore } from '@/store/useAuthStore';

type TabKey = 'info' | 'aktivitas' | 'siswa' | 'ekstra';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info',      label: 'Info' },
  { key: 'aktivitas', label: 'Aktivitas' },
  { key: 'siswa',     label: 'Siswa' },
  { key: 'ekstra',    label: 'Riwayat Ekstra' },
];

// ── Helper: waktu relatif ──────────────────────────────────
function timeAgo(isoDatetime: string) {
  const d = new Date(isoDatetime);
  const diff = (Date.now() - d.getTime()) / 60000; // in minutes
  if (diff < 60) return `${Math.floor(diff)} menit lalu`;
  if (diff < 1440) return `${Math.floor(diff / 60)} jam lalu`;
  return `${Math.floor(diff / 1440)} hari lalu`;
}

function withinEditWindow(isoDatetime: string, isManager: boolean): boolean {
  const ageMin = (Date.now() - new Date(isoDatetime).getTime()) / 60000;
  return isManager ? ageMin <= 1440 : ageMin <= 60;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Jenis Aktivitas Ekstra Icon ──────────────────────────
function EkstraIcon({ jenis }: { jenis: string }) {
  if (jenis === 'WhatsApp PIC') return <MessageSquare size={14} className="text-emerald-400" />;
  if (jenis === 'Telepon PIC') return <PhoneCall size={14} className="text-blue-400" />;
  return <Handshake size={14} className="text-violet-400" />;
}

function EkstraStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Direncanakan': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Selesai':      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Dibatalkan':   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <span className={cn('text-[11px] px-2 py-0.5 rounded border font-medium', map[status] ?? 'text-muted-foreground')}>
      {status}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
export default function SekolahDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [sekolah, setSekolah]     = useState<SekolahDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const userRole = user?.role ?? 'CRO';
  const userName = user?.nama ?? user?.username ?? '';

  // Modals
  const [showInputAktivitas, setShowInputAktivitas]   = useState(false);
  const [showAktivitasEkstra, setShowAktivitasEkstra] = useState(false);
  const [showReassign, setShowReassign]               = useState(false);
  const [showDelete, setShowDelete]                   = useState(false);
  const [showEdit, setShowEdit]                       = useState(false);

  // Edit aktivitas
  const [editingAktivitas, setEditingAktivitas] = useState<Aktivitas | null>(null);

  // Konfirmasi Selesai / Batalkan ekstra
  const [confirmEkstra, setConfirmEkstra] = useState<{
    ae: AktivitasEkstra;
    action: 'selesai' | 'batal';
  } | null>(null);

  // Drag to scroll logic for Tabs
  const scrollContainerRef = useDragScroll<HTMLDivElement>();

  // ── Fetch data sekolah ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSekolahDetail(id);
      setSekolah(data);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (e?.response?.status === 404) {
        setError('not_found');
      } else {
        setError(e?.response?.data?.message || e?.message || 'Gagal memuat data.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 size={32} className="opacity-40 animate-spin" />
        <p className="text-sm">Memuat data sekolah...</p>
      </div>
    );
  }

  // ── Error / Not Found ───────────────────────────────────────
  if (error || !sekolah) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertCircle size={36} className="opacity-30" />
        <p className="text-sm">{error === 'not_found' ? 'Sekolah tidak ditemukan' : (error ?? 'Terjadi kesalahan')}</p>
        <button onClick={() => router.push('/sekolah')} className="text-xs text-primary hover:underline">
          ← Kembali ke Daftar Sekolah
        </button>
      </div>
    );
  }

  const isManager = isManagerOrAdmin(userRole);
  const isCRO = userRole === 'CRO';
  const canEkstra = !isCRO && ['Sudah Sosialisasi', 'Lead Captured'].includes(sekolah.status);
  const hasEkstraActive = sekolah.aktivitasEkstra.some(a => a.statusAktivitas === 'Direncanakan');

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb / Back ── */}
      <button
        onClick={() => router.push('/sekolah')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Kembali ke Daftar Sekolah
      </button>

      {/* ── Page Header ── */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm sm:shadow-none relative z-10">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{sekolah.nama}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{sekolah.tingkat}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin size={11} />{sekolah.kecamatan}</span>
              {sekolah.jumlahSiswaKelas12 > 0 && (
                <span className="flex items-center gap-1"><Users size={11} />{sekolah.jumlahSiswaKelas12} siswa kls 12</span>
              )}
              <span className="flex items-center gap-1"><Calendar size={11} />{sekolah.marketingPeriod}</span>
            </div>
          </div>
          <StatusBadge status={sekolah.status} size="md" showDot />
        </div>

        {/* Info Grid - hidden on mobile when sticky? We'll just hide it on very small screens or keep it scrollable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 hidden sm:grid">
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Next Action</p>
            <p className="text-sm font-medium text-foreground">{sekolah.nextAction ?? '—'}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Due Date</p>
            <AgingBadge dueDate={sekolah.dueDate} className="text-sm font-medium" />
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">PJ CRO</p>
            <p className="text-sm font-medium text-foreground">{sekolah.pjCro}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status Sekolah</p>
            <p className="text-sm font-medium">
              {sekolah.statusAktif === 'Aktif' ? (
                <span className="text-emerald-400">🟢 Aktif</span>
              ) : sekolah.statusAktif === 'Nonaktif' ? (
                <span className="text-rose-400">🔴 Nonaktif</span>
              ) : (
                <span className="text-muted-foreground">Belum Diketahui</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCRO && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
            <button 
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <Edit2 size={13} /> Edit Sekolah
            </button>
            {isManager && (
              <>
                <button
                  onClick={() => setShowReassign(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  <UserCheck size={13} /> Reassign CRO
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-rose-500/70 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </>
            )}
            {canEkstra && (
              <button
                onClick={() => setShowAktivitasEkstra(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-all"
              >
                <Plus size={13} /> Aktivitas Ekstra
                {hasEkstraActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            )}
            <button
              onClick={() => setShowInputAktivitas(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 ml-auto"
            >
              <Play size={13} /> Input Aktivitas
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="mt-4 min-h-[100dvh]">
        {/* Tab Nav (Sticky on Mobile) */}
        <div className="sticky -top-4 z-40 py-2 -mx-4 px-4 bg-background/95 backdrop-blur-md md:static md:bg-transparent md:mx-0 md:px-0 md:py-0">
          <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
            <div
              ref={scrollContainerRef}
              className="flex border-b border-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px',
                    activeTab === tab.key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/50',
                    tab.key === 'ekstra' && hasEkstraActive && 'after:content-["●"] after:text-amber-400 after:text-[8px] after:ml-1'
                  )}
                >
                  {tab.label}
                  {tab.key === 'ekstra' && hasEkstraActive && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-2xl mt-2 md:mt-4 p-4 sm:p-5">
          {activeTab === 'info'      && (
            <div className="space-y-8">
              <TabDetail sekolah={sekolah} />
              <div className="border-t border-border pt-6">
                <TabPIC sekolah={sekolah} />
              </div>
            </div>
          )}
          {activeTab === 'aktivitas' && (
            <TabAktivitas
              aktivitas={sekolah.aktivitas}
              isManager={isManager}
              isCRO={isCRO}
              onEdit={ak => setEditingAktivitas(ak)}
            />
          )}
          {activeTab === 'siswa'     && <TabSiswa />}
          {activeTab === 'ekstra'    && (
            <TabEkstra
              ekstra={sekolah.aktivitasEkstra}
              canAdd={canEkstra}
              isCRO={isCRO}
              onAdd={() => setShowAktivitasEkstra(true)}
              onSelesai={ae => setConfirmEkstra({ ae, action: 'selesai' })}
              onBatalkan={ae => setConfirmEkstra({ ae, action: 'batal' })}
            />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <InputAktivitasModal
        isOpen={showInputAktivitas}
        onClose={() => setShowInputAktivitas(false)}
        sekolah={sekolah}
        onSuccess={() => {
          setShowInputAktivitas(false);
          setActiveTab('aktivitas');
          fetchData();
        }}
      />
      <AktivitasEkstraModal
        isOpen={showAktivitasEkstra}
        onClose={() => setShowAktivitasEkstra(false)}
        sekolah={sekolah}
        onSuccess={() => {
          setShowAktivitasEkstra(false);
          setActiveTab('ekstra');
          fetchData();
        }}
      />
      <ReassignCROModal
        isOpen={showReassign}
        onClose={() => setShowReassign(false)}
        sekolah={sekolah}
        onSuccess={() => {
          setShowReassign(false);
          fetchData();
        }}
      />
      <DeleteSekolahModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        sekolah={sekolah}
        onSuccess={() => router.push('/sekolah')}
      />
      <EditSekolahModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        sekolah={sekolah}
        onSuccess={() => {
          setShowEdit(false);
          fetchData();
        }}
      />

      {/* ── Edit Aktivitas Modal ── */}
      <EditAktivitasModal
        isOpen={!!editingAktivitas}
        onClose={() => setEditingAktivitas(null)}
        aktivitas={editingAktivitas}
        isManager={isManager}
        userName={userName}
        onSuccess={() => {
          setEditingAktivitas(null);
          fetchData();
        }}
      />

      {/* ── Konfirmasi Selesai / Batalkan Ekstra ── */}
      {confirmEkstra && (
        <KonfirmasiEkstraModal
          ae={confirmEkstra.ae}
          action={confirmEkstra.action}
          onClose={() => setConfirmEkstra(null)}
          onSuccess={() => {
            setConfirmEkstra(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ════════ TAB COMPONENTS ════════

function TabDetail({ sekolah }: { sekolah: SekolahDetail }) {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informasi Primer</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nama Sekolah</dt>
            <dd className="font-medium text-foreground text-right">{sekolah.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Jenjang</dt>
            <dd className="font-medium text-foreground">{sekolah.tingkat}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Kecamatan</dt>
            <dd className="font-medium text-foreground">{sekolah.kecamatan}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Alamat</dt>
            <dd className="font-medium text-foreground text-right max-w-[60%]">{sekolah.alamat || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Siswa Kls 12</dt>
            <dd className="font-medium text-foreground">{sekolah.jumlahSiswaKelas12 || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status Aktif</dt>
            <dd className="font-medium">
              {sekolah.statusAktif === 'Aktif' ? (
                <span className="text-emerald-400">🟢 Aktif</span>
              ) : sekolah.statusAktif === 'Nonaktif' ? (
                <span className="text-rose-400">🔴 Nonaktif</span>
              ) : (
                <span className="text-muted-foreground">Belum Diketahui</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ID Sekolah</dt>
            <dd className="font-mono text-[11px] text-muted-foreground">{sekolah.id}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status CRM</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">Status Terkini</dt>
            <dd><StatusBadge status={sekolah.status} size="sm" /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Next Action</dt>
            <dd className="font-medium text-foreground">{sekolah.nextAction ?? '—'}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">Due Date</dt>
            <dd><AgingBadge dueDate={sekolah.dueDate} /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">PJ CRO</dt>
            <dd className="font-medium text-foreground">{sekolah.pjCro}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Marketing Period</dt>
            <dd className="font-medium text-foreground">{sekolah.marketingPeriod}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total Aktivitas</dt>
            <dd className="font-medium text-foreground">{sekolah.aktivitas.length}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function TabAktivitas({
  aktivitas, isManager, isCRO, onEdit,
}: {
  aktivitas: Aktivitas[];
  isManager: boolean;
  isCRO: boolean;
  onEdit: (ak: Aktivitas) => void;
}) {
  if (aktivitas.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        <Clock size={28} className="mx-auto mb-2 opacity-20" />
        Belum ada aktivitas tercatat
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {aktivitas.map((ak, i) => {
        const canEdit = withinEditWindow(ak.createdAt, isManager);
        return (
          <div
            key={ak.id}
            className={cn(
              'relative pl-5 border-l-2 pb-4',
              i === 0 ? 'border-primary' : 'border-border',
            )}
          >
            {/* Timeline dot */}
            <div className={cn(
              'absolute -left-[5px] top-1 w-2 h-2 rounded-full border-2',
              i === 0 ? 'bg-primary border-primary' : 'bg-card border-muted-foreground'
            )} />

            {/* Header */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDate(ak.tanggal)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground font-medium">
                  {ak.jenisAktivitas}
                </span>
              </div>
              {!isCRO && canEdit && (
                <button
                  onClick={() => onEdit(ak)}
                  className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors px-2 py-0.5 rounded border border-primary/20 hover:border-primary/40"
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {/* Content */}
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-muted-foreground text-xs w-14 shrink-0">Hasil</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  {ak.hasilAktivitas}
                </span>
              </div>
              {ak.catatan && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs w-14 shrink-0">Catatan</span>
                  <span className="text-sm text-muted-foreground">{ak.catatan}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground text-xs w-14 shrink-0">Update</span>
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">{ak.statusSesudah}</span>
                </span>
              </div>
            </div>


          </div>
        );
      })}
    </div>
  );
}

function TabPIC({ sekolah }: { sekolah: SekolahDetail }) {
  const pic = sekolah.pic;
  if (!pic) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        <Phone size={28} className="mx-auto mb-2 opacity-20" />
        <p>Data PIC belum diisi.</p>
        <p className="text-xs mt-1">Akan otomatis terisi saat input aktivitas Visit Awal.</p>
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kontak PIC Sekolah</h3>
      <dl className="space-y-3 text-sm">
        <div className="bg-secondary/30 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nama</dt>
            <dd className="font-semibold text-foreground">{pic.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Jabatan</dt>
            <dd className="text-foreground">{pic.jabatan}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">No. WA</dt>
            <dd>
              <a
                href={`https://wa.me/${pic.noWa.replace(/^0/, '62')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline font-medium"
              >
                {pic.noWa}
              </a>
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}

function TabSiswa() {
  return (
    <div className="py-12 text-center text-muted-foreground text-sm">
      <Users size={28} className="mx-auto mb-2 opacity-20" />
      <p>Modul Data Siswa</p>
      <p className="text-xs mt-1">Tersedia di modul terpisah — akan terhubung otomatis.</p>
    </div>
  );
}

function TabEkstra({
  ekstra, canAdd, onAdd, isCRO, onSelesai, onBatalkan,
}: {
  ekstra: AktivitasEkstra[];
  canAdd: boolean;
  onAdd: () => void;
  isCRO: boolean;
  onSelesai: (ae: AktivitasEkstra) => void;
  onBatalkan: (ae: AktivitasEkstra) => void;
}) {
  return (
    <div className="space-y-3">
      {canAdd && (
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-all"
          >
            <Plus size={13} /> Aktivitas Ekstra
          </button>
        </div>
      )}

      {ekstra.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          <RotateCcw size={24} className="mx-auto mb-2 opacity-20" />
          Belum ada aktivitas ekstra
        </div>
      ) : (
        ekstra.map(ae => (
          <div key={ae.id} className="border border-border rounded-xl p-4 space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <EkstraIcon jenis={ae.jenisAktivitas} />
                <span className="text-sm font-semibold text-foreground">{ae.jenisAktivitas}</span>
                <span className="text-xs text-muted-foreground">📅 {formatDate(ae.tanggalRencana)}</span>
              </div>
              <EkstraStatusBadge status={ae.statusAktivitas} />
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">PJ:</span> {ae.pjAktivitas}
              {' · '}
              <span className="text-foreground">Tujuan:</span> {ae.tujuanCatatan}
            </p>

            {ae.catatanHasil && (
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground">Hasil:</span> {ae.catatanHasil}
              </p>
            )}


            {/* Actions */}
            {!isCRO && ae.statusAktivitas === 'Direncanakan' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onSelesai(ae)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors"
                >
                  <CheckCircle size={12} /> Selesaikan
                </button>
                <button
                  onClick={() => onBatalkan(ae)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                >
                  <XCircle size={12} /> Batalkan
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ════ KONFIRMASI EKSTRA MODAL ════
function KonfirmasiEkstraModal({
  ae,
  action,
  onClose,
  onSuccess,
}: {
  ae: AktivitasEkstra;
  action: 'selesai' | 'batal';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [tanggalRealisasi, setTanggalRealisasi] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [catatanHasil, setCatatanHasil] = useState('');
  const [alasanBatal, setAlasanBatal] = useState('');

  const isSelesai = action === 'selesai';
  const formValid = isSelesai ? true : alasanBatal.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    try {
      if (isSelesai) {
        const { selesaikanEkstra } = await import('@/lib/api/sekolah.api');
        await selesaikanEkstra(ae.id, { tanggalRealisasi, catatanHasil: catatanHasil || undefined });
      } else {
        const { batalkanEkstra } = await import('@/lib/api/sekolah.api');
        await batalkanEkstra(ae.id, { alasanBatal: alasanBatal || undefined });
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Gagal memperbarui aktivitas ekstra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl border border-border flex flex-col">

        {/* Header */}
        <div className={cn(
          'flex items-center gap-3 p-4 sm:p-5 border-b border-border',
          isSelesai ? 'bg-emerald-500/5' : 'bg-rose-500/5'
        )}>
          {isSelesai
            ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
            : <XCircle size={18} className="text-rose-400 flex-shrink-0" />
          }
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">
              {isSelesai ? 'Selesaikan Aktivitas' : 'Batalkan Aktivitas'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">{ae.jenisAktivitas} · {ae.pjAktivitas}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <XCircle size={14} />
          </button>
        </div>

        {/* Body */}
        <form id="konfirmasiEkstraForm" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">

          {/* Tujuan readonly */}
          <div className="p-3 bg-secondary/30 rounded-xl text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground text-sm">{ae.jenisAktivitas}</p>
            <p>Tujuan: {ae.tujuanCatatan}</p>
          </div>

          {isSelesai ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tanggal Realisasi *</label>
                <input
                  required
                  type="date"
                  value={tanggalRealisasi}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setTanggalRealisasi(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Catatan Hasil <span className="text-muted-foreground/60">(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={catatanHasil}
                  onChange={e => setCatatanHasil(e.target.value)}
                  placeholder="Ringkasan hasil aktivitas ekstra..."
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors resize-none placeholder:text-muted-foreground"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Alasan Pembatalan * <span className="text-rose-500 text-[10px]">min 5 karakter</span>
              </label>
              <textarea
                required
                rows={3}
                value={alasanBatal}
                onChange={e => setAlasanBatal(e.target.value)}
                placeholder="Jelaskan alasan pembatalan..."
                className={cn(
                  'w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors resize-none placeholder:text-muted-foreground',
                  !formValid && alasanBatal.length > 0 && 'border-rose-500 ring-1 ring-rose-500'
                )}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="konfirmasiEkstraForm"
            disabled={loading || !formValid}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all',
              isSelesai
                ? 'bg-emerald-500 shadow-emerald-500/20'
                : 'bg-rose-500 shadow-rose-500/20'
            )}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isSelesai ? '✅ Selesaikan' : '❌ Batalkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
