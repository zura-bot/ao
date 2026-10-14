import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getRandom } from '@/lib/komiku';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `random:${ip}`,
    limit: 15,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const result = await withErrorHandler(async () => {
    const detail = request.nextUrl.searchParams.get('detail') !== 'false';
    return await getRandom({ detail });
  });

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '15');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
  }
  return result;
}
