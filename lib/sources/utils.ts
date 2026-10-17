import type { SourceId } from './types';

const SOURCE_IDS: SourceId[] = ['komiku', 'shinigami'];
const DEFAULT_SOURCE: SourceId = 'komiku';

/**
 * Parse slug dengan format "source:slug".
 * Fallback ke default source kalau nggak ada prefix.
 *
 * Contoh:
 *   "komiku:the-shamans-blade" → { source: 'komiku', slug: 'the-shamans-blade' }
 *   "shinigami:uuid-xxx" → { source: 'shinigami', slug: 'uuid-xxx' }
 *   "the-shamans-blade" → { source: 'komiku', slug: 'the-shamans-blade' }
 */
export function parseSlug(input: string): {
  source: SourceId;
  slug: string;
} {
  if (!input) return { source: DEFAULT_SOURCE, slug: '' };

  const clean = decodeURIComponent(input).trim();
  const match = clean.match(/^([a-z]+):(.+)$/i);

  if (match) {
    const source = match[1].toLowerCase() as SourceId;
    if (SOURCE_IDS.includes(source)) {
      return { source, slug: match[2] };
    }
  }

  return { source: DEFAULT_SOURCE, slug: clean };
}

/**
 * Bikin slug dengan prefix source.
 *
 * Contoh:
 *   buildSlug('komiku', 'the-shamans-blade') → "komiku:the-shamans-blade"
 *   buildSlug('shinigami', 'uuid') → "shinigami:uuid"
 */
export function buildSlug(source: SourceId, slug: string): string {
  if (!slug) return '';
  if (source === DEFAULT_SOURCE) return slug; // default nggak perlu prefix
  return `${source}:${slug}`;
}

/**
 * Encode slug buat URL (biar karakter `:` aman).
 */
export function encodeSlug(source: SourceId, slug: string): string {
  return encodeURIComponent(buildSlug(source, slug));
}

export const SOURCE_LABELS: Record<SourceId, string> = {
  komiku: 'Komiku',
  shinigami: 'Shinigami',
};

export { SOURCE_IDS, DEFAULT_SOURCE };
