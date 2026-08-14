'use client';

import { useState, useEffect } from 'react';
import { Zap, Search, Plus, School, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMockSekolahList, MockSekolah } from '@/lib/mock/sekolah';
import { InputAktivitasModal } from '@/components/sekolah/InputAktivitasModal';
import { AddSekolahModal } from '@/components/sekolah/AddSekolahModal';

export function GlobalFAB() {
  const [isOpen, setIsOpen] = useState(false);
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
    setSelectedSekolah(sekolah);
    setIsOpen(false);
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full gradient-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 md:w-auto md:px-5 md:rounded-2xl",
          !isVisible && "translate-y-32 opacity-0 pointer-events-none"
        )}
      >
        <Zap size={24} className="md:mr-2" />
        <span className="hidden md:inline font-bold">Catat Aktivitas</span>
      </button>

      {/* Quick Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden h-[80vh] max-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <h2 className="font-bold flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> Quick Log Aktivitas
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
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
                      setIsOpen(false);
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
    </>
  );
}
