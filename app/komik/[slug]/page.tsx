import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDetail } from '@/lib/komiku';
import { ChapterAccordion } from '@/components/chapter-accordion';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const detail = await getDetail(slug);
    return {
      title: detail.title,
      description: detail.synopsis?.slice(0, 160) || undefined,
    };
  } catch {
    return { title: 'Komik tidak ditemukan' };
  }
}

export default function KomikDetailPage({ params }: PageProps) {
  return (
    <main className="container-page py-8 md:py-12">
      <Suspense fallback={<DetailSkeleton />}>
        <DetailContent params={params} />
      </Suspense>
    </main>
  );
}

async function DetailContent({ params }: PageProps) {
  const { slug } = await params;

  let detail;
  try {
    detail = await getDetail(slug);
  } catch {
    notFound();
  }

  const coverUrl = detail.thumbnail
    ? `/api/image-proxy?url=${encodeURIComponent(detail.thumbnail)}`
    : '';

  return (
    <>
      <div className="detail-hero">
        <div className="detail-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={detail.title} />
          ) : (
            <div className="detail-cover-placeholder" aria-hidden="true" />
          )}
        </div>

        <div className="detail-info">
          <h1 className="detail-title">{detail.title}</h1>

          <div className="detail-actions">
            {detail.first_chapter ? (
              <Link
                href={`/baca/${detail.first_chapter.slug}`}
                className="btn btn-primary"
              >
                Baca dari awal
              </Link>
            ) : (
              <button className="btn btn-primary" disabled>
                Belum ada chapter
              </button>
            )}

            {detail.latest_chapter &&
              detail.latest_chapter.slug !== detail.first_chapter?.slug && (
                <Link
                  href={`/baca/${detail.latest_chapter.slug}`}
                  className="btn btn-secondary"
                >
                  Chapter terbaru
                </Link>
              )}
          </div>

          <div className="info-table">
            <div className="info-row">
              <span className="info-label">Tipe</span>
              <span className="info-value">{detail.type || '-'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">{detail.status || '-'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Genre</span>
              <span className="info-value">
                {detail.genres.length > 0 ? (
                  <span className="info-chips">
                    {detail.genres.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/genre/${g.slug}`}
                        className="genre-chip"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </span>
                ) : (
                  '-'
                )}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Jumlah Chapter</span>
              <span className="info-value">
                {detail.total_chapters} chapter
              </span>
            </div>
          </div>
        </div>
      </div>

      {detail.synopsis && (
        <section className="detail-section">
          <h2 className="section-title">Sinopsis</h2>
          <p className="detail-synopsis">{detail.synopsis}</p>
        </section>
      )}

      {detail.chapters.length > 0 && (
        <section className="detail-section">
          <ChapterAccordion chapters={detail.chapters} />
        </section>
      )}
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="detail-hero">
        <div className="detail-cover">
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="detail-info">
          <div className="skeleton" style={{ height: '2rem', width: '80%' }} />
          <div className="skeleton" style={{ height: '2.75rem', width: '60%' }} />
          <div className="skeleton" style={{ height: '8rem', width: '100%' }} />
        </div>
      </div>
    </>
  );
}