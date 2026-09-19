'use client';

import React from 'react';
import { Conversation } from '@/lib/chatApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CommercialStateBadge } from '@/components/siswa/CommercialStateBadge';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantVocabulary } from '@/hooks/useTenantVocabulary';

interface ConversationListProps {
  conversations:        Conversation[];
  activeConvId:         number | string | null;
  isLoading:            boolean;
  tab:                  'all' | 'unread' | 'waiting';
  search:               string;
  selectedLifecycle?:   string;
  onTabChange:          (tab: 'all' | 'unread' | 'waiting') => void;
  onSearchChange:       (search: string) => void;
  onLifecycleChange?:   (lifecycle: string) => void;
  onSelectConversation: (convId: number | string) => void;
}

export function ConversationList({
  conversations,
  activeConvId,
  isLoading,
  tab,
  search,
  selectedLifecycle = 'all',
  onTabChange,
  onSearchChange,
  onLifecycleChange,
  onSelectConversation,
}: ConversationListProps) {
  const { t, lang } = useTranslation();
  const { getStateLabel } = useTenantVocabulary();
  const activeLocale = lang === 'en' ? enUS : localeId;

  const tabs: { value: 'all' | 'unread' | 'waiting'; label: string }[] = [
    { value: 'all',     label: t('chat.tabAll') },
    { value: 'unread',  label: t('chat.tabUnread') },
    { value: 'waiting', label: t('chat.tabWaiting') },
  ];

  const lifecycleOptions: { value: string; label: string }[] = [
    { value: 'all',           label: t('chat.allStages') },
    { value: 'LEAD',          label: getStateLabel('LEAD') },
    { value: 'PROSPECT',      label: getStateLabel('PROSPECT') },
    { value: 'OPPORTUNITY',   label: getStateLabel('OPPORTUNITY') },
    { value: 'REGISTERED',    label: getStateLabel('REGISTERED') },
    { value: 'CUSTOMER',      label: getStateLabel('CUSTOMER') },
    { value: 'POST_CUSTOMER', label: getStateLabel('POST_CUSTOMER') },
  ];

  const filtered = conversations.filter(c => {
    if (!search) return true;
    return (
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.wa_number.includes(search)
    );
  });

  return (
    // outer: full height flex column — MUST be flex-col with defined height
    <div className="flex flex-col w-full bg-background h-full">

      {/* ── Header + Search ── shrink-0 agar tidak ikut flex-grow */}
      <div className="shrink-0 px-3 py-2 md:p-4 border-b">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h2 className="text-base md:text-xl font-bold text-foreground">{t('chat.inboxTitle')}</h2>
          {isLoading && <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground animate-spin" />}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2 md:top-2.5 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          <Input
            placeholder={t('chat.searchPlaceholder')}
            className="pl-9 md:pl-10 bg-muted text-foreground border-none h-8 md:h-10 text-xs md:text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tab Bar ── shrink-0 */}
      <div className="shrink-0 flex border-b h-9 md:h-12">
        {tabs.map(item => (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={cn(
              'flex-1 text-xs md:text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === item.value
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Lifecycle State Filter Bar ── shrink-0 */}
      <div className="shrink-0 px-3 py-1.5 border-b bg-muted/20 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground shrink-0 font-medium">{t('chat.stageFilterLabel')}</span>
        <select
          value={selectedLifecycle || 'all'}
          onChange={(e) => onLifecycleChange?.(e.target.value)}
          aria-label={t('chat.stageFilterAria')}
          className="bg-background text-foreground border rounded-md px-2 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary w-full max-w-44"
        >
          {lifecycleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ── Scrollable Conversation List ── flex-1 + overflow-y-auto */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('chat.noConversations')}
          </div>
        )}
        {filtered.map(conv => (
          <ContactItem
            key={conv.conv_id}
            conversation={conv}
            isActive={activeConvId === conv.conv_id}
            activeLocale={activeLocale}
            t={t}
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
  activeLocale,
  t,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  activeLocale: typeof localeId;
  t: (key: any) => string;
  onClick: () => void;
}) {
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const timeLabel = c.last_msg_ts
    ? formatDistanceToNow(new Date(c.last_msg_ts), { addSuffix: false, locale: activeLocale })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center px-2.5 py-2 md:p-3 hover:bg-accent/50 transition-colors border-b border-border/50 ${isActive ? 'bg-accent' : ''}`}
    >
      <div className="relative mr-2.5 md:mr-3 shrink-0">
        <Avatar className="h-9 w-9 md:h-12 md:w-12 border">
          <AvatarFallback className="bg-muted-foreground text-white text-xs md:text-sm">{getInitials(c.student_name)}</AvatarFallback>
        </Avatar>
        {/* Indikator Service Window */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border-2 border-background ${
            c.window_status === 'OPEN' ? 'bg-primary' : 'bg-destructive'
          }`}
        />
      </div>

      <div className="flex-1 overflow-hidden pr-1.5 md:pr-2">
        <div className="flex justify-between items-baseline mb-0.5 md:mb-1">
          <h3 className="font-medium text-foreground truncate text-sm md:text-base">{c.student_name}</h3>
          <span className={`text-xs ml-1.5 md:ml-2 shrink-0 ${c.unread_count > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {timeLabel}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs md:text-sm text-muted-foreground truncate pr-2">{c.last_message_prev || '–'}</p>
          {c.unread_count > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
              {c.unread_count}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {(c.lifecycle_state || c.pipeline_status) && (
            <CommercialStateBadge
              state={c.lifecycle_state || c.pipeline_status || 'AUDIENCE'}
              channel={c.source_channel}
              relationshipLevel={(c.relationship_level as any) || undefined}
              size="sm"
            />
          )}
          {(c.has_payment_proof || c.pending_registration_token) && (
            <span className="inline-flex items-center gap-0.5 bg-amber-500/15 text-amber-600 border border-amber-500/30 text-xs px-1.5 py-0.5 rounded-md font-semibold shrink-0">
              💳 {c.pending_registration_token ? t('chat.badgeFormProof') : t('chat.badgeTransferProof')}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
