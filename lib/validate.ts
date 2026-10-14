// ============================================================
// INPUT VALIDATION HELPERS
// ============================================================

/**
 * Validasi slug komik/chapter.
 * Format: lowercase, alphanumeric + dash, max 200 karakter.
 * Contoh valid: "the-returned-c-rank-tank-wont-die-chapter-1"
 */
export function isValidSlug(slug: string | null | undefined): boolean {
  if (!slug || typeof slug !== 'string') return false;
  if (slug.length === 0 || slug.length > 200) return false;
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug);
}

/**
 * Validasi page number.
 * Harus integer positif, max 1000.
 */
export function parsePage(raw: string | null | undefined): number {
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isInteger(n)) return 1;
  if (n < 1) return 1;
  if (n > 1000) return 1000;
  return n;
}

/**
 * Validasi search query.
 * Max 100 karakter, strip karakter kontrol.
 */
export function sanitizeQuery(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .slice(0, 100)
    .replace(/[\x00-\x1F\x7F]/g, ''); // strip control chars
}

/**
 * Validasi genre slug (dari whitelist).
 */
const VALID_GENRES = new Set([
  'aksi', 'komedi', 'romantis', 'drama', 'shounen', 'petualangan',
  'school-life', 'slice-of-life', 'seinen', 'supernatural', 'bela-diri',
  'ecchi', 'harem', 'shoujo', 'misteri', 'sejarah', 'ngewe', 'sihir',
  'fiksi-ilmiah', 'psikologis', 'horor', 'reinkarnasi', 'dewasa', 'tragedi',
]);

export function isValidGenre(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return VALID_GENRES.has(slug.toLowerCase());
}

/**
 * Validasi type (manga/manhwa/manhua).
 */
const VALID_TYPES = new Set(['manga', 'manhwa', 'manhua']);

export function isValidType(type: string | null | undefined): boolean {
  if (!type) return false;
  return VALID_TYPES.has(type.toLowerCase());
}

/**
 * Extract slug dari URL komiku (untuk validasi).
 */
export function extractSlugFromUrl(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\/?baca\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}
