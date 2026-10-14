import { Suspense } from 'react';
import { ComicGrid } from '@/components/comic-grid';
import { getHome } from '@/lib/komiku';
import Link from 'next/link';

export const metadata = {
  title: 'Jelajah',
  description: 'Komik terbaru dan populer di Kuroneko.',
};

export default function JelajahPage() {
  return (
    <main className="container-page py-8 md:py-12">
      <header className="mb-10">
        <h1 className="section-title" style={{ fontSize: 'var(--text-3xl)' }}>
          Jelajah
        </h1>
        <p
          className="text-[var(--muted)] mt-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Komik terbaru dan populer.
        </p>
      </header>

      <Suspense fallback={<JelajahSkeleton />}>
        <JelajahContent />
      </Suspense>
    </main>
  );
}

async function JelajahContent() {
  const data = await getHome();
  const latest = data.latest ?? [];
  const popular = data.popular ?? [];

  return (
    <>
      <section className="section" style={{ marginTop: 0 }}>
        <div className="section-header">
          <h2 className="section-title">Baru masuk</h2>
          <Link href="/latest" className="section-link">
            Lihat semua
          </Link>
        </div>
        <ComicGrid comics={latest} priorityCount={4} />
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Sering dibaca</h2>
          <Link href="/popular" className="section-link">
            Lihat semua
          </Link>
        </div>
        <ComicGrid comics={popular} />
      </section>
    </>
  );
}

function JelajahSkeleton() {
  return (
    <>
      {[1, 2].map((section) => (
        <section key={section} className="section">
          <div className="section-header">
            <div
              className="skeleton"
              style={{ height: '1.75rem', width: '8rem' }}
            />
            <div
              className="skeleton"
              style={{ height: '1rem', width: '5rem' }}
            />
          </div>
          <div className="comic-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="comic-card">
                <div className="comic-card-cover skeleton" />
                <div
                  className="skeleton"
                  style={{ height: '1rem', width: '80%' }}
                />
                <div
                  className="skeleton"
                  style={{ height: '0.75rem', width: '50%' }}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}