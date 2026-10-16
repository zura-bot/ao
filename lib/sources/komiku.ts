import * as cheerio from 'cheerio';
import { Agent, fetch as undiciFetch } from 'undici';
import type {
  ComicCard,
  HomeResult,
  ListResult,
  SearchResult,
  TypeResult,
  GenreResult,
  ComicDetail,
  ChapterResult,
} from '@/types/komiku';
import type { Source } from './types';

const BASE_URL = 'https://komiku.online';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://komiku.online/',
};

export const GENRES = [
  'aksi', 'komedi', 'romantis', 'drama', 'shounen', 'petualangan',
  'school-life', 'slice-of-life', 'seinen', 'supernatural', 'bela-diri',
  'ecchi', 'harem', 'shoujo', 'misteri', 'sejarah', 'ngewe', 'sihir',
  'fiksi-ilmiah', 'psikologis', 'horor', 'reinkarnasi', 'dewasa', 'tragedi',
];

// ============================================================
// CUSTOM AGENT — Force IPv4
// ============================================================
const agent = new Agent({
  connect: {
    timeout: 20000,
    family: 4,
  } as any,
  headersTimeout: 25000,
  bodyTimeout: 30000,
  keepAliveTimeout: 30000,
  keepAliveMaxTimeout: 60000,
});

