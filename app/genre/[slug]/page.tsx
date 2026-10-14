import { Suspense } from 'react';
import { ComicGrid } from '@/components/comic-grid';
import { Pagination } from '@/components/pagination';
import { getByGenre } from '@/lib/komiku';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const GENRE_LABELS: Record<string, string> = {
  aksi: 'Aksi',
  komedi: 'Komedi',
  romantis: 'Romantis',
  drama: 'Drama',
  shounen: 'Shounen',
  petualangan: 'Petualangan',
  'school-life': 'School Life',
  'slice-of-life': 'Slice of Life',
  seinen: 'Seinen',
  supernatural: 'Supernatural',
  'bela-diri': 'Bela Diri',
  ecchi: 'Ecchi',
  harem: 'Harem',
  shoujo: 'Shoujo',
  misteri: 'Misteri',
  sejarah: 'Sejarah',
  ngewe: 'Ngewe',
  sihir: 'Sihir',
  'fiksi-ilmiah': 'Fiksi Ilmiah',
  psikologis: 'Psikologis',
  horor: 'Horor',
  reinkarnasi: 'Reinkarnasi',
  dewasa: 'Dewasa',
  tragedi: 'Tragedi',
};

function label(slug: string): string {
  return (
    GENRE_LABELS[slug.toLowerCase()] ||
    slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Genre ${label(slug)}`,
    description: `Komik genre ${label(slug)} di Kuroneko.`,
  };
}

export default function GenrePage({ params, searchParams }: PageProps) {
  return (
    <main className="container-page py-8 md:py-12">
      <Suspense fallback={<GenreSkeleton />}>
        <GenreContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function GenreContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  let data;
  try {
    data = await getByGenre(slug, { page });
  } catch {
    notFound();
  }

  const items = data.items ?? [];
  const hasNext = items.length >= 20;
  const hasPrev = page > 1;

  return (
    <>
      <header className="mb-10">
        <p className="caps text-[var(--muted)]">Genre</p>
        <h1
          className="section-title mt-2"
          style={{ fontSize: 'var(--text-3xl)' }}
        >
          {label(slug)}
        </h1>
        <p
          className="text-[var(--muted)] mt-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Komik genre {label(slug).toLowerCase()} di Kuroneko.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          Belum ada komik genre <strong>{label(slug)}</strong>.
          <br />
          Coba genre lain atau balik ke jelajah.
        </div>
      ) : (
        <>
          <ComicGrid comics={items} priorityCount={4} keyPrefix={`genre-${slug}-`} />

          <Pagination
            currentPage={page}
            hasNext={hasNext}
            hasPrev={hasPrev}
          />
        </>
      )}
    </>
  );
}

function GenreSkeleton() {
  return (
    <>
      <div className="skeleton" style={{ height: '2rem', width: '8rem' }} />
      <div
        className="skeleton"
        style={{ height: '1rem', width: '16rem', marginTop: '0.75rem' }}
      />
      <div className="comic-grid" style={{ marginTop: '2.5rem' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="comic-card">
            <div className="comic-card-cover skeleton" />
            <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '50%' }} />
          </div>
        ))}
      </div>
    </>
  );
}
