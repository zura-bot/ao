import { Suspense } from 'react';
import { ComicGrid } from '@/components/comic-grid';
import { Pagination } from '@/components/pagination';
import { getSourceFromCookie } from '@/lib/source-cookie';
import { getSource } from '@/lib/sources';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}

const VALID_TYPES = ['manga', 'manhwa', 'manhua'];

const TYPE_LABELS: Record<string, string> = {
  manga: 'Manga',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  manga: 'Komik Jepang yang lagi update di Kuroneko.',
  manhwa: 'Komik Korea yang lagi update di Kuroneko.',
  manhua: 'Komik China yang lagi update di Kuroneko.',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const clean = type.toLowerCase();

  if (!VALID_TYPES.includes(clean)) {
    return { title: 'Tipe tidak dikenal' };
  }

  return {
    title: TYPE_LABELS[clean],
    description: TYPE_DESCRIPTIONS[clean],
  };
}

export default function TypePage({ params, searchParams }: PageProps) {
  return (
    <main className="container-page py-8 md:py-12">
      <Suspense fallback={<TypeSkeleton />}>
        <TypeContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TypeContent({ params, searchParams }: PageProps) {
  const { type } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const clean = type.toLowerCase();

  if (!VALID_TYPES.includes(clean)) {
    notFound();
  }

  let data;
  try {
    const sourceId = await getSourceFromCookie();
    const source = getSource(sourceId);
    data = await source.getByType(clean, { page });
  } catch {
    notFound();
  }

  const items = data.items ?? [];
  const hasNext = items.length >= 20;
  const hasPrev = page > 1;
  const label = TYPE_LABELS[clean];

  return (
    <>
      <header className="mb-10">
        <p className="caps text-[var(--muted)]">Tipe</p>
        <h1
          className="section-title mt-2"
          style={{ fontSize: 'var(--text-3xl)' }}
        >
          {label}
        </h1>
        <p
          className="text-[var(--muted)] mt-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          {TYPE_DESCRIPTIONS[clean]}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          Belum ada komik {label}. Coba bentar lagi.
        </div>
      ) : (
        <>
          <ComicGrid comics={items} priorityCount={4} keyPrefix={`type-${clean}-`} />
          <Pagination currentPage={page} hasNext={hasNext} hasPrev={hasPrev} />
        </>
      )}
    </>
  );
}

function TypeSkeleton() {
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
