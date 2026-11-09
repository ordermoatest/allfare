import 'server-only';
import { db } from './supabase';
import { shortCategory } from '../categories';
import { todayKST } from '../deadline';

// 동네 복지: 시·도/시·군·구에서 주는 혜택 (전국 공통 혜택은 빼고)
export type LocalItem = { id: string; name: string; summary: string | null; cat: string; org: string | null; dk: string | null; de: string | null; sgg: string | null };

/** 한 시·도의 지역 혜택 전부 (신청 끝난 것·개인이 못 받는 것 제외), 좋아요·조회 많은 순 */
export async function localRows(sido: string): Promise<LocalItem[]> {
  type R = { id: string; name: string; summary: string | null; category: string | null; org: string | null; deadline_kind: string | null; deadline_end: string | null; sgg: string | null; like_count: number | null; views: number | null };
  const rows: R[] = [];
  const today = todayKST();
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await db().from('benefits')
      .select('id,name,summary,category,org,deadline_kind,deadline_end,sgg,like_count,views')
      .eq('active', true).eq('person_ok', true).eq('sido', sido)
      .or(`deadline_end.is.null,deadline_end.gte.${today}`)
      .order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...(data as R[]));
    if (data.length < 1000) break;
  }
  rows.sort((a, b) => (b.like_count || 0) - (a.like_count || 0) || (b.views || 0) - (a.views || 0));
  return rows.map((r) => ({ id: r.id, name: r.name, summary: r.summary, cat: shortCategory(r.category), org: r.org, dk: r.deadline_kind, de: r.deadline_end, sgg: r.sgg }));
}

/** 분야별 개수 (많은 순) */
export function catCounts(items: LocalItem[]): { name: string; n: number }[] {
  const m = new Map<string, number>();
  items.forEach((x) => m.set(x.cat, (m.get(x.cat) || 0) + 1));
  return Array.from(m, ([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
}

/** 받침 따라 조사 고르기 ("서울특별시" + 와/과 → "서울특별시와") */
export function josa(w: string, pair: '와과' | '이가' | '은는'): string {
  const c = w.trim().slice(-1).charCodeAt(0);
  const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 > 0 : false;
  return w + (has ? pair[1] : pair[0]);
}
