// CLIENT-ONLY: buat baca/set cookie dari browser.
import type { SourceId } from '@/lib/sources/types';

const COOKIE_NAME = 'kuroneko-source';
const DEFAULT_SOURCE: SourceId = 'komiku';

export function getSourceClient(): SourceId {
  if (typeof document === 'undefined') return DEFAULT_SOURCE;
  const match = document.cookie.match(/kuroneko-source=([^;]+)/);
  const value = match?.[1];
  if (value === 'shinigami' || value === 'komiku' || value === 'manhwadesu') {
    return value;
  }
  return DEFAULT_SOURCE;
}

export function setSourceClient(source: SourceId): void {
  if (typeof document === 'undefined') return;
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `kuroneko-source=${source}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export const SOURCE_INFO: Record<SourceId, { name: string; short: string }> = {
  komiku: { name: 'Server 1 — Komiku', short: 'Server 1' },
  shinigami: { name: 'Server 2 — Shinigami', short: 'Server 2' },
  manhwadesu: { name: 'Server 3 — Manhwadesu', short: 'Server 3' }, // <-- TAMBAH INI
};

export { COOKIE_NAME, DEFAULT_SOURCE };
