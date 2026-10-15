'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getHistory } from '@/lib/history';
import { HistoryList } from './history-list';

export function HomeHistorySection() {
  const [hasHistory, setHasHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasHistory(getHistory().length > 0);
  }, []);

  if (!mounted || !hasHistory) return null;

  return (
    <section className="section" style={{ marginTop: 'var(--space-section)' }}>
      <div className="section-header">
        <h2 className="section-title">Lanjut baca</h2>
        <Link href="/riwayat" className="section-header-link">
          Semua
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </div>
      <HistoryList limit={6} />
    </section>
  );
}
