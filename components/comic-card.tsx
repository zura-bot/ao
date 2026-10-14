import Link from 'next/link';
import type { ComicCard as ComicCardType } from '@/types/komiku';

interface ComicCardProps {
  comic: ComicCardType;
  priority?: boolean;
}

export function ComicCard({ comic, priority = false }: ComicCardProps) {
  return (
    <Link href={`/komik/${comic.slug}`} className="comic-card">
      <div className="comic-card-cover">
        <img
          src={`/api/image-proxy?url=${encodeURIComponent(comic.thumbnail)}`}
          alt={comic.title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      <h3 className="comic-card-title">{comic.title}</h3>
      {comic.genre && (
        <p className="comic-card-meta">
          {comic.genre}
          {comic.total_chapters && ` · ${comic.total_chapters}`}
        </p>
      )}
    </Link>
  );
}