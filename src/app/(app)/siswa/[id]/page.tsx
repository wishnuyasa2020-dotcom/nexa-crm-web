'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, MessageCircle, Plus, ClipboardList, Trash2,
  Calendar, User, Phone, School, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommercialStateBadge } from '@/components/siswa/CommercialStateBadge';
import { CatatInteraksiSiswaModal } from '@/components/siswa/CatatInteraksiSiswaModal';
import { AssessmentFNARModal } from '@/components/siswa/AssessmentFNARModal';
import { DeleteSiswaModal } from '@/components/siswa/DeleteSiswaModal';
import { initiateConversation } from '@/lib/chatApi';
import apiClient from '@/lib/apiClient';
import type { SiswaDetail, AktivitasSiswa } from '@/lib/types/siswa.types';

// ── Event Type Configuration ──────────────────────────────────────────────────
const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  'InteractionLogged':           { label: 'Interaksi',          color: 'text-yellow-400',  dot: '🟡' },
  'QualificationAssessmentSubmitted': { label: 'Assessment FNAR', color: 'text-blue-400', dot: '🔵' },
  'StateTransitionedToProspect': { label: 'Naik ke Prospect',   color: 'text-emerald-400', dot: '🟢' },
  'LeadDisqualified':            { label: 'Didiskualifikasi',   color: 'text-rose-400',    dot: '🔴' },
  'ManualStateOverridden':       { label: 'Override Manual',    color: 'text-orange-400',  dot: '⚠️' },
};

