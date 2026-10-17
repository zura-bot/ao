import type {
  ComicCard,
  HomeResult,
  ListResult,
  SearchResult,
  TypeResult,
  GenreResult,
  ComicDetail,
  ChapterResult,
  Genre,
} from '@/types/komiku';
import type { Source } from './types';
import { parseDate, formatDateShort } from '@/lib/parse-date';

// ============================================================
// SHINIGAMI — Pakai API resmi
// ============================================================
const API_BASE = 'https://api.shngm.io/v1';
const SITE_URL = 'https://11.shinigami.asia';
const CDN_URL = 'https://assets.shngm.id';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  Origin: SITE_URL,
  Referer: SITE_URL + '/',
};

// ============================================================
// GENRE MAP — Indonesia (Komiku) → English (Shinigami)
// ============================================================
const GENRE_MAP: Record<string, string> = {
  aksi: 'Action',
  komedi: 'Comedy',
  romantis: 'Romance',
  drama: 'Drama',
  shounen: 'Shounen',
  petualangan: 'Adventure',
  'school-life': 'School Life',
  'slice-of-life': 'Slice of Life',
  seinen: 'Seinen',
  supernatural: 'Supernatural',
  'bela-diri': 'Martial Arts',
  ecchi: 'Ecchi',
  harem: 'Harem',
  shoujo: 'Shoujo',
  misteri: 'Mystery',
  sejarah: 'Historical',
  sihir: 'Magic',
  'fiksi-ilmiah': 'Sci-Fi',
  psikologis: 'Psychological',
  horor: 'Horror',
  reinkarnasi: 'Reincarnation',
  dewasa: 'Mature',
  tragedi: 'Tragedy',
};

function mapGenre(slug: string): string {
  const lower = slug.toLowerCase().trim();
  return GENRE_MAP[lower] || slug;
}

// ============================================================
// FETCH HELPER
// ============================================================
async function fetchJson(path: string, retries = 2): Promise<any> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const url = `${API_BASE}${path}`;
      console.log(
        `[FETCH shinigami] ${attempt > 0 ? `retry #${attempt} ` : ''}GET ${url}`
      );

      const res = await fetch(url, {
        headers: DEFAULT_HEADERS,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }

      const json = await res.json();

      if (json.retcode !== undefined && json.retcode !== 0) {
        throw new Error(json.message || `retcode ${json.retcode}`);
      }

      return json;
    } catch (err) {
      lastError = err;
      console.warn(
        `[FETCH shinigami] attempt ${attempt + 1}/${retries + 1} failed:`,
        err instanceof Error ? err.message : err
      );

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

function qs(o: Record<string, any>): string {
  return Object.keys(o)
    .filter((k) => o[k] !== undefined && o[k] !== '')
    .map((k) => `${k}=${encodeURIComponent(o[k])}`)
    .join('&');
}

// ============================================================
// FORMAT HELPERS
// ============================================================
function getCoverUrl(m: any): string {
  return m.cover_portrait_url || m.cover_image_url || m.cover || '';
}

function extractGenreFromTaxonomy(taxonomy: any): string {
  if (!taxonomy) return '';
  const arr = taxonomy.Genre;
  if (!Array.isArray(arr)) return '';
  return arr
    .map((g: any) => (typeof g === 'string' ? g : g.name || ''))
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
}

function parseTimestamp(m: any): number | undefined {
  const candidates = [
    m.latest_chapter_time,
    m.latest_chapter_release_date,
    m.latest_chapter_created_at,
    m.latest_chapter_at,
    m.updated_at,
    m.last_updated,
    m.last_chapter_at,
    m.last_chapter_release_date,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      const ts = Date.parse(c);
      if (!isNaN(ts)) return ts;
    }
    if (typeof c === 'number') {
      return c < 10000000000 ? c * 1000 : c;
    }
  }
  return undefined;
}

function formatManga(m: any): ComicCard {
  const id = m.manga_id || m.id || '';
  const latest = m.latest_chapter_number ?? m.latest_chapter ?? '';

  let genre = extractGenreFromTaxonomy(m.taxonomy);

  if (!genre) {
    const country = m.country_id || '';
    const status =
      m.status === 1 ? 'Ongoing' : m.status === 2 ? 'Completed' : '';
    genre = [country, status].filter(Boolean).join(' · ');
  }

  return {
    title: m.title || m.name || '',
    slug: id,
    url: `${SITE_URL}/series/${id}`,
    thumbnail: getCoverUrl(m),
    genre,
    total_chapters: latest ? `${latest} chapter` : '',
    meta: '',
    type: 'shinigami',
    latest_chapter_time: parseTimestamp(m),
  };
}

