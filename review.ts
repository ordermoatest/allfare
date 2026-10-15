import 'server-only';
import { ITEM_KEYS } from '../items';

const BAD = /(https?:\/\/|www\.|카톡|오픈채팅|텔레그램|010-?\d{3,4}-?\d{4})/i;

/** 후기 입력 검사 (등록·수정 공통) */
export function cleanReview(raw: { body?: string; paid?: boolean; rating?: number | null; items?: unknown }): { body: string; paid: boolean; rating: number | null; items: string[] } | { error: string } {
  const body = (raw.body || '').trim().replace(/\s+/g, ' ');
  if (typeof raw.paid !== 'boolean') return { error: "문화누리카드 결제가 됐는지 '결제 됐어요' 또는 '결제 안 됐어요'를 골라주세요" };
  if (body.length < 5 || body.length > 200) return { error: '후기는 5~200자로 써주세요' };
  if (BAD.test(body)) return { error: '링크나 연락처는 후기에 넣을 수 없어요' };
  const r = raw.rating;
  const rating = r === null || r === undefined ? null : Number.isInteger(r) && r >= 1 && r <= 5 ? r : NaN;
  if (Number.isNaN(rating)) return { error: '별점은 1~5점으로 골라주세요' };
  const items = Array.isArray(raw.items) ? Array.from(new Set(raw.items.filter((x): x is string => typeof x === 'string' && ITEM_KEYS.includes(x)))).slice(0, 8) : [];
  return { body, paid: raw.paid, rating: rating as number | null, items };
}
