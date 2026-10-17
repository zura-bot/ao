import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSource } from '@/lib/sources';
import type { SourceId } from '@/lib/sources/types';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `home:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const sourceId = (request.nextUrl.searchParams.get('source') || 'komiku') as SourceId;

  const result = await withErrorHandler(async () => {
    const source = getSource(sourceId);
    return await source.getHome();
  });

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '30');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    result.headers.set('X-Source', sourceId);
  }
  return result;
}
