'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from './ConversationList';
import { ChatRoom } from './ChatRoom';
import { fetchConversations, Conversation, subscribeToWebPush } from '@/lib/chatApi';
import { registerServiceWorker, subscribeToPushNotifications } from '@/lib/pushUtils';
import { Bell } from 'lucide-react';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import WhatsAppGatingBanner from '@/components/common/WhatsAppGatingBanner';

const POLLING_INTERVAL_MS = 5000; // 5 detik

export function ChatLayout() {
  const { data: waData, isConnected: isWaConnected, loading: waLoading } = useWhatsAppStatus();
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
    if (typeof window !== 'undefined') {
      console.log('[Push Debug] window is defined');
      if ('Notification' in window) {
        console.log('[Push Debug] Notification API is supported. Current permission:', Notification.permission);
        if (Notification.permission === 'granted') {
          setPushEnabled(true);
          // Jika sudah diizinkan, otomatis registrasi tanpa memunculkan banner
          registerServiceWorker().then(async () => {
            try {
              const sub = await subscribeToPushNotifications();
              if (sub) {
                await subscribeToWebPush(sub.toJSON());
                console.log('[Push Debug] Auto-subscribe success');
              }
            } catch (e) {
              console.error('[Push Debug] Auto-subscribe failed:', e);
            }
          });
        } else if (Notification.permission === 'default') {
          console.log('[Push Debug] Setting showPushBanner to true');
          setShowPushBanner(true);
        } else if (Notification.permission === 'denied') {
          console.warn('[Push Debug] Notification permission is denied by user.');
        }
      } else {
        console.warn('[Push Debug] Notification API is NOT supported in this browser/context.');
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
    <div className="flex flex-col h-full flex-1 w-full overflow-hidden bg-background text-foreground relative">
      {/* Banner Notifikasi */}
      {showPushBanner && (
        <div className="w-full z-50 bg-card border-b border-border px-4 py-2 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center text-sm">
            <Bell className="w-4 h-4 mr-2 text-primary" />
            <span>Aktifkan notifikasi desktop untuk menerima pesan masuk</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPushBanner(false)} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground">Nanti</button>
            <button onClick={handleEnablePush} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90">Aktifkan</button>
          </div>
        </div>
      )}

      {/* Banner Gating WhatsApp */}
      {!isWaConnected && !waLoading && (
        <div className="w-full p-2.5 bg-card border-b border-border z-40 shrink-0">
          <WhatsAppGatingBanner
            compact
            featureName="Live Chat WhatsApp"
            status={waData?.whatsappStatus}
          />
        </div>
      )}

      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {/* List Pane — lebar fixed di desktop, full-screen di mobile saat tidak ada chat aktif */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-border h-full ${
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
            isWaConnected={isWaConnected}
            waStatus={waData?.whatsappStatus}
          />
        </div>
      </div>
    </div>
  );
}
