import { Suspense } from 'react';
import { ComicGrid } from '@/components/comic-grid';
import { SearchForm } from '@/components/search-form';
import { search } from '@/lib/komiku';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export const metadata = {
  title: 'Cari Komik',
};

export default function SearchPage({ searchParams }: PageProps) {
  return (
    <main className="container-page py-8 md:py-12">
      <header className="mb-8">
        <h1 className="section-title" style={{ fontSize: 'var(--text-3xl)' }}>
          Cari komik
        </h1>
        <p
          className="text-[var(--muted)] mt-2 mb-6"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Ketik judul atau kata kunci.
        </p>

        <Suspense fallback={<SearchFormSkeleton />}>
          <SearchForm autoFocus />
        </Suspense>
      </header>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: PageProps) {
  const params = await searchParams;
  const keyword = params.q?.trim();
  const page = Number(params.page) || 1;

  if (!keyword) {
    return (
      <div className="empty-state">
        Belum ada kata kunci. Ketik sesuatu di atas buat mulai cari.
      </div>
    );
  }

  let data;
  try {
    data = await search(keyword, { page });
  } catch {
    return (
      <div className="empty-state">
        Server lagi sibuk. Coba lagi bentar.
      </div>
    );
  }

  const results = data.results ?? [];

  if (!results.length) {
    return (
      <div className="empty-state">
        Nggak ada yang cocok dengan <strong>&ldquo;{keyword}&rdquo;</strong>.
        <br />
        Coba kata lain atau cek ejaannya.
      </div>
    );
  }

  return (
    <>
      <div className="search-header">
        <p className="search-meta">
          {results.length} hasil untuk{' '}
          <strong>&ldquo;{keyword}&rdquo;</strong>
        </p>
      </div>
      <ComicGrid comics={results} priorityCount={4} keyPrefix="search-" />
    </>
  );
}

function SearchFormSkeleton() {
  return <div className="skeleton" style={{ height: 'var(--touch-min)' }} />;
}

function SearchSkeleton() {
  return (
    <div className="comic-grid">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="comic-card">
          <div className="comic-card-cover skeleton" />
          <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
          <div className="skeleton" style={{ height: '0.75rem', width: '50%' }} />
        </div>
      ))}
    </div>
  );
}
