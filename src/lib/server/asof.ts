import { db } from './supabase';

// 데이터 기준일: 마지막으로 성공한 동기화 시각 (10분 캐시)
const cache: Record<string, { at: number; v: string | null }> = {};
export async function lastSync(kind: 'benefits' | 'stores_import'): Promise<string | null> {
  const c = cache[kind];
  if (c && Date.now() - c.at < 600000) return c.v;
  try {
    const { data } = await db().from('sync_log').select('started_at').eq('kind', kind).eq('ok', true).order('started_at', { ascending: false }).limit(1);
    const v = (data?.[0]?.started_at as string | undefined) ?? null;
    cache[kind] = { at: Date.now(), v };
    return v;
  } catch { return null; }
}
