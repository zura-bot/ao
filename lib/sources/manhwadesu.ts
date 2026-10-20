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

async function getChapter(slug: string): Promise<ChapterResult> {
  const data = await manhwadesu.getChapter(slug);
  
  // TRIK: Bikin URL prev/next manual dari slug
  let prev_chapter_url: string | null = null;
  let next_chapter_url: string | null = null;
  let manga_url: string | null = null;

  const match = slug.match(/(.+)-chapter-(\d+)/i);
  if (match) {
    const base = match[1];
    const num = parseInt(match[2], 10);
    
    prev_chapter_url = num > 1 ? `/baca/${base}-chapter-${num - 1}` : null;
    next_chapter_url = `/baca/${base}-chapter-${num + 1}`; // Anggap aja selalu ada next
    manga_url = `/komik/${base}`;
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
