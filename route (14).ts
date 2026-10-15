import { NextRequest, NextResponse } from 'next/server';
import { isCron } from '@/lib/server/supabase';
import { syncBenefits } from '@/lib/server/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 매일 새벽 4시(KST) 버셀 크론이 호출 - 정부24 혜택 전체 동기화
export async function GET(req: NextRequest) {
  if (!isCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await syncBenefits());
}
