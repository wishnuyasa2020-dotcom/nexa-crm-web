import { Home } from 'lucide-react';

export default function HomeVisitPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Home size={18} className="text-pink-400" />
        <h1 className="text-lg font-bold text-foreground">Home Visit</h1>
      </div>
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Home size={32} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Halaman Home Visit sedang dalam pengembangan.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Coming soon in the next build.</p>
      </div>
    </div>
  );
}
