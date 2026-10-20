// SERVER-ONLY: Jangan import di client component.
import 'server-only';
import { cookies } from 'next/headers';
import type { SourceId } from '@/lib/sources/types';

const COOKIE_NAME = 'kuroneko-source';
const DEFAULT_SOURCE: SourceId = 'komiku';

export async function getSourceFromCookie(): Promise<SourceId> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(COOKIE_NAME)?.value;
    if (value === 'shinigami' || value === 'komiku' || value === 'manhwadesu') {
      return value;
    }
  } catch {}
  return DEFAULT_SOURCE;
}

export const SOURCE_INFO: Record<SourceId, { name: string; short: string }> = {
  komiku: { name: 'Server 1 — Komiku', short: 'Server 1' },
  shinigami: { name: 'Server 2 — Shinigami', short: 'Server 2' },
  manhwadesu: { name: 'Server 3 — Manhwadesu', short: 'Server 3' }, // <-- TAMBAH INI
};

export { COOKIE_NAME, DEFAULT_SOURCE };
