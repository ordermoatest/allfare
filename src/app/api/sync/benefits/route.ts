import { NextRequest, NextResponse } from 'next/server';
import { isCron } from '@/lib/server/supabase';
import { syncBenefits } from '@/lib/server/sync';
import { pingIndexNow } from '@/lib/server/indexnow';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 매일 새벽 4시(KST) 버셀 크론이 호출 - 정부24 혜택 전체 동기화
export async function GET(req: NextRequest) {
  if (!isCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sync = await syncBenefits();
  // 같은 크론에서 최근 바뀐 가이드·소식을 IndexNow로 알림 (Bing·네이버)
  const indexnow = await pingIndexNow(2).catch((e) => ({ error: String(e) }));
  return NextResponse.json({ ...sync, indexnow });
}
