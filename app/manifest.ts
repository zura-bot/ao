import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kuroneko — Baca Komik',
    short_name: 'Kuroneko',
    description:
      'Website baca manga, manhwa, dan manhua. Tanpa iklan, gratis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f0f',
    theme_color: '#1e40af',
    orientation: 'portrait',
    lang: 'id',
    categories: ['entertainment', 'books', 'comics'],
    icons: [
      {
        src: '/kuroneko-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/kuroneko-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/kuroneko-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
