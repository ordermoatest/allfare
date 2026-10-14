import { NextRequest, NextResponse } from 'next/server';
import { regionName, searchLocation } from '@/lib/server/kakao';

export const dynamic = 'force-dynamic';

// ?q=백석동  → 좌표 / ?lat=..&lng=.. → 동네 이름
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 50);
  try {
    if (q) {
      const r = await searchLocation(q);
      if (!r) return NextResponse.json({ error: '찾는 지역이 없어요. 동 이름이나 역 이름으로 다시 검색해 보세요' }, { status: 404 });
      return NextResponse.json(r, { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
    }
    const lat = Number(req.nextUrl.searchParams.get('lat'));
    const lng = Number(req.nextUrl.searchParams.get('lng'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
    const label = await regionName(lat, lng);
    return NextResponse.json({ label: label || '현재 위치' });
  } catch {
    return NextResponse.json({ error: '위치 검색에 실패했어요' }, { status: 500 });
  }
}
