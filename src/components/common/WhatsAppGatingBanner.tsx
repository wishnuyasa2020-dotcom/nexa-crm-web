'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, MessageSquareOff } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface WhatsAppGatingBannerProps {
  featureName?: string;
  status?: string;
  description?: string;
  compact?: boolean;
}

export default function WhatsAppGatingBanner({
  featureName,
  status = 'NOT_CONFIGURED',
  description,
  compact = false,
}: WhatsAppGatingBannerProps) {
  const { t } = useTranslation();
  const effectiveFeature = featureName || t('waGating.defaultFeature');
  const isPending = status === 'PENDING_PROVISIONING';

  const defaultDesc = isPending
    ? t('waGating.descPending').replace('{feature}', effectiveFeature)
    : t('waGating.descNotConfigured').replace('{feature}', effectiveFeature);

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              {t('waGating.compactNotConnectedTitle')}{' '}
            </span>
            <span className="text-muted-foreground">
              {isPending
                ? t('waGating.compactVerifying')
                : t('waGating.compactActivatePrompt').replace('{feature}', effectiveFeature)}
            </span>
          </div>
        </div>
        <Link
          href="/settings?tab=whatsapp"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs shrink-0"
        >
          <span>{t('waGating.wabaSettingsBtn')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquareOff className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-foreground">
                {t('waGating.bannerTitleInactive')}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                {isPending ? t('waGating.statusVerifying') : t('waGating.statusNotConnected')}
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
          <span>{t('waGating.connectNowBtn')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
