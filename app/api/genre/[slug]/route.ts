import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, fail, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { isValidGenre, parsePage } from '@/lib/validate';
import { getByGenre } from '@/lib/komiku';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `genre:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const { slug } = await params;

  if (!isValidGenre(slug)) {
    return fail('Genre nggak dikenal', 'BAD_REQUEST', 400);
  }

  const page = parsePage(request.nextUrl.searchParams.get('page'));

  const result = await withErrorHandler(async () =>
    getByGenre(slug.toLowerCase(), { page })
  );

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '60');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
  }
  return result;
}
