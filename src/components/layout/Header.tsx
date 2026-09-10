'use client';

import {
  Bell, Search, Users, Radio, TrendingUp, LogOut, Clock,
  FileText, User, Settings, Calendar, ChevronDown, CalendarDays
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileModal } from './ProfileModal';
import { useCohortStore } from '@/store/useCohortStore';
import { cn } from '@/lib/utils';

interface User {
  nama?: string;
  username: string;
  role: string;
  tenant_id?: string;
}

export default function Header({ title }: { title?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCohortMenu, setShowCohortMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cohortMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    cohorts,
    activeCohort,
    selectedCohort,
    isHistoricalReadOnly,
    fetchCohorts,
    selectCohort,
  } = useCohortStore();

  useEffect(() => {
    const raw = Cookies.get('nexa_user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
    fetchCohorts();
  }, [fetchCohorts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (cohortMenuRef.current && !cohortMenuRef.current.contains(event.target as Node)) {
        setShowCohortMenu(false);
      }
    }
    if (showMenu || showCohortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showCohortMenu]);

  const initials = (user?.nama || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <header className="h-14 flex items-center justify-between px-6 border-b bg-background/95 backdrop-blur-sm shrink-0 z-30">
        {/* Title */}
        <h1 className="text-base font-semibold text-foreground">
          {title || (user?.tenant_id ? (user.tenant_id.charAt(0).toUpperCase() + user.tenant_id.slice(1)) : 'Dashboard')}
        </h1>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick-Switch Session Cohort Dropdown */}
          <div className="relative" ref={cohortMenuRef}>
            <button
              onClick={() => setShowCohortMenu(!showCohortMenu)}
              className={cn(
                "h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                isHistoricalReadOnly 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-secondary/50 hover:bg-secondary text-foreground"
              )}
              title="Ganti Sesi Periode / Cohort"
            >
              <Calendar size={13} className={isHistoricalReadOnly ? "text-amber-500" : "text-primary"} />
              <span className="hidden sm:inline text-muted-foreground font-normal">Cohort:</span>
              <span>{selectedCohort?.nama_period || 'Memuat...'}</span>
              {isHistoricalReadOnly ? (
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 font-bold">Arsip</span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              )}
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>

            {showCohortMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-card border rounded-2xl shadow-xl overflow-hidden py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2.5 border-b">
                  <p className="text-xs font-bold text-foreground">Sesi Periode / Cohort</p>
                  <p className="text-[11px] text-muted-foreground">Pilih tahun ajaran untuk memfilter data</p>
                </div>
                <div className="max-h-56 overflow-y-auto py-1 divide-y divide-border/40">
                  {cohorts.length === 0 ? (
                    <div className="p-3 text-xs text-center text-muted-foreground">Tidak ada cohort</div>
                  ) : (
                    cohorts.map((c) => {
                      const isSelected = selectedCohort?.id_period === c.id_period || selectedCohort?.nama_period === c.nama_period;
                      const isAktif = c.status === 'aktif';

                      return (
                        <button
                          key={c.id_period}
                          onClick={() => {
                            selectCohort(c.id_period);
                            setShowCohortMenu(false);
                          }}
                          className={cn(
                            "w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-secondary/40 transition-colors cursor-pointer",
                            isSelected && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isAktif ? (
                              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
                            )}
                            <span className="truncate">{c.nama_period}</span>
                          </div>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded capitalize font-medium",
                            isAktif ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"
                          )}>
                            {c.status}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <div className="border-t pt-1 bg-secondary/20">
                    <Link
                      href="/manajemen-periode"
                      onClick={() => setShowCohortMenu(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
                    >
                      <Settings size={13} /> Kelola Periode / Re-entry
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
            <Search size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative cursor-pointer">
            <Bell size={16} />
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 pl-2 border-l ml-1 hover:bg-secondary/50 rounded-lg pr-2 py-1 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-foreground leading-tight">{user?.nama || user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </button>

            {/* Popup Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border rounded-2xl shadow-xl overflow-hidden flex flex-col py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                {/* User info (mobile only) */}
                <div className="px-3 py-2.5 border-b sm:hidden">
                  <p className="text-sm font-medium text-foreground truncate">{user?.nama || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>

                {/* Profile */}
                <button
                  onClick={() => { setShowMenu(false); setShowProfile(true); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full text-left cursor-pointer"
                >
                  <User size={16} /> Profil & Password
                </button>

                <div className="h-px bg-border my-1" />

                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <>
                    <Link href="/manajemen-tim" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                      <Users size={16} /> Manajemen Tim
                    </Link>
                    <Link href="/manajemen-periode" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                      <CalendarDays size={16} /> Manajemen Periode
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                      <Settings size={16} /> Settings
                    </Link>
                  </>
                )}
                <Link href="/broadcast" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                  <Radio size={16} /> Broadcast
                </Link>
                <Link href="/nurturing" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                  <TrendingUp size={16} /> Nurturing
                </Link>
                <Link href="/snooze-campaign" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                  <Clock size={16} /> Snooze Campaign
                </Link>
                <Link href="/templates" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:hidden" onClick={() => setShowMenu(false)}>
                  <FileText size={16} /> Template Admin
                </Link>

                <div className="h-px bg-border my-1" />

                <button 
                  onClick={() => {
                    Cookies.remove('nexa_token');
                    Cookies.remove('nexa_user');
                    router.push('/login');
                  }} 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Historical Read-Only Session Banner */}
      {isHistoricalReadOnly && selectedCohort && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ Mode Data Historis (Read-Only):</span>
            <span>Anda sedang melihat arsip data Cohort {selectedCohort.nama_period}.</span>
          </div>
          <button
            onClick={() => {
              if (activeCohort) selectCohort(activeCohort.id_period);
            }}
            className="underline font-semibold hover:opacity-80 cursor-pointer"
          >
            Kembali ke Cohort Aktif ({activeCohort?.nama_period})
          </button>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </>
  );
}
