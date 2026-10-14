import { Suspense } from 'react';
import { ComicGrid } from '@/components/comic-grid';
import { Pagination } from '@/components/pagination';
import { getLatest } from '@/lib/komiku';
import type { Metadata } from 'next';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = {
  title: 'Baru Masuk',
  description: 'Komik terbaru di Kuroneko.',
};

export default function LatestPage({ searchParams }: PageProps) {
  return (
    <main className="container-page py-8 md:py-12">
      <Suspense fallback={<ListSkeleton />}>
        <LatestContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LatestContent({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  let data;
  try {
    data = await getLatest(page);
  } catch {
    return (
      <div className="empty-state">
        Server lagi sibuk. Coba lagi bentar.
      </div>
    );
  }

  const items = data.items ?? [];
  const hasNext = items.length >= 20;
  const hasPrev = page > 1;

  return (
    <>
      <header className="mb-10">
        <p className="caps text-[var(--muted)]">Jelajah</p>
        <h1
          className="section-title mt-2"
          style={{ fontSize: 'var(--text-3xl)' }}
        >
          Baru masuk
        </h1>
        <p
          className="text-[var(--muted)] mt-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Komik yang baru aja di-update.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          Belum ada komik baru. Coba bentar lagi.
        </div>
      ) : (
        <>
          <ComicGrid comics={items} priorityCount={4} keyPrefix={`latest-${page}-`} />
          <Pagination currentPage={page} hasNext={hasNext} hasPrev={hasPrev} />
        </>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <div className="skeleton" style={{ height: '2rem', width: '10rem' }} />
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
