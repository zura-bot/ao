import type { SourceId } from '@/lib/sources/types';

const MAX_ITEMS = 100;
const MAX_AGE_DAYS = 90;

function storageKey(sourceId: SourceId): string {
  return `kuroneko:history:${sourceId}`;
}

export interface HistoryItem {
  komikSlug: string;
  komikTitle: string;
  cover: string;
  chapterSlug: string;
  chapterTitle: string;
  totalChapters: number;
  scrollPercent: number;
  timestamp: number;
}

// ============================================================
// READ
// ============================================================
export function getHistory(sourceId: SourceId): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(sourceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const valid = parsed.filter(
      (item): item is HistoryItem =>
        item &&
        typeof item === 'object' &&
        typeof item.komikSlug === 'string' &&
        typeof item.timestamp === 'number' &&
        now - item.timestamp < maxAgeMs
    );

    return valid
      .map((item) => ({
        ...item,
        scrollPercent:
          typeof item.scrollPercent === 'number' ? item.scrollPercent : 0,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function getHistoryCount(sourceId: SourceId): number {
  return getHistory(sourceId).length;
}

// ============================================================
// WRITE
// ============================================================
export function saveHistory(
  sourceId: SourceId,
  item: Omit<HistoryItem, 'timestamp' | 'scrollPercent'> & {
    scrollPercent?: number;
  }
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getHistory(sourceId);
    const filtered = existing.filter((h) => h.komikSlug !== item.komikSlug);
    const oldItem = existing.find((h) => h.komikSlug === item.komikSlug);
    const scrollPercent =
      typeof item.scrollPercent === 'number'
        ? item.scrollPercent
        : oldItem?.scrollPercent ?? 0;

    const updated: HistoryItem[] = [
      { ...item, scrollPercent, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);

    window.localStorage.setItem(storageKey(sourceId), JSON.stringify(updated));
  } catch {}
}

export function updateScrollPercent(
  sourceId: SourceId,
  komikSlug: string,
  scrollPercent: number
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getHistory(sourceId);
    const updated = existing.map((item) =>
      item.komikSlug === komikSlug
        ? { ...item, scrollPercent, timestamp: Date.now() }
        : item
    );
    window.localStorage.setItem(storageKey(sourceId), JSON.stringify(updated));
  } catch {}
}

// ============================================================
// DELETE
// ============================================================
export function deleteHistory(
  sourceId: SourceId,
  komikSlug: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getHistory(sourceId);
    const filtered = existing.filter((h) => h.komikSlug !== komikSlug);
    window.localStorage.setItem(storageKey(sourceId), JSON.stringify(filtered));
  } catch {}
}

export function clearHistory(sourceId: SourceId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey(sourceId));
  } catch {}
}

// ============================================================
// FORMAT
// ============================================================
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'baru aja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  if (weeks < 4) return `${weeks} minggu lalu`;
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}
