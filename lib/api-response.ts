import { NextResponse } from 'next/server';

// ============================================================
// TYPES
// ============================================================
export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    message: string;
    code: string;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ============================================================
// HELPERS
// ============================================================
export function ok<T>(
  data: T,
  init?: ResponseInit
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, error: null }, init);
}

export function fail(
  message: string,
  code = 'INTERNAL_ERROR',
  status = 500
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, data: null, error: { message, code } },
    { status }
  );
}

export function rateLimited(resetAt: number): NextResponse<ApiError> {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        message: `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`,
        code: 'RATE_LIMITED',
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  );
}

// ============================================================
// ERROR HANDLER WRAPPER
// ============================================================
export async function withErrorHandler<T>(
  fn: () => Promise<T>
): Promise<NextResponse<ApiSuccess<T>> | NextResponse<ApiError>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    console.error('[API ERROR]', {
      message,
      name: err instanceof Error ? err.name : 'Unknown',
      cause: err instanceof Error ? (err as any).cause : undefined,
    });

    // Deteksi error network (Node.js fetch)
    const networkKeywords = [
      'fetch failed',
      'Failed to fetch',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'EAI_AGAIN',
      'UND_ERR',
      'socket hang up',
      'network',
    ];
    if (
      networkKeywords.some((k) =>
        message.toLowerCase().includes(k.toLowerCase())
      )
    ) {
      return fail(message, 'UPSTREAM_ERROR', 502);
    }

    // Not found
    if (
      message.includes('not found') ||
      message.includes('tidak ditemukan') ||
      message.includes('404')
    ) {
      return fail(message, 'NOT_FOUND', 404);
    }

    // Bad request (validasi)
    if (message.includes('Valid') || message.includes('required')) {
      return fail(message, 'BAD_REQUEST', 400);
    }

    return fail(message, 'INTERNAL_ERROR', 500);
  }
}
