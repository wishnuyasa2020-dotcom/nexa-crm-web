'use client';

import React, { useState } from 'react';
import { mockConversations, Conversation } from '@/lib/mockChatData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ConversationListProps {
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
}

export function ConversationList({ activeContactId, onSelectContact }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = mockConversations.filter(c => 
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#111b21]">
      <div className="p-4 border-b border-[#222d34]">
        <h2 className="text-xl font-bold mb-4 text-[#e9edef]">CRM Inbox</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8696a0]" />
          <Input 
            placeholder="Cari nama atau nomor..." 
            className="pl-10 bg-[#202c33] text-[#e9edef] border-none placeholder:text-[#8696a0] h-10 rounded-lg focus-visible:ring-1 focus-visible:ring-[#00a884]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-[#222d34] bg-transparent p-0 h-12">
          <TabsTrigger value="all" className="flex-1 rounded-none text-[#8696a0] data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent h-full shadow-none data-[state=active]:shadow-none">All</TabsTrigger>
          <TabsTrigger value="unread" className="flex-1 rounded-none text-[#8696a0] data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent h-full shadow-none data-[state=active]:shadow-none">Unread</TabsTrigger>
          <TabsTrigger value="waiting" className="flex-1 rounded-none text-[#8696a0] data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent h-full shadow-none data-[state=active]:shadow-none">Waiting</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="all" className="m-0">
            {filtered.map(contact => (
              <ContactItem key={contact.id} contact={contact} isActive={activeContactId === contact.id} onClick={() => onSelectContact(contact.id)} />
            ))}
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            {filtered.filter(c => c.unreadCount > 0).map(contact => (
              <ContactItem key={contact.id} contact={contact} isActive={activeContactId === contact.id} onClick={() => onSelectContact(contact.id)} />
            ))}
          </TabsContent>
          <TabsContent value="waiting" className="m-0">
            {filtered.filter(c => c.pipelineStatus === 'Menunggu Balasan').map(contact => (
              <ContactItem key={contact.id} contact={contact} isActive={activeContactId === contact.id} onClick={() => onSelectContact(contact.id)} />
            ))}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ContactItem({ contact, isActive, onClick }: { contact: Conversation, isActive: boolean, onClick: () => void }) {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left flex items-center p-3 hover:bg-[#202c33] transition-colors border-b border-[#222d34]/50 ${isActive ? 'bg-[#2a3942]' : ''}`}
    >
      <Avatar className="h-12 w-12 mr-3 shrink-0 border border-[#222d34]">
        <AvatarFallback className="bg-[#6b7280] text-white">{getInitials(contact.studentName)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 overflow-hidden pr-2">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-medium text-[#e9edef] truncate text-base">{contact.studentName}</h3>
          <span className={`text-xs ml-2 shrink-0 ${contact.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
            {contact.lastMessageTimestamp}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#8696a0] truncate pr-2">{contact.lastMessageSnippet}</p>
          {contact.unreadCount > 0 && (
            <span className="bg-[#00a884] text-[#111b21] text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {contact.unreadCount}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#53bdeb] mt-1 font-medium tracking-wide uppercase">{contact.pipelineStatus}</p>
      </div>
    </button>
  );
}
