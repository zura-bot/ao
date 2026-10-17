'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SourceId } from '@/lib/sources/types';
import { getHistory } from '@/lib/history';
import { HistoryList } from './history-list';

interface HomeHistorySectionProps {
  sourceId: SourceId;
}

export function HomeHistorySection({ sourceId }: HomeHistorySectionProps) {
  const [hasHistory, setHasHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasHistory(getHistory(sourceId).length > 0);
  }, [sourceId]);

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
      <HistoryList sourceId={sourceId} limit={6} />
    </section>
  );
}
