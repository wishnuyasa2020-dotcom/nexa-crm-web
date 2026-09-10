'use client';

import Cookies from 'js-cookie';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Conversation, ChatMessage, WaTemplate,
  fetchMessages, sendMessage, markConversationAsRead, fetchTemplates,
} from '@/lib/chatApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  ArrowLeft, Paperclip, Send, Clock, AlertCircle,
  CheckCheck, Check, Phone, Briefcase, Loader2, RefreshCw, Info,
  Image as ImageIcon, Video, MapPin, X, FileText, Smile, MousePointer2
} from 'lucide-react';

import { InputAktivitasModal } from '@/components/siswa/InputAktivitasModal';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import { SwCountdown } from './SwCountdown';

interface ChatRoomProps {
  conversation:   Conversation | null;
  onBack:         () => void;
  onMessageSent:  () => void; // callback agar ChatLayout refresh conversation list
}

const MESSAGES_POLL_MS = 5000;

export function ChatRoom({ conversation, onBack, onMessageSent }: ChatRoomProps) {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [inputText,    setInputText]    = useState('');
  const [isSending,    setIsSending]    = useState(false); // anti double-send
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [showSwInfo,   setShowSwInfo]   = useState(false); // toggle info SW closed
  const [showAktivitasModal, setShowAktivitasModal] = useState(false); // state modal aktivitas

  // States untuk Media & File
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachAccept, setAttachAccept] = useState('image/*,video/*');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationData, setLocationData] = useState({ lat: '', lng: '', name: '', address: '' });
  const [mapsLink, setMapsLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef                   = useRef<HTMLDivElement>(null);
  const scrollContainerRef               = useRef<HTMLDivElement>(null); // ref ke scroll container
  const pollingRef                       = useRef<NodeJS.Timeout | null>(null);
  const forceScrollRef                   = useRef(false); // true saat harus paksa scroll (kirim/buka baru)

  const convId: number | string | null = conversation?.conv_id ?? null;

  // ── Cek apakah user dekat bawah (dalam 150px) ─────────────────────────
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // ── Load pesan & mark as read ──────────────────────────────────────────
  const loadMessages = useCallback(async (silent = false) => {
    if (!convId) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const data = await fetchMessages(convId);
      // Sort berdasarkan timestamp ascending (pakai timestamp Unix ms yang reliable)
      const sorted = [...data].sort((a, b) => {
        const ta = Number(a.timestamp) || new Date(a.datetime ?? 0).getTime();
        const tb = Number(b.timestamp) || new Date(b.datetime ?? 0).getTime();
        return ta - tb;
      });
      setMessages(sorted);
      // Tandai terbaca saat membuka percakapan
      await markConversationAsRead(convId).catch(() => null);
    } catch (err) {
      if (!silent) console.error('[ChatRoom] gagal load pesan:', err);
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }, [convId]);

  // Reset + load saat percakapan berubah — paksa scroll ke bawah
  useEffect(() => {
    setMessages([]);
    setInputText('');
    forceScrollRef.current = true; // buka percakapan baru → selalu scroll ke bawah
    loadMessages();
  }, [loadMessages]);

  // Long Polling untuk update pesan real-time
  useEffect(() => {
    if (!convId) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(true), MESSAGES_POLL_MS);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convId, loadMessages]);

  // Smart auto-scroll: hanya scroll kalau user dekat bawah ATAU dipaksa (buka/kirim)
  useEffect(() => {
    // Jangan konsumsi forceScrollRef jika list masih kosong (sedang loading)
    if (messages.length === 0) return;

    if (forceScrollRef.current || isNearBottom()) {
      const isForced = forceScrollRef.current;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: isForced ? 'instant' : 'smooth' });
      }, 50); // Beri jeda sebentar agar DOM selesai merender list pesan
      forceScrollRef.current = false;
    }
  }, [messages, isNearBottom]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background h-full text-muted-foreground w-full">
        <p className="text-lg">Pilih percakapan untuk memulai chat</p>
      </div>
    );
  }

  // Hitung service window secara real-time dari window_expires_at
  const isSwOpen = conversation.window_status === 'OPEN' &&
    (conversation.window_expires_at
      ? new Date(conversation.window_expires_at).getTime() > Date.now()
      : false);

  // ── Kirim Pesan Teks ───────────────────────────────────────────────────
  const handleSendText = async () => {
    if (selectedFile) {
      return handleSendMedia();
    }
    if (!inputText.trim() || isSending || !convId) return;

    // ANTI DOUBLE-SEND: disable tombol & input segera
    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendMessage(convId, { text: textToSend });
      onMessageSent();
      forceScrollRef.current = true; // paksa scroll ke bawah setelah kirim
      await loadMessages(true);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : (err?.response?.data?.message || 'Gagal mengirim pesan.');
      toast.error(msg);
      // Kembalikan teks ke input jika gagal
      setInputText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Ukuran file maksimal adalah 16MB sesuai batasan WhatsApp.');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setShowAttachMenu(false);
    }
  };

  const handleSendMedia = async () => {
    if (!selectedFile || isSending || !convId) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (inputText.trim()) formData.append('text', inputText.trim());

      await sendMessage(convId, formData);
      setInputText('');
      setSelectedFile(null);
      onMessageSent();
      forceScrollRef.current = true;
      await loadMessages(true);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : (err?.response?.data?.message || 'Gagal mengirim media.');
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendLocation = async () => {
    if (!locationData.lat || !locationData.lng || isSending || !convId) return;
    setIsSending(true);
    try {
      await sendMessage(convId, {
        type: 'location',
        latitude: parseFloat(locationData.lat),
        longitude: parseFloat(locationData.lng),
        location_name: locationData.name,
        location_address: locationData.address
      });
      setShowLocationModal(false);
      setLocationData({ lat: '', lng: '', name: '', address: '' });
      onMessageSent();
      forceScrollRef.current = true;
      await loadMessages(true);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : (err?.response?.data?.message || 'Gagal mengirim lokasi.');
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // ── Kirim Template ─────────────────────────────────────────────────────
  const handleSendTemplate = async (templateId: string | number) => {
    if (isSending || !convId) return;
    setIsSending(true);
    try {
      await sendMessage(convId, { templateId });
      toast.success('Template berhasil dikirim!');
      onMessageSent();
      await loadMessages(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim template.';
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info('Sedang mencari lokasi...');
      navigator.geolocation.getCurrentPosition((position) => {
        setLocationData(prev => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString()
        }));
        toast.success('Lokasi GPS berhasil didapatkan!');
      }, (error) => {
        toast.error('Gagal mendapatkan lokasi GPS: ' + error.message);
      }, { timeout: 10000 });
    } else {
      toast.error('Browser tidak mendukung Geolocation');
    }
  };

  const handleExtractMapsLink = () => {
    const match = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      setLocationData(prev => ({
        ...prev,
        lat: match[1],
        lng: match[2]
      }));
      toast.success('Koordinat berhasil diekstrak!');
      setMapsLink('');
    } else {
      toast.error('Gagal mengekstrak! Pastikan link dari browser yang mengandung (@latitude,longitude), bukan shortlink.');
    }
  };

  // ── Kirim Reaksi ───────────────────────────────────────────────────────
  const handleSendReaction = async (targetMessageId: string | number, emoji: string) => {
    if (!convId) return;
    // Jika emoji yang diklik sama dengan yang ada, berarti hapus reaksi (kirim string kosong)
    const currentReaction = messages.find(m => m.message_id === targetMessageId)?.reaction;
    const emojiToSend = currentReaction === emoji ? '' : emoji;
    
    // Optimistic update
    setMessages(prev => prev.map(m => m.message_id === targetMessageId ? { ...m, reaction: emojiToSend } : m));
    
    try {
      await sendMessage(convId, { type: 'reaction', targetMessageId, emoji: emojiToSend });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : (err?.response?.data?.message || 'Gagal mengirim reaksi.');
      toast.error(msg);
      // Revert jika gagal
      loadMessages(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full relative">
      {/* Header */}
      <div className="bg-card border-b border-border px-2 py-2 md:px-4 md:py-3 flex items-center shadow-sm z-10 w-full">
        <Button
          variant="ghost" size="icon"
          className="mr-1 md:mr-2 md:hidden text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-3">
          <AvatarFallback className="bg-muted-foreground text-white text-xs md:text-sm">
            {conversation.student_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground leading-tight text-sm md:text-base truncate">{conversation.student_name}</h2>
          <div className="flex items-center text-xs mt-0.5">
            {isSwOpen ? (
              <span className="flex items-center text-primary font-medium">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary mr-1 md:mr-1.5 animate-pulse" />
                <span className="mr-1"><SwCountdown expiresAt={conversation.window_expires_at || ''} /> Active</span>
                {conversation.window_expires_at && (
                  <span className="ml-1 md:ml-1.5 text-muted-foreground hidden sm:inline">
                    (exp: {format(new Date(conversation.window_expires_at), 'dd MMM yyyy HH:mm', { locale: id })})
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center text-rose-500 font-medium">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-500 mr-1 md:mr-1.5" />
                <span className="hidden xs:inline">Service Window </span>Closed
              </span>
            )}
          </div>
        </div>

        {/* Info Siswa Panel */}
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: 'outline', size: 'sm', className: 'hidden sm:flex bg-transparent border-border text-foreground hover:bg-accent hover:text-white' })}>
            Info Siswa
          </SheetTrigger>
          <SheetContent className="bg-background border-l border-border text-foreground p-0 overflow-y-auto sm:max-w-md w-full">
            <SheetHeader className="sr-only">
              <SheetTitle>Info Siswa</SheetTitle>
            </SheetHeader>
            <div className="h-32 bg-linear-to-r from-primary/60 to-card" />
            <div className="px-6 pb-6 relative">
              <Avatar className="h-24 w-24 border-4 border-background mx-auto -mt-12 bg-card mb-4">
                <AvatarFallback className="bg-muted-foreground text-white text-2xl font-semibold">
                  {conversation.student_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center mb-8">
                <h3 className="font-bold text-2xl text-foreground">{conversation.student_name}</h3>
                {conversation.wa_number ? (
                  <p className="text-muted-foreground mt-1 flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" /> {conversation.wa_number}
                  </p>
                ) : (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary text-primary hover:bg-primary/10"
                      onClick={() => {
                        toast.success('Permintaan kontak telah dikirim via Meta Interactive Message.');
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      Minta Nomor Telepon
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-xl border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Status & Pipeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Tahap Saat Ini
                      </span>
                      <span className="bg-accent text-blue-400 px-2.5 py-1 rounded-md text-xs font-medium">
                        {conversation.pipeline_status || '–'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Sisa Waktu SW
                      </span>
                      {isSwOpen ? (
                        <span className="text-primary text-sm font-medium">
                          {conversation.window_expires_at
                            ? new Date(conversation.window_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Active'}
                        </span>
                      ) : (
                        <span className="text-rose-500 text-sm font-medium">Tertutup</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Aksi Cepat */}
                <div className="bg-card p-4 rounded-xl border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Aksi Cepat</h4>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    onClick={() => setShowAktivitasModal(true)}
                  >
                    + Input Aktivitas
                  </Button>
                </div>

              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 px-2 py-3 md:p-4 w-full">
        {loadingMsgs && messages.length === 0 && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="flex flex-col space-y-3 pb-4">
          <div className="text-center my-4">
            <span className="bg-muted text-yellow-400 text-xs px-3 py-1.5 rounded-lg shadow-sm">
              Sesi percakapan diamankan dengan enkripsi end-to-end Meta.
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex group ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.direction === 'outgoing' && isSwOpen && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center pr-2">
                  <ReactionMenu onSelect={(emoji) => handleSendReaction(msg.message_id, emoji)} />
                </div>
              )}
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 shadow-sm relative ${
                  msg.direction === 'outgoing'
                    ? 'bg-primary/80 text-primary-foreground rounded-tr-none'
                    : 'bg-card text-foreground rounded-tl-none'
                }`}
              >
                <div className="text-xs md:text-sm whitespace-pre-wrap wrap-break-word">
                  {msg.type === 'image' && msg.media_id ? (
                    <div className="mb-2">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || '/api/crm'}/chats/media/${msg.media_id}?token=${Cookies.get('nexa_token') || ''}`} 
                        alt="Media terlampir" 
                        className="max-w-full max-h-64 object-contain rounded-md"
                        onLoad={() => {
                          if (isNearBottom()) {
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      />
                    </div>
                  ) : msg.type === 'image' && (
                    <div className="mb-2 bg-black/20 p-2 rounded flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> <span className="font-medium text-xs">Gambar (Gagal Muat)</span>
                    </div>
                  )}
                  {msg.type === 'video' && msg.media_id ? (
                    <div className="mb-2">
                      <video 
                        src={`${process.env.NEXT_PUBLIC_API_URL || '/api/crm'}/chats/media/${msg.media_id}?token=${Cookies.get('nexa_token') || ''}`} 
                        controls 
                        className="max-w-full max-h-64 rounded-md bg-black"
                        onLoadedData={() => {
                          if (isNearBottom()) {
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      />
                    </div>
                  ) : msg.type === 'video' && (
                    <div className="mb-2 bg-black/20 p-2 rounded flex items-center gap-2">
                      <Video className="h-4 w-4" /> <span className="font-medium text-xs">Video (Gagal Muat)</span>
                    </div>
                  )}
                  {msg.type === 'location' && (
                    <div className="mb-2 bg-black/20 p-2 rounded flex flex-col gap-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <MapPin className="h-4 w-4" /> <span>Lokasi</span>
                      </div>
                      <a href={`https://maps.google.com/?q=${msg.body}`} target="_blank" rel="noreferrer" className="text-blue-400 underline truncate">
                        Buka di Google Maps
                      </a>
                    </div>
                  )}
                  {msg.type === 'document' && (
                    <div className="mb-2 bg-black/20 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-black/30 transition-colors" onClick={() => msg.media_id && window.open(`${process.env.NEXT_PUBLIC_API_URL || '/api/crm'}/chats/media/${msg.media_id}?token=${Cookies.get('nexa_token') || ''}`)}>
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="h-5 w-5" /> <span>Dokumen Terlampir</span>
                      </div>
                      <span className="text-xs text-blue-400 underline">Unduh Dokumen</span>
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: renderMessageBody(msg.body || (msg.type === 'interactive' && msg.direction === 'incoming' ? '[Membalas Tombol Interaktif]' : `[${msg.type}]`)) }} />
                  {(msg.type === 'interactive' || msg.type === 'template') && msg.direction === 'outgoing' && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/20 flex items-center gap-1.5 text-xs text-blue-400 uppercase tracking-wider font-semibold">
                      <MousePointer2 className="h-3 w-3" /> Pilihan Interaktif Terlampir
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className="text-xs text-foreground/50">
                    {(() => {
                      // datetime (ISO string dari DB) = waktu asli pesan, pakai untuk display
                      // timestamp = Unix ms untuk sorting saja (bisa sama semua di legacy)
                      const date = msg.datetime
                        ? new Date(msg.datetime)
                        : (Number(msg.timestamp) > 0 ? new Date(Number(msg.timestamp)) : null);
                      if (!date) return '';
                      if (isToday(date)) {
                        return format(date, 'HH:mm', { locale: id });
                      }
                      if (isYesterday(date)) {
                        return `Kemarin, ${format(date, 'HH:mm', { locale: id })}`;
                      }
                      return format(date, 'dd/MM/yyyy HH:mm', { locale: id });
                    })()}
                  </span>
                  {msg.direction === 'outgoing' && (
                    <span className="text-foreground/50">
                      {msg.status === 'read'
                        ? <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                        : msg.status === 'delivered'
                        ? <CheckCheck className="h-3.5 w-3.5" />
                        : <Check className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>
                {msg.reaction && (
                  <div className={`absolute -bottom-3 ${msg.direction === 'outgoing' ? '-left-2' : '-right-2'} bg-accent border rounded-full px-1.5 py-0.5 text-xs shadow-sm z-10`}>
                    {msg.reaction}
                  </div>
                )}
              </div>
              {msg.direction === 'incoming' && isSwOpen && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center pl-2">
                  <ReactionMenu onSelect={(emoji) => handleSendReaction(msg.message_id, emoji)} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="bg-card px-2 py-2 md:p-3 flex items-end space-x-1.5 md:space-x-2 z-10 w-full relative border-t border-border">
        {!isSwOpen ? (
          // SW CLOSED — hanya ikon ⓘ + tombol template
          <>
            {/* Info icon kecil */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSwInfo(v => !v)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Info service window"
              >
                <Info className="h-4 w-4" />
              </button>
              {/* Popover info */}
              {showSwInfo && (
                <div className="absolute bottom-10 left-0 w-64 bg-accent border border-rose-900/50 text-rose-300 text-xs px-3 py-2.5 rounded-lg shadow-xl z-50">
                  <p className="leading-relaxed">Jeda waktu respon telah melewati 24 jam. Anda hanya dapat membalas menggunakan <span className="font-semibold text-rose-200">Template Pesan</span> resmi.</p>
                  <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-accent border-b border-r border-rose-900/50 rotate-45" />
                </div>
              )}
            </div>
            <TemplatePicker
              buttonText={isSending ? 'Mengirim...' : 'Pilih & Kirim Template'}
              buttonClassName="flex-1 h-9 md:h-11 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 text-xs md:text-sm"
              studentName={conversation.student_name}
              disabled={isSending}
              onSendTemplate={handleSendTemplate}
            />
          </>
        ) : (
          // SW OPEN
          <>
            <TemplatePicker
              buttonText=""
              iconOnly
              studentName={conversation.student_name}
              disabled={isSending}
              onSendTemplate={handleSendTemplate}
            />
            <div className="relative shrink-0">
              <Button
                variant="ghost" size="icon"
                onClick={() => { setShowEmojiMenu(!showEmojiMenu); setShowAttachMenu(false); }}
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-10 w-10"
              >
                <Smile className="h-5 w-5" />
              </Button>
              {showEmojiMenu && (
                <div className="absolute bottom-12 left-0 bg-accent border rounded-xl shadow-xl flex flex-wrap gap-2 p-3 w-56 z-50">
                  {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '✅', '❌', '😊', '🙌', '👌', '💯'].map(e => (
                    <button key={e} onClick={() => { setInputText(prev => prev + e); setShowEmojiMenu(false); }} className="text-xl hover:scale-125 transition-transform flex items-center justify-center h-8 w-8">
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <Button
                variant="ghost" size="icon"
                onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiMenu(false); }}
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-10 w-10"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-accent border rounded-xl shadow-xl flex flex-col overflow-hidden w-40 z-50">
                  <button
                    onClick={() => { setAttachAccept('image/*,video/*'); setShowAttachMenu(false); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-card transition-colors text-left"
                  >
                    <ImageIcon className="h-4 w-4 text-violet-400" /> Gambar/Video
                  </button>
                  <button
                    onClick={() => { setAttachAccept('.pdf,.doc,.docx,.xls,.xlsx'); setShowAttachMenu(false); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-card transition-colors text-left"
                  >
                    <FileText className="h-4 w-4 text-orange-400" /> Dokumen
                  </button>
                  <button
                    onClick={() => { setShowAttachMenu(false); setShowLocationModal(true); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-card transition-colors text-left"
                  >
                    <MapPin className="h-4 w-4 text-emerald-400" /> Lokasi
                  </button>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept={attachAccept}
              onChange={handleFileChange}
            />

            <div className="flex-1 relative flex flex-col">
              {selectedFile && (
                <div className={`absolute left-0 bg-accent px-3 py-2 rounded-t-xl border border-b-0 border-border flex items-center gap-3 ${selectedFile.type.startsWith('image/') ? '-top-20' : '-top-12'}`}>
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-16 w-16 object-cover rounded-md" />
                  ) : selectedFile.type.startsWith('video/') ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate max-w-40 text-xs text-foreground">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-rose-400 hover:text-rose-300 ml-2 bg-card p-1 rounded-full">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Input
                placeholder={selectedFile ? "Tambah keterangan..." : "Ketik pesan..."}
                className={`w-full bg-accent text-foreground border-none focus-visible:ring-1 focus-visible:ring-primary pr-10 py-5 ${selectedFile ? 'rounded-b-xl rounded-tr-xl rounded-tl-none' : 'rounded-full'}`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
            </div>
            {/* ANTI DOUBLE-SEND: disabled saat isSending */}
            <Button
              className="shrink-0 rounded-full h-11 w-11 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-50"
              disabled={(!inputText.trim() && !selectedFile) || isSending}
              onClick={handleSendText}
            >
              {isSending
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Send className="h-5 w-5 ml-1" />}
            </Button>
          </>
        )}
      </div>

      <InputAktivitasModal 
        isOpen={showAktivitasModal} 
        onClose={() => setShowAktivitasModal(false)} 
        siswaId={String(conversation?.id_siswa || '')}
        siswaName={conversation?.student_name || conversation?.wa_number || ''}
      />

      {/* Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Kirim Lokasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            
            <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border">
              <Button onClick={handleGetCurrentLocation} variant="outline" className="w-full">
                <MapPin className="h-4 w-4 mr-2 text-emerald-400" /> Dapatkan Lokasi Saat Ini (GPS)
              </Button>
              <div className="text-center text-xs text-muted-foreground py-1">ATAU</div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Tempel Link Google Maps..." 
                  value={mapsLink} 
                  onChange={e => setMapsLink(e.target.value)}
                  className="bg-muted border-border flex-1 text-xs"
                />
                <Button onClick={handleExtractMapsLink} disabled={!mapsLink} variant="secondary" className="text-xs">
                  Ekstrak
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Latitude</label>
                <Input 
                  placeholder="-6.200000" 
                  value={locationData.lat} 
                  onChange={e => setLocationData({...locationData, lat: e.target.value})}
                  className="bg-muted border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Longitude</label>
                <Input 
                  placeholder="106.816666" 
                  value={locationData.lng} 
                  onChange={e => setLocationData({...locationData, lng: e.target.value})}
                  className="bg-muted border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Nama Tempat (Opsional)</label>
              <Input 
                placeholder="Kantor Nexa" 
                value={locationData.name} 
                onChange={e => setLocationData({...locationData, name: e.target.value})}
                className="bg-muted border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Alamat (Opsional)</label>
              <Input 
                placeholder="Jl. Jend. Sudirman..." 
                value={locationData.address} 
                onChange={e => setLocationData({...locationData, address: e.target.value})}
                className="bg-muted border-none"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleSendLocation} disabled={!locationData.lat || !locationData.lng || isSending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirim Lokasi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper untuk render URL dan tombol
// ─────────────────────────────────────────────────────────────────────────────
function renderMessageBody(body: string) {
  if (!body) return '';
  // Mengubah URL menjadi anchor tag
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let html = body.replace(urlRegex, '<a href="$1" target="_blank" rel="noreferrer" class="text-blue-400 hover:underline break-all">$1</a>');
  
  // Mengubah baris yang terlihat seperti tombol "Quick Reply: [Teks]" menjadi tampilan tombol
  const btnRegex = /\[Quick Reply: (.*?)\]/g;
  html = html.replace(btnRegex, '<div class="mt-2 inline-block bg-accent border text-primary font-medium px-3 py-1.5 rounded-full text-xs shadow-sm">$1</div>');
  
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reaction Menu Component
// ─────────────────────────────────────────────────────────────────────────────
function ReactionMenu({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="h-7 w-7 rounded-full bg-card hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        <Smile className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-accent border rounded-full shadow-lg px-2 py-1.5 flex gap-1 z-50">
            {emojis.map(e => (
              <button 
                key={e} 
                onClick={() => { onSelect(e); setOpen(false); }}
                className="hover:bg-card h-8 w-8 rounded-full flex items-center justify-center text-lg transition-transform hover:scale-110"
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TemplatePicker Dialog
// ─────────────────────────────────────────────────────────────────────────────

/** Parse semua button labels dari meta_buttons atau parameters (semua tipe: QUICK_REPLY, URL, PHONE_NUMBER) */
function parseButtons(t: WaTemplate): { label: string; type: string }[] {
  // Coba meta_buttons dulu (string JSON dari kolom DB)
  if (t.meta_buttons) {
    try {
      const parsed = JSON.parse(t.meta_buttons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((b: any) => b.text)
          .map((b: any) => ({ label: b.text as string, type: (b.type || 'QUICK_REPLY') as string }));
      }
    } catch { /* lanjut ke fallback */ }
  }

  // Fallback: baca dari field 'parameters' (format internal CRM kita)
  if (t.parameters) {
    try {
      const params = JSON.parse(t.parameters);

      // Cek apakah ada meta_buttons di dalam parameters (struktur baru yang dipakai di templates/page.tsx)
      if (Array.isArray(params?.meta_buttons) && params.meta_buttons.length > 0) {
        return params.meta_buttons
          .filter((b: any) => b.text)
          .map((b: any) => ({ label: b.text as string, type: (b.type || 'QUICK_REPLY') as string }));
      }

      // Format 1: { buttons: [{text, type}] }
      if (Array.isArray(params?.buttons) && params.buttons.length > 0) {
        return params.buttons
          .filter((b: any) => b.text)
          .map((b: any) => ({ label: b.text as string, type: (b.type || 'QUICK_REPLY') as string }));
      }

      // Format 2: { components: [{type:'BUTTONS', buttons:[]}] }
      if (Array.isArray(params?.components)) {
        const btnComp = params.components.find((c: any) => c.type === 'BUTTONS');
        if (btnComp && Array.isArray(btnComp.buttons)) {
          return btnComp.buttons
            .filter((b: any) => b.text)
            .map((b: any) => ({ label: b.text as string, type: (b.type || 'QUICK_REPLY') as string }));
        }
      }
    } catch { /* abaikan */ }
  }
  return [];
}

/** Sub-komponen item template di list picker */
function TemplateListItem({
  template: t,
  resolvePreview,
  onPickReview,
}: {
  template: WaTemplate;
  resolvePreview: (body: string) => string;
  onPickReview: (t: WaTemplate) => void;
}) {
  return (
    <div
      className="border bg-card rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-foreground">{t.nama_template}</h4>
        <StatusBadge status={t.meta_status} />
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{resolvePreview(t.body_text)}</p>
      <Button
        size="sm"
        variant="outline"
        className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onPickReview(t)}
      >
        Preview &amp; Kirim
      </Button>
    </div>
  );
}

/** Resolve image URL: jika relative path, tambahkan base API + token */
function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path dari server CRM
  const base = process.env.NEXT_PUBLIC_API_URL || '/api/crm';
  const token = typeof window !== 'undefined' ? (document.cookie.match(/nexa_token=([^;]+)/) || [])[1] || '' : '';
  return `${base}${url}${token ? `?token=${token}` : ''}`;
}

/** Review Dialog — tampilan WA-bubble penerima */
function TemplateReviewDialog({
  template: t,
  resolvePreview,
  isSending,
  onConfirm,
  onBack,
}: {
  template: WaTemplate;
  resolvePreview: (body: string) => string;
  isSending: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const buttons = parseButtons(t);
  const resolvedBody = resolvePreview(t.body_text);
  const resolvedBodyHtml = renderMessageBody(resolvedBody);

  // Resolusi header (mengutamakan parameter dinamis jika ada)
  let pHeader: { type?: string; url?: string; params?: string[] } | null = null;
  if (t.parameters) {
    try {
      const params = JSON.parse(t.parameters);
      pHeader = params.header || null;
    } catch { /* ignore */ }
  }

  // Meta Console Source of Truth
  let finalHeaderType = (t.header_type || '').toLowerCase();
  if (!finalHeaderType || finalHeaderType === 'none') {
    const parsedType = (pHeader?.type || '').toLowerCase();
    // Only fallback for media to avoid text header hallucinations (e.g., STUDENT_NAME)
    if (['image', 'video', 'document'].includes(parsedType)) {
      finalHeaderType = parsedType;
    } else {
      finalHeaderType = 'none';
    }
  }
  const finalHeaderUrl  = finalHeaderType !== 'text' && finalHeaderType !== 'none' ? (pHeader?.url || t.header_url || null) : null;
  const finalHeaderText = finalHeaderType === 'text' ? (pHeader?.params?.[0] || t.header_filename || null) : null;
  const resolvedHeaderText = finalHeaderText ? resolvePreview(finalHeaderText) : null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onBack(); }}>
      {/* flex-col + max-h agar konten bisa scroll jika panjang */}
      <DialogContent className="sm:max-w-sm bg-background border-border text-foreground p-0 flex flex-col max-h-dvh overflow-hidden">

        {/* Header — fixed, tidak ikut scroll */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-border">
          <DialogTitle className="text-foreground flex items-center gap-2 text-sm">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">PREVIEW</span>
            {t.nama_template}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable area — bubble WA */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Wrapper bg simulasi wallpaper */}
          <div className="mx-5 my-4 rounded-xl overflow-hidden shadow-inner bg-muted">
            <div className="p-3 flex justify-start">
              {/* Bubble penerima */}
              <div className="max-w-[90%] bg-card rounded-lg rounded-tl-none shadow-sm overflow-hidden">

                {/* Header: image */}
                {finalHeaderType === 'image' && finalHeaderUrl && (
                  <img
                    src={resolveMediaUrl(finalHeaderUrl)}
                    alt="Header template"
                    className="w-full max-h-56 object-cover"
                    onError={(e) => {
                      // Sembunyikan jika gagal load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {/* Fallback placeholder jika header image tapi URL kosong */}
                {finalHeaderType === 'image' && !finalHeaderUrl && (
                  <div className="w-full h-32 bg-accent flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Header: video */}
                {finalHeaderType === 'video' && finalHeaderUrl && (
                  <video
                    src={resolveMediaUrl(finalHeaderUrl)}
                    controls
                    className="w-full max-h-56 bg-black"
                  />
                )}
                {finalHeaderType === 'video' && !finalHeaderUrl && (
                  <div className="w-full h-32 bg-accent flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Header: text */}
                {finalHeaderType === 'text' && resolvedHeaderText && (
                  <div className="px-3 pt-3 font-bold text-foreground text-sm leading-snug">
                    {resolvedHeaderText}
                  </div>
                )}

                {/* Body — pakai dangerouslySetInnerHTML agar URL & format WA tampil */}
                <div className="px-3 py-2.5">
                  <div
                    className="text-foreground text-sm whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: resolvedBodyHtml }}
                  />
                  <span className="block text-right text-xs text-muted-foreground mt-1">
                    Sekarang ✓
                  </span>
                </div>

                {/* Buttons */}
                {buttons.length > 0 && (
                  <div className="border-t border-border">
                    {buttons.map((btn, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-center px-3 py-2 text-blue-400 text-sm font-medium gap-1.5 ${
                          i < buttons.length - 1 ? 'border-b border-border' : ''
                        }`}
                      >
                        {btn.type === 'URL' ? (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current opacity-70" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                          </svg>
                        ) : btn.type === 'PHONE_NUMBER' ? (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current opacity-70" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current opacity-70" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                          </svg>
                        )}
                        {btn.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons — fixed di bawah */}
        <div className="px-5 py-4 shrink-0 border-t border-border flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isSending}
          >
            Batal
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50"
            onClick={onConfirm}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Send className="h-4 w-4 mr-1.5" />Kirim Sekarang</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePicker({
  buttonText,
  buttonClassName = '',
  iconOnly = false,
  studentName = '',
  disabled = false,
  onSendTemplate,
}: {
  buttonText:     string;
  buttonClassName?: string;
  iconOnly?:       boolean;
  studentName?:    string;
  disabled?:       boolean;
  onSendTemplate:  (templateId: string | number) => void;
}) {
  const [templates, setTemplates]           = useState<WaTemplate[]>([]);
  const [loading, setLoading]               = useState(false);
  const [open, setOpen]                     = useState(false);
  const [selectedForReview, setSelected]    = useState<WaTemplate | null>(null);
  const [isSendingReview, setIsSendingReview] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (templates.length > 0) return; // cache sederhana
    setLoading(true);
    try {
      const res = await fetchTemplates({ status: undefined });
      setTemplates(res.data.filter((t: WaTemplate) => t.status_crm === 'ACTIVE'));
    } catch {
      console.error('Gagal load templates');
    } finally {
      setLoading(false);
    }
  }, [templates.length]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (val) loadTemplates();
    if (!val) setSelected(null); // reset review saat picker ditutup
  };

  const resolvePreview = (text: string) => {
    if (!text) return '';
    const vars = [studentName, 'Nexa', ''];
    let resolved = text.replace(/\{\{(\d+)\}\}/g, (_, i) => vars[parseInt(i) - 1] || '');
    return resolved;
  };

  const handleConfirmSend = async () => {
    if (!selectedForReview) return;
    setIsSendingReview(true);
    try {
      await onSendTemplate(selectedForReview.id_template);
    } finally {
      setIsSendingReview(false);
      setSelected(null);
      setOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          disabled={disabled}
          className={
            iconOnly
              ? buttonVariants({ variant: 'ghost', size: 'icon', className: 'shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-10 w-10' })
              : buttonVariants({ className: buttonClassName })
          }
        >
          {iconOnly ? <Clock className="h-5 w-5" /> : buttonText}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Pilih Template Pesan</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80 mt-4 pr-4">
            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="space-y-3">
              {templates.map(t => (
                <TemplateListItem
                  key={t.id_template}
                  template={t}
                  resolvePreview={resolvePreview}
                  onPickReview={(tmpl) => setSelected(tmpl)}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Review Dialog — terbuka di atas list picker */}
      {selectedForReview && (
        <TemplateReviewDialog
          template={selectedForReview}
          resolvePreview={resolvePreview}
          isSending={isSendingReview || disabled}
          onConfirm={handleConfirmSend}
          onBack={() => setSelected(null)}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED:   'bg-green-950 text-green-400',
    PENDING:    'bg-yellow-950 text-yellow-400',
    REJECTED:   'bg-rose-950 text-rose-400',
    LOCAL_ONLY: 'bg-accent text-blue-400',
  };
  const labels: Record<string, string> = {
    APPROVED:   'META APPROVED',
    PENDING:    'PENDING',
    REJECTED:   'REJECTED',
    LOCAL_ONLY: 'LOCAL',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-accent text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
}
