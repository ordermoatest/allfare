import { NextRequest, NextResponse } from 'next/server';
import { isCron } from '@/lib/server/supabase';
import { geocodeStores, importStores } from '@/lib/server/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 매일 새벽 4시 30분(KST) - 매주 월요일엔 가맹점 목록을 다시 받고, 매일 좌표·전화번호를 채움
export async function GET(req: NextRequest) {
  if (!isCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const kstDay = new Date(Date.now() + 9 * 3600 * 1000).getUTCDay();
  const imported = kstDay === 1 ? await importStores() : null;
  const geo = await geocodeStores(3000, 270000);
  return NextResponse.json({ imported, geo });
}
