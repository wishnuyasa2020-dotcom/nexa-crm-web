import { FileText } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-sky-400" />
        <h1 className="text-lg font-bold text-foreground">Template Admin</h1>
      </div>
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <FileText size={32} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Manajemen template WhatsApp sedang dalam pengembangan.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Coming soon — sinkronisasi template ke Meta API.</p>
      </div>
    </div>
  );
}
