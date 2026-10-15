import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/supabase';
import { lastSync } from '@/lib/server/asof';

export const dynamic = 'force-dynamic';

// 내 주변 문화누리 가맹점 (최대 3km, 가까운 순)
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lng = Number(req.nextUrl.searchParams.get('lng'));
  const r = Math.min(3000, Math.max(200, Number(req.nextUrl.searchParams.get('r')) || 3000));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 32 || lat > 39.5 || lng < 124 || lng > 132) {
    return NextResponse.json({ error: '위치가 올바르지 않아요' }, { status: 400 });
  }
  const { data, error } = await db().rpc('nearby_stores', { p_lat: lat, p_lng: lng, p_radius: r, p_limit: 400 });
  if (error) return NextResponse.json({ error: '가맹점을 불러오지 못했어요' }, { status: 500 });
  // 근처에 없을 때: 아직 데이터 준비 중인지, 정말 없는지 구분
  let ready = true;
  if (!data?.length) {
    const { count } = await db().from('culture_stores').select('id', { count: 'exact', head: true }).eq('geo_status', 'ok');
    ready = (count ?? 0) > 1000;
  }
  return NextResponse.json({ items: data || [], ready, asOf: await lastSync('stores_import') }, { headers: { 'Cache-Control': ready ? 'public, s-maxage=600' : 'no-store' } });
}
