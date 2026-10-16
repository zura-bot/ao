// DEPRECATED: Alias untuk backward compatibility.
// Import dari `lib/sources` untuk kode baru.

export {
  getHome,
  getLatest,
  getPopular,
  search,
  getByType,
  getByGenre,
  getDetail,
  getChapter,
  getRandom,
  getGenres,
  GENRES,
  komikuSource,
} from './sources/komiku';

export { getSource, getAllSources, SOURCES, DEFAULT_SOURCE } from './sources';
export type { Source, SourceId } from './sources/types';
