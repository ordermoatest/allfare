// 신청기한 자유 텍스트 해석 ("상시신청", "2026.10.31까지", "2026. 3. 2. ~ 2026. 12. 31." 등)
export type DeadlineKind = 'always' | 'dated' | 'no_application' | 'unknown';

const ALWAYS = /상시|연중|수시|언제든/;
const NO_APP = /신청\s*불필요|신청절차가\s*없|자동\s*지급|직권/;
const DATE = /(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;

export function parseDeadline(text?: string | null): { kind: DeadlineKind; end: string | null } {
  const t = (text || '').trim();
  if (!t) return { kind: 'unknown', end: null };
  const dates: string[] = [];
  for (const m of Array.from(t.matchAll(DATE))) {
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d) {
      dates.push(`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
  if (dates.length) { dates.sort(); return { kind: 'dated', end: dates[dates.length - 1] }; }
  if (NO_APP.test(t)) return { kind: 'no_application', end: null };
  if (ALWAYS.test(t)) return { kind: 'always', end: null };
  return { kind: 'unknown', end: null };
}

/** 한국 시간 기준 오늘 YYYY-MM-DD */
export function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function daysLeft(end: string | null): number | null {
  if (!end) return null;
  const a = Date.parse(todayKST() + 'T00:00:00Z');
  const b = Date.parse(end + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

/** 카드에 보여줄 짧은 마감 표시 */
export function deadlineLabel(kind: string | null, end: string | null): { text: string; hot: boolean } {
  if (kind === 'dated' && end) {
    const n = daysLeft(end)!;
    if (n < 0) return { text: '마감', hot: false };
    if (n === 0) return { text: '오늘 마감', hot: true };
    return { text: `D-${n}`, hot: n <= 7 };
  }
  if (kind === 'always') return { text: '상시 신청', hot: false };
  if (kind === 'no_application') return { text: '신청 불필요', hot: false };
  return { text: '기한 확인', hot: false };
}
