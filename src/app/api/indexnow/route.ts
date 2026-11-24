import { NextRequest, NextResponse } from 'next/server';
import { isCron } from '@/lib/server/supabase';
import { pingIndexNow } from '@/lib/server/indexnow';

export const dynamic = 'force-dynamic';

// 수동 실행용: /api/indexnow?days=7 (Authorization: Bearer CRON_SECRET)
export async function GET(req: NextRequest) {
  if (!isCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const days = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 2));
  return NextResponse.json(await pingIndexNow(days));
}
