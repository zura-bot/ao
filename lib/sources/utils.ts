import type { SourceId } from './types';

const SOURCE_IDS: SourceId[] = ['komiku', 'shinigami', 'manhwadesu']; // <-- TAMBAH INI
const DEFAULT_SOURCE: SourceId = 'komiku';

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

export function buildSlug(source: SourceId, slug: string): string {
  if (!slug) return '';
  if (source === DEFAULT_SOURCE) return slug;
  return `${source}:${slug}`;
}

export function encodeSlug(source: SourceId, slug: string): string {
  return encodeURIComponent(buildSlug(source, slug));
}

export const SOURCE_LABELS: Record<SourceId, string> = {
  komiku: 'Komiku',
  shinigami: 'Shinigami',
  manhwadesu: 'Manhwadesu', // <-- TAMBAH INI
};

export { SOURCE_IDS, DEFAULT_SOURCE };
