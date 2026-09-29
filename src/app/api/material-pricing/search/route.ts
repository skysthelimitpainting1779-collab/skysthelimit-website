import { NextRequest, NextResponse } from 'next/server';

import { Channel3ConfigurationError, channel3Service } from '@/lib/channel3/service';
import { createRateLimiter } from '@/lib/api/utils';

const rateLimit = createRateLimiter(20, 60 * 1000);

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim();
}

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? '6');
  if (!Number.isInteger(parsed)) return 6;
  return Math.min(Math.max(parsed, 1), 10);
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many pricing searches. Please try again in a minute.' },
      { status: 429 },
    );
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 160) {
    return NextResponse.json(
      { error: 'Enter a material search between 2 and 160 characters.' },
      { status: 400 },
    );
  }

  try {
    const products = await channel3Service.searchProducts(query, parseLimit(request.nextUrl.searchParams.get('limit')));
    return NextResponse.json(
      {
        products,
        retrievedAt: new Date().toISOString(),
        provider: 'Channel3',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    if (error instanceof Channel3ConfigurationError) {
      console.error('Channel3 material pricing is not configured.');
      return NextResponse.json(
        { error: 'Live material pricing is temporarily unavailable. Use a saved or manual price instead.' },
        { status: 503 },
      );
    }

    console.error('Channel3 material search failed:', error);
    return NextResponse.json(
      { error: 'Live material pricing is unavailable. Use a saved or manual price instead.' },
      { status: 502 },
    );
  }
}
