import type { MetadataRoute } from 'next';
import { db } from '@/lib/server/supabase';
import { SITE } from '@/lib/site';

export const revalidate = 86400; // 하루 한 번 새로 만듦

// 구글이 혜택 상세 페이지를 모두 찾아갈 수 있게 주소 목록 제공
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  const rows: { id: string; synced_at: string | null }[] = [];
  try {
    for (let from = 0; from < 45000; from += 1000) {
      const { data, error } = await db().from('benefits').select('id,synced_at').eq('active', true).order('id').range(from, from + 999);
      if (error || !data?.length) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
  } catch { /* DB 연결 실패 시 기본 주소만 */ }
  return [
    ...base,
    ...rows.map((r) => ({ url: `${SITE}/benefit/${encodeURIComponent(r.id)}`, lastModified: r.synced_at ? new Date(r.synced_at) : now, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
