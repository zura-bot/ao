'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChapterResult } from '@/types/komiku';

interface ReaderProps {
  chapter: ChapterResult;
}

interface LoadedChapter {
  slug: string;
  title: string;
  images: string[];
  nextChapterUrl: string | null;
}

const MAX_CHAPTERS_AHEAD = 3;

function getSlugFromUrl(url: string | null): string | null {
  if (!url) return null;
  return url
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\/?baca\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

export function Reader({ chapter }: ReaderProps) {
  const [chapters, setChapters] = useState<LoadedChapter[]>([
    {
      slug: chapter.slug,
      title: chapter.title,
      images: chapter.images,
      nextChapterUrl: chapter.next_chapter_url,
    },
  ]);
  const [activeSlug, setActiveSlug] = useState(chapter.slug);
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [hasMore, setHasMore] = useState(Boolean(chapter.next_chapter_url));
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const firstChapterSlug = getSlugFromUrl(chapter.manga_url);
  const currentChapterIndex = chapters.findIndex((c) => c.slug === activeSlug);
  const currentChapterNumber =
    currentChapterIndex >= 0 ? currentChapterIndex + 1 : 1;

  // Scroll progress + auto-hide navbar
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, p)));
      if (scrollTop > 200) setShowBar(false);
      else setShowBar(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track chapter aktif via Intersection Observer
  useEffect(() => {
    const sections = document.querySelectorAll('[data-chapter-slug]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute('data-chapter-slug');
            if (slug) setActiveSlug(slug);
          }
        }
      },
      {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapters.length]);

  // Load chapter berikutnya
  const loadNextChapter = useCallback(async () => {
    if (loadingRef.current) return;
    if (chapters.length >= MAX_CHAPTERS_AHEAD + 1) {
      setHasMore(false);
      return;
    }

    const lastChapter = chapters[chapters.length - 1];
    if (!lastChapter.nextChapterUrl) {
      setHasMore(false);
      return;
    }

    const nextSlug = getSlugFromUrl(lastChapter.nextChapterUrl);
    if (!nextSlug) {
      setHasMore(false);
      return;
    }

    loadingRef.current = true;
    setLoadingNext(true);
    setError(null);

    try {
      const res = await fetch(`/api/chapter/${encodeURIComponent(nextSlug)}`);
      const data = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Gagal load chapter');
      }

      const nextChapter: ChapterResult = data.data;

      setChapters((prev) => [
        ...prev,
        {
          slug: nextChapter.slug,
          title: nextChapter.title,
          images: nextChapter.images,
          nextChapterUrl: nextChapter.next_chapter_url,
        },
      ]);

      if (!nextChapter.next_chapter_url) setHasMore(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal load chapter berikutnya'
      );
      setHasMore(false);
    } finally {
      setLoadingNext(false);
      loadingRef.current = false;
    }
  }, [chapters]);

  // Auto-load via Intersection Observer di sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextChapter();
        }
      },
      { rootMargin: '800px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadNextChapter]);

  // Keyboard: Esc → balik ke detail
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape' && firstChapterSlug) {
        window.location.href = `/komik/${firstChapterSlug}`;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [firstChapterSlug]);

  return (
    <>
      {/* Progress bar */}
      <div className="reader-progress">
        <div
          className="reader-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reader navbar */}
      <div className={`reader-nav ${showBar ? '' : 'reader-nav-hidden'}`}>
        <div className="reader-nav-inner">
          {firstChapterSlug ? (
            <Link
              href={`/komik/${firstChapterSlug}`}
              className="reader-nav-back"
            >
              <BackIcon />
              <span className="reader-nav-label">Detail</span>
            </Link>
          ) : (
            <div />
          )}

          <div className="reader-nav-center">
            <span className="reader-nav-chapter">
              Chapter {currentChapterNumber}
            </span>
            {chapters.length > 1 && (
              <span className="reader-nav-of">dari {chapters.length}</span>
            )}
          </div>

          <div className="reader-nav-actions">
            <span className="reader-nav-hint" aria-hidden="true">
              Scroll ↓
            </span>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="reader-content">
        {chapters.map((ch, idx) => (
          <section
            key={ch.slug}
            data-chapter-slug={ch.slug}
            className="reader-chapter"
          >
            {idx > 0 && (
              <div className="reader-chapter-divider">
                <span className="reader-chapter-divider-label">
                  {ch.title}
                </span>
              </div>
            )}

            {ch.images.map((src, i) => (
              <img
                key={`${ch.slug}-${i}`}
                src={`/api/image-proxy?url=${encodeURIComponent(src)}`}
                alt={`${ch.title} halaman ${i + 1}`}
                loading={idx === 0 && i < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))}
          </section>
        ))}

        {/* Sentinel buat auto-load */}
        {hasMore && (
          <div ref={sentinelRef} className="reader-sentinel">
            {loadingNext ? (
              <div className="reader-loading">
                <span className="reader-loading-spinner" aria-hidden="true" />
                <span>Lagi load chapter berikutnya...</span>
              </div>
            ) : (
              <div className="reader-loading-placeholder" aria-hidden="true" />
            )}
          </div>
        )}

        {!hasMore && chapters.length > 0 && (
          <div className="reader-end">
            <p>Udah habis. Ini chapter terakhir yang tersedia.</p>
            {firstChapterSlug && (
              <Link
                href={`/komik/${firstChapterSlug}`}
                className="btn btn-secondary"
              >
                Kembali ke detail
              </Link>
            )}
          </div>
        )}

        {error && (
          <div className="reader-error">
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setHasMore(true);
                loadNextChapter();
              }}
              className="btn btn-primary"
            >
              Coba lagi
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BackIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
