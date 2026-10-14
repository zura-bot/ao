import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { parsePage } from '@/lib/validate';
import { getPopular } from '@/lib/komiku';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `popular:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const page = parsePage(request.nextUrl.searchParams.get('page'));

  const result = await withErrorHandler(async () => getPopular({ page }));

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '60');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
  }
  return result;
}
