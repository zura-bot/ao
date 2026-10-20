import type { MetadataRoute } from 'next';
import { getHome, GENRES } from '@/lib/komiku';
import type { ComicCard } from '@/types/komiku';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/latest`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/popular`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/genre`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/type/manga`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/type/manhwa`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/type/manhua`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const genrePages: MetadataRoute.Sitemap = GENRES.map((slug) => ({
    url: `${siteUrl}/genre/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  let comicPages: MetadataRoute.Sitemap = [];

  try {
    // Kita coba fetch, kalau internet mati / error, dia bakal masuk ke catch
    const homeData = await getHome();
    const comics = homeData.items ?? [];

    const seen = new Set<string>();
    const uniqueComics = comics.filter((c: ComicCard) => {
      if (!c.slug || seen.has(c.slug)) return false;
      seen.add(c.slug);
      return true;
    });

    comicPages = uniqueComics.map((comic: ComicCard) => ({
      url: `${siteUrl}/komik/${comic.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (err) {
    // INI KUNCINYA: Kalau fetch gagal, build tetep lanjut tanpa data komik
    console.warn('[sitemap] Gagal fetch data komik (Internet/DNS bermasalah), lanjut bikin sitemap statis aja.');
  }

  return [...staticPages, ...genrePages, ...comicPages];
}
