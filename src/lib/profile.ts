// 내 조건 (로그인 없이 이 기기 브라우저에만 저장)

export type Profile = {
  birth: string;   // 주민등록번호 앞 6자리 YYMMDD
  sido: string;    // 시·도 정식명칭
  sgg: string;     // 시·군·구 (세종은 빈 값)
  hh: number;      // 가구원 수
  mi: string;      // 가구 월 소득(만원)
  inc: string;     // 중위소득 구간 (INC 중 하나, '' = 미입력)
  tags: string[];  // 해당하는 것
  set: boolean;    // '이 조건으로 혜택 보기'를 눌렀는지
};

export const EMPTY_PROFILE: Profile = { birth: '', sido: '', sgg: '', hh: 1, mi: '', inc: '', tags: [], set: false };

export const INC = ['50% 이하', '51~75%', '76~100%', '101~200%', '200% 초과', '잘 모름'] as const;

// 2026년 기준 중위소득 (보건복지부 고시, 월 원)
const MED = [0, 2564238, 4199292, 5359036, 6494738, 7556719, 8555952];
export function medianOf(n: number): number {
  return n <= 6 ? MED[Math.max(1, n)] : MED[6] + (MED[6] - MED[5]) * (n - 6);
}
export function incomePercent(p: Pick<Profile, 'mi' | 'hh'>): number | null {
  const m = parseInt(p.mi, 10);
  if (!m) return null;
  return Math.round(((m * 10000) / medianOf(p.hh)) * 100);
}
export function bracketOf(pct: number): string {
  return pct <= 50 ? INC[0] : pct <= 75 ? INC[1] : pct <= 100 ? INC[2] : pct <= 200 ? INC[3] : INC[4];
}

/** YYMMDD → 만 나이. 잘못된 날짜면 null */
export function manAge(b: string): number | null {
  if (!/^\d{6}$/.test(b)) return null;
  const now = new Date();
  const yy = +b.slice(0, 2);
  const y = (yy > now.getFullYear() % 100 ? 1900 : 2000) + yy;
  const m = +b.slice(2, 4), d = +b.slice(4, 6);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d || dt > now) return null;
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a;
}

export function regionLabel(p: Profile): string {
  return [p.sido, p.sgg].filter(Boolean).join(' ');
}

// 해당하는 것 → 정부24 지원조건 코드
export const TAGS: { label: string; code: string | null }[] = [
  { label: '직장인', code: 'JA0326' },
  { label: '구직 중', code: 'JA0327' },
  { label: '대학생', code: 'JA0320' },
  { label: '임산부', code: 'JA0302' },
  { label: '출산·입양', code: 'JA0303' },
  { label: '장애인', code: 'JA0328' },
  { label: '보훈대상', code: 'JA0329' },
  { label: '무주택', code: 'JA0412' },
  { label: '1인 가구', code: 'JA0404' },
  { label: '한부모·조손', code: 'JA0403' },
  { label: '다자녀', code: 'JA0411' },
  { label: '다문화', code: 'JA0401' },
  { label: '해당 없음', code: null },
];

// ---------- 브라우저 저장 ----------
const KEY = 'af-profile-v1';
function safeGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } }
function safeDel(k: string) { try { localStorage.removeItem(k); } catch { /* */ } }

export function loadProfile(): Profile {
  const raw = safeGet(KEY);
  if (!raw) return { ...EMPTY_PROFILE };
  try { return { ...EMPTY_PROFILE, ...JSON.parse(raw) }; } catch { return { ...EMPTY_PROFILE }; }
}
export function saveProfile(p: Profile) { safeSet(KEY, JSON.stringify(p)); }
export function clearProfile() { safeDel(KEY); }

export function loadNum(k: string, def: number): number { const v = Number(safeGet(k)); return Number.isFinite(v) && safeGet(k) !== null ? v : def; }
export function saveNum(k: string, v: number) { safeSet(k, String(v)); }

export function loadSet(k: string): Record<string, true> {
  try { return JSON.parse(safeGet(k) || '{}'); } catch { return {}; }
}
export function saveSet(k: string, v: Record<string, true>) { safeSet(k, JSON.stringify(v)); }

/** 좋아요·후기 중복 방지용 기기 ID (개인정보 아님, 무작위 값) */
export function deviceId(): string {
  let id = safeGet('af-device');
  if (!id) {
    id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
    safeSet('af-device', id);
  }
  return id;
}
