import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, fail, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { isValidSlug } from '@/lib/validate';
import { getDetail } from '@/lib/komiku';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `detail:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return fail('Slug nggak valid', 'BAD_REQUEST', 400);
  }

  const result = await withErrorHandler(async () => getDetail(slug));

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '60');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
  }
  return result;
}
