import * as cheerio from 'cheerio';

const BASE_URL = 'https://manhwadesu.wiki';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url: string, options: any = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) return res;
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Fetch failed');
}

function formatUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function extractSlug(url: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/komik\//, '').replace(/^\//, '').replace(/\/$/, '');
}

function parseComicList($: cheerio.CheerioAPI): any[] {
  const items: any[] = [];
  $('.listupd .bs').each((_, el) => {
    const linkEl = $(el).find('.bsx a').first();
    const href = linkEl.attr('href') || '';
    const title = $(el).find('.bigor .tt').text().trim();
    
    // Cek src atau data-lazy-src, pastiin bukan data: placeholder
    let img = $(el).find('.limit img').attr('data-lazy-src') || $(el).find('.limit img').attr('src') || '';
    if (img.startsWith('data:')) img = ''; 

    const ch = $(el).find('.adds .epxs').text().trim();
    if (title && href) items.push({ title, slug: extractSlug(href), url: formatUrl(href), thumbnail: img, latest_chapter: ch });
  });
  if (items.length === 0) {
    $('.listupd .utao').each((_, el) => {
      const linkEl = $(el).find('.luf a.series').first();
      const href = linkEl.attr('href') || '';
      const title = $(el).find('.luf h4').text().trim();
      
      let img = $(el).find('.imgu img').attr('data-lazy-src') || $(el).find('.imgu img').attr('src') || '';
      if (img.startsWith('data:')) img = '';

      const latestChapterEl = $(el).find('.luf ul li a').first();
      if (title && href) items.push({ title, slug: extractSlug(href), url: formatUrl(href), thumbnail: img, latest_chapter: latestChapterEl.text().trim() });
    });
  }
  return items;
}

export async function getHome(page = 1) {
  const pageNum = Number(page) || 1;
  const targetUrl = pageNum > 1 ? `${BASE_URL}/page/${pageNum}/` : BASE_URL;
  const res = await fetchWithRetry(targetUrl, { headers: HEADERS });
  if (!res.ok) throw new Error(`Gagal ambil home (${res.status})`);
  const $ = cheerio.load(await res.text());
  return { page: pageNum, total: parseComicList($).length, items: parseComicList($) };
}

export async function getDetail(slugOrUrl: string) {
  let slug = extractSlug(slugOrUrl);
  const url = slugOrUrl.startsWith('http') ? slugOrUrl : `${BASE_URL}/komik/${slug}/`;
  const res = await fetchWithRetry(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Gagal ambil detail (${res.status})`);
  const $ = cheerio.load(await res.text());

  const title = $('.entry-title').text().trim() || $('h1').first().text().trim();
  
  let thumbnail = $('.thumb img').attr('src') || $('.thumb img').attr('data-lazy-src') || '';
  if (thumbnail.startsWith('data:')) thumbnail = '';

  const synopsis = $('.entry-content p').text().trim();

  const info: any = {};
  $('.spe span').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('Status')) info.status = text.replace('Status:', '').trim();
    if (text.includes('Tipe')) info.type = text.replace('Tipe:', '').trim();
  });

  const genres: any[] = [];
  $('a[href*="/genres/"]').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (name && href && !genres.some(g => g.name === name)) {
      genres.push({ name, slug: href.split('/genres/')[1]?.replace('/', '') || '', url: href });
    }
  });

  const chapters: any[] = [];
  $('a[href*="-chapter-"]').each((_, el) => {
    const chHref = $(el).attr('href') || '';
    const chTitle = $(el).text().trim();
    if (chHref && !chapters.some(c => c.url === chHref)) {
      chapters.push({ title: chTitle || chHref.split('/').pop(), slug: extractSlug(chHref), url: formatUrl(chHref), date: $(el).parent().find('.dt').text().trim() || 'Unknown' });
    }
  });
  return { title, slug, url, thumbnail, synopsis, info, genres, total_chapters: chapters.length, chapters };
}

export async function getChapter(slugOrUrl: string) {
  let slug = slugOrUrl.trim();
  if (slug.startsWith('http')) slug = slug.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  const url = `${BASE_URL}/${slug}/`;
  const res = await fetchWithRetry(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} - Cek URL: ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $('.entry-title').text().trim() || $('h1').text().trim();
  let images: string[] = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original');
    // ABAIKAN data:image dan logo
    if (!src || src.startsWith('data:') || /logo|favicon|fav\.png|public\/|assets|theme|banner|iklan|thumbnail|noimg/i.test(src)) return;
    
    let finalSrc = src.trim();
    if (finalSrc.startsWith('//')) finalSrc = 'https:' + finalSrc;
    if (finalSrc.startsWith('/')) finalSrc = BASE_URL + finalSrc;
    if (finalSrc.startsWith('http')) images.push(finalSrc);
  });

  // Fallback logic kalau gambar kosong
  if (images.length === 0) {
    const match = html.match(/https?:\/\/[^"'\s]+image-1\.(?:webp|jpg|png)/i);
    if (match) images.push(match[0]);
  }
  if (images.length === 1 && images[0].includes('image-1.')) {
    const baseUrl = images[0].split('image-1.')[0];
    const ext = images[0].split('.').pop();
    for (let i = 2; i <= 30; i++) images.push(`${baseUrl}image-${i}.${ext}`);
  }
  if (images.length === 0) {
    const matchSlug = slug.match(/(.+)-chapter-(\d+)/i);
    if (matchSlug) {
      const baseUrl = `https://cdn.gilakomik.id/${matchSlug[1]}/chapter-${matchSlug[2]}/`;
      for (let i = 1; i <= 30; i++) images.push(`${baseUrl}image-${i}.webp`);
    }
  }
  images = [...new Set(images)];
  return { title, url, total_images: images.length, images };
}

export async function getPopular() {
  const res = await fetchWithRetry(BASE_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`Gagal ambil popular (${res.status})`);
  const $ = cheerio.load(await res.text());
  const items: any[] = [];
  $('.popconslide .bs').each((_, el) => {
    const linkEl = $(el).find('.bsx a').first();
    const href = linkEl.attr('href') || '';
    const title = $(el).find('.bigor .tt').text().trim();
    let img = $(el).find('.limit img').attr('data-lazy-src') || $(el).find('.limit img').attr('src') || '';
    if (img.startsWith('data:')) img = '';
    const ch = $(el).find('.adds .epxs').text().trim();
    if (title && href) items.push({ title, slug: extractSlug(href), url: formatUrl(href), thumbnail: img, latest_chapter: ch });
  });
  return { total: items.length, items };
}

export async function getRandom() {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const home = await getHome(randomPage);
  if (!home.items || home.items.length === 0) throw new Error('Tidak ada komik');
  return home.items[Math.floor(Math.random() * home.items.length)];
}
