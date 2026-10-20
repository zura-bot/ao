'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { setSourceClient } from '@/lib/source-cookie-client';

export function HiddenServerTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const secret = searchParams.get('server');
    
    if (secret === 'manhwadesu') {
      // 1. Set cookie ke manhwadesu
      setSourceClient('manhwadesu');
      
      // 2. Bersihin URL dari parameter rahasia
      window.history.replaceState(null, '', window.location.pathname);
      
      // 3. Refresh server components biar data baru dari cookie kebaca
      router.refresh();
      
      // 4. Kalau router.refresh() nggak cukup, paksa reload total
      // setTimeout(() => window.location.reload(), 500);
    }
  }, [searchParams, router]);

  return null;
}
