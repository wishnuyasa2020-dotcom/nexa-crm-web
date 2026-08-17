'use client';

import { Bell, Search, Users, Radio, TrendingUp, LogOut, Clock, FileText } from 'lucide-react';
import Cookies from 'js-cookie';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  nama?: string;
  username: string;
  role: string;
}

export default function Header({ title }: { title?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = Cookies.get('nexa_user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const initials = (user?.nama || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0 z-[100]">
      {/* Title */}
      <h1 className="text-base font-semibold text-foreground">{title || 'Dashboard'}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Search size={16} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative">
          <Bell size={16} />
        </button>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-border ml-1 hover:bg-secondary/50 rounded-lg pr-2 py-1 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-foreground leading-tight">{user?.nama || user?.username}</p>
              <p className="text-[10px] text-muted-foreground">{user?.role}</p>
            </div>
          </button>

          {/* Popup Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col py-1 z-[100]">
              <div className="px-3 py-2 border-b border-border sm:hidden">
                <p className="text-sm font-medium text-foreground truncate">{user?.nama || user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
              
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <Link href="/manajemen-tim" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setShowMenu(false)}>
                  <Users size={16} /> Manajemen Tim
                </Link>
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
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
