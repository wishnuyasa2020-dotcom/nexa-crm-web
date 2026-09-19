'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, ChevronLeft, ChevronRight, Users,
  ChevronRight as ArrowRight, SlidersHorizontal, Upload, Layers,
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { CommercialStateBadge } from '@/components/siswa/CommercialStateBadge';
import { CANONICAL_STATES } from '@/lib/constants/lifecycle';
import { AddSiswaModal }    from '@/components/siswa/AddSiswaModal';
import { ImportSiswaModal } from '@/components/siswa/ImportSiswaModal';
import { AssignKelasModal } from '@/components/siswa/AssignKelasModal';
import type { Siswa, CommercialState, SiswaIntent } from '@/lib/types/siswa.types';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';
import { useTranslation } from '@/hooks/useTranslation';

import { getChannelConfig } from '@/lib/constants/channel';

// ── Channel Badge ─────────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel?: string }) {
  const config = getChannelConfig(channel);
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border font-medium shrink-0', config.badgeClass)}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

// ── Intent Badge ──────────────────────────────────────────────────────────────
const INTENT_CONFIG: Record<string, { labelKey: 'student.intentHighShort' | 'student.intentMidShort' | 'student.intentLowShort'; className: string }> = {
  'High': { labelKey: 'student.intentHighShort', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  'Mid':  { labelKey: 'student.intentMidShort',  className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'Low':  { labelKey: 'student.intentLowShort',  className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

function IntentBadge({ intent }: { intent: string }) {
  const { t } = useTranslation();
  if (!intent) return null;
  const config = INTENT_CONFIG[intent];
  if (!config) return null;
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs border font-medium', config.className)}>
      {t(config.labelKey)}
    </span>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-border/50 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-secondary rounded w-full max-w-28" />
        </td>
      ))}
    </tr>
  );
}

// ── Skeleton Mobile Card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border border-border/50 rounded-xl p-3 space-y-2 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-1.5 w-2/3">
          <div className="h-4 bg-secondary rounded w-full" />
          <div className="h-3 bg-secondary rounded w-3/4" />
        </div>
        <div className="h-5 w-16 bg-secondary rounded" />
      </div>
      <div className="h-3 bg-secondary rounded w-1/2" />
    </div>
  );
}

