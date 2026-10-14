// app/api/genres/route.ts
import { ok } from '@/lib/api-response';
import { GENRES } from '@/lib/komiku';

// Label display (biar ada Title Case, bukan slug)
const LABELS: Record<string, string> = {
  aksi: 'Aksi',
  komedi: 'Komedi',
  romantis: 'Romantis',
  drama: 'Drama',
  shounen: 'Shounen',
  petualangan: 'Petualangan',
  'school-life': 'School Life',
  'slice-of-life': 'Slice of Life',
  seinen: 'Seinen',
  supernatural: 'Supernatural',
  'bela-diri': 'Bela Diri',
  ecchi: 'Ecchi',
  harem: 'Harem',
  shoujo: 'Shoujo',
  misteri: 'Misteri',
  sejarah: 'Sejarah',
  ngewe: 'Ngewe',
  sihir: 'Sihir',
  'fiksi-ilmiah': 'Fiksi Ilmiah',
  psikologis: 'Psikologis',
  horor: 'Horor',
  reinkarnasi: 'Reinkarnasi',
  dewasa: 'Dewasa',
  tragedi: 'Tragedi',
};

export async function GET() {
  const genres = GENRES.map((slug) => ({
    slug,
    label: LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    url: `/genre/${slug}`,
  }));

  return ok({ total: genres.length, genres });
}