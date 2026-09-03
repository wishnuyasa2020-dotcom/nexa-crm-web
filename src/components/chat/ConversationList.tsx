'use client';

import React from 'react';
import { Conversation } from '@/lib/chatApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ConversationListProps {
  conversations:        Conversation[];
  activeConvId:         number | string | null;
  isLoading:            boolean;
  tab:                  'all' | 'unread' | 'waiting';
  search:               string;
  onTabChange:          (tab: 'all' | 'unread' | 'waiting') => void;
  onSearchChange:       (search: string) => void;
  onSelectConversation: (convId: number | string) => void;
}

export function ConversationList({
  conversations,
  activeConvId,
  isLoading,
  tab,
  search,
  onTabChange,
  onSearchChange,
  onSelectConversation,
}: ConversationListProps) {

  // Filter unread & waiting di frontend (sudah di-filter di backend juga,
  // tapi kita filter ulang agar tidak perlu polling ulang saat ganti tab)
  const filtered = conversations.filter(c => {
    if (!search) return true;
    return (
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.wa_number.includes(search)
    );
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#111b21]">
      <div className="p-4 border-b border-[#222d34]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#e9edef]">CRM Inbox</h2>
          {isLoading && <Loader2 className="h-4 w-4 text-[#8696a0] animate-spin" />}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder="Cari nama atau nomor..."
            className="pl-10 bg-[#202c33] text-[#e9edef] border-none placeholder:text-[#8696a0] h-10 rounded-lg focus-visible:ring-1 focus-visible:ring-[#00a884]"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as typeof tab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-[#222d34] bg-transparent p-0 h-12">
          <TabsTrigger value="all"     className="flex-1 rounded-none text-[#8696a0] data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent h-full shadow-none data-[state=active]:shadow-none">All</TabsTrigger>
          <TabsTrigger value="unread"  className="flex-1 rounded-none text-[#8696a0] data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent h-full shadow-none data-[state=active]:shadow-none">Unread</TabsTrigger>
          <TabsTrigger value="waiting" className="flex-1 rounded-none text-[#8696a0] data-[state=active]:text-[#00a884] data-[state=active]:border-b-2 data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent h-full shadow-none data-[state=active]:shadow-none">Waiting</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value={tab} className="m-0">
            {filtered.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-32 text-[#8696a0] text-sm">
                Tidak ada percakapan.
              </div>
            )}
            {filtered.map(conv => (
              <ContactItem
                key={conv.conv_id}
                conversation={conv}
                isActive={activeConvId === conv.conv_id}
                onClick={() => onSelectConversation(conv.conv_id)}
              />
            ))}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactItem
// ─────────────────────────────────────────────────────────────────────────────
function ContactItem({
  conversation: c,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const timeLabel = c.last_msg_ts
    ? formatDistanceToNow(new Date(c.last_msg_ts), { addSuffix: false, locale: localeId })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center p-3 hover:bg-[#202c33] transition-colors border-b border-[#222d34]/50 ${isActive ? 'bg-[#2a3942]' : ''}`}
    >
      <div className="relative mr-3 shrink-0">
        <Avatar className="h-12 w-12 border border-[#222d34]">
          <AvatarFallback className="bg-[#6b7280] text-white">{getInitials(c.student_name)}</AvatarFallback>
        </Avatar>
        {/* Indikator Service Window */}
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#111b21] ${
            c.window_status === 'OPEN' ? 'bg-[#00a884]' : 'bg-rose-500'
          }`}
        />
      </div>

      <div className="flex-1 overflow-hidden pr-2">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-medium text-[#e9edef] truncate text-base">{c.student_name}</h3>
          <span className={`text-xs ml-2 shrink-0 ${c.unread_count > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
            {timeLabel}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#8696a0] truncate pr-2">{c.last_message_prev || '–'}</p>
          {c.unread_count > 0 && (
            <span className="bg-[#00a884] text-[#111b21] text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {c.unread_count}
            </span>
          )}
        </div>
        {c.pipeline_status && (
          <p className="text-[11px] text-[#53bdeb] mt-1 font-medium tracking-wide uppercase">{c.pipeline_status}</p>
        )}
      </div>
    </button>
  );
}
