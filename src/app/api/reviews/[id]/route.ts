import { NextRequest, NextResponse } from 'next/server';
import { db, validDevice } from '@/lib/server/supabase';
import { cleanReview } from '@/lib/server/review';

export const dynamic = 'force-dynamic';

async function own(id: number, device: string) {
  const { data } = await db().from('store_reviews').select('id,device_id').eq('id', id).maybeSingle();
  return data && data.device_id === device;
}

// 내 후기 수정 (쓴 기기에서만)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const raw = (await req.json().catch(() => ({}))) as { body?: string; device?: string; paid?: boolean; rating?: number | null };
  if (!Number.isInteger(id) || id <= 0 || !validDevice(raw.device)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  if (!(await own(id, raw.device))) return NextResponse.json({ error: '이 기기에서 쓴 후기만 고칠 수 있어요' }, { status: 403 });
  const c = cleanReview(raw);
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: 400 });
  const { error } = await db().from('store_reviews').update({ body: c.body, paid: c.paid, rating: c.rating, edited: true, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: '후기를 고치지 못했어요' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 내 후기 삭제 (쓴 기기에서만)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const device = req.nextUrl.searchParams.get('device') || '';
  if (!Number.isInteger(id) || id <= 0 || !validDevice(device)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  if (!(await own(id, device))) return NextResponse.json({ error: '이 기기에서 쓴 후기만 지울 수 있어요' }, { status: 403 });
  const { error } = await db().from('store_reviews').delete().eq('id', id);
  if (error) return NextResponse.json({ error: '후기를 지우지 못했어요' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
