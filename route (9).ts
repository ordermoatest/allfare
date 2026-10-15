import { NextRequest, NextResponse } from 'next/server';
import { db, validDevice } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

// 혜택 좋아요 (기기당 1번, 다시 누르면 취소)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, device } = body as { id?: string; device?: string };
  if (!id || !/^[A-Za-z0-9_-]{1,40}$/.test(id) || !validDevice(device)) {
    return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  }
  const { data, error } = await db().rpc('toggle_benefit_like', { p_id: id, p_device: device });
  if (error) return NextResponse.json({ error: '좋아요를 저장하지 못했어요' }, { status: 500 });
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ liked: !!row?.liked, count: row?.cnt ?? 0 });
}
