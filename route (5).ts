import { NextRequest, NextResponse } from 'next/server';
import { db, isAdmin } from '@/lib/server/supabase';
import { geocodeStores, importStores, storeStats, syncBenefits } from '@/lib/server/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 관리자 기능 (헤더 x-admin-password 필요)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: '비밀번호가 맞지 않아요' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: number; tab?: string; page?: number; q?: string; since?: string };
  const { action, id } = body;

  switch (action) {
    case 'stats': {
      const [benefits, stores, logs] = await Promise.all([
        db().from('benefits').select('id', { count: 'exact', head: true }).eq('active', true),
        storeStats(),
        db().from('sync_log').select('kind,started_at,ok,message,counts').order('started_at', { ascending: false }).limit(10),
      ]);
      return NextResponse.json({ benefits: benefits.count ?? 0, stores, logs: logs.data || [] });
    }
    case 'sync-benefits':
      return NextResponse.json(await syncBenefits());
    case 'import-stores':
      return NextResponse.json(await importStores());
    case 'geocode':
      return NextResponse.json(await geocodeStores(300, 45000));
    case 'retry-failed': {
      const { error } = await db().from('culture_stores').update({ geo_status: 'pending' }).eq('geo_status', 'fail');
      return NextResponse.json({ ok: !error });
    }
    case 'reviews': {
      // tab: reported(신고 들어옴) | recent(최근 7일) | hidden(숨김) | all(전체)
      const tab = String(body.tab || 'reported');
      const page = Math.max(0, Number(body.page) || 0);
      const q = String(body.q || '').replace(/[%,()*.:\\]/g, ' ').trim().slice(0, 30);
      const week = new Date(Date.now() - 7 * 86400000).toISOString();
      let qb = db().from('store_reviews')
        .select('id,store_id,nick,body,paid,rating,heart_count,report_count,hidden,edited,created_at,updated_at,culture_stores(name)', { count: 'exact' });
      if (tab === 'reported') qb = qb.gt('report_count', 0);
      else if (tab === 'recent') qb = qb.gte('created_at', week);
      else if (tab === 'hidden') qb = qb.eq('hidden', true);
      if (q) {
        const { data: st } = await db().from('culture_stores').select('id').ilike('name', `%${q}%`).limit(200);
        const ids = (st || []).map((x) => x.id);
        qb = ids.length ? qb.or(`body.ilike.%${q}%,store_id.in.(${ids.join(',')})`) : qb.ilike('body', `%${q}%`);
      }
      qb = tab === 'reported' ? qb.order('report_count', { ascending: false }).order('created_at', { ascending: false }) : qb.order('created_at', { ascending: false });
      const { data, count, error } = await qb.range(page * 20, page * 20 + 19);
      if (error) return NextResponse.json({ error: '후기를 불러오지 못했어요' }, { status: 500 });
      // 탭 배지 숫자
      const since = typeof body.since === 'string' && !Number.isNaN(Date.parse(body.since)) ? body.since : week;
      const [rep, hid, fresh] = await Promise.all([
        db().from('store_reviews').select('id', { count: 'exact', head: true }).gt('report_count', 0),
        db().from('store_reviews').select('id', { count: 'exact', head: true }).eq('hidden', true),
        db().from('store_reviews').select('id', { count: 'exact', head: true }).gt('created_at', since),
      ]);
      return NextResponse.json({ items: data || [], total: count ?? 0, counts: { reported: rep.count ?? 0, hidden: hid.count ?? 0, fresh: fresh.count ?? 0 } });
    }
    case 'review-clear': {
      // 문제없음: 신고 기록 지우고 다시 보이게
      if (!Number.isInteger(id)) break;
      const { error } = await db().rpc('clear_review_reports', { p_review: id });
      return NextResponse.json({ ok: !error, error: error ? '처리하지 못했어요' : undefined });
    }
    case 'review-hide':
    case 'review-show': {
      if (!Number.isInteger(id)) break;
      const { error } = await db().from('store_reviews').update({ hidden: action === 'review-hide' }).eq('id', id);
      return NextResponse.json({ ok: !error });
    }
    case 'review-delete': {
      if (!Number.isInteger(id)) break;
      const { error } = await db().from('store_reviews').delete().eq('id', id);
      return NextResponse.json({ ok: !error });
    }
  }
  return NextResponse.json({ error: '알 수 없는 요청이에요' }, { status: 400 });
}
