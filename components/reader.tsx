'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChapterResult } from '@/types/komiku';
import type { SourceId } from '@/lib/sources/types';
import { saveHistory, updateScrollPercent, getHistory } from '@/lib/history';

interface ReaderProps {
  chapter: ChapterResult;
  sourceId: SourceId;
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
    .replace(/^\/?komik\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

export function Reader({ chapter, sourceId }: ReaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumedRef = useRef(false);

  const firstChapterSlug = getSlugFromUrl(chapter.manga_url);
  const currentChapterIndex = chapters.findIndex((c) => c.slug === activeSlug);
  const currentChapterNumber = currentChapterIndex >= 0 ? currentChapterIndex + 1 : 1;

  // ============================================================
  // SCROLL TO TOP SAAT GANTI CHAPTER (KECUALI RESUME)
  // ============================================================
  useEffect(() => {
    if (searchParams.get('resume') === '1') return;
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 10);
    return () => clearTimeout(timer);
  }, [chapter.slug, searchParams]);

  // ============================================================
  // AUTO-SAVE RIWAYAT BACA
  // ============================================================
  useEffect(() => {
    if (!chapter.manga_url) return;

    const komikSlug = getSlugFromUrl(chapter.manga_url);
    if (!komikSlug) return;

    let cancelled = false;

    (async () => {
      try {
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
    if (!chapter.manga_url) return;

    const komikSlug = getSlugFromUrl(chapter.manga_url);
    if (!komikSlug) return;

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
  }, [searchParams, sourceId, chapter.manga_url]);

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

      if (chapter.manga_url) {
        const komikSlug = getSlugFromUrl(chapter.manga_url);
        if (komikSlug) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            updateScrollPercent(sourceId, komikSlug, Math.round(percent));
          }, 1500);
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [sourceId, chapter.manga_url]);

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
        const slug = getSlugFromUrl(chapter.manga_url);
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
    const slug = getSlugFromUrl(url);
    if (!slug) return;
    const prefixed = sourceId === 'komiku' ? slug : `${sourceId}:${slug}`;
    router.push(`/baca/${encodeURIComponent(prefixed)}`);
  };

  // ============================================================
  // INFINITE SCROLL / AUTO-LOAD CHAPTER
  // ============================================================
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
      const prefixedSlug =
        sourceId === 'komiku' ? nextSlug : `${sourceId}:${nextSlug}`;
      const res = await fetch(`/api/chapter/${encodeURIComponent(prefixedSlug)}`);
      const data = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Gagal load chapter');
      }

      const nextChapter: ChapterResult = data.data;

      const isDuplicate = chapters.some((c) => c.slug === nextChapter.slug);
      if (isDuplicate || !nextChapter.images?.length) {
        // Source ngasih chapter yang sama / kosong -> stop, jangan render dobel
        setHasMore(false);
        return;
      }

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
  }, [chapters, sourceId]);

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

  const getSlugWithPrefix = (url: string | null) => {
    const slug = getSlugFromUrl(url);
    if (!slug) return null;
    return sourceId === 'komiku' ? slug : `${sourceId}:${slug}`;
  };

  const prevSlug = getSlugWithPrefix(chapter.prev_chapter_url);
  const nextSlug = getSlugWithPrefix(chapter.next_chapter_url);
  const detailSlug = getSlugWithPrefix(chapter.manga_url);

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

          <div className="reader-nav-center">
            <span className="reader-nav-chapter">
              Chapter {currentChapterNumber}
            </span>
            {chapters.length > 1 && (
              <span className="reader-nav-of">dari {chapters.length}</span>
            )}
          </div>

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

            {ch.images.map((src, i) => {
              if (!src.startsWith('http')) return null;
              return (
                <ChapterImage
                  key={`${ch.slug}-${i}`}
                  src={src}
                  alt={`${ch.title} halaman ${i + 1}`}
                  eager={idx === 0 && i < 2}
                />
              );
            })}
          </section>
        ))}

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
            {detailSlug && (
              <Link
                href={`/komik/${encodeURIComponent(detailSlug)}`}
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

// Gambar dengan retry 1x. Kalau tetap gagal (mis. URL tebakan yang nggak ada),
// disembunyikan supaya nggak muncul kotak abu-abu kosong.
function ChapterImage({
  src,
  alt,
  eager,
}: {
  src: string;
  alt: string;
  eager: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  const proxied = `/api/image-proxy?url=${encodeURIComponent(src)}${
    attempt > 0 ? `&r=${attempt}` : ''
  }`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (attempt < 1) setAttempt((a) => a + 1);
        else setFailed(true);
      }}
    />
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
