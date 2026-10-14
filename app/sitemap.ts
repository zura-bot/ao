import type { MetadataRoute } from 'next';
import { getHome, getByGenre, GENRES } from '@/lib/komiku';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ============================================================
  // 1. Static pages
  // ============================================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/jelajah`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/latest`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/popular`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/genre`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/type/manga`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/type/manhwa`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/type/manhua`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // ============================================================
  // 2. Genre pages
  // ============================================================
  const genrePages: MetadataRoute.Sitemap = GENRES.map((slug) => ({
    url: `${siteUrl}/genre/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ============================================================
  // 3. Comic detail pages (dari halaman home + page 1 tiap type)
  // ============================================================
  let comicPages: MetadataRoute.Sitemap = [];

  try {
    const homeData = await getHome();
    const comics = homeData.items ?? [];

    // Dedupe by slug
    const seen = new Set<string>();
    const uniqueComics = comics.filter((c) => {
      if (!c.slug || seen.has(c.slug)) return false;
      seen.add(c.slug);
      return true;
    });

    comicPages = uniqueComics.map((comic) => ({
      url: `${siteUrl}/komik/${comic.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (err) {
    console.warn('[sitemap] gagal fetch home:', err);
    // Kalau fetch gagal, sitemap tetap valid (cuma static + genre)
  }

  return [...staticPages, ...genrePages, ...comicPages];
}
