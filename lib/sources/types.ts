import type {
  HomeResult,
  ListResult,
  SearchResult,
  TypeResult,
  GenreResult,
  ComicDetail,
  ChapterResult,
} from '@/types/komiku';

export type SourceId = 'komiku' | 'shinigami' | 'manhwadesu';

export interface Source {
  id: SourceId;
  name: string;
  baseUrl: string;
  logo?: string;

  getHome(): Promise<HomeResult>;
  getLatest(page?: number): Promise<ListResult>;
  getPopular(options?: { page?: number }): Promise<ListResult>;
  search(keyword: string, options?: { page?: number }): Promise<SearchResult>;
  getByType(type: string, options?: { page?: number }): Promise<TypeResult>;
  getByGenre(genre: string, options?: { page?: number }): Promise<GenreResult>;
  getDetail(slug: string): Promise<ComicDetail>;
  getChapter(slug: string): Promise<ChapterResult>;
  getRandom(options?: { detail?: boolean }): Promise<ComicDetail | any>;
}
