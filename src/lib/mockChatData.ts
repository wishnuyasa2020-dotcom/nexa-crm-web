export type ServiceWindowStatus = 'OPEN' | 'CLOSED';
export type MessageDirection = 'incoming' | 'outgoing';

export interface Message {
  id: string;
  body: string;
  timestamp: string;
  direction: MessageDirection;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: string;
  studentName: string;
  waNumber: string;
  serviceWindowStatus: ServiceWindowStatus;
  windowExpiresAt?: string;
  unreadCount: number;
  lastMessageSnippet: string;
  lastMessageTimestamp: string;
  pipelineStatus: string;
  messages: Message[];
}

export interface Template {
  id: string;
  name: string;
  bodyText: string;
  metaStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'LOCAL_ONLY';
  category: string;
}

export const mockConversations: Conversation[] = [
  {
    id: 'C-001',
    studentName: 'Alice Johnson',
    waNumber: '+6281234567890',
    serviceWindowStatus: 'OPEN',
    windowExpiresAt: '2026-08-18T10:00:00Z',
    unreadCount: 2,
    lastMessageSnippet: 'Terima kasih atas infonya kak!',
    lastMessageTimestamp: '10:35 AM',
    pipelineStatus: 'Konsultasi',
    messages: [
      {
        id: 'M-101',
        body: 'Halo Alice, apakah ada yang bisa kami bantu terkait program ke Jepang?',
        timestamp: '10:00 AM',
        direction: 'outgoing',
        status: 'read',
      },
      {
        id: 'M-102',
        body: 'Halo kak, iya saya mau tanya detail biayanya',
        timestamp: '10:15 AM',
        direction: 'incoming',
      },
      {
        id: 'M-103',
        body: 'Baik, untuk biaya detailnya akan kami kirimkan brosur ya.',
        timestamp: '10:20 AM',
        direction: 'outgoing',
        status: 'delivered',
      },
      {
        id: 'M-104',
        body: 'Terima kasih atas infonya kak!',
        timestamp: '10:35 AM',
        direction: 'incoming',
      },
    ],
  },
  {
    id: 'C-002',
    studentName: 'Budi Santoso',
    waNumber: '+6289876543210',
    serviceWindowStatus: 'CLOSED',
    unreadCount: 0,
    lastMessageSnippet: 'Mohon maaf, sesi telah berakhir.',
    lastMessageTimestamp: 'Yesterday',
    pipelineStatus: 'Data Masuk',
    messages: [
      {
        id: 'M-201',
        body: 'Halo Budi, formulir pendaftaran kamu sudah kami terima.',
        timestamp: 'Yesterday 09:00 AM',
        direction: 'outgoing',
        status: 'read',
      },
      {
        id: 'M-202',
        body: 'Apakah kamu sudah memiliki sertifikat JLPT?',
        timestamp: 'Yesterday 09:05 AM',
        direction: 'outgoing',
        status: 'read',
      },
    ],
  },
  {
    id: 'C-003',
    studentName: 'Citra Kirana',
    waNumber: '+6281122334455',
    serviceWindowStatus: 'OPEN',
    windowExpiresAt: '2026-08-18T14:00:00Z',
    unreadCount: 1,
    lastMessageSnippet: 'Saya tunggu kabarnya ya',
    lastMessageTimestamp: '08:02 AM',
    pipelineStatus: 'Prospek Aktif',
    messages: [
      {
        id: 'M-301',
        body: 'Saya tunggu kabarnya ya',
        timestamp: '08:02 AM',
        direction: 'incoming',
      },
    ],
  },
];

export const mockTemplates: Template[] = [
  {
    id: 'TPL-001',
    name: 'Follow Up Hari 1',
    bodyText: 'Halo {{1}}, bagaimana kabarnya? Kami dari LPK {{2}} ingin menanyakan apakah kamu jadi ikut wawancara?',
    metaStatus: 'APPROVED',
    category: 'MARKETING',
  },
  {
    id: 'TPL-002',
    name: 'Pemberitahuan Kelulusan',
    bodyText: 'Selamat! {{1}} dinyatakan LULUS tahap pertama.',
    metaStatus: 'PENDING',
    category: 'UTILITY',
  },
  {
    id: 'TPL-003',
    name: 'Quick Reply: Mohon Tunggu',
    bodyText: 'Terima kasih, pesan kamu sudah kami terima. Mohon tunggu sebentar ya.',
    metaStatus: 'LOCAL_ONLY',
    category: 'REPLY',
  },
];
