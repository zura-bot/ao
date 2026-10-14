'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <main className="container-page min-h-hero flex flex-col justify-center py-16">
      <div className="max-w-xl">
        <p className="caps text-[var(--muted)]">Error</p>

        <h1
          className="mt-4 font-medium tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-4xl)',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}
        >
          Server lagi ngambek.
        </h1>

        <p
          className="mt-4 text-[var(--muted-strong)] max-w-[48ch]"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          Ada yang nggak beres di server. Coba muat ulang, atau balik ke
          beranda.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={reset} className="btn btn-primary">
            Coba lagi
          </button>
          <Link href="/" className="btn btn-secondary">
            Balik ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
