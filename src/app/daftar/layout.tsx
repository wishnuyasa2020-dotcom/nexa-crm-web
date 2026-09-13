import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Formulir Pendaftaran',
  description: 'Isi formulir pendaftaran untuk mendapatkan konsultasi karir bersama konselor resmi kami.',
  robots: { index: false, follow: false },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-sm font-medium">Memuat halaman pendaftaran...</span>
      </div>
    </div>
  );
}

export default function DaftarLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}
