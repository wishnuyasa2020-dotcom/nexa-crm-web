'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from './ConversationList';
import { ChatRoom } from './ChatRoom';
import { fetchConversations, Conversation, subscribeToWebPush } from '@/lib/chatApi';
import { registerServiceWorker, subscribeToPushNotifications } from '@/lib/pushUtils';
import { Bell } from 'lucide-react';

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

  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      } else if (Notification.permission === 'default') {
        setShowPushBanner(true);
      }
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        setShowPushBanner(false);
        await registerServiceWorker();
        const sub = await subscribeToPushNotifications();
        if (sub) {
          await subscribeToWebPush(sub.toJSON());
        }
      } else {
        setShowPushBanner(false);
      }
    } catch (err) {
      console.error('Failed to enable push notifications:', err);
    }
  };

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
    <div className="flex h-full flex-1 w-full overflow-hidden bg-[#111b21] text-[#e9edef] relative">
      {/* Banner Notifikasi */}
      {showPushBanner && (
        <div className="absolute top-0 left-0 w-full z-50 bg-[#202c33] border-b border-[#222d34] px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center text-sm">
            <Bell className="w-4 h-4 mr-2 text-[#00a884]" />
            <span>Aktifkan notifikasi desktop untuk menerima pesan masuk</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPushBanner(false)} className="text-xs px-3 py-1.5 text-[#8696a0] hover:text-[#e9edef]">Nanti</button>
            <button onClick={handleEnablePush} className="text-xs px-3 py-1.5 bg-[#00a884] text-[#111b21] font-medium rounded hover:bg-[#00c99f]">Aktifkan</button>
          </div>
        </div>
      )}

      {/* List Pane */}
      <div
        className={`w-full md:w-87.5 lg:w-100 shrink-0 border-r border-[#222d34] h-full ${
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
