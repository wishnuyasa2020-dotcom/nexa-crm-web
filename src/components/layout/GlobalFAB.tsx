'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Search, Plus, School, X, Link as LinkIcon, Copy, QrCode, ExternalLink, CheckCircle2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import QRCode from 'react-qr-code';
import { getMockSekolahList, MockSekolah } from '@/lib/mock/sekolah';
import { InputAktivitasModal } from '@/components/sekolah/InputAktivitasModal';
import { AddSekolahModal } from '@/components/sekolah/AddSekolahModal';
import { usePathname } from 'next/navigation';

export function GlobalFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchAction, setSearchAction] = useState<'aktivitas' | 'link' | 'show-link' | null>(null);
  const [selectedSekolahForLink, setSelectedSekolahForLink] = useState<MockSekolah | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MockSekolah[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const main = document.getElementById('main-scroll-container');
    if (!main) return;

    let lastScrollY = main.scrollTop;

    const handleScroll = () => {
      const currentScrollY = main.scrollTop;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true); // scrolling up
      }
      lastScrollY = currentScrollY;
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  // Modals
  const [selectedSekolah, setSelectedSekolah] = useState<MockSekolah | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      const res = getMockSekolahList({ search: query, page: 1, pageSize: 5 });
      setSearchResults(res.data);
      setHasSearched(true);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const openInputAktivitas = (sekolah: MockSekolah) => {
    if (searchAction === 'aktivitas') {
      setSelectedSekolah(sekolah);
      setSearchAction(null);
    } else if (searchAction === 'link') {
      setSelectedSekolahForLink(sekolah);
      setSearchAction('show-link');
    }
  };

  const getFormUrl = () => {
    if (!selectedSekolahForLink) return '';
    return `${window.location.origin}/public/form-siswa?sekolahId=${selectedSekolahForLink.id}&croId=CRO-CURRENT`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getFormUrl());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (pathname.startsWith('/broadcast') || pathname.startsWith('/live-chat')) return null;

  return (
    <>
      {/* SPEED DIAL FAB */}
      <div
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-3 transition-transform duration-300",
          !isVisible && "translate-y-32 opacity-0 pointer-events-none"
        )}
      >
        {isSpeedDialOpen && (
          <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-5 fade-in-20">
            <button
              onClick={() => {
                setIsSpeedDialOpen(false);
                setSearchAction('aktivitas');
              }}
              className="flex items-center gap-3 group"
            >
              <span className="px-3 py-1.5 bg-background border border-border shadow-sm rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Catat Aktivitas
              </span>
              <div className="w-12 h-12 bg-card border border-border text-foreground flex items-center justify-center rounded-full shadow-lg hover:bg-secondary transition-colors">
                <Zap size={20} className="text-amber-500" />
              </div>
            </button>
            <button
              onClick={() => {
                setIsSpeedDialOpen(false);
                setSearchAction('link');
              }}
              className="flex items-center gap-3 group"
            >
              <span className="px-3 py-1.5 bg-background border border-border shadow-sm rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Link Sosialisasi
              </span>
              <div className="w-12 h-12 bg-card border border-border text-foreground flex items-center justify-center rounded-full shadow-lg hover:bg-secondary transition-colors">
                <LinkIcon size={20} className="text-primary" />
              </div>
            </button>
            <button
              onClick={() => {
                setIsSpeedDialOpen(false);
                router.push('/broadcast');
              }}
              className="flex items-center gap-3 group"
            >
              <span className="px-3 py-1.5 bg-background border border-border shadow-sm rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Broadcast Pesan
              </span>
              <div className="w-12 h-12 bg-card border border-border text-foreground flex items-center justify-center rounded-full shadow-lg hover:bg-secondary transition-colors">
                <Radio size={20} className="text-violet-500" />
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-all duration-300 md:w-auto md:px-5 md:rounded-2xl",
            isSpeedDialOpen ? "bg-rose-500 shadow-rose-500/30 scale-105" : "gradient-primary shadow-primary/30 hover:scale-105 active:scale-95"
          )}
        >
          {isSpeedDialOpen ? <X size={24} className="md:mr-2" /> : <Zap size={24} className="md:mr-2" />}
          <span className="hidden md:inline font-bold">
            {isSpeedDialOpen ? 'Tutup Menu' : 'Tindakan'}
          </span>
        </button>
      </div>

      {/* Quick Search Modal */}
      {(searchAction === 'aktivitas' || searchAction === 'link') && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden h-[80vh] max-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <h2 className="font-bold flex items-center gap-2">
                {searchAction === 'aktivitas' ? (
                  <><Zap size={16} className="text-amber-500" /> Quick Log Aktivitas</>
                ) : (
                  <><LinkIcon size={16} className="text-primary" /> Pilih Sekolah (Link Form)</>
                )}
              </h2>
              <button onClick={() => setSearchAction(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cari nama sekolah..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-9 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => openInputAktivitas(s)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{s.nama}</h3>
                        <p className="text-xs text-muted-foreground">{s.kecamatan} • {s.tingkat}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : hasSearched && searchQuery.length > 2 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <School size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Sekolah tidak ditemukan</p>
                    <p className="text-xs text-muted-foreground">Daftarkan sekolah baru dan langsung catat aktivitas.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchAction(null);
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={16} /> Daftarkan "{searchQuery}"
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50">
                  <Search size={32} className="mb-2" />
                  <p className="text-sm">Ketik nama sekolah untuk mencari</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actual Modals */}
      {selectedSekolah && (
        <InputAktivitasModal
          isOpen={!!selectedSekolah}
          onClose={() => setSelectedSekolah(null)}
          sekolah={selectedSekolah}
          onSuccess={() => setSelectedSekolah(null)}
        />
      )}

      {/* Note: In a real app, AddSekolahModal success should open InputAktivitasModal immediately (Inline Quick-Create) */}
      {showAddModal && (
        <AddSekolahModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
      {/* Show Link & QR Modal */}
      {searchAction === 'show-link' && selectedSekolahForLink && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Header / Background Decoration */}
            <div className="absolute top-0 left-0 right-0 h-24 gradient-primary opacity-10" />

            <button
              onClick={() => setSearchAction(null)}
              className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-secondary rounded-full backdrop-blur-md transition-colors"
            >
              <X size={18} />
            </button>

            <div className="bg-white p-3 rounded-2xl flex items-center justify-center mb-4 z-10 shadow-sm border border-border">
              <QRCode value={getFormUrl()} size={140} />
            </div>

            <h3 className="text-xl font-bold mb-1">Bagikan Form Publik</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Siswa di <span className="font-semibold text-foreground">{selectedSekolahForLink.nama}</span>
            </p>

            {/* Link Container */}
            <div className="w-full bg-secondary/50 border border-border rounded-xl p-3 mb-4 flex items-center gap-3">
              <div className="flex-1 truncate text-xs text-muted-foreground font-mono text-left">
                {getFormUrl()}
              </div>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-background border border-border rounded-lg hover:bg-secondary hover:text-primary transition-colors flex-shrink-0"
                title="Copy Link"
              >
                {isCopied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={copyToClipboard}
                className={cn(
                  "py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  isCopied ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-secondary text-foreground hover:bg-secondary/80 border border-transparent"
                )}
              >
                {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {isCopied ? 'Tersalin' : 'Copy'}
              </button>

              <button
                onClick={() => {
                  setSearchAction(null);
                  router.push(`/public/form-siswa?sekolahId=${selectedSekolahForLink.id}&croId=CRO-CURRENT`);
                }}
                className="py-3 px-4 gradient-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                Buka Form <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
