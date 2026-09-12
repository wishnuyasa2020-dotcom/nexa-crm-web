'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, MessageSquareOff } from 'lucide-react';

interface WhatsAppGatingBannerProps {
  featureName?: string;
  status?: string;
  description?: string;
  compact?: boolean;
}

export default function WhatsAppGatingBanner({
  featureName = 'Fitur Perpesanan WhatsApp',
  status = 'NOT_CONFIGURED',
  description,
  compact = false,
}: WhatsAppGatingBannerProps) {
  const isPending = status === 'PENDING_PROVISIONING';

  const defaultDesc = isPending
    ? `Nomor WhatsApp lembaga Anda sedang dalam proses verifikasi dan aktivasi oleh tim teknis Superadmin. Selama proses ini berlangsung, fitur ${featureName} belum dapat mengirim pesan baru.`
    : `Fitur ${featureName} memerlukan nomor WhatsApp Business resmi yang terverifikasi dan aktif. Daftarkan dan aktifkan nomor lembaga Anda melalui pengaturan untuk mulai mengirim pesan.`;

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">WhatsApp Belum Terhubung: </span>
            <span className="text-amber-900/80 dark:text-amber-300/80">
              {isPending ? 'Verifikasi nomor sedang berlangsung.' : `Aktifkan nomor WABA untuk menggunakan ${featureName}.`}
            </span>
          </div>
        </div>
        <Link
          href="/settings?tab=whatsapp"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs shrink-0"
        >
          <span>Pengaturan WABA</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquareOff className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-foreground">
                WhatsApp Bisnis Belum Aktif
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                {isPending ? 'Sedang Diverifikasi' : 'Belum Terhubung'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {description || defaultDesc}
            </p>
          </div>
        </div>

        <Link
          href="/settings?tab=whatsapp"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shrink-0 w-full sm:w-auto"
        >
          <span>Hubungkan Nomor Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
