'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * ScrollContainer: Wrapper utama konten app.
 * 
 * NOTE: useDragScroll sengaja dihapus dari sini (2026-09-13).
 * Memasang useDragScroll di <main> global menyebabkan:
 * - Kursor "grab" muncul di seluruh halaman (termasuk form & tabel)
 * - Teks tidak bisa di-select/copy pada desktop (userSelect: 'none' saat mousedown)
 * - Click events dicegat saat user "mendrag" secara tidak sengaja
 * 
 * Jika diperlukan drag-scroll, gunakan useDragScroll hanya pada elemen
 * horizontal overflow spesifik (e.g., tab bar, card carousel), bukan di <main>.
 */
export function ScrollContainer({ children, className, ...props }: ScrollContainerProps) {
  const pathname = usePathname();
  const isNoPaddingRoute = pathname.startsWith('/live-chat');

  return (
    <main
      id="main-scroll-container"
      className={cn(
        'flex-1 flex flex-col w-full max-w-full min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin', 
        className,
        isNoPaddingRoute && 'p-0! pb-16! md:p-0! overflow-hidden!'
      )}
      {...props}
    >
      {children}
    </main>
  );
}
