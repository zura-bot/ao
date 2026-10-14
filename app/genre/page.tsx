import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Genre',
  description: 'Jelajahi komik berdasarkan genre di Kuroneko.',
};

const GENRES: { slug: string; label: string }[] = [
  { slug: 'aksi', label: 'Aksi' },
  { slug: 'komedi', label: 'Komedi' },
  { slug: 'romantis', label: 'Romantis' },
  { slug: 'drama', label: 'Drama' },
  { slug: 'shounen', label: 'Shounen' },
  { slug: 'petualangan', label: 'Petualangan' },
  { slug: 'school-life', label: 'School Life' },
  { slug: 'slice-of-life', label: 'Slice of Life' },
  { slug: 'seinen', label: 'Seinen' },
  { slug: 'supernatural', label: 'Supernatural' },
  { slug: 'bela-diri', label: 'Bela Diri' },
  { slug: 'ecchi', label: 'Ecchi' },
  { slug: 'harem', label: 'Harem' },
  { slug: 'shoujo', label: 'Shoujo' },
  { slug: 'misteri', label: 'Misteri' },
  { slug: 'sejarah', label: 'Sejarah' },
  { slug: 'sihir', label: 'Sihir' },
  { slug: 'fiksi-ilmiah', label: 'Fiksi Ilmiah' },
  { slug: 'psikologis', label: 'Psikologis' },
  { slug: 'horor', label: 'Horor' },
  { slug: 'reinkarnasi', label: 'Reinkarnasi' },
  { slug: 'dewasa', label: 'Dewasa' },
  { slug: 'tragedi', label: 'Tragedi' },
];

export default function GenreListPage() {
  return (
    <main className="container-page py-8 md:py-12">
      <header className="mb-10">
        <p className="caps text-[var(--muted)]">Jelajah</p>
        <h1
          className="section-title mt-2"
          style={{ fontSize: 'var(--text-3xl)' }}
        >
          Genre
        </h1>
        <p
          className="text-[var(--muted)] mt-2"
          style={{ fontSize: 'var(--text-base)' }}
        >
          Pilih genre yang mau lu jelajahi.
        </p>
      </header>

      <div className="genre-grid">
        {GENRES.map((g) => (
          <Link
            key={g.slug}
            href={`/genre/${g.slug}`}
            className="genre-card"
          >
            <span className="genre-card-label">{g.label}</span>
            <span className="genre-card-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
