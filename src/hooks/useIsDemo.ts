'use client';

import { useSyncExternalStore } from 'react';

/**
 * Helper sinkron untuk memeriksa apakah aplikasi sedang berada dalam Mode Demo.
 * Mendeteksi:
 * 1. Environment variable NEXT_PUBLIC_IS_DEMO === 'true'
 * 2. Subdomain demo (misal: demo.nexamos.cloud, demo.nexa.id, demo.localhost)
 * 3. Query parameter ?demo=1 atau ?demo=true untuk pengujian cepat
 */
export function checkIsDemo(): boolean {
  if (process.env.NEXT_PUBLIC_IS_DEMO === 'true') {
    return true;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (
      host === 'demo.nexamos.cloud' ||
      host.startsWith('demo.') ||
      host.includes('demo')
    ) {
      return true;
    }

    // Dukungan query param ?demo=true / ?demo=1 untuk testing
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true' || params.get('demo') === '1') {
      return true;
    }
  }

  return false;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

/**
 * Hook React untuk mendeteksi status Mode Demo NexaMOS CRM secara reaktif
 * menggunakan useSyncExternalStore agar aman dari SSR hydration mismatch dan cascading renders.
 */
export function useIsDemo(): boolean {
  return useSyncExternalStore(
    subscribe,
    checkIsDemo,
    () => process.env.NEXT_PUBLIC_IS_DEMO === 'true'
  );
}
