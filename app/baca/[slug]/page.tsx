import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { getSourceFromCookie } from '@/lib/source-cookie';
import { getSource } from '@/lib/sources';
import { parseSlug, SOURCE_IDS } from '@/lib/sources/utils';
import type { SourceId } from '@/lib/sources/types';
import { Reader } from '@/components/reader';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Slug dari URL bisa berbentuk "shinigami:uuid" / "manhwadesu:slug-chapter-1"
// (kadang masih ter-encode jadi %3A). Prefix source menang atas cookie,
// dan slug yang dikirim ke source SELALU sudah bersih dari prefix.
async function resolveRequest(
  rawSlug: string
): Promise<{ sourceId: SourceId; slug: string }> {
  const decoded = decodeURIComponent(rawSlug).trim();
  const prefix = decoded.split(':')[0]?.toLowerCase() as SourceId;
  const hasPrefix = decoded.includes(':') && SOURCE_IDS.includes(prefix);

  if (hasPrefix) {
    const { source, slug } = parseSlug(decoded);
    return { sourceId: source, slug };
  }
  return { sourceId: await getSourceFromCookie(), slug: decoded };
}

// cache() = generateMetadata dan ReaderContent berbagi hasil fetch yang sama,
// jadi upstream cuma di-hit 1x per request (sebelumnya 2x).
const loadChapter = cache(async (rawSlug: string) => {
  const { sourceId, slug } = await resolveRequest(rawSlug);
  const chapter = await getSource(sourceId).getChapter(slug);
  return { sourceId, chapter };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { chapter } = await loadChapter(slug);
    return { title: chapter.title || 'Baca chapter' };
  } catch {
    return { title: 'Chapter tidak ditemukan' };
  }
}

export default function BacaPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <ReaderContent params={params} />
    </Suspense>
  );
}

async function ReaderContent({ params }: PageProps) {
  const { slug } = await params;

  let loaded;
  try {
    loaded = await loadChapter(slug);
  } catch {
    notFound();
  }

  const { sourceId, chapter } = loaded;

  if (!chapter.images.length) {
    return (
      <main className="container-page py-20 text-center">
        <p className="empty-state">
          Gambar chapter ini nggak bisa dimuat.
        </p>
      </main>
    );
  }

  // key = state Reader (daftar chapter hasil infinite scroll) di-reset
  // tiap pindah chapter lewat tombol prev/next.
  return <Reader key={chapter.slug} chapter={chapter} sourceId={sourceId} />;
}

function ReaderSkeleton() {
  return (
    <div className="reader-skeleton">
      <div className="skeleton" style={{ height: '3.5rem' }} />
      <div className="container-reader">
        <div
          className="skeleton"
          style={{ height: '80vh', marginBottom: '0.5rem' }}
        />
      </div>
    </div>
  );
}
