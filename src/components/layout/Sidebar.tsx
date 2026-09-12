'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, School, CheckSquare, Calendar,
  Home, TrendingUp, Radio, FileText, LogOut, ChevronLeft, ChevronRight, Zap, Clock, MessageSquare,
  Settings as SettingsIcon, CalendarDays, BookOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Task List', href: '/tasks', icon: CheckSquare },
  { label: 'Weekly Planning', href: '/weekly', icon: Calendar },
  { label: 'Data Sekolah', href: '/sekolah', icon: School },
  { label: 'Data Siswa', href: '/siswa', icon: Users },
  { label: 'Home Visit', href: '/home-visit', icon: Home },
  { label: 'Broadcast WA', href: '/broadcast', icon: Radio },
  { label: 'Nurturing (Aktif)', href: '/nurturing', icon: TrendingUp },
  { label: 'Snooze Campaign', href: '/snooze-campaign', icon: Clock },
  { label: 'Live Chat', href: '/live-chat', icon: MessageSquare },
  { label: 'Template Admin', href: '/templates', icon: FileText },
  { label: 'Panduan Tenant', href: '/panduan', icon: BookOpen },
  { label: 'Manajemen Periode', href: '/manajemen-periode', icon: CalendarDays },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user, loadFromCookie } = useAuthStore();
  const isFullAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    loadFromCookie();
  }, [loadFromCookie]);

  function handleLogout() {
    Cookies.remove('nexa_token');
    Cookies.remove('nexa_user');
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center px-0'
      )}>
        <div className="shrink-0 w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm glow-primary">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">Nexa CRM</p>
            <p className="text-xs text-muted-foreground truncate">Powered by Nexa OS</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        <div className="space-y-0.5">
          {navItems.filter(item => !['/settings', '/manajemen-periode'].includes(item.href) || isFullAdmin).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20 glow-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                  collapsed && 'justify-center px-0 w-10 mx-auto'
                )}
              >
                <Icon className={cn('shrink-0 w-4.5 h-4.5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} size={18} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-150',
            collapsed && 'justify-center px-0 w-10 mx-auto'
          )}
          title={collapsed ? 'Perluas sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Tutup sidebar</span></>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150',
            collapsed && 'justify-center px-0 w-10 mx-auto'
          )}
          title="Keluar"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
