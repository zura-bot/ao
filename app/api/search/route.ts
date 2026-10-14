import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, fail, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeQuery, parsePage } from '@/lib/validate';
import { search } from '@/lib/komiku';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `search:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const q = sanitizeQuery(request.nextUrl.searchParams.get('q'));

  if (!q || q.length < 2) {
    return fail('Kata kunci minimal 2 karakter', 'BAD_REQUEST', 400);
  }

  const page = parsePage(request.nextUrl.searchParams.get('page'));

  const result = await withErrorHandler(async () => search(q, { page }));

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '20');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
  }
  return result;
}
