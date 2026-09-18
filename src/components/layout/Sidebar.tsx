'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, School, CheckSquare, Calendar,
  Home, TrendingUp, Radio, FileText, LogOut, ChevronLeft, ChevronRight, Zap, Clock, MessageSquare,
  Settings as SettingsIcon, CalendarDays, BookOpen, UserCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard',     href: '/dashboard',         icon: LayoutDashboard },
  { labelKey: 'nav.tasks',         href: '/tasks',             icon: CheckSquare },
  { labelKey: 'nav.weekly',        href: '/weekly',            icon: Calendar },
  { labelKey: 'nav.school',        href: '/sekolah',           icon: School },
  { labelKey: 'nav.student',       href: '/siswa',             icon: Users },
  { labelKey: 'nav.homeVisit',     href: '/home-visit',        icon: Home },
  { labelKey: 'nav.broadcast',     href: '/broadcast',         icon: Radio },
  { labelKey: 'nav.nurturing',     href: '/nurturing',         icon: TrendingUp },
  { labelKey: 'nav.snoozeCampaign',href: '/snooze-campaign',   icon: Clock },
  { labelKey: 'nav.liveChat',      href: '/live-chat',         icon: MessageSquare },
  { labelKey: 'nav.templates',     href: '/templates',         icon: FileText },
  { labelKey: 'nav.guide',         href: '/panduan',           icon: BookOpen },
  { labelKey: 'nav.managePeriod',  href: '/manajemen-periode', icon: CalendarDays },
  { labelKey: 'nav.manageTeam',    href: '/manajemen-tim',     icon: UserCheck },
  { labelKey: 'nav.settings',      href: '/settings',          icon: SettingsIcon },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user, loadFromCookie } = useAuthStore();
  const { t } = useTranslation();
  const isFullAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager';

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
          {NAV_ITEMS.filter(item => !['/settings', '/manajemen-periode', '/manajemen-tim'].includes(item.href) || isFullAdmin).map((item) => {
            const Icon = item.icon;
            const label = t(item.labelKey as Parameters<typeof t>[0]);
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20 glow-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                  collapsed && 'justify-center px-0 w-10 mx-auto'
                )}
              >
                <Icon className={cn('shrink-0 w-4.5 h-4.5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} size={18} />
                {!collapsed && <span className="truncate">{label}</span>}
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
          title={collapsed ? t('nav.expandSidebar') : t('nav.closeSidebar')}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>{t('nav.closeSidebar')}</span></>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150',
            collapsed && 'justify-center px-0 w-10 mx-auto'
          )}
          title={t('nav.logout')}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
