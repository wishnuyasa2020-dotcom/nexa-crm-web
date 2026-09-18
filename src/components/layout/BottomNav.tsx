'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, CheckSquare, School, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.tasks',     href: '/tasks',     icon: CheckSquare },
  { labelKey: 'nav.liveChat',  href: '/live-chat', icon: MessageSquare },
  { labelKey: 'nav.school',    href: '/sekolah',   icon: School },
  { labelKey: 'nav.student',   href: '/siswa',     icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isFullAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    const main = document.getElementById('main-scroll-container');
    if (!main) return;

    let lastScrollY = main.scrollTop;

    const handleScroll = () => {
      const currentScrollY = main.scrollTop;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true); // scrolling up
      }
      lastScrollY = currentScrollY;
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-30 flex items-center justify-around px-2 pb-safe transition-transform duration-300",
      !isVisible && "translate-y-full"
    )}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        const label = t(item.labelKey as Parameters<typeof t>[0]);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={label}
            title={label}
            className={cn(
              "flex items-center justify-center w-full h-full transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={35} className={cn(isActive && "fill-primary/20")} />
          </Link>
        );
      })}
    </div>
  );
}
