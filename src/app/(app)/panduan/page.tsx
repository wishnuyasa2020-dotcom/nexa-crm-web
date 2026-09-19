'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, School, Shield, Users, CheckCircle2, Info,
  ArrowRight, Search, ChevronDown, ChevronRight, MessageSquare, Radio,
  TrendingUp, Clock, Calendar, CheckSquare, Zap, Sparkles,
  FileText, Phone, Mail, RefreshCw, UserCheck, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

export default function PanduanPage() {
  const { t } = useTranslation();
  const { isLpk } = useTenantVocabulary();

  const [activeTab, setActiveTab] = useState<'sekolah' | 'admin' | 'cro'>('sekolah');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'b2b-pipeline': true,
    'b2b-decision': true,
    'admin-assign-kelas': true,
    'admin-waba': true,
    'admin-smartrouting': true,
    'admin-domains': true,
    'cro-funnel': true,
    'cro-territorial': true,
    'cro-fnar': true,
    'cro-tasks': true,
    'cro-chat': true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="w-full max-w-6xl mx-auto min-w-0 space-y-4 sm:space-y-6 pb-16 md:pb-12 wrap-break-word overflow-x-clip">
      {/* Header Banner */}
      <div className="w-full min-w-0 rounded-2xl border bg-card p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <BookOpen size={13} className="shrink-0" />
              <span className="truncate">{t('guide.bannerBadge')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {t('guide.bannerTitle')}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              {t('guide.bannerSubtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder={t('guide.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('guide.clearSearch')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons (Touch Friendly & Horizontally Scrollable on Mobile) */}
        <div className="w-full min-w-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t overflow-x-auto scrollbar-none pb-1 touch-pan-x">
          <button
            onClick={() => setActiveTab('sekolah')}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer",
              activeTab === 'sekolah'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <School size={15} className="shrink-0" />
            <span>{isLpk ? t('guide.tabSchoolLpk') : t('guide.tabSchoolGeneral')}</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer",
              activeTab === 'admin'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Shield size={15} className="shrink-0" />
            <span>{t('guide.tabAdmin')}</span>
          </button>

          <button
            onClick={() => setActiveTab('cro')}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer",
              activeTab === 'cro'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Users size={15} className="shrink-0" />
            <span>{isLpk ? t('guide.tabCroLpk') : t('guide.tabCroGeneral')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PIPELINE SEKOLAH / MITRA (B2B)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'sekolah' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
          {/* Intro Card */}
          <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <School size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {isLpk ? t('guide.b2bConceptTitleLpk') : t('guide.b2bConceptTitleGeneral')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isLpk ? t('guide.b2bConceptSubtitleLpk') : t('guide.b2bConceptSubtitleGeneral')}
                  </p>
                </div>
              </div>
              <Link
                href="/sekolah"
                className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
              >
                <span>{isLpk ? t('guide.openSchoolDataBtnLpk') : t('guide.openSchoolDataBtnGeneral')}</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                {isLpk ? t('guide.b2bPhilosophyLpk') : t('guide.b2bPhilosophyGeneral')}
              </p>
              <div className="p-3.5 rounded-xl bg-secondary/50 border text-xs text-foreground space-y-1.5">
                <p className="font-semibold text-purple-600 flex items-center gap-1.5">
                  <Info size={14} className="shrink-0" />
                  <span>{t('guide.ontologyRuleTitle')}</span>
                </p>
                <p>
                  {isLpk ? t('guide.ontologyRuleDescLpk') : t('guide.ontologyRuleDescGeneral')}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Tahap Pipeline Sekolah */}
          {matchesSearch('pipeline sekolah mitra school partner tahapan stages identified engaged sosialisasi presentation') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('b2b-pipeline')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <Layers className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {isLpk ? t('guide.b2bLifecycleTitleLpk') : t('guide.b2bLifecycleTitleGeneral')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['b2b-pipeline'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['b2b-pipeline'] && (
                <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl border bg-background/50 space-y-2 min-w-0">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border shrink-0">
                        {t('guide.stageTag1')}
                      </span>
                      <span className="text-xs font-semibold text-amber-500">
                        {t('guide.stageStatus1')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {isLpk ? t('guide.stageTitle1Lpk') : t('guide.stageTitle1General')}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLpk ? t('guide.stageDesc1Lpk') : t('guide.stageDesc1General')}
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl border bg-background/50 space-y-2 min-w-0">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                        {t('guide.stageTag2')}
                      </span>
                      <span className="text-xs font-semibold text-blue-500">
                        {t('guide.stageStatus2')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {t('guide.stageTitle2')}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLpk ? t('guide.stageDesc2Lpk') : t('guide.stageDesc2General')}
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl border bg-background/50 space-y-2 min-w-0">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20 shrink-0">
                        {t('guide.stageTag3')}
                      </span>
                      <span className="text-xs font-semibold text-purple-500">
                        {t('guide.stageStatus3')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {t('guide.stageTitle3')}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLpk ? t('guide.stageDesc3Lpk') : t('guide.stageDesc3General')}
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl border bg-background/50 space-y-2 min-w-0">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                        {t('guide.stageTag4')}
                      </span>
                      <span className="text-xs font-semibold text-emerald-500">
                        {t('guide.stageStatus4')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {t('guide.stageTitle4')}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('guide.stageDesc4')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision Environment & Peran Validator */}
          {matchesSearch('guru bk kepsek counselor principal validator peran role cro chief manager decision lingkungan keputusan') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('b2b-decision')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <UserCheck className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {isLpk ? t('guide.validatorTitleLpk') : t('guide.validatorTitleGeneral')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['b2b-decision'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['b2b-decision'] && (
                <div className="pt-2 space-y-4 text-sm leading-relaxed">
                  <div className="p-4 rounded-xl bg-secondary/40 border space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600">
                      {t('guide.decisionEnvBannerTitle')}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLpk ? t('guide.decisionEnvBannerDescLpk') : t('guide.decisionEnvBannerDescGeneral')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-card space-y-1.5 min-w-0">
                      <div className="font-bold text-foreground text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        {isLpk ? t('guide.roleCroTitleLpk') : t('guide.roleCroTitleGeneral')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isLpk ? t('guide.roleCroDescLpk') : t('guide.roleCroDescGeneral')}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-card space-y-1.5 min-w-0">
                      <div className="font-bold text-foreground text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        {t('guide.roleChiefTitle')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isLpk ? t('guide.roleChiefDescLpk') : t('guide.roleChiefDescGeneral')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADMIN (SISTEM, LAYANAN, TEMPLATE & SMART ROUTING)                   */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
          {/* Quick Links Admin */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <Link
              href="/manajemen-tim"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{t('guide.adminQuickTeam')}</h4>
                  <p className="text-xs text-muted-foreground truncate">{t('guide.adminQuickTeamDesc')}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1 hidden sm:block" />
            </Link>

            <Link
              href="/siswa"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <UserCheck size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{t('guide.adminQuickAssign')}</h4>
                  <p className="text-xs text-muted-foreground truncate">{t('guide.adminQuickAssignDesc')}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1 hidden sm:block" />
            </Link>

            <Link
              href="/settings?tab=whatsapp"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{t('guide.adminQuickWa')}</h4>
                  <p className="text-xs text-muted-foreground truncate">{t('guide.adminQuickWaDesc')}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1 hidden sm:block" />
            </Link>

            <Link
              href="/templates"
              className="p-3.5 sm:p-4 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{t('guide.adminQuickTemplate')}</h4>
                  <p className="text-xs text-muted-foreground truncate">{t('guide.adminQuickTemplateDesc')}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0 ml-1 hidden sm:block" />
            </Link>
          </div>

          {/* SOP: CARA CHIEF CRO & ADMIN MELAKUKAN PENUGASAN KELAS KE CRO */}
          {matchesSearch('assign kelas penugasan teritorial class territory assignment chief cro manager admin replace auto inherit b2c langkah sop panduan guide steps') && (
            <div className="rounded-2xl border-2 border-purple-500/30 bg-card p-4 sm:p-6 md:p-7 shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm w-fit mb-1 sm:mb-0 sm:absolute sm:top-0 sm:right-0 sm:rounded-none sm:rounded-bl-xl">
                {t('guide.assignAuthorityBadge')}
              </div>

              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none pt-1 sm:pt-2 min-h-11"
                onClick={() => toggleSection('admin-assign-kelas')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <UserCheck size={20} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                      {t('guide.assignGuideTitle')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('guide.assignGuideSubtitle')}
                    </p>
                  </div>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-assign-kelas'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {expandedSections['admin-assign-kelas'] && (
                <div className="pt-2 sm:pt-3 space-y-4 sm:space-y-5">
                  {/* Banner Ringkasan Filosofi 1 Komando */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                      <Shield size={16} className="shrink-0" />
                      <span>{t('guide.assignCommandTitle')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('guide.assignCommandDesc')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                        <span className="text-foreground">{t('guide.assignPillar1')}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                        <span className="text-foreground">{t('guide.assignPillar2')}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                        <span className="text-foreground">{t('guide.assignPillar3')}</span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Langkah Demi Langkah Praktis */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Sparkles size={16} className="text-purple-600 shrink-0" />
                      <span>{t('guide.assignStepsTitle')}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
                      {/* Step 1 */}
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 relative min-w-0">
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            {t('guide.step1Tag')}
                          </span>
                          <Link
                            href="/siswa"
                            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold text-xs"
                          >
                            <span>{t('guide.step1Link')}</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">{t('guide.step1Title')}</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.step1Desc')}
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            {t('guide.step2Tag')}
                          </span>
                          <span className="text-muted-foreground text-xs font-mono font-semibold">{t('guide.step2Badge')}</span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">{t('guide.step2Title')}</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.step2Desc')}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            {t('guide.step3Tag')}
                          </span>
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 size={13} /> {t('guide.step3Badge')}
                          </span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">{t('guide.step3Title')}</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.step3Desc')}
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            {t('guide.step4Tag')}
                          </span>
                          <span className="text-muted-foreground text-xs">{t('guide.step4Badge')}</span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">{t('guide.step4Title')}</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.step4Desc')}
                        </p>
                      </div>

                      {/* Step 5 */}
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            {t('guide.step5Tag')}
                          </span>
                          <span className="text-muted-foreground text-xs">{t('guide.step5Badge')}</span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">{t('guide.step5Title')}</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.step5Desc')}
                        </p>
                      </div>

                      {/* Step 6 */}
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {t('guide.step6Tag')}
                          </span>
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <Zap size={13} /> {t('guide.step6Badge')}
                          </span>
                        </div>
                        <h5 className="font-bold text-foreground text-sm">{t('guide.step6Title')}</h5>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.step6Desc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Jaminan Otomatisasi & Integritas Pasca Penugasan */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-background border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <RefreshCw size={16} className="shrink-0" />
                      <span>{t('guide.assignGuaranteesTitle')}</span>
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-secondary/40 border space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span>{t('guide.guarantee1Title')}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.guarantee1Desc')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/40 border space-y-1 min-w-0">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span>{t('guide.guarantee2Title')}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.guarantee2Desc')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/40 border space-y-1 min-w-0">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span>{t('guide.guarantee3Title')}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {t('guide.guarantee3Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SERVICE WINDOW & DUAL SMART ROUTING */}
          {matchesSearch('service window sw open sw closed smart routing dual template hemat biaya cost saving fallback zero failure') && (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-card p-4 sm:p-6 md:p-7 shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm w-fit mb-1 sm:mb-0 sm:absolute sm:top-0 sm:right-0 sm:rounded-none sm:rounded-bl-xl">
                {t('guide.srExclusiveBadge')}
              </div>

              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none pt-1 sm:pt-2 min-h-11"
                onClick={() => toggleSection('admin-smartrouting')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Zap size={20} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                      {t('guide.srTitle')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('guide.srSubtitle')}
                    </p>
                  </div>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-smartrouting'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {expandedSections['admin-smartrouting'] && (
                <div className="pt-2 sm:pt-3 space-y-4 sm:space-y-5">
                  {/* Penjelasan Service Window 24 Jam Meta */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-background border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Clock size={16} className="shrink-0" />
                      <span>{t('guide.swRegTitle')}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('guide.swRegDesc')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          {t('guide.swOpenTitle')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('guide.swOpenDesc')}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                          {t('guide.swClosedTitle')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('guide.swClosedDesc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Solusi Dual Smart Routing */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-background border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Sparkles size={16} className="shrink-0" />
                      <span>{t('guide.dualSrWhyTitle')}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('guide.dualSrWhyDesc')}
                    </p>

                    <div className="space-y-2.5 pt-1 text-xs">
                      <div className="flex items-start gap-2 sm:gap-2.5 p-3 rounded-xl bg-secondary/40 border">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">{t('guide.dualSrPoint1Title')} </strong>
                          {t('guide.dualSrPoint1Desc')}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 sm:gap-2.5 p-3 rounded-xl bg-secondary/40 border">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">{t('guide.dualSrPoint2Title')} </strong>
                          {t('guide.dualSrPoint2Desc')}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 sm:gap-2.5 p-3 rounded-xl bg-secondary/40 border">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">{t('guide.dualSrPoint3Title')} </strong>
                          {t('guide.dualSrPoint3Desc')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onboarding WhatsApp Pola A & PIN 2FA Meta */}
          {matchesSearch('waba whatsapp onboarding pola a pattern a graph api pin 2fa fresh sim') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('admin-waba')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <Phone className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t('guide.wabaTitle')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-waba'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['admin-waba'] && (
                <div className="pt-2 space-y-4 text-sm leading-relaxed">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 space-y-1.5">
                    <div className="font-bold flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs uppercase tracking-wider">
                      <Phone size={16} className="shrink-0" />
                      <span>{t('guide.wabaAssistedTitle')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('guide.wabaAssistedDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span>{t('guide.freshSimTitle')}</span>
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.freshSimDesc')}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span>{t('guide.displayNameTitle')}</span>
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.displayNameDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pemisahan Domain Produksi & Email Alert */}
          {matchesSearch('domain produksi production url 404 crm nexamos nexamos.cloud crm.nexamos.cloud admin email superadmin security alert') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('admin-domains')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <Mail className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t('guide.domainSectionTitle')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['admin-domains'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['admin-domains'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/40 border space-y-2 min-w-0">
                    <h4 className="font-bold text-foreground text-sm">{t('guide.domainOfficialTitle')}</h4>
                    <div className="space-y-1.5 text-muted-foreground">
                      <p>
                        • 🌐 <strong>{t('guide.domainLandingLabel')}</strong> <code className="text-primary font-bold break-all">https://nexamos.cloud</code> {t('guide.domainLandingDesc')}
                      </p>
                      <p>
                        • 💻 <strong>{t('guide.domainCrmLabel')}</strong> <code className="text-emerald-600 font-bold break-all">https://crm.nexamos.cloud</code> {t('guide.domainCrmDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary">
                      {t('guide.securityAlertTitle')}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('guide.securityAlertDesc')}{' '}
                      <code className="text-foreground font-semibold break-all">https://crm.nexamos.cloud/manajemen-tim</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRO (PIPELINE SISWA/KONTAK, WEEKLY, TASKS, CHAT, BC, NURTURE, SNOOZE) */}
      {/* ========================================================================= */}
      {activeTab === 'cro' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
          {/* Quick Links CRO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <Link
              href="/tasks"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <CheckSquare size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">{t('guide.croQuickTask')}</h4>
                <p className="text-xs text-muted-foreground truncate">{t('guide.croQuickTaskDesc')}</p>
              </div>
            </Link>

            <Link
              href="/weekly"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">{t('guide.croQuickWeekly')}</h4>
                <p className="text-xs text-muted-foreground truncate">{t('guide.croQuickWeeklyDesc')}</p>
              </div>
            </Link>

            <Link
              href="/live-chat"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">{t('guide.croQuickLiveChat')}</h4>
                <p className="text-xs text-muted-foreground truncate">{t('guide.croQuickLiveChatDesc')}</p>
              </div>
            </Link>

            <Link
              href="/siswa"
              className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-secondary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {isLpk ? t('guide.croQuickStudentLpk') : t('guide.croQuickStudentGeneral')}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{t('guide.croQuickStudentDesc')}</p>
              </div>
            </Link>
          </div>

          {/* Universal Funnel Siswa / Kontak Berbasis Bukti */}
          {matchesSearch('pipeline siswa b2c kontak contact lead prospect opportunity registered customer fnar komitmen commitment dp conversion universal state model') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-funnel')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <TrendingUp className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {isLpk ? t('guide.stateModelTitleLpk') : t('guide.stateModelTitleGeneral')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-funnel'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-funnel'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border text-muted-foreground">
                    {isLpk ? t('guide.stateModelIntroLpk') : t('guide.stateModelIntroGeneral')}
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 font-bold border border-slate-500/20">AUDIENCE</span>
                          <span className="font-semibold text-foreground text-sm">
                            {isLpk ? t('guide.stateAudienceTitleLpk') : t('guide.stateAudienceTitleGeneral')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {isLpk ? t('guide.stateAudienceDescLpk') : t('guide.stateAudienceDescGeneral')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-muted/60 sm:bg-transparent">
                        {t('guide.stateAudienceBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 font-bold border border-sky-500/20">KNOWN_PROFILE</span>
                          <span className="font-semibold text-foreground text-sm">
                            {t('guide.stateKnownTitle')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t('guide.stateKnownDesc')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-sky-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-sky-500/10 sm:bg-transparent">
                        {t('guide.stateKnownBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">LEAD</span>
                          <span className="font-semibold text-foreground text-sm">
                            {t('guide.stateLeadTitle')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t('guide.stateLeadDesc')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-muted/60 sm:bg-transparent">
                        {t('guide.stateLeadBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold border border-blue-500/20">PROSPECT</span>
                          <span className="font-semibold text-foreground text-sm">
                            {t('guide.stateProspectTitle')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t('guide.stateProspectDesc')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-blue-500/10 sm:bg-transparent">
                        {t('guide.stateProspectBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold border border-purple-500/20">OPPORTUNITY</span>
                          <span className="font-semibold text-foreground text-sm">
                            {t('guide.stateOpportunityTitle')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t('guide.stateOpportunityDesc')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-purple-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-purple-500/10 sm:bg-transparent">
                        {t('guide.stateOpportunityBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 font-bold border border-teal-500/20">REGISTERED</span>
                          <span className="font-semibold text-foreground text-sm">
                            {isLpk ? t('guide.stateRegisteredTitleLpk') : t('guide.stateRegisteredTitleGeneral')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {isLpk ? t('guide.stateRegisteredDescLpk') : t('guide.stateRegisteredDescGeneral')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-teal-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-teal-500/10 sm:bg-transparent">
                        {t('guide.stateRegisteredBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">CUSTOMER</span>
                          <span className="font-semibold text-foreground text-sm">
                            {isLpk ? t('guide.stateCustomerTitleLpk') : t('guide.stateCustomerTitleGeneral')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t('guide.stateCustomerDesc')}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-emerald-500/20 sm:bg-transparent">
                        {t('guide.stateCustomerBadge')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold border border-indigo-500/20">POST_CUSTOMER</span>
                          <span className="font-semibold text-foreground text-sm">
                            {isLpk ? t('guide.statePostCustomerTitleLpk') : t('guide.statePostCustomerTitleGeneral')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t('guide.statePostCustomerDesc')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 shrink-0 self-start sm:self-auto px-2 py-0.5 rounded bg-indigo-500/10 sm:bg-transparent">
                        {t('guide.statePostCustomerBadge')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/50 border text-xs text-foreground">
                    🛡️ <strong>{t('guide.croTerritoryRuleCallout')}</strong> {t('guide.croTerritoryRuleDesc')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Penugasan Teritorial: 1 Kelas Banyak Siswa = 1 CRO */}
          {matchesSearch('teritorial kelas class assignment penugasan territory chief cro sekolah school sosialisasi replace auto inherit b2c') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-territorial')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <Layers className="text-primary w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {t('guide.croTerritorialTitle')}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {t('guide.croChiefAuthorityBadge')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-territorial'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-territorial'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border space-y-1.5">
                    <p className="font-bold text-foreground text-sm flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Sparkles size={16} className="text-primary shrink-0" />
                      <span>{t('guide.croTerritorialPrincipleTitle')}</span>
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('guide.croTerritorialPrincipleDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Pilar 1 */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          {t('guide.croPillar1Tag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.croPillar1Title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.croPillar1Desc')}
                      </p>
                    </div>

                    {/* Pilar 2 */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {t('guide.croPillar2Tag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.croPillar2Title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.croPillar2Desc')}
                      </p>
                    </div>

                    {/* Pilar 3 */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {t('guide.croPillar3Tag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.croPillar3Title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.croPillar3Desc')}
                      </p>
                    </div>

                    {/* Pilar 4 */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {t('guide.croPillar4Tag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.croPillar4Title')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.croPillar4Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/30 text-xs text-foreground space-y-1 min-w-0">
                    <p className="font-bold text-purple-600 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>{t('guide.croCqrsAuditTitle')}</span>
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('guide.croCqrsAuditDesc')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Framework Kualifikasi FNAR */}
          {matchesSearch('fnar fit need ability readiness kualifikasi qualification lead prospect gate lolos pass diskualifikasi disqualified') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-fnar')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <UserCheck className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t('guide.fnarSectionTitle')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-fnar'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-fnar'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border space-y-1.5">
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-primary shrink-0" />
                      <span>{t('guide.whatIsFnarTitle')}</span>
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('guide.whatIsFnarDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* F: FIT */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {t('guide.fnarFitTag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.fnarFitTitle')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.fnarFitDesc')}
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        {t('guide.fnarFitDisqualified')}
                      </div>
                    </div>

                    {/* N: NEED */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {t('guide.fnarNeedTag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.fnarNeedTitle')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.fnarNeedDesc')}
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        {t('guide.fnarNeedWarning')}
                      </div>
                    </div>

                    {/* A: ABILITY */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          {t('guide.fnarAbilityTag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.fnarAbilityTitle')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.fnarAbilityDesc')}
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        {t('guide.fnarAbilityHardGate')}
                      </div>
                    </div>

                    {/* R: READINESS */}
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {t('guide.fnarReadinessTag')}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{t('guide.fnarReadinessTitle')}</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('guide.fnarReadinessDesc')}
                      </p>
                      <div className="p-2 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                        {t('guide.fnarReadinessSnooze')}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-xs text-foreground space-y-1 min-w-0">
                    <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>{t('guide.fnarCqrsMechanismTitle')}</span>
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('guide.fnarCqrsMechanismDesc')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Task List & Weekly Planning */}
          {matchesSearch('task list weekly planning kanban eksekusi execute tunda postpone bukti evidence') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-tasks')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <CheckSquare className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t('guide.tasksSopTitle')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-tasks'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-tasks'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>{t('guide.btnExecuteTitle')}</span>
                      </h4>
                      <p className="text-muted-foreground">
                        {t('guide.btnExecuteDesc')}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-amber-500">
                        <Clock size={16} className="shrink-0" />
                        <span>{t('guide.btnPostponeTitle')}</span>
                      </h4>
                      <p className="text-muted-foreground">
                        {t('guide.btnPostponeDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/40 border space-y-2 min-w-0">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600">
                      {t('guide.weeklyKanbanTitle')}
                    </h4>
                    <p className="text-muted-foreground">
                      {t('guide.weeklyKanbanDesc')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOP Live Chat, Broadcast, Nurturing & Snooze */}
          {matchesSearch('live chat shared inbox broadcast nurture snooze drip gating hibernasi') && (
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div 
                className="flex items-start sm:items-center justify-between cursor-pointer select-none min-h-10 py-1"
                onClick={() => toggleSection('cro-chat')}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <MessageSquare className="text-primary w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t('guide.chatSectionTitle')}
                  </h3>
                </div>
                <div className="p-1 text-muted-foreground shrink-0">
                  {expandedSections['cro-chat'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {expandedSections['cro-chat'] && (
                <div className="pt-2 space-y-4 text-xs leading-relaxed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="font-bold text-sm flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2 text-emerald-600">
                        <MessageSquare size={16} className="shrink-0" />
                        <span>{t('guide.liveChatSharedTitle')}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {t('guide.liveChatSiloItem1')}<br />
                        {t('guide.liveChatSiloItem2')}<br />
                        {t('guide.liveChatSiloItem3')}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="font-bold text-sm flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2 text-blue-600">
                        <Radio size={16} className="shrink-0" />
                        <span>{t('guide.broadcastWizardTitle')}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {t('guide.broadcastWizardDesc')}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="font-bold text-sm flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2 text-purple-600">
                        <TrendingUp size={16} className="shrink-0" />
                        <span>{t('guide.nurturingTitle')}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {t('guide.nurturingDesc')}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl border bg-background space-y-2 min-w-0">
                      <div className="font-bold text-sm flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2 text-amber-500">
                        <Clock size={16} className="shrink-0" />
                        <span>{t('guide.snoozeTitle')}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {t('guide.snoozeDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
