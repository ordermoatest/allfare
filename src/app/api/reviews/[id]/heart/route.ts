import { NextRequest, NextResponse } from 'next/server';
import { db, validDevice } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { device } = (await req.json().catch(() => ({}))) as { device?: string };
  if (!Number.isInteger(id) || id <= 0 || !validDevice(device)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const { data, error } = await db().rpc('toggle_review_heart', { p_review: id, p_device: device });
  if (error) return NextResponse.json({ error: '하트를 저장하지 못했어요' }, { status: 500 });
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ liked: !!row?.liked, count: row?.cnt ?? 0 });
}
