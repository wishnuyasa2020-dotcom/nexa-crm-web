'use client';

import React, { useState } from 'react';
import { Conversation, mockTemplates, Template } from '@/lib/mockChatData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Paperclip, Send, Clock, AlertCircle, CheckCircle2, Check, CheckCheck, Phone, Mail, MapPin, Briefcase } from 'lucide-react';

interface ChatRoomProps {
  contact: Conversation | null;
  onBack: () => void;
}

export function ChatRoom({ contact, onBack }: ChatRoomProps) {
  const [inputText, setInputText] = useState('');

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] h-full text-[#8696a0] w-full">
        <p className="text-lg">Pilih percakapan untuk memulai chat</p>
      </div>
    );
  }

  const isServiceWindowOpen = contact.serviceWindowStatus === 'OPEN';

  return (
    <div className="flex flex-col h-full bg-[#0b141a] w-full relative">
      {/* Header */}
      <div className="bg-[#202c33] border-b border-[#222d34] px-4 py-3 flex items-center shadow-sm z-10 w-full">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback className="bg-[#6b7280] text-white">
            {contact.studentName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-[#e9edef] leading-tight">{contact.studentName}</h2>
          <div className="flex items-center text-xs mt-0.5">
            {isServiceWindowOpen ? (
              <span className="flex items-center text-[#00a884] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00a884] mr-1.5 animate-pulse"></span>
                24h Active
              </span>
            ) : (
              <span className="flex items-center text-rose-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                Service Window Closed
              </span>
            )}
          </div>
        </div>

        {/* Info Panel Trigger */}
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "hidden sm:flex bg-transparent border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white" })}>
            Info Siswa
          </SheetTrigger>
          <SheetContent className="bg-[#111b21] border-l border-[#222d34] text-[#e9edef] p-0 overflow-y-auto sm:max-w-md w-full">
            <div className="h-32 bg-gradient-to-r from-[#005c4b] to-[#202c33] relative">
              {/* Header Cover */}
            </div>
            
            <div className="px-6 pb-6 relative">
              <Avatar className="h-24 w-24 border-4 border-[#111b21] mx-auto -mt-12 bg-[#202c33] mb-4">
                <AvatarFallback className="bg-[#6b7280] text-white text-2xl font-semibold">
                  {contact.studentName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center mb-8">
                <h3 className="font-bold text-2xl text-[#e9edef]">{contact.studentName}</h3>
                <p className="text-[#8696a0] mt-1 flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" /> {contact.waNumber}
                </p>
              </div>

              <div className="space-y-4">
                {/* Status Card */}
                <div className="bg-[#202c33] p-4 rounded-xl border border-[#222d34]">
                  <h4 className="text-xs font-semibold text-[#8696a0] mb-3 uppercase tracking-wider">Status & Pipeline</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#8696a0]" />
                        Tahap Saat Ini
                      </span>
                      <span className="bg-[#2a3942] text-[#53bdeb] px-2.5 py-1 rounded-md text-xs font-medium">
                        {contact.pipelineStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#8696a0]" />
                        Sisa Waktu SW
                      </span>
                      {isServiceWindowOpen ? (
                        <span className="text-[#00a884] text-sm font-medium">
                          {contact.windowExpiresAt ? new Date(contact.windowExpiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                        </span>
                      ) : (
                        <span className="text-rose-500 text-sm font-medium">Tertutup</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-[#202c33] p-4 rounded-xl border border-[#222d34]">
                  <h4 className="text-xs font-semibold text-[#8696a0] mb-3 uppercase tracking-wider">Tindakan Cepat</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full bg-[#111b21] border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white">
                      Ubah Status
                    </Button>
                    <Button variant="outline" className="w-full bg-[#111b21] border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942] hover:text-white">
                      Tandai Selesai
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 w-full">
        <div className="flex flex-col space-y-3 pb-4">
          {/* Mock Encryption Notice */}
          <div className="text-center my-4">
            <span className="bg-[#182229] text-[#ffd279] text-[11px] px-3 py-1.5 rounded-lg shadow-sm">
              Sesi percakapan diamankan dengan enkripsi end-to-end Meta.
            </span>
          </div>

          {contact.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 shadow-sm relative ${
                  msg.direction === 'outgoing' 
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                  {msg.direction === 'outgoing' && (
                    <span className="text-gray-400">
                      {msg.status === 'read' ? <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" /> : 
                       msg.status === 'delivered' ? <CheckCheck className="h-3.5 w-3.5" /> : 
                       <Check className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer Area */}
      <div className="bg-[#202c33] p-3 flex items-end space-x-2 z-10 w-full">
        {!isServiceWindowOpen ? (
          // SW CLOSED STATE
          <div className="w-full flex flex-col space-y-2">
            <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs px-3 py-2 rounded-md flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
              <p>Jeda waktu respon telah melewati 24 jam. Anda hanya dapat membalas menggunakan Template Pesan resmi.</p>
            </div>
            <div className="flex items-center w-full space-x-2">
              <TemplatePicker buttonText="Pilih & Kirim Template" buttonClassName="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white" studentName={contact.studentName} />
            </div>
          </div>
        ) : (
          // SW OPEN STATE
          <>
            <TemplatePicker buttonText="" iconOnly />
            <Button variant="ghost" size="icon" className="shrink-0 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10">
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input 
                placeholder="Ketik pesan..." 
                className="w-full rounded-full bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0] border-none focus-visible:ring-1 focus-visible:ring-[#00a884] pr-10 py-5"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            <Button className="shrink-0 rounded-full h-11 w-11 p-0 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] shadow-sm" disabled={!inputText.trim()}>
              <Send className="h-5 w-5 ml-1" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function TemplatePicker({ buttonText, buttonClassName = "", iconOnly = false, studentName = "" }: { buttonText: string, buttonClassName?: string, iconOnly?: boolean, studentName?: string }) {
  return (
    <Dialog>
      <DialogTrigger className={iconOnly 
        ? buttonVariants({ variant: "ghost", size: "icon", className: "shrink-0 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full h-10 w-10" })
        : buttonVariants({ className: buttonClassName })
      }>
        {iconOnly ? <Clock className="h-5 w-5" /> : buttonText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#111b21] border-[#222d34] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle className="text-[#e9edef]">Pilih Template Pesan</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] mt-4 pr-4">
          <div className="space-y-3">
            {mockTemplates.map(template => {
              // Mock variable replacement
              let previewText = template.bodyText;
              if (studentName) {
                previewText = previewText.replace('{{1}}', studentName).replace('{{2}}', 'Nexa');
              }

              return (
                <div key={template.id} className="border border-[#222d34] bg-[#202c33] rounded-lg p-3 hover:bg-[#2a3942] cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-[#e9edef]">{template.name}</h4>
                    {template.metaStatus === 'APPROVED' ? (
                      <span className="text-[10px] bg-[#005c4b] text-[#8696a0] px-2 py-0.5 rounded-full font-medium">META APPROVED</span>
                    ) : template.metaStatus === 'LOCAL_ONLY' ? (
                      <span className="text-[10px] bg-[#2a3942] text-[#53bdeb] px-2 py-0.5 rounded-full font-medium">LOCAL RESPONSE</span>
                    ) : (
                      <span className="text-[10px] bg-[#3f3b14] text-[#ffd279] px-2 py-0.5 rounded-full font-medium">{template.metaStatus}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#8696a0] mb-3">{previewText}</p>
                  <Button size="sm" className="w-full bg-[#111b21] hover:bg-[#222d34] text-[#e9edef] border-[#2a3942] opacity-0 group-hover:opacity-100 transition-opacity" variant="outline">Gunakan Template</Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
