export interface ComicCard {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  genre: string;
  total_chapters: string;
  meta: string;
  type?: string;
}

export interface HomeResult {
  total: number;
  latest: ComicCard[];
  popular: ComicCard[];
  items: ComicCard[];
}

export interface ListResult {
  page: number;
  total: number;
  items: ComicCard[];
}

export interface SearchResult {
  keyword: string;
  page: number;
  total: number;
  results: ComicCard[];
}

export interface TypeResult {
  type: string;
  page: number;
  total: number;
  items: ComicCard[];
}

export interface GenreResult {
  genre: string;
  page: number;
  total: number;
  items: ComicCard[];
}

export interface Genre {
  name: string;
  slug: string;
  url: string;
}

export interface ChapterLink {
  title: string;
  slug: string;
  url: string;
  date?: string;
}

export interface ComicDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  type: string;
  status: string;
  genres: Genre[];
  synopsis: string;
  first_chapter: ChapterLink | null;
  latest_chapter: ChapterLink | null;
  total_chapters: number;
  chapters: ChapterLink[];
}

export interface ChapterResult {
  title: string;
  slug: string;
  url: string;
  manga_url: string | null;
  prev_chapter_url: string | null;
  next_chapter_url: string | null;
  total_images: number;
  images: string[];
}