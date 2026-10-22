import 'server-only';
import { db } from './supabase';
import { shortCategory } from '../categories';

export type BenefitDetail = {
  id: string; name: string; summary: string | null; category: string; supportType: string | null;
  target: string | null; criteria: string | null; content: string | null; how: string | null;
  deadlineText: string | null; deadlineKind: string | null; deadlineEnd: string | null;
  url: string | null; org: string | null; dept: string | null; receiver: string | null; phone: string | null;
  views: number; likes: number; lo: number; hi: number; codes: string[]; hint: Record<string, unknown> | null; active: boolean;
  rawCategory: string | null; scope: string | null; sido: string | null; sgg: string | null;
};
export type SimilarBenefit = { id: string; name: string; org: string | null; category: string };

export async function getBenefit(id: string): Promise<BenefitDetail | null> {
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return null;
  const { data: r } = await db().from('benefits').select('*').eq('id', id).maybeSingle();
  if (!r) return null;
  return {
    id: r.id, name: r.name, summary: r.summary, category: shortCategory(r.category), supportType: r.support_type,
    target: r.target, criteria: r.criteria, content: r.content, how: r.how,
    deadlineText: r.deadline_text, deadlineKind: r.deadline_kind, deadlineEnd: r.deadline_end,
    url: r.url, org: r.org, dept: r.dept, receiver: r.receiver, phone: r.phone,
    views: r.views || 0, likes: r.like_count || 0, lo: r.age_min || 0, hi: r.age_max || 0, codes: r.cond_codes || [], hint: r.hint || null, active: r.active,
    rawCategory: r.category || null, scope: r.scope || null, sido: r.sido || null, sgg: r.sgg || null,
  };
}

/** 비슷한 혜택: 같은 분야 중 전국 혜택 또는 같은 지역 혜택, 좋아요·조회 많은 순 */
export async function similarBenefits(b: BenefitDetail, n = 4): Promise<SimilarBenefit[]> {
  if (!b.rawCategory) return [];
  let q = db().from('benefits').select('id,name,org,category,like_count,views').eq('active', true).eq('person_ok', true)
    .eq('category', b.rawCategory).neq('id', b.id);
  q = b.sido ? q.or(`sido.is.null,sido.eq."${b.sido}"`) : q.is('sido', null);
  const { data } = await q.order('like_count', { ascending: false }).order('views', { ascending: false }).limit(n);
  return (data || []).map((r) => ({ id: r.id, name: r.name, org: r.org, category: shortCategory(r.category) }));
}
