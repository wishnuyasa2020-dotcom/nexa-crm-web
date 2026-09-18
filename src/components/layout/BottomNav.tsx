'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, CheckSquare, School, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Main',    href: '/dashboard', icon: LayoutDashboard },
  { label: 'Task',    href: '/tasks',     icon: CheckSquare },
  { label: 'Chat',    href: '/live-chat', icon: MessageSquare },
  { label: 'School',  href: '/sekolah',   icon: School },
  { label: 'Student', href: '/siswa',     icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

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

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={20} className={cn(isActive && "fill-primary/20")} />
            <span className="text-xs font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
