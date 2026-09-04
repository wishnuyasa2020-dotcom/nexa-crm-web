import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

export function SwCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!expiresAt) return;
      const expDate = new Date(expiresAt);
      const diff = differenceInSeconds(expDate, new Date());
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;
  
  return <>{timeLeft}</>;
}
