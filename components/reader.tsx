'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ChapterResult } from '@/types/komiku';
import { saveHistory, updateScrollPercent } from '@/lib/history';

interface ReaderProps {
  chapter: ChapterResult;
}

export function Reader({ chapter }: ReaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(true);

  const komikSlugRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumedRef = useRef(false);

  // ============================================================
  // AUTO-SAVE RIWAYAT BACA (saat buka chapter)
  // ============================================================
  useEffect(() => {
    if (!chapter.manga_url) return;

    const komikSlug = chapter.manga_url
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/?/, '')
      .replace(/\/$/, '');

    if (!komikSlug) return;
    komikSlugRef.current = komikSlug;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/detail/${encodeURIComponent(komikSlug)}`
        );
        const data = await res.json();
        if (cancelled) return;

        const detail = data?.data;
        const fallbackTitle = chapter.title
          .replace(/\s*[-–]?\s*Chapter\s*\d+.*$/i, '')
          .trim();

        saveHistory({
          komikSlug,
          komikTitle: detail?.title || fallbackTitle || chapter.title,
          cover: detail?.thumbnail || '',
          chapterSlug: chapter.slug,
          chapterTitle: chapter.title,
          totalChapters: detail?.total_chapters || 0,
        });
      } catch {
        if (cancelled) return;
        saveHistory({
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
  }, [chapter.slug, chapter.manga_url, chapter.title]);

  // ============================================================
  // AUTO-RESUME SCROLL (dari ?resume=1)
  // ============================================================
  useEffect(() => {
    if (resumedRef.current) return;
    if (searchParams.get('resume') !== '1') return;
    if (!komikSlugRef.current) return;

    const komikSlug = komikSlugRef.current;
    resumedRef.current = true;

    // Tunggu gambar ke-render dulu, baru scroll
    const timer = setTimeout(() => {
      const raw = window.localStorage.getItem('kuroneko:history');
      if (!raw) return;
      try {
        const items = JSON.parse(raw) as Array<{
          komikSlug: string;
          scrollPercent: number;
        }>;
        const item = items.find((h) => h.komikSlug === komikSlug);
        if (!item || !item.scrollPercent || item.scrollPercent < 5) return;

        const docHeight = document.documentElement.scrollHeight;
        const target = (docHeight * item.scrollPercent) / 100;
        window.scrollTo({ top: target, behavior: 'auto' });
      } catch {}
    }, 600);

    return () => clearTimeout(timer);
  }, [searchParams]);

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

      // Debounced save scroll position (1.5 detik)
      if (komikSlugRef.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (komikSlugRef.current) {
            updateScrollPercent(komikSlugRef.current, Math.round(percent));
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
  }, []);

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
        router.push(chapter.manga_url);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter]);

  const navigateChapter = (url: string) => {
    const slug = url
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/?baca\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '');
    router.push(`/baca/${slug}`);
  };

  const getSlug = (url: string | null) => {
    if (!url) return null;
    return url
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/?baca\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '');
  };

  const prevSlug = getSlug(chapter.prev_chapter_url);
  const nextSlug = getSlug(chapter.next_chapter_url);
  const detailSlug = chapter.manga_url
    ? chapter.manga_url
        .replace(/^https?:\/\/[^/]+\//, '')
        .replace(/^\//, '')
        .replace(/\/$/, '')
    : null;

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
            <Link href={`/komik/${detailSlug}`} className="reader-nav-back">
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
                href={`/baca/${prevSlug}`}
                className="reader-nav-btn"
                aria-label="Chapter sebelumnya"
                title="Chapter sebelumnya (←)"
              >
                <ChevronLeft />
              </Link>
            )}
            {nextSlug && (
              <Link
                href={`/baca/${nextSlug}`}
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
            <Link href={`/baca/${prevSlug}`} className="btn btn-secondary">
              ← Sebelumnya
            </Link>
          ) : (
            <button className="btn btn-secondary" disabled>
              ← Sebelumnya
            </button>
          )}

          {nextSlug ? (
            <Link href={`/baca/${nextSlug}`} className="btn btn-primary">
              Selanjutnya →
            </Link>
          ) : (
            <button className="btn btn-primary" disabled>
              Selanjutnya →
            </button>
          )}
        </div>

        {detailSlug && (
          <Link href={`/komik/${detailSlug}`} className="reader-bottom-link">
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
