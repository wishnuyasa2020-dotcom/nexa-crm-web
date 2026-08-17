'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, CheckSquare, School, User, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Live Chat', href: '/live-chat', icon: MessageSquare },
  { label: 'Sekolah', href: '/sekolah', icon: School },
  { label: 'Profil', href: '/profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuthStore();
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
      "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-30 flex items-center justify-around px-2 pb-safe transition-transform duration-300",
      !isVisible && "translate-y-full"
    )}>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={20} className={cn(isActive && "fill-primary/20")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
