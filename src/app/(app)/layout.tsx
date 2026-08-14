import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { GlobalFAB } from '@/components/layout/GlobalFAB';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScrollContainer } from '@/components/layout/ScrollContainer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header />
        <ScrollContainer className="p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </ScrollContainer>
        <GlobalFAB />
        <BottomNav />
      </div>
    </div>
  );
}