function formatGenreList(taxonomy: any, key: string): string[] {
  const arr = taxonomy?.[key];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x: any) => (typeof x === 'string' ? x : x.name || x.title || ''))
    .filter(Boolean);
}

// ============================================================
// API FUNCTIONS
// ============================================================
async function listManga(opts: {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
  format?: string;
  genre?: string;
}): Promise<{ items: any[]; meta: any }> {
  const path =
    '/manga/list?' +
    qs({
      page: opts.page || 1,
      page_size: opts.pageSize || 24,
      sort: opts.sort || 'latest',
      q: opts.q || '',
      format: opts.format || '',
      genre_include: opts.genre || '',
    });
  const json = await fetchJson(path);
  return {
    items: Array.isArray(json.data) ? json.data : [],
    meta: json.meta || {},
  };
}

async function topManga(): Promise<any[]> {
  const json = await fetchJson('/manga/top');
  return Array.isArray(json.data) ? json.data : [];
}

async function detailManga(id: string): Promise<any> {
  const json = await fetchJson(`/manga/detail/${id}`);
  return json.data || {};
}

async function listChapters(id: string): Promise<any[]> {
  const out: any[] = [];
  const size = 100;
  for (let page = 1; page <= 60; page++) {
    const json = await fetchJson(
      `/chapter/${id}/list?` +
        qs({
          page,
          page_size: size,
          sort_by: 'chapter_number',
          sort_order: 'desc',
        })
    );
    const rows = Array.isArray(json.data) ? json.data : [];
    out.push(...rows);

    const totalPage = json.meta?.total_page || json.meta?.total_pages;
    if (
      !rows.length ||
      rows.length < size ||
      (totalPage && page >= totalPage)
    ) {
      break;
    }
  }
  return out;
}

async function detailChapter(chapterId: string): Promise<any> {
  const json = await fetchJson(`/chapter/detail/${chapterId}`);
  return json.data || {};
}

// ============================================================
// SOURCE IMPLEMENTATION
// ============================================================
async function getHome(): Promise<HomeResult> {
  const [latestRes, top] = await Promise.all([
    listManga({ page: 1, pageSize: 20, sort: 'latest' }),
    topManga().catch(() => []),
  ]);

  const latest = latestRes.items.map(formatManga);
  const popular = top.slice(0, 20).map(formatManga);

  return {
    total: latest.length + popular.length,
    latest,
    popular,
    items: [...latest, ...popular],
  };
}

async function getLatest(page: number = 1): Promise<ListResult> {
  const res = await listManga({ page, pageSize: 24, sort: 'latest' });
  return {
    page: Number(page),
    total: res.items.length,
    items: res.items.map(formatManga),
  };
}

async function getPopular(
  options: { page?: number } = {}
): Promise<ListResult> {
  const page = options.page || 1;
  if (page === 1) {
    const top = await topManga();
    return {
      page: 1,
      total: top.length,
      items: top.map(formatManga),
    };
  }
  const res = await listManga({ page, pageSize: 24, sort: 'bookmark' });
  return {
    page: Number(page),
    total: res.items.length,
    items: res.items.map(formatManga),
  };
}

async function search(
  keyword: string,
  options: { page?: number } = {}
): Promise<SearchResult> {
  if (!keyword) throw new Error('Keyword required');
  const page = options.page || 1;
  const res = await listManga({
    page,
    pageSize: 24,
    q: keyword,
    sort: 'latest',
  });
  return {
    keyword: keyword.trim(),
    page: Number(page),
    total: res.items.length,
    results: res.items.map(formatManga),
  };
}

async function getByType(
  type: string,
  options: { page?: number } = {}
): Promise<TypeResult> {
  const page = options.page || 1;
  const cleanType = String(type).toLowerCase();
  const validFormats = ['manga', 'manhwa', 'manhua'];
  const format = validFormats.includes(cleanType) ? cleanType : 'manhwa';

  const res = await listManga({ page, pageSize: 24, format, sort: 'latest' });
  return {
    type: format,
    page: Number(page),
    total: res.items.length,
    items: res.items.map(formatManga),
  };
}

async function getByGenre(
  genre: string,
  options: { page?: number } = {}
): Promise<GenreResult> {
  const page = options.page || 1;
  const mappedGenre = mapGenre(genre);
  const res = await listManga({
    page,
    pageSize: 24,
    genre: mappedGenre,
    sort: 'latest',
  });
  return {
    genre,
    page: Number(page),
    total: res.items.length,
    items: res.items.map(formatManga),
  };
}

