import React from 'react';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhatsApp Chat - Nexa CRM',
  description: 'Modul pengelola pesan dan percakapan pelanggan',
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <ChatLayout />
    </div>
  );
}
