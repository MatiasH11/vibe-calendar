'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useMessages() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    const error = searchParams.get('error');
    
    if (urlMessage) {
      setMessage(urlMessage);
      setMessageType('success');
    } else if (error) {
      setMessage(error);
      setMessageType('error');
    }
  }, [searchParams]);

  const clearMessage = () => {
    setMessage(null);
  };

  return {
    message,
    messageType,
    clearMessage,
  };
}
