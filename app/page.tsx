import Link from 'next/link';

export default function Home() {
  return (
    <main className="container-page min-h-hero flex flex-col justify-center py-16 md:py-24">
      <section className="space-y-6 max-w-2xl">
        <p className="caps text-[var(--muted)]">
          Manga · Manhwa · Manhua
        </p>

        <h1
          className="font-medium tracking-tight max-w-[18ch]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-5xl)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
          }}
        >
          Baca komik online bahasa Indonesia.
        </h1>

        <p
          className="text-[var(--muted-strong)] max-w-[52ch]"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          Update tiap hari, gratis.
        </p>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/jelajah" className="btn btn-primary">
            Mulai baca
          </Link>
          <Link href="/genre" className="btn btn-secondary">
            Lihat genre
          </Link>
        </div>
      </section>
    </main>
  );
}
