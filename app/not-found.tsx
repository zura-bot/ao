import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-page min-h-hero flex flex-col justify-center py-16">
      <div className="max-w-xl">
        <p className="caps text-[var(--muted)]">Error 404</p>

        <h1
          className="mt-4 font-medium tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-5xl)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
          }}
        >
          Halaman ini udah pindah.
        </h1>

        <p
          className="mt-4 text-[var(--muted-strong)] max-w-[48ch]"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          Kayaknya yang lu cari nggak ada di sini. Coba balik ke beranda,
          atau langsung jelajah aja.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            Balik ke beranda
          </Link>
          <Link href="/jelajah" className="btn btn-secondary">
            Jelajah komik
          </Link>
        </div>
      </div>
    </main>
  );
}
