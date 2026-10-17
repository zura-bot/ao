import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSource } from '@/lib/sources';
import { parsePage } from '@/lib/validate';
import type { SourceId } from '@/lib/sources/types';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `latest:${ip}`, limit: 60, windowMs: 60_000 });
  if (!limit.allowed) return rateLimited(limit.resetAt);

  const sourceId = (request.nextUrl.searchParams.get('source') || 'komiku') as SourceId;
  const page = parsePage(request.nextUrl.searchParams.get('page'));

  const result = await withErrorHandler(async () => {
    const source = getSource(sourceId);
    return await source.getLatest(page);
  });

  if (result instanceof NextResponse) {
    result.headers.set('X-Source', sourceId);
  }
  return result;
}
