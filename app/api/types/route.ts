// app/api/types/route.ts
import { ok } from '@/lib/api-response';

const TYPES = [
  { slug: 'manga', label: 'Manga', description: 'Komik Jepang' },
  { slug: 'manhwa', label: 'Manhwa', description: 'Komik Korea' },
  { slug: 'manhua', label: 'Manhua', description: 'Komik China' },
];

export async function GET() {
  return ok({ total: TYPES.length, types: TYPES });
}