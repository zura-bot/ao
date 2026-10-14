'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function Pagination({
  currentPage,
  hasNext,
  hasPrev,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (!hasNext && !hasPrev) return null;

  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      {hasPrev ? (
        <Link href={buildHref(currentPage - 1)} className="btn btn-secondary">
          ← Sebelumnya
        </Link>
      ) : (
        <button className="btn btn-secondary" disabled>
          ← Sebelumnya
        </button>
      )}

      <span className="pagination-current">Halaman {currentPage}</span>

      {hasNext ? (
        <Link href={buildHref(currentPage + 1)} className="btn btn-secondary">
          Selanjutnya →
        </Link>
      ) : (
        <button className="btn btn-secondary" disabled>
          Selanjutnya →
        </button>
      )}
    </nav>
  );
}
