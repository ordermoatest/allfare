import { NextRequest, NextResponse } from 'next/server';
import { db, validDevice } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

const validStore = (id: string) => /^[a-f0-9]{24}$/.test(id);

// 후기 목록 (하트 많은 순)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validStore(params.id)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const device = req.nextUrl.searchParams.get('device') || '';
  const { data, error } = await db().from('store_reviews')
    .select('id,nick,body,heart_count,created_at')
    .eq('store_id', params.id).eq('hidden', false)
    .order('heart_count', { ascending: false }).order('created_at', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: '후기를 불러오지 못했어요' }, { status: 500 });
  let liked = new Set<number>(), reported = new Set<number>();
  if (validDevice(device) && data?.length) {
    const ids = data.map((r) => r.id);
    const [h, rp] = await Promise.all([
      db().from('review_hearts').select('review_id').eq('device_id', device).in('review_id', ids),
      db().from('review_reports').select('review_id').eq('device_id', device).in('review_id', ids),
    ]);
    liked = new Set((h.data || []).map((x) => x.review_id));
    reported = new Set((rp.data || []).map((x) => x.review_id));
  }
  return NextResponse.json({
    items: (data || []).map((r) => ({ id: r.id, nick: r.nick, body: r.body, hearts: r.heart_count, at: r.created_at, liked: liked.has(r.id), reported: reported.has(r.id) })),
  });
}

const BAD = /(https?:\/\/|www\.|카톡|오픈채팅|텔레그램|010-?\d{3,4}-?\d{4})/i;

// 후기 등록 (기기당 하루 5개까지, 링크·연락처 금지)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validStore(params.id)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const { body, device } = (await req.json().catch(() => ({}))) as { body?: string; device?: string };
  const text = (body || '').trim().replace(/\s+/g, ' ');
  if (!validDevice(device)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  if (text.length < 5 || text.length > 200) return NextResponse.json({ error: '후기는 5~200자로 써주세요' }, { status: 400 });
  if (BAD.test(text)) return NextResponse.json({ error: '링크나 연락처는 후기에 넣을 수 없어요' }, { status: 400 });

  const since = new Date(Date.now() - 86400000).toISOString();
  const { count } = await db().from('store_reviews').select('id', { count: 'exact', head: true }).eq('device_id', device).gte('created_at', since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: '후기는 하루 5개까지 쓸 수 있어요' }, { status: 429 });

  const nick = '이용자 ' + device.replace(/[^0-9a-f]/gi, '').slice(-4).toUpperCase();
  const { error } = await db().from('store_reviews').insert({ store_id: params.id, nick, body: text, device_id: device });
  if (error) return NextResponse.json({ error: '후기를 저장하지 못했어요' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
