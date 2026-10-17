import { HistoryList } from '@/components/history-list';
import { getSourceFromCookie } from '@/lib/source-cookie';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riwayat Baca',
  description: 'Komik yang pernah kamu baca.',
};

export default async function RiwayatPage() {
  const sourceId = await getSourceFromCookie();

  return (
    <main className="container-page py-8 md:py-12">
      <header className="mb-10">
        <p className="caps text-[var(--muted)]">Akun</p>
        <h1
          className="section-title mt-2"
          style={{ fontSize: 'var(--text-3xl)' }}
        >
          Riwayat baca
        </h1>
        <p
          className="text-[var(--muted)] mt-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Komik yang pernah kamu buka di server ini, tersimpan di browser.
        </p>
      </header>

      <HistoryList sourceId={sourceId} showClearButton />
    </main>
  );
}
