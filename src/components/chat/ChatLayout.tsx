'use client';

import React, { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatRoom } from './ChatRoom';
import { mockConversations } from '@/lib/mockChatData';

export function ChatLayout() {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const activeContact = mockConversations.find(c => c.id === activeContactId) || null;

  return (
    <div className="flex h-full flex-1 w-full overflow-hidden bg-[#111b21] text-[#e9edef]">
      {/* List Pane */}
      <div 
        className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-[#222d34] ${activeContactId ? 'hidden md:flex' : 'flex'}`}
      >
        <ConversationList 
          activeContactId={activeContactId} 
          onSelectContact={(id) => setActiveContactId(id)} 
        />
      </div>

      {/* Chat Room Pane */}
      <div 
        className={`flex-1 min-w-0 h-full ${!activeContactId ? 'hidden md:flex' : 'flex'}`}
      >
        <ChatRoom 
          contact={activeContact} 
          onBack={() => setActiveContactId(null)} 
        />
      </div>
    </div>
  );
}
