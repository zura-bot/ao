'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getHistory,
  deleteHistory,
  clearHistory,
  formatRelativeTime,
  type HistoryItem,
} from '@/lib/history';

interface HistoryListProps {
  limit?: number;
  showClearButton?: boolean;
}

export function HistoryList({
  limit,
  showClearButton = false,
}: HistoryListProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const load = () => {
    const all = getHistory();
    setItems(limit ? all.slice(0, limit) : all);
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, [limit]);

  const handleDelete = (komikSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteHistory(komikSlug);
    load();
  };

  const handleClear = () => {
    if (!confirm('Hapus semua riwayat baca?')) return;
    clearHistory();
    load();
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="empty-state">
        Belum ada riwayat baca. Buka chapter buat mulai.
      </div>
    );
  }

  return (
    <>
      {showClearButton && (
        <div className="history-header">
          <span className="history-count">{items.length} komik</span>
          <button
            type="button"
            className="history-clear-btn"
            onClick={handleClear}
          >
            Hapus semua
          </button>
        </div>
      )}

      <ul className="history-list">
        {items.map((item) => {
          const hasProgress =
            item.scrollPercent > 5 && item.scrollPercent < 95;

          return (
            <li key={item.komikSlug}>
              <Link
                href={`/baca/${item.chapterSlug}?resume=1`}
                className="history-item"
              >
                <div className="history-cover">
                  {item.cover ? (
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(item.cover)}`}
                      alt={item.komikTitle}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="history-cover-placeholder"
                      aria-hidden="true"
                    />
                  )}
                  {hasProgress && (
                    <div
                      className="history-cover-progress"
                      style={{ width: `${item.scrollPercent}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="history-info">
                  <h3 className="history-title">{item.komikTitle}</h3>
                  <p className="history-chapter">
                    {item.chapterTitle}
                    {item.totalChapters > 0 && (
                      <span className="history-progress">
                        {' '}
                        · {item.totalChapters} chapter
                      </span>
                    )}
                  </p>
                  <p className="history-time">
                    {formatRelativeTime(item.timestamp)}
                    {hasProgress && (
                      <span className="history-percent">
                        {' '}
                        · {item.scrollPercent}%
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="history-delete-btn"
                  onClick={(e) => handleDelete(item.komikSlug, e)}
                  aria-label={`Hapus ${item.komikTitle} dari riwayat`}
                  title="Hapus dari riwayat"
                >
                  <CloseIcon />
                </button>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
