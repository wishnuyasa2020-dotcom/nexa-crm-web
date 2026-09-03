'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from './ConversationList';
import { ChatRoom } from './ChatRoom';
import { fetchConversations, Conversation } from '@/lib/chatApi';

const POLLING_INTERVAL_MS = 5000; // 5 detik

export function ChatLayout() {
  const searchParams = useSearchParams();
  const initConvId = searchParams.get('conv_id');
  const initialId = initConvId && !isNaN(Number(initConvId)) ? Number(initConvId) : initConvId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<number | string | null>(initialId);
  const [tab, setTab]                     = useState<'all' | 'unread' | 'waiting'>('all');
  const [search, setSearch]               = useState('');
  const [isLoading, setIsLoading]         = useState(true);

  // Ref agar polling tidak ter-trigger ulang saat state berubah
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initConvId) {
      setActiveConvId(initConvId);
    }
  }, [initConvId]);

  const activeContact = conversations.find(c => String(c.conv_id) === String(activeConvId)) ?? null;

  // ── Fetch conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await fetchConversations({ tab, search });
      setConversations(result.data || []);
    } catch (err) {
      console.error('[ChatLayout] Gagal memuat percakapan:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [tab, search]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Long Polling (silent refresh setiap 5 detik) ─────────────────────────
  useEffect(() => {
    // Bersihkan polling lama sebelum mulai yang baru
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      loadConversations(true); // silent = tidak tampil loading spinner
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadConversations]);

  // ── Handler ──────────────────────────────────────────────────────────────
  const handleSelectConversation = (convId: number | string) => {
    setActiveConvId(convId);
  };

  // Dipanggil oleh ChatRoom ketika pesan baru berhasil dikirim
  // agar list conversation langsung diperbarui tanpa tunggu polling
  const handleMessageSent = useCallback(() => {
    loadConversations(true);
  }, [loadConversations]);

  return (
    <div className="flex h-full flex-1 w-full overflow-hidden bg-[#111b21] text-[#e9edef]">
      {/* List Pane */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-[#222d34] h-full ${
          activeConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConvId={activeConvId}
          isLoading={isLoading}
          tab={tab}
          search={search}
          onTabChange={setTab}
          onSearchChange={setSearch}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Chat Room Pane */}
      <div className={`flex-1 min-w-0 h-full ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <ChatRoom
          conversation={activeContact}
          onBack={() => setActiveConvId(null)}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}