export default function SiswaPage() {
  const router = useRouter();
  const [siswaList,          setSiswaList]          = useState<Siswa[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [search,             setSearch]             = useState('');
  const [page,               setPage]               = useState(1);
  const [total,              setTotal]              = useState(0);
  const [filterCommercial,   setFilterCommercial]   = useState<CommercialState | ''>('');
  const [filterIntent,       setFilterIntent]       = useState<SiswaIntent | ''>('');
  const [filterChannel,      setFilterChannel]      = useState('');
  const [filterKelas,        setFilterKelas]        = useState('');
  const [isAddModalOpen,     setIsAddModalOpen]     = useState(false);
  const [isImportModalOpen,  setIsImportModalOpen]  = useState(false);
  const [isAssignModalOpen,  setIsAssignModalOpen]  = useState(false);
  const [showMobileFilter,   setShowMobileFilter]   = useState(false);
  const pageSize = 20;

  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { isGeneral, pageLabels, getStateLabel } = useTenantVocabulary();
  const canAssignClass = ['admin', 'manager', 'chief cro'].includes(user?.role?.toLowerCase() || '');

  const loadSiswa = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (page > 1)          query.append('page', page.toString());
      if (search)            query.append('search', search);
      if (filterCommercial)  query.append('commercialState', filterCommercial);
      if (filterIntent)      query.append('intent', filterIntent);
      if (filterChannel)     query.append('channel', filterChannel);
      if (filterKelas)       query.append('kelas', filterKelas);

      const res = await apiClient.get(`/api/v1/siswa?${query.toString()}`);
      if (res.data?.status === 'ok') {
        setSiswaList(res.data.data.data);
        setTotal(res.data.data.total);
      }
    } catch (e) {
      console.error('Error loading siswa:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCommercial, filterIntent, filterChannel, filterKelas]);

  useEffect(() => {
    const timer = setTimeout(() => loadSiswa(), 300);
    return () => clearTimeout(timer);
  }, [loadSiswa]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 pb-24 md:pb-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Row 1 (Mobile): Judul & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
            <Users size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">{pageLabels.siswaPageTitle}</h1>
            <p className="text-xs text-muted-foreground">{total} {isGeneral ? t('student.foundCountContact') : t('student.foundCountStudent')}</p>
          </div>
        </div>

        {/* Row 2 (Mobile): Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilter(v => !v)}
              className={cn(
                'sm:hidden p-2 rounded-lg border text-muted-foreground transition-colors',
                showMobileFilter && 'bg-primary/10 text-primary border-primary/40'
              )}
              title={t('student.filterSearchTooltip')}
            >
              <SlidersHorizontal size={16} />
            </button>
            {canAssignClass && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10 transition-all cursor-pointer"
                title={t('student.assignClassTooltip')}
              >
                <Layers size={13} />
                <span className="hidden sm:inline">{t('student.assignClass')}</span>
                <span className="sm:hidden">{t('student.classShort')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all"
            >
              <Upload size={13} />
              {t('student.importExcel')}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
              title={pageLabels.addBtn}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{pageLabels.addBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={pageLabels.searchPlaceholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className={cn('flex-col sm:flex-row gap-2', showMobileFilter ? 'flex' : 'hidden sm:flex')}>
        {/* Filter Channel */}
        <select
          value={filterChannel}
          onChange={e => { setFilterChannel(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          <option value="">{t('student.allChannels')}</option>
          <option value="sekolah">{t('student.channelSchool')}</option>
          <option value="relasi">{t('student.channelRelation')}</option>
          <option value="instagram">{t('student.channelInstagram')}</option>
          <option value="facebook">{t('student.channelFacebook')}</option>
          <option value="tiktok">{t('student.channelTiktok')}</option>
          <option value="website">{t('student.channelWebsite')}</option>
          <option value="whatsapp">{t('student.channelWhatsapp')}</option>
        </select>
        {/* Filter Commercial State */}
        <select
          value={filterCommercial}
          onChange={e => { setFilterCommercial(e.target.value as CommercialState | ''); setPage(1); }}
          className="flex-1 px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          <option value="">{t('student.allStates')}</option>
          <option value="AUDIENCE">⚫ {getStateLabel('AUDIENCE')}</option>
          <option value="KNOWN_PROFILE">⚪ {getStateLabel('KNOWN_PROFILE')}</option>
          <option value="LEAD">🟡 {getStateLabel('LEAD')}</option>
          <option value="PROSPECT">🔵 {getStateLabel('PROSPECT')}</option>
          <option value="OPPORTUNITY">🟣 {getStateLabel('OPPORTUNITY')}</option>
          <option value="REGISTERED">🟣 {getStateLabel('REGISTERED')}</option>
          <option value="CUSTOMER">🟢 {getStateLabel('CUSTOMER')}</option>
          <option value="POST_CUSTOMER">🎓 {getStateLabel('POST_CUSTOMER')}</option>
          <option value="Disqualified">{t('student.stateDisqualified')}</option>
        </select>
        {/* Filter Intent */}
        <select
          value={filterIntent}
          onChange={e => { setFilterIntent(e.target.value as SiswaIntent | ''); setPage(1); }}
          className="flex-1 px-3 py-2.5 bg-card border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          <option value="">{t('student.allIntents')}</option>
          <option value="High">{t('student.intentHigh')}</option>
          <option value="Mid">{t('student.intentMid')}</option>
          <option value="Low">{t('student.intentLow')}</option>
        </select>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          DESKTOP TABLE
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{pageLabels.entityColumn}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{pageLabels.schoolColumn}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('student.colCommercialState')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('student.colIntent')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('student.colNextAction')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('student.colCro')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t('student.colDueDate')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                    {isGeneral ? t('student.emptyContacts') : t('student.emptyStudents')}
                  </td>
                </tr>
              ) : (
                siswaList.map((s) => (
                  <tr
                    key={s.idRecord}
                    onClick={() => router.push(`/siswa/${s.id}`)}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 min-w-44">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {s.nama}
                        </span>
                        <ChannelBadge channel={s.sourceChannel} />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {s.sourceDetail && (
                          <span className="text-xs text-muted-foreground truncate" title={s.sourceDetail}>
                            📌 {s.sourceDetail}
                          </span>
                        )}
                        {s.kebutuhanLayanan && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-xs bg-primary/10 text-primary border border-primary/20 shrink-0">
                            🎯 {s.kebutuhanLayanan}
                          </span>
                        )}
                      </div>
                      {!s.wa && s.bsuid ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-secondary/50 text-muted-foreground border">
                            📱 {t('student.hiddenByUser')}
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-36 truncate">
                      {s.namaSekolah || <span className="text-muted-foreground/50 italic">{t('student.nonSchool')}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <CommercialStateBadge 
                        state={s.commercialState || CANONICAL_STATES.LEAD} 
                        channel={s.sourceChannel}
                        relationshipLevel={s.relationship_level} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <IntentBadge intent={s.intent} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.nextAction}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.cro}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.dueDate || '–'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination desktop */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">{t('common.page')} {page} {t('common.of')} {totalPages} · {total} {t('common.total')}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MOBILE CARD LIST
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : siswaList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {isGeneral ? t('student.emptyContacts') : t('student.emptyStudents')}
          </div>
        ) : (
          siswaList.map((s) => (
            <button
              key={s.idRecord}
              onClick={() => router.push(`/siswa/${s.id}`)}
              className="w-full text-left bg-card border rounded-xl p-3.5 hover:bg-secondary/20 active:scale-95 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm text-foreground truncate">{s.nama}</p>
                    <ChannelBadge channel={s.sourceChannel} />
                    {!s.wa && s.bsuid && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-secondary/50 text-muted-foreground border">
                        📱 {t('student.hidden')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {s.sourceDetail && (
                      <span className="text-xs text-muted-foreground truncate">📌 {s.sourceDetail}</span>
                    )}
                    {s.kebutuhanLayanan && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-xs bg-primary/10 text-primary border border-primary/20 shrink-0">
                        🎯 {s.kebutuhanLayanan}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {s.namaSekolah || <span className="italic">{t('student.nonSchool')}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.cro && <span className="text-primary/70">{s.cro}</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <CommercialStateBadge 
                    state={s.commercialState || CANONICAL_STATES.LEAD} 
                    channel={s.sourceChannel}
                    relationshipLevel={s.relationship_level}
                    size="sm" 
                  />
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                <IntentBadge intent={s.intent} />
                <span className="text-xs text-muted-foreground">
                  {s.dueDate ? `📅 ${s.dueDate}` : s.nextAction || ''}
                </span>
              </div>
            </button>
          ))
        )}

        {/* Pagination mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-1">
            <p className="text-xs text-muted-foreground">{t('student.pageShort')} {page} / {totalPages} · {total} {t('student.totalShort')}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AddSiswaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => { setPage(1); loadSiswa(); }}
      />
      <ImportSiswaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => { setPage(1); loadSiswa(); }}
      />
      <AssignKelasModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => { setPage(1); loadSiswa(); }}
      />
    </div>
  );
}
