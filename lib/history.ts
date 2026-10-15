export interface HistoryItem {
  komikSlug: string;
  komikTitle: string;
  cover: string;
  chapterSlug: string;
  chapterTitle: string;
  totalChapters?: number;
  updatedAt: number;
}

const STORAGE_KEY = 'kuroneko:history';

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(item: Omit<HistoryItem, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    const filtered = history.filter((h) => h.komikSlug !== item.komikSlug);
    
    const newItem: HistoryItem = {
      ...item,
      updatedAt: Date.now(),
    };

    const updated = [newItem, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history:', err);
  }
}

export function deleteHistory(komikSlug: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    const updated = history.filter((h) => h.komikSlug !== komikSlug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete history item:', err);
  }
}

export function clearHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return `${Math.floor(diff / 2592000)} bulan lalu`;
}
