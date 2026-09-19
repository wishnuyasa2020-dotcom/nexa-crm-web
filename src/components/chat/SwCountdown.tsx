import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

export function SwCountdown({ expiresAt }: { expiresAt: string }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!expiresAt) return;
      const expDate = new Date(expiresAt);
      const diff = differenceInSeconds(expDate, new Date());
      
      if (diff <= 0) {
        setTimeLeft(t('chat.swExpired'));
        return;
      }
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setTimeLeft(`${hours}${t('chat.hourShort')} ${minutes}${t('chat.minuteShort')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, t]);

  if (!timeLeft) return null;
  
  return <>{timeLeft}</>;
}
