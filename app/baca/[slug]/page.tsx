import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getSourceFromCookie } from '@/lib/source-cookie';
import { getSource } from '@/lib/sources';
import { Reader } from '@/components/reader';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const sourceId = await getSourceFromCookie();
    const source = getSource(sourceId);
    const chapter = await source.getChapter(slug);
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

  const sourceId = await getSourceFromCookie();
  const source = getSource(sourceId);

  let chapter;
  try {
    chapter = await source.getChapter(slug);
  } catch {
    notFound();
  }

  if (!chapter.images.length) {
    return (
      <main className="container-page py-20 text-center">
        <p className="empty-state">
          Gambar chapter ini nggak bisa dimuat.
        </p>
      </main>
    );
  }

  return <Reader chapter={chapter} sourceId={sourceId} />;
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
