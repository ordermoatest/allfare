import type { Hint } from './hints';
/** 혜택 목록 한 줄 (API /api/benefits 의 짧은 키) */
export type BItem = {
  id: string; n: string; s: string; c: string; o: string | null;
  dk: string | null; de: string | null; v: number; l: number; r: string | null;
  lo: number; hi: number; k: string[]; h?: Hint; lc?: 1;
};

export type Store = {
  id: string; name: string; category: string | null; address: string | null;
  lat: number; lng: number; phone: string | null; place_url: string | null;
  distance: number; review_count: number;
  paid_yes?: number; paid_no?: number; rating_avg?: number | null; no_items?: string[];
};

export type Place = { lat: number; lng: number; label: string; mode: 'gps' | 'search' | 'home' };

export const km = (d: number) => (d < 1000 ? `${d}m` : `${(d / 1000).toFixed(1)}km`);

/** 결제 확인 요약 한 줄: "결제 확인 3명 · ★4.3" */
export function paidLine(yes?: number, no?: number, avg?: number | null) {
  const parts: string[] = [];
  if (yes) parts.push(`결제 확인 ${yes}명`);
  if (avg) parts.push(`★${avg.toFixed(1)}`);
  return { text: parts.join(' · '), warn: (no || 0) > 0 ? `결제 안 됨 제보 ${no}` : '' };
}

/** 기준일 표시: '10월 16일' (한국 시간) */
export function fmtAsOf(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const k = new Date(d.getTime() + 9 * 3600000);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일`;
}
