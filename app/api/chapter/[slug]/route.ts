import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, fail, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSource } from '@/lib/sources';
import { parseSlug } from '@/lib/sources/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `chapter:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) return rateLimited(limit.resetAt);

  const { slug: rawSlug } = await params;
  const { source: sourceId, slug } = parseSlug(rawSlug);

  if (!slug) {
    return fail('Slug nggak valid', 'BAD_REQUEST', 400);
  }

  const result = await withErrorHandler(async () => {
    const source = getSource(sourceId);
    return await source.getChapter(slug);
  });

  if (result instanceof NextResponse) {
    result.headers.set('X-RateLimit-Limit', '60');
    result.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    result.headers.set('X-Source', sourceId);
  }
  return result;
}