// ── Intent Badge ──────────────────────────────────────────────────────────────
const INTENT_CONFIG: Record<string, { label: string; className: string }> = {
  'High': { label: '🔥 High Intent', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  'Mid':  { label: '🟢 Mid Intent',  className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'Low':  { label: '⚪ Low Intent',  className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return null;
  const config = INTENT_CONFIG[intent];
  if (!config) return null;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs border font-medium', config.className)}>
      {config.label}
    </span>
  );
}

export default function SiswaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [siswaDetail,           setSiswaDetail]           = useState<SiswaDetail | null>(null);
  const [loading,               setLoading]               = useState(true);
  const [isInteraksiOpen,       setIsInteraksiOpen]       = useState(false);
  const [isAssessmentOpen,      setIsAssessmentOpen]      = useState(false);
  const [isDeleteModalOpen,     setIsDeleteModalOpen]     = useState(false);
  const [isChatLoading,         setIsChatLoading]         = useState(false);

  const handleChatSiswa = async () => {
    if (!id) return;
    try {
      setIsChatLoading(true);
      const res = await initiateConversation(id);
      if (res?.conv_id) {
        window.location.href = `/live-chat?conv_id=${res.conv_id}`;
      } else {
        throw new Error('Gagal mendapatkan ID percakapan dari server');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || 'Gagal memulai percakapan');
    } finally {
      setIsChatLoading(false);
    }
  };

  const reloadDetail = useCallback(async () => {
    try {
      if (!id) return;
      const res = await apiClient.get(`/api/v1/siswa/${id}`);
      if (res.data?.status === 'ok') {
        setSiswaDetail(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching detail:', e);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    reloadDetail().finally(() => setLoading(false));
  }, [reloadDetail]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data...</div>;
  }
  if (!siswaDetail) {
    return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 sm:pb-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{siswaDetail.nama_lengkap}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <School size={12} /> {siswaDetail.nama_sekolah} · {siswaDetail.id_siswa}
          </p>
        </div>
      </div>

      {/* ── State & Intent Badges ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <CommercialStateBadge state={siswaDetail.commercial_state || 'Lead'} size="md" />
        <IntentBadge intent={siswaDetail.intent} />
        {siswaDetail.due_date && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <Calendar size={12} /> {siswaDetail.due_date}
          </span>
        )}
        {siswaDetail.next_action && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            Next: <span className="font-medium text-foreground">{siswaDetail.next_action}</span>
          </span>
        )}
      </div>

      {/* ── Profile Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kontak */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Informasi Kontak</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nomor WhatsApp</p>
              {!siswaDetail.wa ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-sm flex-1">
                    <AlertCircle size={15} />
                    <span>[📱 Nomor Disembunyikan]</span>
                  </div>
                  <button className="flex justify-center items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity w-full sm:w-auto">
                    Minta No. WA
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Phone size={15} className="text-muted-foreground" />
                  {siswaDetail.wa}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Kelas</p>
                <p className="text-sm font-medium text-foreground">{siswaDetail.kelas || '–'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">PJ CRO</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <User size={13} /> {siswaDetail.pj_cro}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Lanjutan */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Informasi Lanjutan</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Rencana Lulus</p>
              <p className="text-sm font-medium text-foreground">{siswaDetail.rencana_lulus}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Minat Awal</p>
              <p className="text-sm font-medium text-foreground">{siswaDetail.minat_awal}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Status Lama (Legacy)</p>
              <p className="text-xs text-muted-foreground">{siswaDetail.status_terkini}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 sm:relative sm:p-0 sm:bg-transparent sm:border-t-0 sm:backdrop-blur-none flex gap-2">
        <button
          onClick={handleChatSiswa}
          disabled={isChatLoading}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
        >
          {isChatLoading
            ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <MessageCircle size={15} />}
          <span className="hidden sm:inline">{isChatLoading ? 'Memproses...' : 'Buka Chat'}</span>
          <span className="sm:hidden">{isChatLoading ? 'Wait...' : 'Chat'}</span>
        </button>

        <button
          onClick={() => setIsInteraksiOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Catat Interaksi</span>
          <span className="sm:hidden">Interaksi</span>
        </button>

        <button
          onClick={() => setIsAssessmentOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <ClipboardList size={15} />
          <span className="hidden sm:inline">Isi Assessment</span>
          <span className="sm:hidden">FNAR</span>
        </button>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="hidden sm:flex items-center justify-center p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* ── Event / Audit Log ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
          📋 Event / Audit Log
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground font-normal">
            Append-Only
          </span>
        </h2>

        <div className="space-y-5">
          {!siswaDetail.logs || siswaDetail.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada aktivitas. Mulai catat interaksi pertama.
            </p>
          ) : (
            siswaDetail.logs.map((log: AktivitasSiswa, idx: number) => {
              const evConfig = EVENT_TYPE_CONFIG[log.event_type] ?? {
                label: log.event_type, color: 'text-muted-foreground', dot: '⚪'
              };
              return (
                <div key={log.id} className="relative flex gap-3">
                  {/* Vertical line */}
                  {idx !== siswaDetail.logs.length - 1 && (
                    <div className="absolute left-3 top-6 -bottom-5 w-px bg-border z-0" />
                  )}
                  {/* Dot */}
                  <div className="relative z-10 w-6 h-6 shrink-0 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px]">
                    {evConfig.dot}
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-secondary/30 border border-border rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-semibold', evConfig.color)}>{evConfig.label}</span>
                        <span className="text-xs text-muted-foreground">{log.jenis_aktivitas}</span>
                        {log.channel && log.channel !== 'WhatsApp' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary border border-border text-muted-foreground">
                            {log.channel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Clock size={11} /> {log.created_at}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-foreground">{log.hasil_aktivitas}</p>
                    {log.catatan && (
                      <p className="text-xs text-muted-foreground mt-1">{log.catatan}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                      <User size={10} /> {log.pj_cro}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <CatatInteraksiSiswaModal
        isOpen={isInteraksiOpen}
        onClose={() => setIsInteraksiOpen(false)}
        onSuccess={reloadDetail}
        siswaId={id}
        siswaName={siswaDetail.nama_lengkap}
      />
      <AssessmentFNARModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        onSuccess={() => reloadDetail()}
        siswaId={id}
        siswaName={siswaDetail.nama_lengkap}
      />
      <DeleteSiswaModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        siswaName={siswaDetail.nama_lengkap}
      />
    </div>
  );
}
