import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/supabase';
import { SGG } from '@/lib/regions';
import { shortCategory } from '@/lib/categories';
import { todayKST } from '@/lib/deadline';

export const dynamic = 'force-dynamic';

const COLS = 'id,name,summary,category,org,deadline_kind,deadline_end,views,like_count,registered_at,age_min,age_max,cond_codes,hint,scope';

// 지역 기준 혜택 목록 (내 조건 판정·검색·정렬은 브라우저에서)
export async function GET(req: NextRequest) {
  const sido = req.nextUrl.searchParams.get('sido') || '';
  const sgg = req.nextUrl.searchParams.get('sgg') || '';
  const validSido = sido && sido in SGG;
  const validSgg = validSido && sgg && SGG[sido].includes(sgg);

  let region = 'scope.eq.national';
  if (validSido) {
    region += `,and(scope.eq.local,sido.eq."${sido}",sgg.is.null)`;
    if (validSgg) region += `,and(scope.eq.local,sido.eq."${sido}",sgg.eq."${sgg}")`;
  }

  try {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await db().from('benefits').select(COLS)
        .eq('active', true).eq('person_ok', true)
        .or(region)
        .or(`deadline_end.is.null,deadline_end.gte.${todayKST()}`)
        .order('id').range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    const items = rows.map((r) => ({
      id: r.id,
      n: r.name,
      s: typeof r.summary === 'string' ? r.summary.slice(0, 90) : '',
      c: shortCategory(r.category as string),
      o: r.org,
      dk: r.deadline_kind,
      de: r.deadline_end,
      v: r.views,
      l: r.like_count,
      r: typeof r.registered_at === 'string' ? r.registered_at.slice(0, 10) : null,
      lo: r.age_min,
      hi: r.age_max,
      k: r.cond_codes,
      h: r.hint || undefined,
      lc: r.scope === 'local' ? 1 : undefined,
    }));
    return NextResponse.json({ items, region: validSgg ? `${sido} ${sgg}` : validSido ? sido : '전국' }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '목록을 불러오지 못했어요' }, { status: 500 });
  }
}
