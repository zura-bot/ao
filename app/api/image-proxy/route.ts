import { NextResponse, type NextRequest } from 'next/server';

// ============================================================
// WHITELIST HOST
// Catatan: Komiku pakai beberapa CDN gambar, kadang beda per komik.
// Tambahin hostname baru kalau ada yang 403.
// ============================================================
const ALLOWED_HOSTS = new Set<string>([
  'static.anipop.xyz',
  'komiku.online',
  'img.komiku.online',
  'cdn.komiku.online',
  'komiku.org',
  'manga.googiane.com',
  'googiane.com',
  'manga.gogoanime.fit',
  'gogoanime.fit',
]);

const ALLOWED_SUFFIXES = [
  '.anipop.xyz',
  '.komiku.online',
  '.komiku.org',
  '.googiane.com',
  '.gogoanime.fit',
];

function isAllowedHost(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(clean)) return true;
  return ALLOWED_SUFFIXES.some((suffix) => clean.endsWith(suffix));
}

// ============================================================
// BLOCK PRIVATE IP (SSRF protection)
// ============================================================
function isPrivateHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  if (clean === 'localhost' || clean.endsWith('.localhost')) return true;

  const ipv4Match = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }

  if (clean === '::1' || clean === '[::1]') return true;
  return false;
}

// ============================================================
// VALIDASI URL
// ============================================================
interface ValidationResult {
  ok: boolean;
  error?: string;
  code?: string;
  parsed?: URL;
}

function validateUrl(raw: string): ValidationResult {
  if (!raw || typeof raw !== 'string') {
    return { ok: false, error: 'Missing "url" param', code: 'BAD_REQUEST' };
  }
  if (raw.length > 2048) {
    return { ok: false, error: 'URL terlalu panjang', code: 'BAD_REQUEST' };
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'Invalid URL', code: 'BAD_REQUEST' };
  }
  if (parsed.protocol !== 'https:') {
    return {
      ok: false,
      error: `Protocol "${parsed.protocol}" nggak diizinkan`,
      code: 'FORBIDDEN_PROTOCOL',
    };
  }
  if (isPrivateHostname(parsed.hostname)) {
    return {
      ok: false,
      error: 'Host privat nggak diizinkan',
      code: 'FORBIDDEN_HOST',
    };
  }
  if (!isAllowedHost(parsed.hostname)) {
    return {
      ok: false,
      error: `Host "${parsed.hostname}" nggak diizinkan`,
      code: 'FORBIDDEN_HOST',
    };
  }
  return { ok: true, parsed };
}

// ============================================================
// FETCH DENGAN RETRY
// ============================================================
async function fetchWithRetry(
  url: string,
  retries = 2,
  timeoutMs = 15000
): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Referer: 'https://komiku.online/',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
          Connection: 'keep-alive',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// ============================================================
// HANDLER
// ============================================================
export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  const validation = validateUrl(urlParam ?? '');

  if (!validation.ok || !validation.parsed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: validation.error || 'Invalid request',
          code: validation.code || 'BAD_REQUEST',
        },
      },
      {
        status:
          validation.code === 'FORBIDDEN_HOST' ||
          validation.code === 'FORBIDDEN_PROTOCOL'
            ? 403
            : 400,
      }
    );
  }

  const target = validation.parsed;

  try {
    const res = await fetchWithRetry(target.toString(), 2, 15000);

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Upstream error (${res.status})`,
            code: 'UPSTREAM_ERROR',
          },
        },
        { status: 502 }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';

    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Response bukan gambar',
            code: 'INVALID_CONTENT',
          },
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();

    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Gambar kegedean (>10MB)',
            code: 'TOO_LARGE',
          },
        },
        { status: 413 }
      );
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[IMAGE-PROXY] Fetch failed for ${target.hostname}: ${message}`);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Proxy error: nggak bisa akses gambar dari server',
          code: 'PROXY_ERROR',
        },
      },
      { status: 502 }
    );
  }
}
