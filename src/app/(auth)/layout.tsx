import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — Nexa CRM',
  description: 'Masuk ke sistem Nexa CRM',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
