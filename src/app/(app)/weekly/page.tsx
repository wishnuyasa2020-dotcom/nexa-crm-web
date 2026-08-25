'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, Search, GripVertical, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, RotateCcw, School, User, Home, Star,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { weeklyApi, type BacklogItem, type BoardItem } from '@/lib/weeklyApi';

// ─────────────────────────────────────────────────────────────────────────────
// Date utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Senin dari suatu tanggal */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Format Date → "YYYY-MM-DD" menggunakan komponen tanggal LOKAL (bukan UTC) */
function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format "YYYY-MM-DD" → "17 Ags" secara lokal */
function formatDisplayDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d); // local date constructor — tidak ada shift UTC
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const DAYS_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Hasilkan array 6 hari (Senin–Sabtu) dari date Senin */
function buildWeekDays(monday: Date) {
  return DAYS_ID.map((title, i) => {
    const d = addDays(monday, i);
    return { id: `day-${i}`, title, date: toYMD(d) };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Jenis badge
// ─────────────────────────────────────────────────────────────────────────────
const JENIS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  sekolah:    { label: 'Sekolah',    icon: <School size={10} />,   cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'   },
  siswa:      { label: 'Siswa',      icon: <User size={10} />,     cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  home_visit: { label: 'Home Visit', icon: <Home size={10} />,     cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ekstra:     { label: 'Ekstra',     icon: <Star size={10} />,     cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function WeeklyPage() {
  const [mounted, setMounted] = useState(false);

  // ── Week navigation ──
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMondayOf(new Date()));
  const weekDays = buildWeekDays(weekMonday);
  const startDate = toYMD(weekMonday);
  const endDate   = toYMD(addDays(weekMonday, 5));

  // ── Data state ──
  const [backlog, setBacklog]       = useState<BacklogItem[]>([]);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(true);
  const [isLoadingBoard,   setIsLoadingBoard]   = useState(true);
  const [backlogError, setBacklogError]         = useState<string | null>(null);
  const [boardError,   setBoardError]           = useState<string | null>(null);

  // ── Search ──
  const [search, setSearch]   = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch backlog ──
  const fetchBacklog = useCallback(async (sq?: string) => {
    setIsLoadingBacklog(true);
    setBacklogError(null);
    try {
      const res = await weeklyApi.getBacklog({ search: sq || undefined });
      setBacklog(res.data?.data ?? []);
    } catch (e: unknown) {
      setBacklogError(e instanceof Error ? e.message : 'Gagal memuat backlog');
    } finally {
      setIsLoadingBacklog(false);
    }
  }, []);

  // ── Fetch board ──
  const fetchBoard = useCallback(async (sd: string, ed: string) => {
    setIsLoadingBoard(true);
    setBoardError(null);
    try {
      const res = await weeklyApi.getBoardItems({ startDate: sd, endDate: ed });
      setBoardItems(res.data?.data ?? []);
    } catch (e: unknown) {
      setBoardError(e instanceof Error ? e.message : 'Gagal memuat jadwal');
    } finally {
      setIsLoadingBoard(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBacklog();
    fetchBoard(startDate, endDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload board when week changes
  useEffect(() => {
    fetchBoard(startDate, endDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  // Debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchBacklog(search), 350);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Week navigation ──
  const goToPrevWeek = () => setWeekMonday(d => addDays(d, -7));
  const goToNextWeek = () => setWeekMonday(d => addDays(d,  7));
  const goToThisWeek = () => setWeekMonday(getMondayOf(new Date()));

  // ── Get board items for a specific date ──
  const getBoardForDay = (date: string) =>
    boardItems.filter(b => b.tanggal === date);

  // ── Drag & Drop handler ──
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcId  = source.droppableId;       // 'backlog' | 'day-0' .. 'day-5'
    const destId = destination.droppableId;  // 'backlog' | 'day-0' .. 'day-5'

    const destDay = weekDays.find(d => d.id === destId);
    const srcDay  = weekDays.find(d => d.id === srcId);

    // ── Case 1: Backlog → Day ──
    if (srcId === 'backlog' && destDay) {
      const item = backlog.find(b => b.taskId === draggableId);
      if (!item) return;

      // Optimistic: hapus dari backlog, tambah ke board
      setBacklog(prev => prev.filter(b => b.taskId !== draggableId));
      const tempBoardItem: BoardItem = {
        dbId: -1,
        id_agenda: `temp-${draggableId}`,
        referensi_id: draggableId.split(':')[1],
        jenis_agenda: draggableId.split(':')[0],
        judul: item.judul,
        tanggal: destDay.date,
        jam_mulai: null,
        jam_selesai: null,
        lokasi: null,
        cro: '',
        catatan: null,
      };
      setBoardItems(prev => [...prev, tempBoardItem]);

      try {
        const res = await weeklyApi.scheduleTask({ taskId: draggableId, tanggal: destDay.date });
        // Replace temp item dengan data real dari server
        const real = res.data?.data;
        if (real) {
          setBoardItems(prev =>
            prev.map(b => b.id_agenda === `temp-${draggableId}` ? real : b)
          );
        }
      } catch {
        // Rollback
        setBacklog(prev => [...prev, item]);
        setBoardItems(prev => prev.filter(b => b.id_agenda !== `temp-${draggableId}`));
      }
      return;
    }

    // ── Case 2: Day → Backlog ──
    if (srcDay && destId === 'backlog') {
      const item = boardItems.find(b => b.id_agenda === draggableId);
      if (!item) return;

      // Optimistic: hapus dari board, tambah ke backlog
      setBoardItems(prev => prev.filter(b => b.id_agenda !== draggableId));
      const tempBacklog: BacklogItem = {
        taskId: `${item.jenis_agenda}:${item.referensi_id}`,
        jenis: item.jenis_agenda as BacklogItem['jenis'],
        judul: item.judul,
        next_action: null,
        status: null,
        owner: item.cro,
        marketing_period: '',
      };
      setBacklog(prev => [tempBacklog, ...prev]);

      try {
        await weeklyApi.unscheduleTask(draggableId);
        // Refresh backlog untuk data lengkap
        fetchBacklog(search || undefined);
      } catch {
        // Rollback
        setBoardItems(prev => [...prev, item]);
        setBacklog(prev => prev.filter(b => b.taskId !== tempBacklog.taskId));
      }
      return;
    }

    // ── Case 3: Day → Day lain ──
    if (srcDay && destDay && srcId !== destId) {
      const item = boardItems.find(b => b.id_agenda === draggableId);
      if (!item) return;

      // Optimistic update tanggal
      setBoardItems(prev =>
        prev.map(b => b.id_agenda === draggableId ? { ...b, tanggal: destDay.date } : b)
      );

      try {
        await weeklyApi.rescheduleTask(draggableId, { newTanggal: destDay.date });
      } catch {
        // Rollback
        setBoardItems(prev =>
          prev.map(b => b.id_agenda === draggableId ? { ...b, tanggal: srcDay.date } : b)
        );
      }
    }
  };

  if (!mounted) return null;

  const isThisWeek = toYMD(getMondayOf(new Date())) === startDate;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 text-white">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Weekly Planning</h1>
            <p className="text-xs text-muted-foreground">
              {formatDisplayDate(startDate)} – {formatDisplayDate(endDate)}
            </p>
          </div>
        </div>

        {/* Navigasi minggu */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            title="Minggu sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToThisWeek}
            disabled={isThisWeek}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              isThisWeek
                ? 'border-primary bg-primary/10 text-primary cursor-default'
                : 'border-border hover:bg-secondary/50'
            )}
          >
            Minggu Ini
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            title="Minggu berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Board ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex flex-col sm:flex-row gap-4 overflow-hidden">

          {/* ── Sidebar Backlog ── */}
          <div className="w-full sm:w-64 h-56 sm:h-auto flex-shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-foreground text-sm">Belum Terjadwal</h2>
                <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                  {backlog.length}
                </span>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari target..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:border-primary outline-none"
                />
              </div>
            </div>

            {isLoadingBacklog ? (
              <div className="flex-1 flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Memuat...</span>
              </div>
            ) : backlogError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2 text-rose-500 px-4 text-center">
                <AlertCircle size={18} />
                <p className="text-xs">{backlogError}</p>
                <button onClick={() => fetchBacklog(search)} className="text-xs underline flex items-center gap-1">
                  <RotateCcw size={11} /> Coba lagi
                </button>
              </div>
            ) : (
              <Droppable droppableId="backlog">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 p-2 overflow-y-auto hide-scrollbar space-y-2 transition-colors min-h-[60px]',
                      snapshot.isDraggingOver && 'bg-primary/5'
                    )}
                  >
                    {backlog.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        {search ? 'Tidak ditemukan' : 'Semua sudah terjadwal 🎉'}
                      </p>
                    )}
                    {backlog.map((item, index) => (
                      <BacklogCard key={item.taskId} item={item} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>

          {/* ── Area Hari Kerja ── */}
          <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-3 pb-2">
            {isLoadingBoard ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Memuat jadwal...</span>
              </div>
            ) : boardError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-rose-500">
                <AlertCircle size={20} />
                <p className="text-sm">{boardError}</p>
                <button onClick={() => fetchBoard(startDate, endDate)} className="text-sm underline flex items-center gap-1">
                  <RotateCcw size={13} /> Coba lagi
                </button>
              </div>
            ) : (
              weekDays.map(col => {
                const colItems = getBoardForDay(col.date);
                const isOverloaded = colItems.length >= 5;
                const isToday = col.date === toYMD(new Date());

                return (
                  <div
                    key={col.id}
                    className={cn(
                      'w-56 flex-shrink-0 flex flex-col rounded-xl overflow-hidden border',
                      isToday
                        ? 'border-primary/40 bg-primary/5'
                        : 'bg-card/50 border-border'
                    )}
                  >
                    <div className={cn(
                      'p-2.5 border-b flex items-center justify-between',
                      isToday ? 'border-primary/20 bg-primary/10' : 'border-border bg-secondary/30',
                      isOverloaded && 'bg-amber-500/10 border-amber-400/20'
                    )}>
                      <div>
                        <h3 className={cn(
                          'font-bold text-sm',
                          isToday && 'text-primary'
                        )}>{col.title}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDisplayDate(col.date)}
                        </p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        isOverloaded
                          ? 'bg-amber-500/20 text-amber-600'
                          : isToday
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary text-muted-foreground'
                      )}>
                        {colItems.length} Task
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'flex-1 p-2 overflow-y-auto hide-scrollbar space-y-2 transition-colors min-h-[60px]',
                            snapshot.isDraggingOver && 'bg-primary/5'
                          )}
                        >
                          {colItems.map((item, index) => (
                            <BoardCard key={item.id_agenda} item={item} index={index} />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </DragDropContext>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BacklogCard — item di sidebar kiri
// ─────────────────────────────────────────────────────────────────────────────
function BacklogCard({ item, index }: { item: BacklogItem; index: number }) {
  const cfg = JENIS_CONFIG[item.jenis] ?? JENIS_CONFIG.ekstra;
  return (
    <Draggable draggableId={item.taskId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={cn(
            'bg-background border rounded-lg p-2.5 shadow-sm flex items-start gap-2 transition-all group cursor-grab active:cursor-grabbing',
            snapshot.isDragging
              ? 'border-primary shadow-lg shadow-primary/20 scale-[1.03] z-50 rotate-1'
              : 'border-border hover:border-primary/40'
          )}
        >
          <GripVertical size={14} className="text-muted-foreground/30 mt-0.5 flex-shrink-0 group-hover:text-muted-foreground/60" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate leading-tight">{item.judul}</h4>
            {item.next_action && (
              <p className="text-[10px] text-primary mt-0.5 truncate">{item.next_action}</p>
            )}
            <div className="mt-1.5 flex items-center gap-1 flex-wrap">
              <span className={cn('inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full', cfg.cls)}>
                {cfg.icon} {cfg.label}
              </span>
              {item.date_val && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/50">
                  <Calendar size={10} /> {formatDisplayDate(item.date_val)}
                </span>
              )}
              {item.status && (
                <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                  {item.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BoardCard — item di kolom hari
// ─────────────────────────────────────────────────────────────────────────────
function BoardCard({ item, index }: { item: BoardItem; index: number }) {
  const prefix = item.jenis_agenda as string;
  const cfg = JENIS_CONFIG[
    prefix === 'as' ? 'sekolah'
    : prefix === 'asi' ? 'siswa'
    : prefix === 'hv' ? 'home_visit'
    : 'ekstra'
  ] ?? JENIS_CONFIG.ekstra;
  const isTemp = item.id_agenda.startsWith('temp-');

  return (
    <Draggable draggableId={item.id_agenda} index={index} isDragDisabled={isTemp}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={cn(
            'bg-background border rounded-lg p-2.5 shadow-sm flex items-start gap-2 transition-all group',
            isTemp ? 'opacity-60 cursor-wait' : 'cursor-grab active:cursor-grabbing',
            snapshot.isDragging
              ? 'border-primary shadow-lg shadow-primary/20 scale-[1.03] z-50 rotate-1'
              : 'border-border hover:border-primary/40'
          )}
        >
          <GripVertical size={14} className="text-muted-foreground/30 mt-0.5 flex-shrink-0 group-hover:text-muted-foreground/60" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate leading-tight">{item.judul}</h4>
            {item.jam_mulai && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {item.jam_mulai}{item.jam_selesai ? ` – ${item.jam_selesai}` : ''}
              </p>
            )}
            <div className="mt-1.5">
              <span className={cn('inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full', cfg.cls)}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
          </div>
          {isTemp && <Loader2 size={11} className="animate-spin text-muted-foreground flex-shrink-0 mt-0.5" />}
        </div>
      )}
    </Draggable>
  );
}
