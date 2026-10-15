import 'server-only';
import { db } from './supabase';
import { shortCategory } from '../categories';

export type BenefitDetail = {
  id: string; name: string; summary: string | null; category: string; supportType: string | null;
  target: string | null; criteria: string | null; content: string | null; how: string | null;
  deadlineText: string | null; deadlineKind: string | null; deadlineEnd: string | null;
  url: string | null; org: string | null; dept: string | null; receiver: string | null; phone: string | null;
  views: number; likes: number; lo: number; hi: number; codes: string[]; hint: Record<string, unknown> | null; active: boolean;
};

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
  };
}
