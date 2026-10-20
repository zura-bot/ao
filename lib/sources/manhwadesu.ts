import type {
  ComicCard, HomeResult, ListResult, SearchResult, TypeResult, GenreResult, ComicDetail, ChapterResult, Genre
} from '@/types/komiku';
import type { Source } from './types';
import * as manhwadesu from '@/lib/manhwadesu-scraper';

function mapCard(item: any): ComicCard {
  return {
    title: item.title, slug: item.slug, url: item.url, thumbnail: item.thumbnail,
    genre: '', total_chapters: item.latest_chapter || '', meta: '', type: 'manhwadesu',
  };
}

async function getHome(): Promise<HomeResult> {
  const data = await manhwadesu.getHome(1);
  const popularData = await manhwadesu.getPopular().catch(() => ({ items: [] }));
  const items = data.items.map(mapCard);
  const popular = popularData.items.map(mapCard);
  return { total: items.length + popular.length, latest: items.slice(0, 20), popular: popular.slice(0, 20), items: [...items, ...popular] };
}

async function getLatest(page: number = 1): Promise<ListResult> {
  const data = await manhwadesu.getHome(page);
  return { page, total: data.total, items: data.items.map(mapCard) };
}

async function getPopular(options: { page?: number } = {}): Promise<ListResult> {
  const data = await manhwadesu.getPopular();
  return { page: 1, total: data.total, items: data.items.map(mapCard) };
}

async function search(keyword: string, options: { page?: number } = {}): Promise<SearchResult> {
  return { keyword, page: 1, total: 0, results: [] }; 
}

async function getByType(type: string, options: { page?: number } = {}): Promise<TypeResult> {
  return { type, page: 1, total: 0, items: [] };
}

async function getByGenre(genre: string, options: { page?: number } = {}): Promise<GenreResult> {
  return { genre, page: 1, total: 0, items: [] };
}

async function getDetail(slug: string): Promise<ComicDetail> {
  const data = await manhwadesu.getDetail(slug);
  const genres: Genre[] = (data.genres || []).map((g: any) => ({ name: g.name, slug: g.slug, url: g.url }));
  const chapters = data.chapters.map((c: any) => ({ title: c.title, slug: c.slug, url: c.url, date: c.date !== 'Unknown' ? c.date : undefined }));

  return {
    title: data.title, slug: data.slug, url: data.url, thumbnail: data.thumbnail,
    type: data.info.type || 'Manhwa', status: data.info.status || 'Ongoing', genres,
    synopsis: data.synopsis,
    first_chapter: chapters.length ? chapters[chapters.length - 1] : null,
    latest_chapter: chapters.length ? chapters[0] : null,
    total_chapters: chapters.length, chapters,
  };
}

// Cache daftar chapter per komik (5 menit) supaya tiap buka chapter
// nggak harus scrape halaman detail lagi.
const chapterListCache = new Map<string, { at: number; slugs: string[] }>();
const CHAPTER_LIST_TTL = 5 * 60 * 1000;

function chapterNumber(slug: string): number {
  const m = slug.match(/chapter-(\d+)(?:-(\d+))?/i);
  if (!m) return NaN;
  return m[2] ? parseFloat(`${m[1]}.${m[2]}`) : parseInt(m[1], 10);
}

async function getOrderedChapterSlugs(mangaSlug: string): Promise<string[]> {
  const cached = chapterListCache.get(mangaSlug);
  if (cached && Date.now() - cached.at < CHAPTER_LIST_TTL) return cached.slugs;

  const detail = await manhwadesu.getDetail(mangaSlug);
  const slugs = detail.chapters
    .map((c: any) => String(c.slug))
    .filter((s: string) => !Number.isNaN(chapterNumber(s)))
    .sort((a: string, b: string) => chapterNumber(a) - chapterNumber(b)); // lama -> baru

  chapterListCache.set(mangaSlug, { at: Date.now(), slugs });
  return slugs;
}

async function getChapter(slug: string): Promise<ChapterResult> {
  const data = await manhwadesu.getChapter(slug);

  let prev_chapter_url: string | null = null;
  let next_chapter_url: string | null = null;
  let manga_url: string | null = null;

  const match = slug.match(/^(.+)-chapter-\d+(?:-\d+)?$/i);
  if (match) {
    const base = match[1];
    manga_url = `/komik/${base}`;

    try {
      // Prev/next diambil dari daftar chapter ASLI, bukan nomor+1 (tebakan).
      const slugs = await getOrderedChapterSlugs(base);
      const idx = slugs.indexOf(slug);
      if (idx >= 0) {
        if (idx > 0) prev_chapter_url = `/baca/${slugs[idx - 1]}`;
        if (idx < slugs.length - 1) next_chapter_url = `/baca/${slugs[idx + 1]}`;
      } else {
        throw new Error('chapter nggak ada di daftar');
      }
    } catch {
      // Fallback tebakan lama, kalau halaman detail gagal di-scrape.
      const num = parseInt(slug.match(/chapter-(\d+)/i)?.[1] || '0', 10);
      prev_chapter_url = num > 1 ? `/baca/${base}-chapter-${num - 1}` : null;
      next_chapter_url = `/baca/${base}-chapter-${num + 1}`;
    }
  }

  return {
    title: data.title, slug: slug, url: data.url,
    manga_url, prev_chapter_url, next_chapter_url,
    total_images: data.total_images, images: data.images,
  };
}

async function getRandom(options: { detail?: boolean } = {}) {
  const data = await manhwadesu.getRandom();
  if (options.detail !== false) return getDetail(data.slug);
  return mapCard(data);
}

export const manhwadesuSource: Source = {
  id: 'manhwadesu' as any, name: 'Manhwadesu', baseUrl: 'https://manhwadesu.wiki',
  getHome, getLatest, getPopular, search, getByType, getByGenre, getDetail, getChapter, getRandom,
};
