'use client';

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
  CheckCheck, Check, Phone, Briefcase, Loader2, RefreshCw,
} from 'lucide-react';

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
  const messagesEndRef                   = useRef<HTMLDivElement>(null);
  const pollingRef                       = useRef<NodeJS.Timeout | null>(null);

  const convId: number | string | null = conversation?.conv_id ?? null;

  // ── Load pesan & mark as read ──────────────────────────────────────────
  const loadMessages = useCallback(async (silent = false) => {
    if (!convId) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const data = await fetchMessages(convId);
      setMessages(data);
      // Tandai terbaca saat membuka percakapan
      await markConversationAsRead(convId).catch(() => null);
    } catch (err) {
      if (!silent) console.error('[ChatRoom] gagal load pesan:', err);
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }, [convId]);

  // Reset + load saat percakapan berubah
  useEffect(() => {
    setMessages([]);
    setInputText('');
    loadMessages();
  }, [loadMessages]);

  // Long Polling untuk update pesan real-time
  useEffect(() => {
    if (!convId) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(true), MESSAGES_POLL_MS);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convId, loadMessages]);

  // Auto-scroll ke bawah saat pesan baru masuk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!inputText.trim() || isSending || !convId) return;

    // ANTI DOUBLE-SEND: disable tombol & input segera
    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendMessage(convId, { text: textToSend });
      onMessageSent();
      await loadMessages(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pesan.';
      toast.error(msg);
      // Kembalikan teks ke input jika gagal
      setInputText(textToSend);
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
      <div className="bg-[#202c33] border-b border-[#222d34] px-4 py-3 flex items-center shadow-sm z-10 w-full">
        <Button
          variant="ghost" size="icon"
          className="mr-2 md:hidden text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback className="bg-[#6b7280] text-white">
            {conversation.student_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-semibold text-[#e9edef] leading-tight">{conversation.student_name}</h2>
          <div className="flex items-center text-xs mt-0.5">
            {isSwOpen ? (
              <span className="flex items-center text-[#00a884] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00a884] mr-1.5 animate-pulse" />
                24h Active
                {conversation.window_expires_at && (
                  <span className="ml-1.5 text-[#8696a0]">
                    (exp: {new Date(conversation.window_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center text-rose-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                Service Window Closed
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
            <div className="h-32 bg-gradient-to-r from-[#005c4b] to-[#202c33]" />
            <div className="px-6 pb-6 relative">
              <Avatar className="h-24 w-24 border-4 border-[#111b21] mx-auto -mt-12 bg-[#202c33] mb-4">
                <AvatarFallback className="bg-[#6b7280] text-white text-2xl font-semibold">
                  {conversation.student_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center mb-8">
                <h3 className="font-bold text-2xl text-[#e9edef]">{conversation.student_name}</h3>
                <p className="text-[#8696a0] mt-1 flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" /> {conversation.wa_number}
                </p>
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 w-full">
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
                className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 shadow-sm relative ${
                  msg.direction === 'outgoing'
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.body || `[${msg.type}]`}</p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className="text-[10px] text-gray-400">
                    {msg.datetime
                      ? new Date(msg.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
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
      <div className="bg-[#202c33] p-3 flex items-end space-x-2 z-10 w-full">
        {!isSwOpen ? (
          // SW CLOSED
          <div className="w-full flex flex-col space-y-2">
            <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs px-3 py-2 rounded-md flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
              <p>Jeda waktu respon telah melewati 24 jam. Anda hanya dapat membalas menggunakan Template Pesan resmi.</p>
            </div>
            <div className="flex items-center w-full space-x-2">
              <TemplatePicker
                buttonText={isSending ? 'Mengirim...' : 'Pilih & Kirim Template'}
                buttonClassName="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                studentName={conversation.student_name}
                disabled={isSending}
                onSendTemplate={handleSendTemplate}
              />
            </div>
          </div>
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
            <Button
              variant="ghost" size="icon"
              className="shrink-0 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Ketik pesan..."
                className="w-full rounded-full bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0] border-none focus-visible:ring-1 focus-visible:ring-[#00a884] pr-10 py-5"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
            </div>
            {/* ANTI DOUBLE-SEND: disabled saat isSending */}
            <Button
              className="shrink-0 rounded-full h-11 w-11 p-0 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] shadow-sm disabled:opacity-50"
              disabled={!inputText.trim() || isSending}
              onClick={handleSendText}
            >
              {isSending
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Send className="h-5 w-5 ml-1" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
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
        <ScrollArea className="h-[320px] mt-4 pr-4">
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
