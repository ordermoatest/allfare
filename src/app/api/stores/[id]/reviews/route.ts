import { NextRequest, NextResponse } from 'next/server';
import { db, validDevice } from '@/lib/server/supabase';
import { cleanReview } from '@/lib/server/review';

export const dynamic = 'force-dynamic';

const validStore = (id: string) => /^[a-f0-9]{24}$/.test(id);

// 후기 목록 (하트 많은 순 → 최근 수정 순) + 결제 확인 요약 + 내 후기
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validStore(params.id)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const device = req.nextUrl.searchParams.get('device') || '';
  const { data, error } = await db().from('store_reviews')
    .select('id,nick,body,heart_count,created_at,updated_at,edited,paid,rating,device_id')
    .eq('store_id', params.id).eq('hidden', false)
    .order('heart_count', { ascending: false }).order('updated_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: '후기를 불러오지 못했어요' }, { status: 500 });
  const rows = data || [];
  let liked = new Set<number>(), reported = new Set<number>();
  if (validDevice(device) && rows.length) {
    const ids = rows.map((r) => r.id);
    const [h, rp] = await Promise.all([
      db().from('review_hearts').select('review_id').eq('device_id', device).in('review_id', ids),
      db().from('review_reports').select('review_id').eq('device_id', device).in('review_id', ids),
    ]);
    liked = new Set((h.data || []).map((x) => x.review_id));
    reported = new Set((rp.data || []).map((x) => x.review_id));
  }
  // 숨겨진 내 후기도 '내 후기'로는 보여줌 (다시 쓰지 못하게)
  let mine = rows.find((r) => r.device_id === device) || null;
  if (!mine && validDevice(device)) {
    const { data: m } = await db().from('store_reviews').select('id,nick,body,heart_count,created_at,updated_at,edited,paid,rating,device_id,hidden')
      .eq('store_id', params.id).eq('device_id', device).maybeSingle();
    mine = m || null;
  }
  const ratings = rows.map((r) => r.rating).filter((x): x is number => typeof x === 'number');
  const out = (r: typeof rows[number] & { hidden?: boolean }) => ({
    id: r.id, nick: r.nick, body: r.body, hearts: r.heart_count, at: r.updated_at || r.created_at, edited: !!r.edited,
    paid: r.paid, rating: r.rating, liked: liked.has(r.id), reported: reported.has(r.id), mine: r.device_id === device, hidden: !!r.hidden,
  });
  return NextResponse.json({
    items: rows.map(out),
    mine: mine ? out(mine) : null,
    summary: {
      yes: rows.filter((r) => r.paid === true).length,
      no: rows.filter((r) => r.paid === false).length,
      avg: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      ratingCount: ratings.length,
    },
  });
}

// 후기 등록: 가게당 한 기기 1개, 30초 안 연속 등록·같은 내용 금지
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validStore(params.id)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const raw = (await req.json().catch(() => ({}))) as { body?: string; device?: string; paid?: boolean; rating?: number | null };
  if (!validDevice(raw.device)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  const c = cleanReview(raw);
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: 400 });
  const device = raw.device;

  const { data: exist } = await db().from('store_reviews').select('id').eq('store_id', params.id).eq('device_id', device).maybeSingle();
  if (exist) return NextResponse.json({ error: '이 가게에는 이미 후기를 썼어요. 내 후기를 수정해 주세요' }, { status: 409 });

  const { data: last } = await db().from('store_reviews').select('created_at,body').eq('device_id', device).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - Date.parse(last.created_at) < 30000) return NextResponse.json({ error: '후기는 30초에 한 번만 쓸 수 있어요. 잠시 후 다시 시도해 주세요' }, { status: 429 });
  const { count: same } = await db().from('store_reviews').select('id', { count: 'exact', head: true }).eq('device_id', device).eq('body', c.body);
  if ((same ?? 0) > 0) return NextResponse.json({ error: '같은 내용의 후기를 이미 썼어요' }, { status: 409 });
  const since = new Date(Date.now() - 86400000).toISOString();
  const { count } = await db().from('store_reviews').select('id', { count: 'exact', head: true }).eq('device_id', device).gte('created_at', since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: '후기는 하루 5개까지 쓸 수 있어요' }, { status: 429 });

  const nick = '이용자 ' + device.replace(/[^0-9a-f]/gi, '').slice(-4).toUpperCase();
  const { error } = await db().from('store_reviews').insert({ store_id: params.id, nick, body: c.body, paid: c.paid, rating: c.rating, device_id: device });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '이 가게에는 이미 후기를 썼어요' }, { status: 409 });
    return NextResponse.json({ error: '후기를 저장하지 못했어요' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
