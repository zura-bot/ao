import { komikuSource } from './komiku';
import { shinigamiSource } from './shinigami';
import type { Source, SourceId } from './types';

export const SOURCES: Record<SourceId, Source> = {
  komiku: komikuSource,
  shinigami: shinigamiSource,
};

export const DEFAULT_SOURCE: SourceId = 'komiku';

export function getSource(id?: string | null): Source {
  if (!id) return SOURCES[DEFAULT_SOURCE];
  const clean = id.toLowerCase() as SourceId;
  return SOURCES[clean] || SOURCES[DEFAULT_SOURCE];
}

export function getAllSources(): Source[] {
  return Object.values(SOURCES);
}

export type { Source, SourceId };
