'use client';

import { ReactNode } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { cn } from '@/lib/utils';

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ScrollContainer({ children, className, ...props }: ScrollContainerProps) {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <main
      ref={scrollRef}
      id="main-scroll-container"
      className={cn('flex-1 overflow-y-auto scrollbar-thin', className)}
      {...props}
    >
      {children}
    </main>
  );
}
