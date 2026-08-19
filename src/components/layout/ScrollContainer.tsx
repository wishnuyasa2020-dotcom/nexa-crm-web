'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useDragScroll } from '@/hooks/useDragScroll';
import { cn } from '@/lib/utils';

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ScrollContainer({ children, className, ...props }: ScrollContainerProps) {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const pathname = usePathname();
  const isNoPaddingRoute = pathname.startsWith('/live-chat');

  return (
    <main
      ref={scrollRef}
      id="main-scroll-container"
      className={cn(
        'flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin', 
        className,
        isNoPaddingRoute && '!p-0 !pb-16 md:!p-0'
      )}
      {...props}
    >
      {children}
    </main>
  );
}
