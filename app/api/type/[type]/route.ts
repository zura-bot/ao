import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler, fail, rateLimited } from '@/lib/api-response';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getSource } from '@/lib/sources';
import { parsePage } from '@/lib/validate';
import type { SourceId } from '@/lib/sources/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `type:${ip}`, limit: 60, windowMs: 60_000 });
  if (!limit.allowed) return rateLimited(limit.resetAt);

  const { type } = await params;
  const sourceId = (request.nextUrl.searchParams.get('source') || 'komiku') as SourceId;
  const page = parsePage(request.nextUrl.searchParams.get('page'));

  if (!type) return fail('Tipe nggak valid', 'BAD_REQUEST', 400);

  const result = await withErrorHandler(async () => {
    const source = getSource(sourceId);
    return await source.getByType(type, { page });
  });

  if (result instanceof NextResponse) {
    result.headers.set('X-Source', sourceId);
  }
  return result;
}
