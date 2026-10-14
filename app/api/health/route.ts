import { NextResponse } from 'next/server';
import { getHome } from '@/lib/komiku';

export async function GET() {
  const started = Date.now();

  // Cek reach ke komiku
  let komikuOk = false;
  let komikuError: string | null = null;
  let itemCount = 0;

  try {
    const data = await getHome();
    itemCount = data.total;
    komikuOk = true;
  } catch (err) {
    komikuError = err instanceof Error ? err.message : 'Unknown error';
  }

  const elapsed = Date.now() - started;

  return NextResponse.json(
    {
      status: komikuOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${elapsed}ms`,
      checks: {
        server: { ok: true },
        komiku: {
          ok: komikuOk,
          items: itemCount,
          error: komikuError,
        },
      },
    },
    { status: komikuOk ? 200 : 503 }
  );
}
