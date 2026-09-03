'use client';

import React from 'react';
import { Conversation } from '@/lib/chatApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

const TABS: { value: 'all' | 'unread' | 'waiting'; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'unread',  label: 'Unread' },
  { value: 'waiting', label: 'Waiting' },
];

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

  const filtered = conversations.filter(c => {
    if (!search) return true;
    return (
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.wa_number.includes(search)
    );
  });

  return (
    // outer: full height flex column — MUST be flex-col with defined height
    <div className="flex flex-col w-full bg-[#111b21]" style={{ height: '100%' }}>

      {/* ── Header + Search ── shrink-0 agar tidak ikut flex-grow */}
      <div className="shrink-0 px-3 py-2 md:p-4 border-b border-[#222d34]">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h2 className="text-base md:text-xl font-bold text-[#e9edef]">CRM Inbox</h2>
          {isLoading && <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#8696a0] animate-spin" />}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2 md:top-2.5 h-3.5 w-3.5 md:h-4 md:w-4 text-[#8696a0]" />
          <Input
            placeholder="Cari nama atau nomor..."
            className="pl-9 md:pl-10 bg-[#202c33] text-[#e9edef] border-none h-8 md:h-10 text-xs md:text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#00a884]"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tab Bar ── shrink-0 */}
      <div className="shrink-0 flex border-b border-[#222d34] h-9 md:h-12">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => onTabChange(t.value)}
            className={cn(
              'flex-1 text-xs md:text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.value
                ? 'text-[#00a884] border-[#00a884]'
                : 'text-[#8696a0] border-transparent hover:text-[#e9edef]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable Conversation List ── flex-1 + overflow-y-auto */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
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
      className={`w-full text-left flex items-center px-2.5 py-2 md:p-3 hover:bg-[#202c33] transition-colors border-b border-[#222d34]/50 ${isActive ? 'bg-[#2a3942]' : ''}`}
    >
      <div className="relative mr-2.5 md:mr-3 shrink-0">
        <Avatar className="h-9 w-9 md:h-12 md:w-12 border border-[#222d34]">
          <AvatarFallback className="bg-[#6b7280] text-white text-xs md:text-sm">{getInitials(c.student_name)}</AvatarFallback>
        </Avatar>
        {/* Indikator Service Window */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border-2 border-[#111b21] ${
            c.window_status === 'OPEN' ? 'bg-[#00a884]' : 'bg-rose-500'
          }`}
        />
      </div>

      <div className="flex-1 overflow-hidden pr-1.5 md:pr-2">
        <div className="flex justify-between items-baseline mb-0.5 md:mb-1">
          <h3 className="font-medium text-[#e9edef] truncate text-sm md:text-base">{c.student_name}</h3>
          <span className={`text-[10px] md:text-xs ml-1.5 md:ml-2 shrink-0 ${c.unread_count > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
            {timeLabel}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs md:text-sm text-[#8696a0] truncate pr-2">{c.last_message_prev || '–'}</p>
          {c.unread_count > 0 && (
            <span className="bg-[#00a884] text-[#111b21] text-[10px] md:text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
              {c.unread_count}
            </span>
          )}
        </div>
        {c.pipeline_status && (
          <p className="text-[9px] md:text-[11px] text-[#53bdeb] mt-0.5 md:mt-1 font-medium tracking-wide uppercase">{c.pipeline_status}</p>
        )}
      </div>
    </button>
  );
}
