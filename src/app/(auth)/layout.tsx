import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — NexaMOS CRM',
  description: 'Masuk ke sistem NexaMOS CRM',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
