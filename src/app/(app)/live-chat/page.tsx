import React, { Suspense } from 'react';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhatsApp Chat - Nexa CRM',
  description: 'Modul pengelola pesan dan percakapan pelanggan',
};

export default function ChatPage() {
  return (
    <div className="h-full w-full overflow-hidden">
      <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-muted-foreground">Memuat Chat...</div>}>
        <ChatLayout />
      </Suspense>
    </div>
  );
}
