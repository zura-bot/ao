import { NextResponse } from 'next/server';
import { shinigamiSource } from '@/lib/sources/shinigami';

export async function GET() {
  try {
    const home = await shinigamiSource.getHome();
    return NextResponse.json({
      success: true,
      latestCount: home.latest.length,
      popularCount: home.popular.length,
      firstThree: home.latest.slice(0, 3),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    );
  }
}
