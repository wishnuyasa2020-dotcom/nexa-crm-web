'use client';

import { useState, useEffect } from 'react';
import { Calendar, Search, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/sekolah/StatusBadge';

// Mock Data
type TaskItem = {
  id: string;
  nama: string;
  nextAction: string;
  status: string;
  dueDate: string | null; // null = backlog
};

const initialTasks: TaskItem[] = [
  { id: 't1', nama: 'SMA N 1 Kota', nextAction: 'Visit Awal', status: 'Belum Visit', dueDate: null },
  { id: 't2', nama: 'SMK Budi Utama', nextAction: 'Kirim Proposal', status: 'Follow Up', dueDate: null },
  { id: 't3', nama: 'Budi Santoso', nextAction: 'Telepon Ortu', status: 'Konsultasi', dueDate: null },
  { id: 't4', nama: 'SMA N 2 Kota', nextAction: 'Visit Lanjutan', status: 'Tunggu Visit Ulang', dueDate: '2026-08-17' },
  { id: 't5', nama: 'SMA Taruna', nextAction: 'Sosialisasi', status: 'Sosialisasi Terjadwal', dueDate: '2026-08-19' },
  { id: 't6', nama: 'Andi Wijaya', nextAction: 'Kirim Formulir', status: 'Daftar', dueDate: '2026-08-20' },
  { id: 't7', nama: 'SMK Bina Nusa', nextAction: 'Follow Up Kepsek', status: 'Follow Up', dueDate: '2026-08-21' },
];

const COLUMNS = [
  { id: 'backlog', title: 'Belum Terjadwal', date: null },
  { id: 'senin', title: 'Senin', date: '2026-08-17' },
  { id: 'selasa', title: 'Selasa', date: '2026-08-18' },
  { id: 'rabu', title: 'Rabu', date: '2026-08-19' },
  { id: 'kamis', title: 'Kamis', date: '2026-08-20' },
  { id: 'jumat', title: 'Jumat', date: '2026-08-21' },
  { id: 'sabtu', title: 'Sabtu', date: '2026-08-22' },
];

export default function WeeklyPage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Jika di-drop di luar droppable area
    if (!destination) return;

    // Jika posisi tidak berubah
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = COLUMNS.find(c => c.id === source.droppableId);
    const destColumn = COLUMNS.find(c => c.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Pindahkan state
    const newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    
    if (taskIndex > -1) {
      // Update due date berdasarkan kolom tujuan
      newTasks[taskIndex] = {
        ...newTasks[taskIndex],
        dueDate: destColumn.date
      };
      setTasks(newTasks);
    }
  };

  if (!mounted) return null; // Mencegah hydration mismatch error untuk DND

  // Pengelompokkan Task
  const getTasksByColumn = (colId: string) => {
    const col = COLUMNS.find(c => c.id === colId);
    let filtered = tasks.filter(t => t.dueDate === (col?.date || null));
    
    if (colId === 'backlog' && search) {
      filtered = filtered.filter(t => t.nama.toLowerCase().includes(search.toLowerCase()));
    }
    return filtered;
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20 text-white">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Weekly Planning</h1>
            <p className="text-xs text-muted-foreground">17 Ags - 22 Ags 2026</p>
          </div>
        </div>
      </div>

      {/* ── Board ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-4 overflow-hidden">
          
          {/* Sidebar Backlog */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="font-semibold text-foreground flex items-center justify-between mb-3">
                Belum Terjadwal
                <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                  {getTasksByColumn('backlog').length}
                </span>
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari target..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            
            <Droppable droppableId="backlog">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 p-3 overflow-y-auto hide-scrollbar space-y-2 transition-colors",
                    snapshot.isDraggingOver ? "bg-primary/5" : ""
                  )}
                >
                  {getTasksByColumn('backlog').map((task, index) => (
                    <TaskCard key={task.id} task={task} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Area Hari Kerja */}
          <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-4 pb-2">
            {COLUMNS.slice(1).map(col => {
              const colTasks = getTasksByColumn(col.id);
              const isOverloaded = colTasks.length >= 5;

              return (
                <div key={col.id} className="w-72 flex-shrink-0 flex flex-col bg-card/50 border border-border rounded-xl overflow-hidden">
                  <div className={cn(
                    "p-3 border-b border-border flex items-center justify-between",
                    isOverloaded ? "bg-amber-500/10" : "bg-secondary/30"
                  )}>
                    <div>
                      <h3 className="font-bold text-foreground">{col.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{col.date}</p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      isOverloaded ? "bg-amber-500/20 text-amber-600" : "bg-secondary text-muted-foreground"
                    )}>
                      {colTasks.length} Tasks
                    </span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 p-3 overflow-y-auto hide-scrollbar space-y-2 transition-colors",
                          snapshot.isDraggingOver ? "bg-primary/5" : ""
                        )}
                      >
                        {colTasks.map((task, index) => (
                          <TaskCard key={task.id} task={task} index={index} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>

        </div>
      </DragDropContext>
    </div>
  );
}

function TaskCard({ task, index }: { task: TaskItem, index: number }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-background border rounded-lg p-3 shadow-sm flex items-start gap-2 transition-all group",
            snapshot.isDragging ? "border-primary shadow-lg shadow-primary/20 scale-105 z-50" : "border-border hover:border-primary/50"
          )}
          style={provided.draggableProps.style}
        >
          <GripVertical size={16} className="text-muted-foreground/30 mt-0.5 group-hover:text-muted-foreground/60" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-foreground truncate">{task.nama}</h4>
            <p className="text-[11px] font-medium text-primary mt-0.5 truncate">{task.nextAction}</p>
            <div className="mt-2">
              <StatusBadge status={task.status} size="sm" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
