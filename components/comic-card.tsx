import Link from 'next/link';
import type { ComicCard as ComicCardType } from '@/types/komiku';
import { RelativeTime } from './relative-time';

interface ComicCardProps {
  comic: ComicCardType;
  priority?: boolean;
}

export function ComicCard({ comic, priority = false }: ComicCardProps) {
  const badge = comic.genre || comic.type;
  const hasTime = typeof comic.latest_chapter_time === 'number';

  return (
    <Link href={`/komik/${comic.slug}`} className="comic-card">
      <div className="comic-card-cover">
        <img
          src={`/api/image-proxy?url=${encodeURIComponent(comic.thumbnail)}`}
          alt={comic.title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
        {badge && <span className="comic-card-badge">{badge}</span>}
      </div>
      <h3 className="comic-card-title">{comic.title}</h3>
      {comic.total_chapters && (
        <p className="comic-card-meta">
          {comic.total_chapters}
          {hasTime && (
            <>
              {' · '}
              <RelativeTime
                timestamp={comic.latest_chapter_time!}
                className="comic-card-time"
              />
            </>
          )}
        </p>
      )}
      {!comic.total_chapters && hasTime && (
        <p className="comic-card-meta">
          <RelativeTime
            timestamp={comic.latest_chapter_time!}
            className="comic-card-time"
          />
        </p>
      )}
    </Link>
  );
}
