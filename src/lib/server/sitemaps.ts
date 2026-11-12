import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './supabase';
import { SITE } from '../site';
import { GUIDES } from '../guides';
import { NEWS } from '../news';
import { SGG, SIDO_SHORT } from '../regions';
import { todayKST } from '../deadline';

// 사이트맵을 세 묶음으로 나눔: 핵심(홈·가이드·소식·시도) / 지역 사용처 / 혜택 상세
type U = { loc: string; lastmod?: string; changefreq?: string; priority?: number };
const day = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function urlset(us: U[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${us.map((u) =>
    `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `<priority>${u.priority}</priority>` : ''}</url>`).join('\n')}\n</urlset>`;
}

export function coreUrls(): U[] {
  const latestNews = NEWS[0]?.date;
  const latestGuide = GUIDES.map((g) => g.updated).sort().pop();
  return [
    { loc: `${SITE}/`, lastmod: day(latestNews), changefreq: 'daily', priority: 1 },
    { loc: `${SITE}/guide`, lastmod: day(latestGuide), changefreq: 'weekly', priority: 0.9 },
    ...GUIDES.map((g) => ({ loc: `${SITE}/guide/${g.slug}`, lastmod: day(g.updated), changefreq: 'monthly', priority: 0.9 })),
    { loc: `${SITE}/news`, lastmod: day(latestNews), changefreq: 'weekly', priority: 0.8 },
    ...NEWS.map((n) => ({ loc: `${SITE}/news/${n.slug}`, lastmod: day(n.date), changefreq: 'monthly', priority: 0.8 })),
    { loc: `${SITE}/culture`, changefreq: 'weekly', priority: 0.8 },
    ...Object.keys(SGG).map((full) => ({ loc: `${SITE}/culture/${encodeURIComponent(SIDO_SHORT[full])}`, changefreq: 'weekly', priority: 0.7 })),
    { loc: `${SITE}/local`, changefreq: 'weekly', priority: 0.8 },
    ...Object.keys(SGG).map((full) => ({ loc: `${SITE}/local/${encodeURIComponent(SIDO_SHORT[full])}`, changefreq: 'weekly', priority: 0.7 })),
    { loc: `${SITE}/about`, changefreq: 'monthly', priority: 0.4 },
    { loc: `${SITE}/privacy`, changefreq: 'yearly', priority: 0.2 },
    { loc: `${SITE}/terms`, changefreq: 'yearly', priority: 0.2 },
  ];
}

export function cultureUrls(): U[] {
  return Object.entries(SGG).flatMap(([full, list]) => {
    const sh = encodeURIComponent(SIDO_SHORT[full]);
    return list.map((g) => ({ loc: `${SITE}/culture/${sh}/${encodeURIComponent(g)}`, changefreq: 'weekly', priority: 0.6 }));
  });
}

/** 동네 복지: 시·군·구별 혜택 페이지 */
export function localUrls(): U[] {
  return Object.entries(SGG).flatMap(([full, list]) => {
    const sh = encodeURIComponent(SIDO_SHORT[full]);
    return list.map((g) => ({ loc: `${SITE}/local/${sh}/${encodeURIComponent(g)}`, changefreq: 'weekly', priority: 0.7 }));
  });
}

/** 검색에 남길 혜택 상세 수. 나머지는 정부24와 내용이 겹쳐 noindex (2026-11 구글 색인 대량 제외 대응) */
export const INDEX_TOP = 300;

type BR = { id: string; source_updated: string | null; registered_at: string | null; like_count: number | null; views: number | null; scope: string | null };

/** 신청 가능한 혜택을 좋아요·조회 많은 순(같으면 전국 혜택 먼저)으로 상위 INDEX_TOP개 */
async function topRows(): Promise<BR[]> {
  const rows: BR[] = [];
  const today = todayKST();
  for (let from = 0; from < 45000; from += 1000) {
    const { data, error } = await db().from('benefits').select('id,source_updated,registered_at,like_count,views,scope')
      .eq('active', true).eq('person_ok', true).or(`deadline_end.is.null,deadline_end.gte.${today}`)
      .order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...(data as BR[]));
    if (data.length < 1000) break;
  }
  rows.sort((a, b) => (b.like_count || 0) - (a.like_count || 0) || (b.views || 0) - (a.views || 0)
    || (a.scope === 'local' ? 1 : 0) - (b.scope === 'local' ? 1 : 0) || a.id.localeCompare(b.id));
  return rows.slice(0, INDEX_TOP);
}

/** 검색에 남길 혜택 id 목록 (하루 캐시) */
export const indexedBenefitIds = unstable_cache(async () => (await topRows()).map((r) => r.id), ['indexed-benefits-v1'], { revalidate: 86400 });

/** 혜택 상세 사이트맵: 인기 상위 INDEX_TOP개만 */
export async function benefitUrls(): Promise<U[]> {
  return (await topRows()).map((r) => ({ loc: `${SITE}/benefit/${encodeURIComponent(r.id)}`, lastmod: day(r.source_updated || r.registered_at), changefreq: 'monthly', priority: 0.6 }));
}
