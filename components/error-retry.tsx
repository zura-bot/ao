'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ErrorRetry({
  message = 'Server lagi sibuk. Coba lagi bentar.',
}: {
  message?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRetry = () => {
    setLoading(true);
    router.refresh();
  };

  return (
    <div className="empty-state">
      <p>{message}</p>
      <button
        onClick={handleRetry}
        className="btn btn-primary"
        disabled={loading}
        style={{ marginTop: '1rem' }}
      >
        {loading ? 'Memuat...' : 'Coba Lagi'}
      </button>
    </div>
  );
}
