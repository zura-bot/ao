import { NextResponse, type NextRequest } from 'next/server';

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
  'assets.shngm.id',
  'manhwadesu.wiki',
  'cdn.gilakomik.id',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'i3.wp.com',
  'blogger.googleusercontent.com',
  'blogspot.com',
]);

const ALLOWED_SUFFIXES = [
  '.anipop.xyz',
  '.komiku.online',
  '.komiku.org',
  '.googiane.com',
  '.gogoanime.fit',
  '.shngm.id',
  '.manhwadesu.wiki',
  '.gilakomik.id',
  '.wp.com',
  '.googleusercontent.com',
  '.blogspot.com',
];

function isAllowedHost(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(clean)) return true;
  return ALLOWED_SUFFIXES.some((suffix) => clean.endsWith(suffix));
}

function isPrivateHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  if (clean === 'localhost' || clean.endsWith('.localhost')) return true;
  const ipv4Match = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127 || a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  if (clean === '::1' || clean === '[::1]') return true;
  return false;
}

function getRefererFor(hostname: string): string {
  const clean = hostname.toLowerCase();
  if (clean.endsWith('.shngm.id')) return 'https://11.shinigami.asia/';
  if (clean.includes('manhwadesu') || clean.includes('gilakomik') || clean.includes('wp.com') || clean.includes('googleusercontent')) {
    return 'https://manhwadesu.wiki/';
  }
  if (clean === 'komiku.online' || clean === 'komiku.org' || clean.endsWith('.anipop.xyz') || clean.endsWith('.gogoanime.fit') || clean.endsWith('.googiane.com') || clean.endsWith('.komiku.online') || clean.endsWith('.komiku.org')) {
    return 'https://komiku.online/';
  }
  return '';
}

interface ValidationResult {
  ok: boolean;
  error?: string;
  code?: string;
  parsed?: URL;
}

function validateUrl(raw: string): ValidationResult {
  if (!raw || typeof raw !== 'string') return { ok: false, error: 'Missing "url" param', code: 'BAD_REQUEST' };
  if (raw.length > 2048) return { ok: false, error: 'URL terlalu panjang', code: 'BAD_REQUEST' };
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return { ok: false, error: 'Invalid URL', code: 'BAD_REQUEST' }; }
  
  // TAMBAHAN: Blokir data: URI
  if (parsed.protocol === 'data:') {
    return { ok: false, error: 'Data URI tidak diizinkan', code: 'FORBIDDEN_PROTOCOL' };
  }

  if (parsed.protocol !== 'https:') return { ok: false, error: `Protocol "${parsed.protocol}" nggak diizinkan`, code: 'FORBIDDEN_PROTOCOL' };
  if (isPrivateHostname(parsed.hostname)) return { ok: false, error: 'Host privat nggak diizinkan', code: 'FORBIDDEN_HOST' };
  if (!isAllowedHost(parsed.hostname)) console.warn(`[IMAGE-PROXY] Host ditolak (belum di allowlist): ${parsed.hostname}`);
  if (!isAllowedHost(parsed.hostname)) return { ok: false, error: `Host "${parsed.hostname}" nggak diizinkan`, code: 'FORBIDDEN_HOST' };
  return { ok: true, parsed };
}

async function fetchWithRetry(url: string, referer: string, retries = 2, timeoutMs = 15000): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          ...(referer ? { Referer: referer } : {}),
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
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  const validation = validateUrl(urlParam ?? '');

  if (!validation.ok || !validation.parsed) {
    return NextResponse.json(
      { success: false, error: { message: validation.error || 'Invalid request', code: validation.code || 'BAD_REQUEST' } },
      { status: validation.code === 'FORBIDDEN_HOST' || validation.code === 'FORBIDDEN_PROTOCOL' ? 403 : 400 }
    );
  }

  const target = validation.parsed;
  const referer = getRefererFor(target.hostname);

  try {
    const res = await fetchWithRetry(target.toString(), referer, 2, 15000);
    if (!res.ok) return NextResponse.json({ success: false, error: { message: `Upstream error (${res.status})`, code: 'UPSTREAM_ERROR' } }, { status: 502 });
    
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return NextResponse.json({ success: false, error: { message: 'Response bukan gambar', code: 'INVALID_CONTENT' } }, { status: 502 });
    
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: { message: 'Gambar kegedean (>10MB)', code: 'TOO_LARGE' } }, { status: 413 });

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
    return NextResponse.json({ success: false, error: { message: 'Proxy error', code: 'PROXY_ERROR' } }, { status: 502 });
  }
}
