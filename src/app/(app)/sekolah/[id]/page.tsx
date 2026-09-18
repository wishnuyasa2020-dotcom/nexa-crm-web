'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDragScroll } from '@/hooks/useDragScroll';
import Link from 'next/link';
import {
  ArrowLeft, Edit2, UserCheck, Plus, Trash2,
  Phone, MapPin, Users, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle,
  MessageSquare, PhoneCall, Handshake, Loader2,
  Play, RotateCcw, ExternalLink, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import {
  StatusBadge, AgingBadge,
  AktivitasEkstraModal, ReassignCROModal, DeleteSekolahModal,
  EditSekolahModal,
} from '@/components/sekolah';
import { CatatInteraksiModal } from '@/components/sekolah/CatatInteraksiModal';
import { IntentBadge } from '@/components/sekolah/IntentBadge';
import { CommercialStateBadge } from '@/components/siswa/CommercialStateBadge';
import { CANONICAL_STATES } from '@/lib/constants/lifecycle';
import { getSekolahDetail } from '@/lib/api/sekolah.api';
import type { SekolahDetail, Aktivitas, AktivitasEkstra } from '@/lib/types/sekolah.types';
import { isManagerOrAdmin, EVENT_TYPE_CONFIG } from '@/lib/constants/sekolah';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

type TabKey = 'info' | 'aktivitas' | 'siswa' | 'ekstra';

// ── Helper: waktu relatif ──────────────────────────────────
function timeAgo(isoDatetime: string, isEn = false) {
  const d = new Date(isoDatetime);
  const diff = (Date.now() - d.getTime()) / 60000; // in minutes
  if (diff < 60) return isEn ? `${Math.floor(diff)} min ago` : `${Math.floor(diff)} menit lalu`;
  if (diff < 1440) return isEn ? `${Math.floor(diff / 60)} hr ago` : `${Math.floor(diff / 60)} jam lalu`;
  return isEn ? `${Math.floor(diff / 1440)} days ago` : `${Math.floor(diff / 1440)} hari lalu`;
}

function formatDate(iso: string | null, loc = 'id-ID') {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Jenis Aktivitas Ekstra Icon ──────────────────────────
function EkstraIcon({ jenis }: { jenis: string }) {
  if (jenis === 'WhatsApp PIC') return <MessageSquare size={14} className="text-emerald-400" />;
  if (jenis === 'Telepon PIC') return <PhoneCall size={14} className="text-blue-400" />;
  return <Handshake size={14} className="text-violet-400" />;
}

function EkstraStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { cls: string; label: string }> = {
    'Direncanakan': { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: t('sekolah.extraStatusPlanned') },
    'Selesai':      { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: t('sekolah.extraStatusFinished') },
    'Dibatalkan':   { cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: t('sekolah.extraStatusCancelled') },
  };
  const item = map[status];
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', item?.cls ?? 'text-muted-foreground')}>
      {item?.label ?? status}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
export default function SekolahDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();

  const [sekolah, setSekolah]     = useState<SekolahDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const userRole = user?.role ?? 'CRO';
  const userName = user?.nama ?? user?.username ?? '';

  const tabs = [
    { key: 'info' as TabKey,      label: t('sekolah.tabInfo') },
    { key: 'aktivitas' as TabKey, label: t('sekolah.tabActivity') },
    { key: 'siswa' as TabKey,     label: isGeneral ? t('sekolah.tabContact') : t('sekolah.tabStudent') },
    { key: 'ekstra' as TabKey,    label: t('sekolah.tabExtra') },
  ];

  // Modals
  const [showCatatInteraksi, setShowCatatInteraksi] = useState(false);
  const [showAktivitasEkstra, setShowAktivitasEkstra] = useState(false);
  const [showReassign, setShowReassign]               = useState(false);
  const [showDelete, setShowDelete]                   = useState(false);
  const [showEdit, setShowEdit]                       = useState(false);

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
        <p className="text-sm">{isGeneral ? t('sekolah.loadingDetailPartner') : t('sekolah.loadingDetailSchool')}</p>
      </div>
    );
  }

  // ── Error / Not Found ───────────────────────────────────────
  if (error || !sekolah) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertCircle size={36} className="opacity-30" />
        <p className="text-sm">
          {error === 'not_found'
            ? (isGeneral ? t('sekolah.notFoundPartner') : t('sekolah.notFoundSchool'))
            : (error ?? t('sekolah.genericError'))}
        </p>
        <button onClick={() => router.push('/sekolah')} className="text-xs text-primary hover:underline cursor-pointer">
          ← {isGeneral ? t('sekolah.backToListPartner') : t('sekolah.backToListSchool')}
        </button>
      </div>
    );
  }

  const isManager = isManagerOrAdmin(userRole);
  const isCRO = userRole === 'CRO';
  const canEkstra = !isCRO && ['Sudah Sosialisasi', 'Identity Captured', 'Lead Captured'].includes(sekolah.status);
  const hasEkstraActive = sekolah.aktivitasEkstra.some(a => a.statusAktivitas === 'Direncanakan');

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb / Back ── */}
      <button
        onClick={() => router.push('/sekolah')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} />
        {isGeneral ? t('sekolah.backToListPartner') : t('sekolah.backToListSchool')}
      </button>

      {/* ── Page Header ── */}
      <div className="bg-card border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm sm:shadow-none relative z-10">
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
                <span className="flex items-center gap-1">
                  <Users size={11} />{sekolah.jumlahSiswaKelas12} {t('sekolah.grade12StudentsSuffix')}
                </span>
              )}
              <span className="flex items-center gap-1"><Calendar size={11} />{sekolah.marketingPeriod}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <IntentBadge intent={sekolah.intent} size="md" />
            <StatusBadge status={sekolah.status} size="md" showDot />
          </div>
        </div>

        {/* Info Grid */}
        <div className="hidden sm:grid sm:grid-cols-4 grid-cols-2 gap-3">
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('sekolah.colNextAction')}</p>
            <p className="text-sm font-medium text-foreground">{sekolah.nextAction ?? '—'}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('sekolah.colDueDate')}</p>
            <AgingBadge dueDate={sekolah.dueDate} className="text-sm font-medium" />
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('sekolah.colPicCro')}</p>
            <p className="text-sm font-medium text-foreground">{sekolah.pjCro}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {isGeneral ? t('sekolah.statusPartner') : t('sekolah.statusSchool')}
            </p>
            <p className="text-sm font-medium">
              {sekolah.statusAktif === 'Aktif' ? (
                <span className="text-emerald-400">{t('sekolah.statusActive')}</span>
              ) : sekolah.statusAktif === 'Nonaktif' ? (
                <span className="text-rose-400">{t('sekolah.statusInactive')}</span>
              ) : (
                <span className="text-muted-foreground">{t('sekolah.statusUnknown')}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCRO && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
            <button 
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-pointer"
            >
              <Edit2 size={13} /> {isGeneral ? t('sekolah.editPartner') : t('sekolah.editSchool')}
            </button>
            {isManager && (
              <>
                <button
                  onClick={() => setShowReassign(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-pointer"
                >
                  <UserCheck size={13} /> {t('sekolah.reassignCro')}
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-rose-500/70 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <Trash2 size={13} /> {t('sekolah.deleteSchoolBtn')}
                </button>
              </>
            )}
            {canEkstra && (
              <button
                onClick={() => setShowAktivitasEkstra(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <Plus size={13} /> {t('sekolah.extraActivityBtn')}
                {hasEkstraActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            )}
            <button
              onClick={() => setShowCatatInteraksi(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 ml-auto cursor-pointer"
            >
              <Play size={13} /> {t('sekolah.logInteractionBtn')}
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="mt-4 min-h-dvh">
        {/* Tab Nav (Sticky on Mobile) */}
        <div className="sticky -top-4 z-40 py-2 -mx-4 px-4 bg-background/95 backdrop-blur-md md:static md:bg-transparent md:mx-0 md:px-0 md:py-0">
          <div className="bg-card border rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
            <div
              ref={scrollContainerRef}
              className="flex border-b overflow-x-auto scrollbar-none"
            >
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px cursor-pointer',
                    activeTab === tab.key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/50',
                    tab.key === 'ekstra' && hasEkstraActive && 'after:content-["●"] after:text-amber-400 after:text-xs after:ml-1'
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
        <div className="bg-card border rounded-2xl mt-2 md:mt-4 p-4 sm:p-5">
          {activeTab === 'info'      && (
            <div className="space-y-8">
              <TabDetail sekolah={sekolah} />
              <div className="border-t pt-6">
                <TabPIC sekolah={sekolah} />
              </div>
            </div>
          )}
          {activeTab === 'aktivitas' && (
            <TabAktivitas
              aktivitas={sekolah.aktivitas}
            />
          )}
          {activeTab === 'siswa'     && <TabSiswa sekolahId={sekolah.id} namaSekolah={sekolah.nama} />}
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
      <CatatInteraksiModal
        isOpen={showCatatInteraksi}
        onClose={() => setShowCatatInteraksi(false)}
        sekolah={sekolah}
        onSuccess={() => {
          setShowCatatInteraksi(false);
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

      {/* Edit Aktivitas modal removed — Event Log is now Append-Only (Fase 1 Ontologi) */}

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
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sekolah.primaryInfo')}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{isGeneral ? t('sekolah.partnerName') : t('sekolah.schoolName')}</dt>
            <dd className="font-medium text-foreground text-right">{sekolah.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.level')}</dt>
            <dd className="font-medium text-foreground">{sekolah.tingkat}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.district')}</dt>
            <dd className="font-medium text-foreground">{sekolah.kecamatan}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.address')}</dt>
            <dd className="font-medium text-foreground text-right max-w-xs">{sekolah.alamat || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.grade12Count')}</dt>
            <dd className="font-medium text-foreground">{sekolah.jumlahSiswaKelas12 || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.activeStatus')}</dt>
            <dd className="font-medium">
              {sekolah.statusAktif === 'Aktif' ? (
                <span className="text-emerald-400">{t('sekolah.statusActive')}</span>
              ) : sekolah.statusAktif === 'Nonaktif' ? (
                <span className="text-rose-400">{t('sekolah.statusInactive')}</span>
              ) : (
                <span className="text-muted-foreground">{t('sekolah.statusUnknown')}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{isGeneral ? t('sekolah.partnerId') : t('sekolah.schoolId')}</dt>
            <dd className="font-mono text-xs text-muted-foreground">{sekolah.id}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sekolah.crmStatus')}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">{t('sekolah.currentStatus')}</dt>
            <dd><StatusBadge status={sekolah.status} size="sm" /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.colNextAction')}</dt>
            <dd className="font-medium text-foreground">{sekolah.nextAction ?? '—'}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">{t('sekolah.colDueDate')}</dt>
            <dd><AgingBadge dueDate={sekolah.dueDate} /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.colPicCro')}</dt>
            <dd className="font-medium text-foreground">{sekolah.pjCro}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.marketingPeriod')}</dt>
            <dd className="font-medium text-foreground">{sekolah.marketingPeriod}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.totalActivities')}</dt>
            <dd className="font-medium text-foreground">{sekolah.aktivitas.length}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function TabAktivitas({
  aktivitas,
}: {
  aktivitas:  Aktivitas[];
  isManager?: boolean;
  isCRO?:     boolean;
  onEdit?:    (ak: Aktivitas) => void;
}) {
  const { t, lang } = useTranslation();
  const loc = lang === 'en' ? 'en-US' : 'id-ID';

  if (aktivitas.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        <Clock size={28} className="mx-auto mb-2 opacity-20" />
        {t('sekolah.noActivityYet')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Append-Only label */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sekolah.eventLogTitle')}</h3>
        <span className="text-xs text-muted-foreground/60">{aktivitas.length} {t('sekolah.entriesCount')}</span>
      </div>
      {aktivitas.map((ak, i) => {
        const evCfg = EVENT_TYPE_CONFIG[ak.eventType] ?? EVENT_TYPE_CONFIG['InteractionLogged'];
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
              'absolute -left-1.25 top-1 w-2 h-2 rounded-full border-2',
              i === 0 ? 'bg-primary border-primary' : 'bg-card border-muted-foreground'
            )} />

            {/* Header */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDate(ak.tanggal, loc)}
                </span>
                {/* Event Type Badge */}
                <span className={cn('text-xs px-2 py-0.5 rounded border font-semibold', evCfg.color, 'bg-secondary')} title={ak.eventType}>
                  {evCfg.icon} {evCfg.label}
                </span>
                {ak.jenisAktivitas && (
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                    {ak.jenisAktivitas}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-muted-foreground text-xs w-14 shrink-0">{t('sekolah.outcomeLabel')}</span>
                <span className="font-medium text-foreground">{ak.outcome || ak.hasilAktivitas}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground text-xs w-14 shrink-0">{t('sekolah.updateLabel')}</span>
                <span className="text-xs text-foreground font-medium">{ak.statusSesudah}</span>
              </div>
              {ak.catatan && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs w-14 shrink-0">{t('sekolah.notesLabel')}</span>
                  <span className="text-sm text-muted-foreground">{ak.catatan}</span>
                </div>
              )}
              {ak.alasanTidakBisa && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs w-14 shrink-0">{t('sekolah.reasonLabel')}</span>
                  <span className="text-sm text-rose-400">{ak.alasanTidakBisa}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabPIC({ sekolah }: { sekolah: SekolahDetail }) {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();
  const pic = sekolah.pic;
  if (!pic) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        <Phone size={28} className="mx-auto mb-2 opacity-20" />
        <p>{t('sekolah.picEmptyTitle')}</p>
        <p className="text-xs mt-1">{t('sekolah.picEmptyDesc')}</p>
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {isGeneral ? t('sekolah.picContactPartner') : t('sekolah.picContactSchool')}
      </h3>
      <dl className="space-y-3 text-sm">
        <div className="bg-secondary/30 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.picName')}</dt>
            <dd className="font-semibold text-foreground">{pic.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('sekolah.picPosition')}</dt>
            <dd className="text-foreground">{pic.jabatan}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">{t('sekolah.picWa')}</dt>
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

interface SiswaItem {
  id: string;
  idRecord?: string;
  nama: string;
  namaSekolah?: string;
  kelas?: string;
  cro?: string;
  status?: string;
  commercialState?: string;
  intent?: string;
  priorityScore?: number;
  nextAction?: string;
  prioritas?: string;
  dueDate?: string;
  wa?: string;
  bsuid?: string;
}

function TabSiswa({ sekolahId, namaSekolah }: { sekolahId: string; namaSekolah: string }) {
  const { t } = useTranslation();
  const { isGeneral } = useTenantVocabulary();

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSiswa = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ status: string; data: { data: SiswaItem[]; total: number } }>(
        '/api/v1/siswa',
        { params: { sekolahId, pageSize: 50 } }
      );
      if (res.data.status === 'ok') {
        setSiswaList(res.data.data.data || []);
        setTotal(res.data.data.total || 0);
      } else {
        setError(isGeneral ? t('sekolah.failedLoadContacts') : t('sekolah.failedLoadStudents'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isGeneral ? t('sekolah.failedLoadContacts') : t('sekolah.failedLoadStudents')));
    } finally {
      setLoading(false);
    }
  }, [sekolahId, isGeneral, t]);

  useEffect(() => {
    fetchSiswa();
  }, [fetchSiswa]);

  const handleCopyFormLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/public/form-siswa?sekolahId=${sekolahId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm font-medium">{isGeneral ? t('sekolah.loadingContacts') : t('sekolah.loadingStudents')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-rose-500 space-y-3">
        <AlertCircle size={28} className="mx-auto" />
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchSiswa}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
        >
          {t('sekolah.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users size={16} className="text-primary" />
            {isGeneral ? t('sekolah.registeredContactsTitle') : t('sekolah.registeredStudentsTitle')}
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
              {total} {isGeneral ? t('sekolah.tabContact') : t('sekolah.tabStudent')}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isGeneral ? t('sekolah.contactsConnectedWith') : t('sekolah.studentsConnectedWith')} {namaSekolah} {t('sekolah.inThisPeriod')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFormLink}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-pointer"
            title={t('sekolah.copyFormTooltip')}
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? t('sekolah.copiedBadge') : (isGeneral ? t('sekolah.copyContactForm') : t('sekolah.copyStudentForm'))}
          </button>
          <Link
            href={`/siswa?search=${encodeURIComponent(namaSekolah)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <span>{isGeneral ? t('sekolah.openContactModule') : t('sekolah.openStudentModule')}</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {siswaList.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground/40">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isGeneral ? t('sekolah.emptyContactTitle') : t('sekolah.emptyStudentTitle')}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {isGeneral ? t('sekolah.emptyContactDesc') : t('sekolah.emptyStudentDesc')}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleCopyFormLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition-all cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('sekolah.copiedBadge') : (isGeneral ? t('sekolah.copyContactFormLink') : t('sekolah.copyStudentFormLink'))}
            </button>
          </div>
        </div>
      ) : (
        /* Table of Students */
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3 px-4">{isGeneral ? t('sekolah.tableColContactName') : t('sekolah.tableColStudentName')}</th>
                <th className="py-3 px-3">{t('sekolah.tableColClass')}</th>
                <th className="py-3 px-3">{t('sekolah.tableColWa')}</th>
                <th className="py-3 px-3">{t('sekolah.tableColCommercial')}</th>
                <th className="py-3 px-3">{t('sekolah.tableColCro')}</th>
                <th className="py-3 px-3 text-right">{t('sekolah.tableColAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {siswaList.map((siswa) => (
                <tr key={siswa.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">
                    <Link
                      href={`/siswa/${siswa.id}`}
                      className="hover:underline hover:text-primary font-semibold"
                    >
                      {siswa.nama || '—'}
                    </Link>
                    {siswa.id && (
                      <span className="block text-xs text-muted-foreground font-normal">
                        {siswa.id}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {siswa.kelas || '—'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {siswa.wa ? (
                      <a
                        href={`https://wa.me/${siswa.wa.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-500 hover:underline flex items-center gap-1"
                      >
                        <Phone size={12} />
                        <span>{siswa.wa}</span>
                      </a>
                    ) : siswa.bsuid ? (
                      <span className="text-muted-foreground text-xs">BSUID: {siswa.bsuid.slice(0, 10)}...</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <CommercialStateBadge state={siswa.commercialState || CANONICAL_STATES.LEAD} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {siswa.cro || '—'}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <Link
                      href={`/siswa/${siswa.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium text-xs transition-colors cursor-pointer"
                    >
                      <span>{t('sekolah.detailLink')}</span>
                      <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const { t, lang } = useTranslation();
  const loc = lang === 'en' ? 'en-US' : 'id-ID';

  return (
    <div className="space-y-3">
      {canAdd && (
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-all cursor-pointer"
          >
            <Plus size={13} /> {t('sekolah.extraActivityBtn')}
          </button>
        </div>
      )}

      {ekstra.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          <RotateCcw size={24} className="mx-auto mb-2 opacity-20" />
          {t('sekolah.noExtraYet')}
        </div>
      ) : (
        ekstra.map(ae => (
          <div key={ae.id} className="border rounded-xl p-4 space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <EkstraIcon jenis={ae.jenisAktivitas} />
                <span className="text-sm font-semibold text-foreground">{ae.jenisAktivitas}</span>
                <span className="text-xs text-muted-foreground">📅 {formatDate(ae.tanggalRencana, loc)}</span>
              </div>
              <EkstraStatusBadge status={ae.statusAktivitas} />
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">{t('sekolah.extraPicPrefix')}</span> {ae.pjAktivitas}
              {' · '}
              <span className="text-foreground">{t('sekolah.extraGoalPrefix')}</span> {ae.tujuanCatatan}
            </p>

            {ae.catatanHasil && (
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground">{t('sekolah.extraResultPrefix')}</span> {ae.catatanHasil}
              </p>
            )}

            {/* Actions */}
            {!isCRO && ae.statusAktivitas === 'Direncanakan' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onSelesai(ae)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <CheckCircle size={12} /> {t('sekolah.extraCompleteBtn')}
                </button>
                <button
                  onClick={() => onBatalkan(ae)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <XCircle size={12} /> {t('sekolah.extraCancelBtn')}
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
  const { t } = useTranslation();
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
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl border flex flex-col">

        {/* Header */}
        <div className={cn(
          'flex items-center gap-3 p-4 sm:p-5 border-b',
          isSelesai ? 'bg-emerald-500/5' : 'bg-rose-500/5'
        )}>
          {isSelesai
            ? <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            : <XCircle size={18} className="text-rose-400 shrink-0" />
          }
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">
              {isSelesai ? t('sekolah.confirmCompleteTitle') : t('sekolah.confirmCancelTitle')}
            </h2>
            <p className="text-xs text-muted-foreground truncate">{ae.jenisAktivitas} · {ae.pjAktivitas}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <XCircle size={14} />
          </button>
        </div>

        {/* Body */}
        <form id="konfirmasiEkstraForm" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">

          {/* Tujuan readonly */}
          <div className="p-3 bg-secondary/30 rounded-xl text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground text-sm">{ae.jenisAktivitas}</p>
            <p>{t('sekolah.extraGoalPrefix')} {ae.tujuanCatatan}</p>
          </div>

          {isSelesai ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('sekolah.realizationDate')}</label>
                <input
                  required
                  type="date"
                  value={tanggalRealisasi}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setTanggalRealisasi(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('sekolah.resultSummary')} <span className="text-muted-foreground/60">{t('sekolah.resultSummaryOptional')}</span>
                </label>
                <textarea
                  rows={3}
                  value={catatanHasil}
                  onChange={e => setCatatanHasil(e.target.value)}
                  placeholder={t('sekolah.resultSummaryPlaceholder')}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors resize-none placeholder:text-muted-foreground"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('sekolah.cancelReason')} <span className="text-rose-500 text-xs">{t('sekolah.cancelReasonMinChar')}</span>
              </label>
              <textarea
                required
                rows={3}
                value={alasanBatal}
                onChange={e => setAlasanBatal(e.target.value)}
                placeholder={t('sekolah.cancelReasonPlaceholder')}
                className={cn(
                  'w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors resize-none placeholder:text-muted-foreground',
                  !formValid && alasanBatal.length > 0 && 'border-rose-500 ring-1 ring-rose-500'
                )}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            {t('sekolah.cancelBtn')}
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
            {isSelesai ? t('sekolah.confirmFinishBtn') : t('sekolah.confirmCancelBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