async function fetchHtml(
  url: string,
  options: { retries?: number; timeoutMs?: number } = {}
): Promise<string> {
  const retries = options.retries ?? 4;
  const timeoutMs = options.timeoutMs ?? 25000;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(
        `[FETCH komiku] ${attempt > 0 ? `retry #${attempt} ` : ''}GET ${url}`
      );

      const res = await undiciFetch(url, {
        dispatcher: agent,
        headers: {
          ...DEFAULT_HEADERS,
          Connection: 'keep-alive',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err;
      const cause =
        err instanceof Error && (err as any).cause
          ? ` (cause: ${String((err as any).cause)})`
          : '';
      console.warn(
        `[FETCH komiku] attempt ${attempt + 1}/${retries + 1} failed${cause}`,
        err instanceof Error ? err.message : err
      );

      if (attempt < retries) {
        const delay = 800 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  const causeMsg =
    lastError instanceof Error
      ? `${lastError.message}${
          (lastError as any).cause
            ? ` — cause: ${String((lastError as any).cause)}`
            : ''
        }`
      : String(lastError);

  throw new Error(`fetch failed: ${url} — ${causeMsg}`);
}

// ============================================================
// UTILS
// ============================================================
function formatUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function extractSlug(urlOrSlug: string): string {
  if (!urlOrSlug) return '';
  return urlOrSlug
    .replace(/^https?:\/\/[^\/]+/, '')
    .replace(/^\/baca\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

function parseCard($: cheerio.CheerioAPI, el: any): ComicCard {
  const linkEl = $(el).find('a').first();
  const rawUrl = linkEl.attr('href') || $(el).attr('href') || '';
  const url = formatUrl(rawUrl);
  const slug = extractSlug(rawUrl);

  const title =
    $(el).find('.kmk-kartu-judul').text().trim() ||
    linkEl.attr('title') ||
    '';
  const thumbnail =
    $(el).find('img').attr('src') ||
    $(el).find('img').attr('data-src') ||
    '';
  const meta = $(el)
    .find('.kmk-kartu-meta')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
  const chText = $(el).find('.kmk-kartu-ch').text().trim();

  let genre = '';
  let totalChapters = '';
  if (meta.includes('·')) {
    const parts = meta.split('·');
    genre = parts[0].trim();
    totalChapters = parts[1].trim();
  } else {
    genre = meta;
  }

  return {
    title,
    slug,
    url,
    thumbnail,
    genre,
    total_chapters: totalChapters || chText,
    meta,
    type: 'komiku',
  };
}

// ============================================================
// FUNGSI SCRAPER (internal)
// ============================================================
async function getHome(): Promise<HomeResult> {
  const html = await fetchHtml(BASE_URL);
  const $ = cheerio.load(html);

  const items: ComicCard[] = [];
  $('.kmk-kartu').each((_, el) => {
    const card = parseCard($, el);
    if (card.title) items.push(card);
  });

  return {
    total: items.length,
    latest: items.slice(0, 20),
    popular: items.slice(20),
    items,
  };
}

async function getPopular(
  options: { page?: number } = {}
): Promise<ListResult> {
  const page = options.page || 1;
  const pagePath = Number(page) > 1 ? `page/${page}/` : '';
  const targetUrl = `${BASE_URL}/populer/${pagePath}`;

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const items: ComicCard[] = [];
  $('.kmk-kartu').each((_, el) => {
    const card = parseCard($, el);
    if (card.title) items.push(card);
  });

  return { page: Number(page), total: items.length, items };
}

async function getLatest(page: number = 1): Promise<ListResult> {
  const pageNum = Number(page) || 1;
  const pagePath = pageNum > 1 ? `page/${pageNum}/` : '';
  const targetUrl = `${BASE_URL}/terbaru/${pagePath}`;

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const items: ComicCard[] = [];
  $('.kmk-kartu').each((_, el) => {
    const card = parseCard($, el);
    if (card.title) items.push(card);
  });

  return { page: pageNum, total: items.length, items };
}

async function search(
  keyword: string,
  options: { page?: number } = {}
): Promise<SearchResult> {
  if (!keyword || typeof keyword !== 'string') {
    throw new Error('Valid search keyword string is required');
  }

  const page = options.page || 1;
  const queryParams = new URLSearchParams({ s: keyword.trim() });
  if (Number(page) > 1) queryParams.set('paged', String(page));

  const targetUrl = `${BASE_URL}/?${queryParams.toString()}`;
  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const results: ComicCard[] = [];
  $('.kmk-kartu').each((_, el) => {
    const card = parseCard($, el);
    if (card.title) results.push(card);
  });

  return {
    keyword: keyword.trim(),
    page: Number(page),
    total: results.length,
    results,
  };
}

async function getByType(
  type: string = 'manhwa',
  options: { page?: number } = {}
): Promise<TypeResult> {
  const cleanType = String(type).trim().toLowerCase();
  const validTypes = ['manga', 'manhwa', 'manhua'];
  const selectedType = validTypes.includes(cleanType) ? cleanType : 'manhwa';

  const page = options.page || 1;
  const pagePath = Number(page) > 1 ? `page/${page}/` : '';
  const targetUrl = `${BASE_URL}/${selectedType}/${pagePath}`;

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const items: ComicCard[] = [];
  $('.kmk-kartu').each((_, el) => {
    const card = parseCard($, el);
    if (card.title) items.push(card);
  });

  return { type: selectedType, page: Number(page), total: items.length, items };
}

async function getByGenre(
  genreSlug: string,
  options: { page?: number } = {}
): Promise<GenreResult> {
  if (!genreSlug || typeof genreSlug !== 'string') {
    throw new Error('Valid genre slug is required');
  }

  const cleanSlug = genreSlug.trim().toLowerCase();
  const page = options.page || 1;
  const pagePath = Number(page) > 1 ? `page/${page}/` : '';
  const targetUrl = `${BASE_URL}/genre/${cleanSlug}/${pagePath}`;

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const items: ComicCard[] = [];
  $('.kmk-kartu').each((_, el) => {
    const card = parseCard($, el);
    if (card.title) items.push(card);
  });

  return { genre: cleanSlug, page: Number(page), total: items.length, items };
}

async function getDetail(slugOrUrl: string): Promise<ComicDetail> {
  if (!slugOrUrl || typeof slugOrUrl !== 'string') {
    throw new Error('Valid manga slug or URL is required');
  }

  let targetUrl = slugOrUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const slug = extractSlug(targetUrl);
    targetUrl = `${BASE_URL}/${slug}/`;
  }

  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const rawTitle = $('h1').first().text().trim();
  const title = rawTitle.replace(/^Komik\s+/i, '').trim();
  const slug = extractSlug(targetUrl);

  const thumbnail =
    $('img[src*="poster"]').first().attr('src') ||
    $('img').first().attr('src') ||
    '';

  const metaText = $('p:contains("adalah"), p:contains("bergenre")')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  let type = 'Manga';
  if (/manhwa/i.test(metaText)) type = 'Manhwa';
  else if (/manhua/i.test(metaText)) type = 'Manhua';

  let status = 'Ongoing';
  if (/tamat|completed/i.test(metaText)) status = 'Completed';

  const genres: { name: string; slug: string; url: string }[] = [];
  $('a[href*="/genre/"]').each((_, a) => {
    const gName = $(a).text().trim();
    const gHref = $(a).attr('href') || '';
    if (gName && !genres.some((g) => g.name === gName)) {
      genres.push({
        name: gName,
        slug: extractSlug(gHref),
        url: formatUrl(gHref),
      });
    }
  });

  const synopsis =
    $('p:contains("adalah")').text().trim() || $('p').eq(1).text().trim();

  const chapters: {
    title: string;
    slug: string;
    url: string;
    date?: string;
  }[] = [];

  $('a[href*="/baca/"]').each((_, a) => {
    const chHref = $(a).attr('href') || '';
    if (!chHref.includes(`/baca/${slug}-chapter-`)) return;

    const fullUrl = formatUrl(chHref);
    if (chapters.some((c) => c.url === fullUrl)) return;

    const titleEl = $(a).find('.kmk-ch-n');
    const titleText =
      titleEl.text().trim() ||
      $(a).text().replace(/\s+/g, ' ').trim();

    const timeEl = $(a).find('time.kmk-ch-t, time');
    const dateText =
      timeEl.text().trim() ||
      timeEl.attr('datetime') ||
      '';

    chapters.push({
      title: titleText,
      slug: extractSlug(chHref),
      url: fullUrl,
      date: dateText || undefined,
    });
  });

  return {
    title,
    slug,
    url: targetUrl,
    thumbnail,
    type,
    status,
    genres,
    synopsis,
    first_chapter: chapters.length ? chapters[0] : null,
    latest_chapter: chapters.length ? chapters[1] || chapters[0] : null,
    total_chapters: chapters.length,
    chapters,
  };
}

async function getChapter(slugOrUrl: string): Promise<ChapterResult> {
  if (!slugOrUrl || typeof slugOrUrl !== 'string') {
    throw new Error('Valid chapter slug or URL is required');
  }

  let targetUrl = slugOrUrl.trim();
  const slug = extractSlug(targetUrl);

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `${BASE_URL}/baca/${slug}/`;
  }

  let html: string;
  try {
    html = await fetchHtml(targetUrl);
  } catch (err) {
    try {
      const detail = await getDetail(slug);
      if (detail?.first_chapter?.url) {
        targetUrl = detail.first_chapter.url;
        html = await fetchHtml(targetUrl);
      } else {
        throw err;
      }
    } catch {
      throw new Error(
        `Chapter "${slugOrUrl}" tidak ditemukan.`
      );
    }
  }

  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim();

  let prevChapterUrl: string | null = null;
  let nextChapterUrl: string | null = null;
  let mangaUrl: string | null = null;

  $('a').each((_, a) => {
    const text = $(a).text().trim();
    const cls = ($(a).attr('class') || '').toLowerCase();
    const rel = ($(a).attr('rel') || '').toLowerCase();
    const rawHref = $(a).attr('href') || '';
    const href = formatUrl(rawHref);

    if (!href) return;

    const isPrev =
      cls.includes('prev') || rel === 'prev' ||
      text.includes('Sebelumnya') || text.includes('‹') || text.includes('«');
    const isNext =
      cls.includes('next') || rel === 'next' ||
      text.includes('Selanjutnya') || text.includes('›') || text.includes('»');
    const isMangaLink =
      text.includes('Semua Chapter') ||
      text.includes('Daftar Chapter') ||
      text.includes('Kembali ke Komik');

    if (isPrev && !prevChapterUrl) prevChapterUrl = href;
    else if (isNext && !nextChapterUrl) nextChapterUrl = href;
    else if (isMangaLink && !mangaUrl) mangaUrl = href.replace(/#chapter$/, '');
  });

  // Fallback: derive next/prev dari detail
  if (!nextChapterUrl || !prevChapterUrl) {
    const mangaSlugMatch = slug.match(/^(.+?)-chapter-\d+$/);
    const mangaSlug = mangaUrl
      ? extractSlug(mangaUrl)
      : mangaSlugMatch
        ? mangaSlugMatch[1]
        : null;

    if (mangaSlug) {
      try {
        const detail = await getDetail(mangaSlug);
        const currentSlug = extractSlug(targetUrl);
        const idx = detail.chapters.findIndex((c) => c.slug === currentSlug);

        if (idx >= 0) {
          if (!nextChapterUrl && idx + 1 < detail.chapters.length) {
            nextChapterUrl = detail.chapters[idx + 1].url;
          }
          if (!prevChapterUrl && idx > 0) {
            prevChapterUrl = detail.chapters[idx - 1].url;
          }
        }
        if (!mangaUrl && detail.url) mangaUrl = detail.url;
      } catch (err) {
        console.warn('[komiku] Fallback getDetail gagal:', err);
      }
    }
  }

  const images: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (!src) return;
    if (
      src.includes('logo') ||
      src.includes('favicon') ||
      src.includes('assets') ||
      src.includes('theme') ||
      src.includes('banner') ||
      src.includes('iklan')
    ) {
      return;
    }
    if (src.startsWith('http')) images.push(src.trim());
  });

  return {
    title,
    slug: extractSlug(targetUrl),
    url: targetUrl,
    manga_url: mangaUrl,
    prev_chapter_url: prevChapterUrl,
    next_chapter_url: nextChapterUrl,
    total_images: images.length,
    images,
  };
}

async function getRandom(options: { detail?: boolean } = {}) {
  const home = await getHome();
  const items = home.items || [];
  if (!items.length) {
    throw new Error('No comics available to pick from');
  }

  const randomItem = items[Math.floor(Math.random() * items.length)];
  if (options.detail !== false && randomItem?.slug) {
    return getDetail(randomItem.slug);
  }
  return randomItem;
}

function getGenres(): string[] {
  return [...GENRES];
}

// ============================================================
// EXPORT SOURCE
// ============================================================
export const komikuSource: Source & { getGenres: () => string[]; GENRES: string[] } = {
  id: 'komiku',
  name: 'Komiku',
  baseUrl: BASE_URL,
  getHome,
  getLatest,
  getPopular,
  search,
  getByType,
  getByGenre,
  getDetail,
  getChapter,
  getRandom,
  getGenres,
  GENRES,
};

export {
  getHome,
  getLatest,
  getPopular,
  search,
  getByType,
  getByGenre,
  getDetail,
  getChapter,
  getRandom,
  getGenres,
};
