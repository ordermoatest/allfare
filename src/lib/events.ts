// PC 왼쪽 '놓치면 안 되는 일정' (지난 일정은 자동으로 빠져요)
// date: 정확한 날짜(YYYY-MM-DD) / month: 날짜가 안 정해졌으면 '2026-12'처럼 월만
export type Ev = { date?: string; month?: string; title: string; sub: string; slug: string };

export const EVENTS: Ev[] = [
  { date: '2026-10-25', title: '작년 등유·LPG 추가지원 잔액 소멸', sub: '에너지바우처 추가지원 카드 잔액', slug: 'energy-voucher' },
  { date: '2026-11-30', title: '문화누리카드 신청 마감', sub: '1인 15만원 · 주민센터·누리집', slug: 'culture-nuri-card' },
  { date: '2026-12-01', title: '근로·자녀장려금 기한 후 신청 마감', sub: '홈택스·손택스, 금액의 95%', slug: 'work-incentive' },
  { date: '2026-11-16', title: '청년미래적금 2차 계좌 개설 시작', sub: '11.16~27 · 심사 통과자만', slug: 'youth-future-savings' },
  { date: '2026-12-31', title: '에너지바우처 신청 마감', sub: '복지로·주민센터', slug: 'energy-voucher' },
  { date: '2026-12-31', title: '문화누리카드 잔액 소멸', sub: '남은 금액은 다음 해로 안 넘어가요', slug: 'culture-nuri-year-end' },
];

const kstToday = () => { const n = new Date(Date.now() + 9 * 3600000); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()); };

/** 오늘 기준으로 남은 일정만, 가까운 순 */
export function upcoming(limit = 5) {
  const today = kstToday();
  return EVENTS.map((e) => {
    if (e.date) {
      const [y, m, d] = e.date.split('-').map(Number);
      const t = Date.UTC(y, m - 1, d);
      const dd = Math.round((t - today) / 86400000);
      return { ...e, sort: t, label: `${m}.${String(d).padStart(2, '0')}`, dday: dd === 0 ? 'D-DAY' : `D-${dd}`, hot: dd <= 50, past: dd < 0 };
    }
    const [y, m] = (e.month || '').split('-').map(Number);
    const end = Date.UTC(y, m, 0);
    return { ...e, sort: Date.UTC(y, m - 1, 15), label: `${m}월`, dday: '예정', hot: false, past: end < today };
  }).filter((e) => !e.past).sort((a, b) => a.sort - b.sort).slice(0, limit);
}
