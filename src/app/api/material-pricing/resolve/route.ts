import { NextRequest, NextResponse } from 'next/server';

import { createRateLimiter } from '@/lib/api/utils';
import { resolveMaterialPrice } from '@/lib/estimating/pricing';
import type { PriceCandidate } from '@/lib/estimating/types';

const rateLimit = createRateLimiter(20, 60 * 1000);

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim();
}

function candidate(value: unknown, allowedSource?: PriceCandidate['source']): PriceCandidate | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const data = value as Record<string, unknown>;
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0) return undefined;
  if (typeof data.source !== 'string') return undefined;
  if (allowedSource && data.source !== allowedSource) return undefined;
  if (!['channel3', 'cache', 'contractor', 'manual'].includes(data.source)) return undefined;

  return {
    price: data.price,
    source: data.source as PriceCandidate['source'],
    ...(typeof data.supplier === 'string' ? { supplier: data.supplier.slice(0, 120) } : {}),
    ...(typeof data.product === 'string' ? { product: data.product.slice(0, 180) } : {}),
    ...(typeof data.retrievedAt === 'string' ? { retrievedAt: data.retrievedAt } : {}),
    ...(typeof data.expiresAt === 'string' ? { expiresAt: data.expiresAt } : {}),
    ...(typeof data.enteredBy === 'string' ? { enteredBy: data.enteredBy.slice(0, 120) } : {}),
    ...(typeof data.notes === 'string' ? { notes: data.notes.slice(0, 1000) } : {}),
  };
}

export async function POST(request: NextRequest) {
  if (!rateLimit(getClientIp(request))) {
    return NextResponse.json({ error: 'Too many pricing requests. Please try again in a minute.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({ error: 'Enter a material search between 2 and 160 characters.' }, { status: 400 });
  }

  const productId = typeof body.productId === 'string' && body.productId.length <= 160
    ? body.productId
    : undefined;

  const result = await resolveMaterialPrice({
    query,
    productId,
    cached: candidate(body.cached, 'cache'),
    contractor: candidate(body.contractor, 'contractor'),
    manual: candidate(body.manual, 'manual'),
    manualOverride: candidate(body.manualOverride, 'manual'),
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
