import { NextRequest, NextResponse } from 'next/server';
import { verifyRequiredWebhookSecret } from '@/lib/api/utils';
import { listPendingLeadDeliveries } from '@/lib/leads/persistence';

export async function GET(request: NextRequest) {
  const authentication = verifyRequiredWebhookSecret(
    process.env.LEAD_RECONCILIATION_SECRET,
    request.headers.get('x-ops-secret') || '',
  );
  if (!authentication.ok) {
    return NextResponse.json(
      { error: authentication.error },
      { status: authentication.status },
    );
  }

  try {
    const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 100);
    const items = await listPendingLeadDeliveries(requestedLimit);
    return NextResponse.json(
      { items, count: items.length },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Lead reconciliation query failed:', error);
    return NextResponse.json(
      { error: 'Reconciliation data is unavailable.' },
      { status: 503 },
    );
  }
}
