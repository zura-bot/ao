'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ChapterResult } from '@/types/komiku';
import type { SourceId } from '@/lib/sources/types';
import {
  saveHistory,
  updateScrollPercent,
  getHistory,
} from '@/lib/history';

interface ReaderProps {
  chapter: ChapterResult;
  sourceId: SourceId;
}

function extractKomikSlug(mangaUrl: string | null): string | null {
  if (!mangaUrl) return null;
  return mangaUrl
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\/?komik\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

export function Reader({ chapter, sourceId }: ReaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(true);

  const komikSlugRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumedRef = useRef(false);

  // ============================================================
  // AUTO-SAVE RIWAYAT BACA
  // ============================================================
  useEffect(() => {
    const komikSlug = extractKomikSlug(chapter.manga_url);
    if (!komikSlug) return;
    komikSlugRef.current = komikSlug;

    let cancelled = false;

    (async () => {
      try {
        // Build URL dengan prefix source
        const prefixedSlug =
          sourceId === 'komiku' ? komikSlug : `${sourceId}:${komikSlug}`;
        const res = await fetch(
          `/api/detail/${encodeURIComponent(prefixedSlug)}`
        );
        const data = await res.json();
        if (cancelled) return;

        const detail = data?.data;
        const fallbackTitle = chapter.title
          .replace(/\s*[-–]?\s*Chapter\s*\d+.*$/i, '')
          .trim();

        saveHistory(sourceId, {
          komikSlug,
          komikTitle: detail?.title || fallbackTitle || chapter.title,
          cover: detail?.thumbnail || '',
          chapterSlug: chapter.slug,
          chapterTitle: chapter.title,
          totalChapters: detail?.total_chapters || 0,
        });
      } catch {
        if (cancelled) return;
        saveHistory(sourceId, {
          komikSlug,
          komikTitle:
            chapter.title.replace(/\s*[-–]?\s*Chapter\s*\d+.*$/i, '').trim() ||
            chapter.title,
          cover: '',
          chapterSlug: chapter.slug,
          chapterTitle: chapter.title,
          totalChapters: 0,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chapter.slug, chapter.manga_url, chapter.title, sourceId]);

  // ============================================================
  // AUTO-RESUME SCROLL
  // ============================================================
  useEffect(() => {
    if (resumedRef.current) return;
    if (searchParams.get('resume') !== '1') return;
    if (!komikSlugRef.current) return;

    const komikSlug = komikSlugRef.current;
    resumedRef.current = true;

    const timer = setTimeout(() => {
      const items = getHistory(sourceId);
      const item = items.find((h) => h.komikSlug === komikSlug);
      if (!item || !item.scrollPercent || item.scrollPercent < 5) return;

      const docHeight = document.documentElement.scrollHeight;
      const target = (docHeight * item.scrollPercent) / 100;
      window.scrollTo({ top: target, behavior: 'auto' });
    }, 600);

    return () => clearTimeout(timer);
  }, [searchParams, sourceId]);

  // ============================================================
  // SCROLL PROGRESS + AUTO-SAVE POSISI
  // ============================================================
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      const percent = Math.min(100, Math.max(0, p));
      setProgress(percent);

      if (scrollTop > 200) setShowBar(false);
      else setShowBar(true);

      if (komikSlugRef.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (komikSlugRef.current) {
            updateScrollPercent(
              sourceId,
              komikSlugRef.current,
              Math.round(percent)
            );
          }
        }, 1500);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [sourceId]);

  // ============================================================
  // KEYBOARD SHORTCUT
  // ============================================================
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft' && chapter.prev_chapter_url) {
        navigateChapter(chapter.prev_chapter_url);
      } else if (e.key === 'ArrowRight' && chapter.next_chapter_url) {
        navigateChapter(chapter.next_chapter_url);
      } else if (e.key === 'Escape' && chapter.manga_url) {
        const slug = extractKomikSlug(chapter.manga_url);
        if (slug) {
          const prefixed =
            sourceId === 'komiku' ? slug : `${sourceId}:${slug}`;
          router.push(`/komik/${encodeURIComponent(prefixed)}`);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, sourceId]);

  const navigateChapter = (url: string) => {
    // URL dari source mungkin relative atau absolute
    const slug = url
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/?baca\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '');
    const prefixed = sourceId === 'komiku' ? slug : `${sourceId}:${slug}`;
    router.push(`/baca/${encodeURIComponent(prefixed)}`);
  };

  const getSlug = (url: string | null) => {
    if (!url) return null;
    const slug = url
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/?baca\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '');
    return sourceId === 'komiku' ? slug : `${sourceId}:${slug}`;
  };

  const prevSlug = getSlug(chapter.prev_chapter_url);
  const nextSlug = getSlug(chapter.next_chapter_url);
  const detailSlug = (() => {
    const slug = extractKomikSlug(chapter.manga_url);
    if (!slug) return null;
    return sourceId === 'komiku' ? slug : `${sourceId}:${slug}`;
  })();

  return (
    <>
      <div className="reader-progress">
        <div
          className="reader-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={`reader-nav ${showBar ? '' : 'reader-nav-hidden'}`}>
        <div className="reader-nav-inner">
          {detailSlug ? (
            <Link
              href={`/komik/${encodeURIComponent(detailSlug)}`}
              className="reader-nav-back"
            >
              <BackIcon />
              <span className="reader-nav-label">Detail</span>
            </Link>
          ) : (
            <div />
          )}

          <h1 className="reader-nav-title">{chapter.title}</h1>

          <div className="reader-nav-actions">
            {prevSlug && (
              <Link
                href={`/baca/${encodeURIComponent(prevSlug)}`}
                className="reader-nav-btn"
                aria-label="Chapter sebelumnya"
                title="Chapter sebelumnya (←)"
              >
                <ChevronLeft />
              </Link>
            )}
            {nextSlug && (
              <Link
                href={`/baca/${encodeURIComponent(nextSlug)}`}
                className="reader-nav-btn"
                aria-label="Chapter selanjutnya"
                title="Chapter selanjutnya (→)"
              >
                <ChevronRight />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="reader-content">
        {chapter.images.map((src, i) => (
          <img
            key={i}
            src={`/api/image-proxy?url=${encodeURIComponent(src)}`}
            alt={`Halaman ${i + 1}`}
            loading={i < 2 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
      </div>

      <div className="reader-bottom">
        <div className="reader-bottom-actions">
          {prevSlug ? (
            <Link
              href={`/baca/${encodeURIComponent(prevSlug)}`}
              className="btn btn-secondary"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <button className="btn btn-secondary" disabled>
              ← Sebelumnya
            </button>
          )}

          {nextSlug ? (
            <Link
              href={`/baca/${encodeURIComponent(nextSlug)}`}
              className="btn btn-primary"
            >
              Selanjutnya →
            </Link>
          ) : (
            <button className="btn btn-primary" disabled>
              Selanjutnya →
            </button>
          )}
        </div>

        {detailSlug && (
          <Link
            href={`/komik/${encodeURIComponent(detailSlug)}`}
            className="reader-bottom-link"
          >
            Kembali ke daftar chapter
          </Link>
        )}
      </div>
    </>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
