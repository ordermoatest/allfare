import { NextRequest, NextResponse } from 'next/server';
import { isCron } from '@/lib/server/supabase';
import { geocodeStores, importStores } from '@/lib/server/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 매일 새벽 4시 30분(KST) - 매주 월요일엔 가맹점 목록을 다시 받고, 매일 좌표·전화번호를 채움
export async function GET(req: NextRequest) {
  if (!isCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const t0 = Date.now();
  const kstDay = new Date(Date.now() + 9 * 3600 * 1000).getUTCDay();
  const imported = kstDay === 1 ? await importStores() : null;
  // 월요일엔 목록 받기에 쓴 시간만큼 좌표 채우기 시간을 줄여 5분 제한을 넘기지 않게
  const left = 270000 - (Date.now() - t0);
  const geo = left > 20000 ? await geocodeStores(3000, left) : { ok: true, skipped: 'no time left' };
  return NextResponse.json({ imported, geo });
}
