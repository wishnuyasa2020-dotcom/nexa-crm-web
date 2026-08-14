import { Calendar } from 'lucide-react';

export default function WeeklyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-primary" />
        <h1 className="text-lg font-bold text-foreground">Weekly Planning</h1>
      </div>
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Halaman Weekly Planning sedang dalam pengembangan.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Coming soon in the next build.</p>
      </div>
    </div>
  );
}
