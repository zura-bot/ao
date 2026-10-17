import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, fail, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSource } from '@/lib/sources';
import { sanitizeQuery, parsePage } from '@/lib/validate';
import type { SourceId } from '@/lib/sources/types';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `search:${ip}`, limit: 20, windowMs: 60_000 });
  if (!limit.allowed) return rateLimited(limit.resetAt);

  const sourceId = (request.nextUrl.searchParams.get('source') || 'komiku') as SourceId;
  const q = sanitizeQuery(request.nextUrl.searchParams.get('q'));
  if (!q || q.length < 2) return fail('Kata kunci minimal 2 karakter', 'BAD_REQUEST', 400);

  const page = parsePage(request.nextUrl.searchParams.get('page'));

  const result = await withErrorHandler(async () => {
    const source = getSource(sourceId);
    return await source.search(q, { page });
  });

  if (result instanceof NextResponse) {
    result.headers.set('X-Source', sourceId);
  }
  return result;
}