async function getDetail(slugOrUrl: string): Promise<ComicDetail> {
  const match = String(slugOrUrl).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  const id = match ? match[0] : slugOrUrl.trim();

  if (!id) throw new Error('Manga ID required');

  const [raw, chapters] = await Promise.all([
    detailManga(id),
    listChapters(id),
  ]);

  const taxonomy = raw.taxonomy || {};

  const genres: Genre[] = formatGenreList(taxonomy, 'Genre').map((g) => ({
    name: g,
    slug: g.toLowerCase().replace(/\s+/g, '-'),
    url: `/genre/${g.toLowerCase().replace(/\s+/g, '-')}`,
  }));

  const chapterList = chapters.map((c) => {
    const rawDate = c.release_date || c.created_at;
    return {
      title: `Chapter ${c.chapter_number ?? ''}${
        c.chapter_title ? ` - ${c.chapter_title}` : ''
      }`.trim(),
      slug: c.chapter_id || c.id || '',
      url: `/baca/${c.chapter_id || c.id || ''}`,
      date: formatDateShort(rawDate),
    };
  });

  // Ambil raw date dari chapter terbaru untuk last_updated timestamp
  const latestRawDate = chapters[0]?.release_date || chapters[0]?.created_at;

  return {
    title: raw.title || raw.name || '',
    slug: id,
    url: `${SITE_URL}/series/${id}`,
    thumbnail: getCoverUrl(raw),
    type: formatGenreList(taxonomy, 'Format').join(', ') || 'Manhwa',
    status:
      raw.status === 1
        ? 'Ongoing'
        : raw.status === 2
          ? 'Completed'
          : 'Ongoing',
    genres,
    synopsis: raw.description || raw.synopsis || '',
    first_chapter: chapterList.length
      ? chapterList[chapterList.length - 1]
      : null,
    latest_chapter: chapterList.length ? chapterList[0] : null,
    total_chapters: chapterList.length,
    chapters: chapterList,
    last_updated: parseDate(latestRawDate),
  };
}

async function getChapter(slugOrUrl: string): Promise<ChapterResult> {
  const match = String(slugOrUrl).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  const chapterId = match ? match[0] : slugOrUrl.trim();

  if (!chapterId) throw new Error('Chapter ID required');

  const raw = await detailChapter(chapterId);
  const chapter = raw.chapter || {};
  const base = String(raw.base_url || CDN_URL).replace(/\/+$/, '');
  const path = String(chapter.path || raw.path || '').replace(
    /^\/+|\/+$/g,
    ''
  );
  const files = Array.isArray(chapter.data || raw.images || raw.pages)
    ? chapter.data || raw.images || raw.pages
    : [];

  const images = files
    .map((f: any) => {
      const s = String(f);
      if (/^https?:\/\//i.test(s)) return s;
      return `${base}/${path}/${s.replace(/^\/+/, '')}`;
    })
    .filter(Boolean);

  return {
    title: `Chapter ${raw.chapter_number ?? ''}${
      raw.chapter_title ? ` - ${raw.chapter_title}` : ''
    }`.trim(),
    slug: chapterId,
    url: `${SITE_URL}/chapter/${chapterId}`,
    manga_url: raw.manga_id ? `/komik/${raw.manga_id}` : null,
    prev_chapter_url: raw.prev_chapter_id
      ? `/baca/${raw.prev_chapter_id}`
      : null,
    next_chapter_url: raw.next_chapter_id
      ? `/baca/${raw.next_chapter_id}`
      : null,
    total_images: images.length,
    images,
  };
}

async function getRandom(options: { detail?: boolean } = {}) {
  const home = await getHome();
  const items = home.items || [];
  if (!items.length) throw new Error('No comics available');
  const randomItem = items[Math.floor(Math.random() * items.length)];
  if (options.detail !== false && randomItem?.slug) {
    return getDetail(randomItem.slug);
  }
  return randomItem;
}

// ============================================================
// EXPORT SOURCE
// ============================================================
export const shinigamiSource: Source = {
  id: 'shinigami',
  name: 'Shinigami',
  baseUrl: SITE_URL,
  getHome,
  getLatest,
  getPopular,
  search,
  getByType,
  getByGenre,
  getDetail,
  getChapter,
  getRandom,
};

export default shinigamiSource;
