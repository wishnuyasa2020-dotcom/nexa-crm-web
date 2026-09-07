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
  Image as ImageIcon, Video, MapPin, X
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
  
  // Media & Location state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationData, setLocationData] = useState({ lat: '', lng: '', name: '', address: '' });
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
    if (forceScrollRef.current || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: forceScrollRef.current ? 'instant' : 'smooth' });
      forceScrollRef.current = false;
    }
  }, [messages, isNearBottom]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] h-full text-[#8696a0] w-full">
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
      setSelectedFile(e.target.files[0]);
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

  return (
    <div className="flex flex-col h-full bg-[#0b141a] w-full relative">
      {/* Header */}
      <div className="bg-[#202c33] border-b border-[#222d34] px-2 py-2 md:px-4 md:py-3 flex items-center shadow-sm z-10 w-full">
        <Button
          variant="ghost" size="icon"
          className="mr-1 md:mr-2 md:hidden text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-3">
          <AvatarFallback className="bg-[#6b7280] text-white text-xs md:text-sm">
            {conversation.student_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[#e9edef] leading-tight text-sm md:text-base truncate">{conversation.student_name}</h2>
          <div className="flex items-center text-[10px] md:text-xs mt-0.5">
            {isSwOpen ? (
              <span className="flex items-center text-[#00a884] font-medium">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00a884] mr-1 md:mr-1.5 animate-pulse" />
                <span className="mr-1"><SwCountdown expiresAt={conversation.window_expires_at || ''} /> Active</span>
                {conversation.window_expires_at && (
                  <span className="ml-1 md:ml-1.5 text-[#8696a0] hidden sm:inline">
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
          <SheetTrigger className={buttonVariants({ variant: 'outline', size: 'sm', className: 'hidden sm:flex bg-transparent border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white' })}>
            Info Siswa
          </SheetTrigger>
          <SheetContent className="bg-[#111b21] border-l border-[#222d34] text-[#e9edef] p-0 overflow-y-auto sm:max-w-md w-full">
            <SheetHeader className="sr-only">
              <SheetTitle>Info Siswa</SheetTitle>
            </SheetHeader>
            <div className="h-32 bg-linear-to-r from-[#005c4b] to-[#202c33]" />
            <div className="px-6 pb-6 relative">
              <Avatar className="h-24 w-24 border-4 border-[#111b21] mx-auto -mt-12 bg-[#202c33] mb-4">
                <AvatarFallback className="bg-[#6b7280] text-white text-2xl font-semibold">
                  {conversation.student_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center mb-8">
                <h3 className="font-bold text-2xl text-[#e9edef]">{conversation.student_name}</h3>
                {conversation.wa_number ? (
                  <p className="text-[#8696a0] mt-1 flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" /> {conversation.wa_number}
                  </p>
                ) : (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[#00a884] text-[#00a884] hover:bg-[#00a884]/10"
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
                <div className="bg-[#202c33] p-4 rounded-xl border border-[#222d34]">
                  <h4 className="text-xs font-semibold text-[#8696a0] mb-3 uppercase tracking-wider">Status & Pipeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#8696a0]" />
                        Tahap Saat Ini
                      </span>
                      <span className="bg-[#2a3942] text-[#53bdeb] px-2.5 py-1 rounded-md text-xs font-medium">
                        {conversation.pipeline_status || '–'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#8696a0]" />
                        Sisa Waktu SW
                      </span>
                      {isSwOpen ? (
                        <span className="text-[#00a884] text-sm font-medium">
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
                <div className="bg-[#202c33] p-4 rounded-xl border border-[#222d34]">
                  <h4 className="text-xs font-semibold text-[#8696a0] mb-3 uppercase tracking-wider">Aksi Cepat</h4>
                  <Button 
                    className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-semibold"
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
            <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
          </div>
        )}

        <div className="flex flex-col space-y-3 pb-4">
          <div className="text-center my-4">
            <span className="bg-[#182229] text-[#ffd279] text-[11px] px-3 py-1.5 rounded-lg shadow-sm">
              Sesi percakapan diamankan dengan enkripsi end-to-end Meta.
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 shadow-sm relative ${
                  msg.direction === 'outgoing'
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                }`}
              >
                <div className="text-xs md:text-sm whitespace-pre-wrap wrap-break-word">
                  {msg.type === 'image' && msg.media_id ? (
                    <div className="mb-2">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || '/api/crm'}/chats/media/${msg.media_id}?token=${Cookies.get('nexa_token') || ''}`} 
                        alt="Media terlampir" 
                        className="max-w-full max-h-64 object-contain rounded-md"
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
                  <div dangerouslySetInnerHTML={{ __html: renderMessageBody(msg.body || `[${msg.type}]`) }} />
                </div>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className="text-[10px] text-gray-400">
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
                    <span className="text-gray-400">
                      {msg.status === 'read'
                        ? <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                        : msg.status === 'delivered'
                        ? <CheckCheck className="h-3.5 w-3.5" />
                        : <Check className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="bg-[#202c33] px-2 py-2 md:p-3 flex items-end space-x-1.5 md:space-x-2 z-10 w-full relative">
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
                <div className="absolute bottom-10 left-0 w-64 bg-[#2a3942] border border-rose-900/50 text-rose-300 text-xs px-3 py-2.5 rounded-lg shadow-xl z-50">
                  <p className="leading-relaxed">Jeda waktu respon telah melewati 24 jam. Anda hanya dapat membalas menggunakan <span className="font-semibold text-rose-200">Template Pesan</span> resmi.</p>
                  <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-[#2a3942] border-b border-r border-rose-900/50 rotate-45" />
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
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-[#2a3942] border border-[#222d34] rounded-xl shadow-xl flex flex-col overflow-hidden w-40 z-50">
                  <button
                    onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#e9edef] hover:bg-[#202c33] transition-colors text-left"
                  >
                    <ImageIcon className="h-4 w-4 text-violet-400" /> Gambar/Video
                  </button>
                  <button
                    onClick={() => { setShowAttachMenu(false); setShowLocationModal(true); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#e9edef] hover:bg-[#202c33] transition-colors text-left"
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
              accept="image/*,video/*"
              onChange={handleFileChange}
            />

            <div className="flex-1 relative flex flex-col">
              {selectedFile && (
                <div className={`absolute left-0 bg-[#2a3942] px-3 py-2 rounded-t-xl border border-b-0 border-[#222d34] flex items-center gap-3 ${selectedFile.type.startsWith('image/') ? '-top-20' : '-top-12'}`}>
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-16 w-16 object-cover rounded-md" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-[#8696a0]" />
                  )}
                  <span className="truncate max-w-40 text-xs text-[#e9edef]">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-rose-400 hover:text-rose-300 ml-2 bg-[#202c33] p-1 rounded-full">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Input
                placeholder={selectedFile ? "Tambah keterangan..." : "Ketik pesan..."}
                className={`w-full bg-[#2a3942] text-[#e9edef] border-none focus-visible:ring-1 focus-visible:ring-[#00a884] pr-10 py-5 ${selectedFile ? 'rounded-b-xl rounded-tr-xl rounded-tl-none' : 'rounded-full'}`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
            </div>
            {/* ANTI DOUBLE-SEND: disabled saat isSending */}
            <Button
              className="shrink-0 rounded-full h-11 w-11 p-0 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] shadow-sm disabled:opacity-50"
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
        <DialogContent className="bg-[#111b21] border-[#222d34] text-[#e9edef]">
          <DialogHeader>
            <DialogTitle>Kirim Lokasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#8696a0]">Latitude</label>
                <Input 
                  placeholder="-6.200000" 
                  value={locationData.lat} 
                  onChange={e => setLocationData({...locationData, lat: e.target.value})}
                  className="bg-[#202c33] border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8696a0]">Longitude</label>
                <Input 
                  placeholder="106.816666" 
                  value={locationData.lng} 
                  onChange={e => setLocationData({...locationData, lng: e.target.value})}
                  className="bg-[#202c33] border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8696a0]">Nama Tempat (Opsional)</label>
              <Input 
                placeholder="Kantor Nexa" 
                value={locationData.name} 
                onChange={e => setLocationData({...locationData, name: e.target.value})}
                className="bg-[#202c33] border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8696a0]">Alamat (Opsional)</label>
              <Input 
                placeholder="Jl. Jend. Sudirman..." 
                value={locationData.address} 
                onChange={e => setLocationData({...locationData, address: e.target.value})}
                className="bg-[#202c33] border-none"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleSendLocation} disabled={!locationData.lat || !locationData.lng || isSending} className="bg-[#00a884] hover:bg-[#008f6f] text-[#111b21]">
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
  html = html.replace(btnRegex, '<div class="mt-2 inline-block bg-[#2a3942] border border-[#3b4a54] text-[#00a884] font-medium px-3 py-1.5 rounded-full text-xs shadow-sm">$1</div>');
  
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// TemplatePicker Dialog
// ─────────────────────────────────────────────────────────────────────────────
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
  const [templates, setTemplates]   = useState<WaTemplate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);

  const loadTemplates = useCallback(async () => {
    if (templates.length > 0) return; // cache sederhana
    setLoading(true);
    try {
      const res = await fetchTemplates({ status: undefined }); // semua template aktif
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
  };

  const resolvePreview = (bodyText: string) => {
    const vars = [studentName, 'Nexa', ''];
    return bodyText.replace(/\{\{(\d+)\}\}/g, (_, i) => vars[parseInt(i) - 1] || '');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        disabled={disabled}
        className={
          iconOnly
            ? buttonVariants({ variant: 'ghost', size: 'icon', className: 'shrink-0 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10' })
            : buttonVariants({ className: buttonClassName })
        }
      >
        {iconOnly ? <Clock className="h-5 w-5" /> : buttonText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#111b21] border-[#222d34] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle className="text-[#e9edef]">Pilih Template Pesan</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-80 mt-4 pr-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
            </div>
          )}
          <div className="space-y-3">
            {templates.map(t => (
              <div
                key={t.id_template}
                className="border border-[#222d34] bg-[#202c33] rounded-lg p-3 hover:bg-[#2a3942] cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm text-[#e9edef]">{t.nama_template}</h4>
                  <StatusBadge status={t.meta_status} />
                </div>
                <p className="text-xs text-[#8696a0] mb-3">{resolvePreview(t.body_text)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-[#111b21] hover:bg-[#222d34] text-[#e9edef] border-[#2a3942] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    onSendTemplate(t.id_template);
                    setOpen(false);
                  }}
                >
                  Gunakan Template
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED:   'bg-[#005c4b] text-[#00a884]',
    PENDING:    'bg-[#3f3b14] text-[#ffd279]',
    REJECTED:   'bg-rose-950 text-rose-400',
    LOCAL_ONLY: 'bg-[#2a3942] text-[#53bdeb]',
  };
  const labels: Record<string, string> = {
    APPROVED:   'META APPROVED',
    PENDING:    'PENDING',
    REJECTED:   'REJECTED',
    LOCAL_ONLY: 'LOCAL',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-[#2a3942] text-[#8696a0]'}`}>
      {labels[status] || status}
    </span>
  );
}
