import { Suspense } from 'react';
import Link from 'next/link';
import { ComicGrid } from '@/components/comic-grid';
import { HomeHistorySection } from '@/components/home-history-section';
import { getSourceFromCookie } from '@/lib/source-cookie';
import { getSource } from '@/lib/sources';
import { ErrorRetry } from '@/components/error-retry';

export default async function HomePage() {
  const sourceId = await getSourceFromCookie();

  return (
    <main className="container-page py-8 md:py-12">
      <HomeHistorySection sourceId={sourceId} />

      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent sourceId={sourceId} />
      </Suspense>
    </main>
  );
}

async function HomeContent({ sourceId }: { sourceId: 'komiku' | 'shinigami' }) {
  const source = getSource(sourceId);

  let latest: any[] = [];
  let popular: any[] = [];

  try {
    const data = await source.getHome();
    latest = data.latest ?? [];
    popular = data.popular ?? [];
    } catch {
    return <ErrorRetry />;
  }

  return (
    <>
      <section className="section" style={{ marginTop: 0 }}>
        <div className="section-header">
          <h2 className="section-title">Baru masuk</h2>
          <Link href="/latest" className="section-header-link">
            Lainnya
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <ComicGrid comics={latest} priorityCount={4} keyPrefix="latest-" />
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Sering dibaca</h2>
          <Link href="/popular" className="section-header-link">
            Lainnya
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <ComicGrid comics={popular} keyPrefix="popular-" />
      </section>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      {[1, 2].map((section) => (
        <section key={section} className="section">
          <div className="section-header">
            <div className="skeleton" style={{ height: '1.75rem', width: '8rem' }} />
            <div className="skeleton" style={{ height: '1rem', width: '5rem' }} />
          </div>
          <div className="comic-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="comic-card">
                <div className="comic-card-cover skeleton" />
                <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
                <div className="skeleton" style={{ height: '0.75rem', width: '50%' }} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
