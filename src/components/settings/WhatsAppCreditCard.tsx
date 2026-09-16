'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  creditBillingApi, 
  CreditBalanceData, 
  TopupRequestItem, 
  CreditTransactionItem 
} from '@/lib/creditBillingApi';
import TopupCreditModal from './TopupCreditModal';
import { 
  Wallet, Plus, RefreshCw, AlertTriangle, ShieldCheck, 
  CheckCircle2, Clock, XCircle, ArrowDownRight, MessageSquare, 
  HelpCircle, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WhatsAppCreditCard() {
  const [balance, setBalance] = useState<CreditBalanceData | null>(null);
  const [topups, setTopups] = useState<TopupRequestItem[]>([]);
  const [transactions, setTransactions] = useState<CreditTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'history'>('requests');

  const loadCreditData = useCallback(async () => {
    try {
      setLoading(true);
      const [balRes, topRes, txRes] = await Promise.allSettled([
        creditBillingApi.getBalance(),
        creditBillingApi.getTopupRequests(),
        creditBillingApi.getTransactions(1, 10),
      ]);

      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value);
      }
      if (topRes.status === 'fulfilled') {
        setTopups(topRes.value);
      }
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data);
      }
    } catch (err) {
      console.error('Error loading credit data:', err);
      toast.error('Gagal memuat status saldo kredit WhatsApp.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreditData();
  }, [loadCreditData]);

  const fmtRp = (n: number) => {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !balance) {
    return (
      <div className="bg-card border rounded-2xl p-6 shadow-xs flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-primary animate-spin mr-3" />
        <span className="text-xs font-medium text-muted-foreground">Memuat data kredit WhatsApp...</span>
      </div>
    );
  }

  const isBlocked = balance?.is_blocked ?? false;
  const statusLabel = balance?.status_label ?? 'OK';
  const totalBalance = balance?.balance ?? 0;
  const usableBalance = balance?.usable_balance ?? 0;
  const threshold = balance?.threshold ?? 350000;

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-xs relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Saldo & Tombol Top-Up */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base text-foreground">Kredit Pesan WhatsApp (Meta API)</h3>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  statusLabel === 'OK'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : statusLabel === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                )}
              >
                {statusLabel === 'OK' ? '✓ Saldo Aman' : statusLabel === 'WARNING' ? '⚠ Saldo Rendah' : '🚫 Terblokir'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo prabayar terisolasi untuk biaya pengiriman pesan template resmi Meta di NexaMOS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadCreditData}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Data Saldo"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowTopupModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Top-Up Saldo</span>
          </button>
        </div>
      </div>

      {/* Grid Metrik Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Saldo */}
        <div className="p-4 rounded-xl bg-secondary/30 border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">Total Saldo di NexaMOS</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {fmtRp(totalBalance)}
          </div>
          <span className="text-xs text-muted-foreground block">
            Termasuk dana cadangan jaminan
          </span>
        </div>

        {/* Saldo Aktif Dapat Dipakai */}
        <div className="p-4 rounded-xl bg-secondary/30 border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">Saldo Efektif Kirim Pesan</span>
          <div
            className={cn(
              'text-xl sm:text-2xl font-bold font-mono',
              usableBalance > 0 ? 'text-emerald-600' : 'text-rose-500'
            )}
          >
            {fmtRp(usableBalance)}
          </div>
          <span className="text-xs text-muted-foreground block">
            {usableBalance > 0 ? 'Dapat dipakai mengirim pesan' : 'Kredit pesan habis, segera top-up'}
          </span>
        </div>

        {/* Buffer Limit Threshold */}
        <div className="p-4 rounded-xl bg-secondary/30 border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">Threshold Buffer Proteksi</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-muted-foreground">
            {fmtRp(threshold)}
          </div>
          <span className="text-xs text-muted-foreground block">
            Batas penghentian otomatis Meta
          </span>
        </div>
      </div>

      {/* Alert Jika Terblokir / Warning */}
      {isBlocked && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-600">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Pengiriman Pesan Outbound Dinonaktifkan Sementara</strong>
            <p className="text-muted-foreground">
              Saldo efektif Anda telah menyentuh batas minimum threshold (Rp {threshold.toLocaleString('id-ID')}). Silakan lakukan top-up kredit minimal Rp 200.000 untuk mengaktifkan kembali pengiriman pesan template.
            </p>
          </div>
        </div>
      )}

      {/* Rincian Tarif Pesan Meta */}
      <div className="p-4 rounded-xl border bg-secondary/20 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-foreground">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={14} className="text-primary" />
            Struktur Tarif Pengiriman Pesan WhatsApp (Meta Per-Message):
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-card border flex items-center justify-between">
            <span className="text-muted-foreground">Marketing (Broadcast):</span>
            <span className="font-bold text-foreground font-mono">Rp 1.250 / pesan</span>
          </div>
          <div className="p-2.5 rounded-lg bg-card border flex items-center justify-between">
            <span className="text-muted-foreground">Utility &amp; Notifikasi:</span>
            <span className="font-bold text-foreground font-mono">Rp 600 / pesan</span>
          </div>
          <div className="p-2.5 rounded-lg bg-card border flex items-center justify-between">
            <span className="text-muted-foreground">Service Window (24 Jam):</span>
            <span className="font-bold text-emerald-600 font-mono">GRATIS (Rp 0)</span>
          </div>
        </div>
      </div>

      {/* Sub-tab: Riwayat Permohonan Top-Up & Riwayat Transaksi */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-colors',
              activeSubTab === 'requests'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Antrean Pengajuan Top-Up ({topups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-colors',
              activeSubTab === 'history'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mutasi Pemotongan Pesan Terakhir
          </button>
        </div>

        {/* Tab 1: Antrean Top-up */}
        {activeSubTab === 'requests' && (
          <div className="overflow-x-auto">
            {topups.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Belum ada pengajuan top-up yang tercatat.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-semibold">Waktu Request</th>
                    <th className="pb-2 font-semibold">Nominal</th>
                    <th className="pb-2 font-semibold">Referensi Bank</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold text-right">Catatan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {topups.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 text-muted-foreground">{fmtDate(r.requested_at)}</td>
                      <td className="py-2.5 font-bold font-mono text-foreground">{fmtRp(r.amount)}</td>
                      <td className="py-2.5 text-muted-foreground">{r.transfer_ref || '—'}</td>
                      <td className="py-2.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1',
                            r.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : r.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-amber-500/10 text-amber-600'
                          )}
                        >
                          {r.status === 'approved' && <CheckCircle2 size={11} />}
                          {r.status === 'rejected' && <XCircle size={11} />}
                          {r.status === 'pending' && <Clock size={11} />}
                          {r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {r.admin_note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Mutasi Pesan Terakhir */}
        {activeSubTab === 'history' && (
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Belum ada mutasi pemotongan pesan tercatat.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-semibold">Waktu</th>
                    <th className="pb-2 font-semibold">Tipe</th>
                    <th className="pb-2 font-semibold">Jumlah</th>
                    <th className="pb-2 font-semibold">Sisa Saldo</th>
                    <th className="pb-2 font-semibold text-right">Keterangan / Tujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 text-muted-foreground">{fmtDate(tx.created_at)}</td>
                      <td className="py-2.5 font-medium uppercase text-muted-foreground">
                        {tx.type} {tx.message_type ? `(${tx.message_type})` : ''}
                      </td>
                      <td
                        className={cn(
                          'py-2.5 font-bold font-mono',
                          tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'
                        )}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {fmtRp(tx.amount)}
                      </td>
                      <td className="py-2.5 font-mono text-muted-foreground">{fmtRp(tx.balance_after)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {tx.recipient_phone ? `Ke: ${tx.recipient_phone}` : tx.note || tx.reference || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog Top-up */}
      <TopupCreditModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSuccess={loadCreditData}
        balanceData={balance}
      />
    </div>
  );
}
