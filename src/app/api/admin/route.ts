import { NextRequest, NextResponse } from 'next/server';
import { db, isAdmin } from '@/lib/server/supabase';
import { geocodeStores, importStores, storeStats, syncBenefits } from '@/lib/server/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 관리자 기능 (헤더 x-admin-password 필요)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: '비밀번호가 맞지 않아요' }, { status: 401 });
  const { action, id } = (await req.json().catch(() => ({}))) as { action?: string; id?: number };

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
      const { data } = await db().from('store_reviews')
        .select('id,store_id,nick,body,heart_count,report_count,hidden,created_at,culture_stores(name)')
        .order('report_count', { ascending: false }).order('created_at', { ascending: false }).limit(100);
      return NextResponse.json({ items: data || [] });
    }
    case 'review-hide':
    case 'review-show': {
      if (!Number.isInteger(id)) break;
      await db().from('store_reviews').update({ hidden: action === 'review-hide' }).eq('id', id);
      return NextResponse.json({ ok: true });
    }
    case 'review-delete': {
      if (!Number.isInteger(id)) break;
      await db().from('store_reviews').delete().eq('id', id);
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: '알 수 없는 요청이에요' }, { status: 400 });
}
