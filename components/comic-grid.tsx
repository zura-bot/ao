import type { ComicCard as ComicCardType } from '@/types/komiku';
import { ComicCard } from './comic-card';

interface ComicGridProps {
  comics: ComicCardType[];
  priorityCount?: number;
  keyPrefix?: string;
}

export function ComicGrid({
  comics,
  priorityCount = 0,
  keyPrefix = '',
}: ComicGridProps) {
  if (!comics.length) return null;

  return (
    <div className="comic-grid">
      {comics.map((comic, i) => (
        <ComicCard
          key={`${keyPrefix}${comic.slug || 'comic'}-${i}`}
          comic={comic}
          priority={i < priorityCount}
        />
      ))}
    </div>
  );
}