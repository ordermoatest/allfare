// 내 조건 (로그인 없이 이 기기 브라우저에만 저장)

export type Profile = {
  birth: string;   // 생년월일 YYYYMMDD (숫자 8자리)
  sido: string;    // 시·도 정식명칭
  sgg: string;     // 시·군·구 (세종은 빈 값)
  hh: number;      // 가구원 수
  mi: string;      // 가구 월 소득(만원)
  inc: string;     // 중위소득 구간 (INC 중 하나, '' = 미입력)
  tags: string[];  // 해당하는 것
  gender: '' | 'M' | 'F';
  head: '' | 'Y' | 'N';      // 주민등록상 세대주 여부
  hasKids: '' | 'Y' | 'N';
  kids: string[];            // 자녀 생년월일 YYYYMMDD
  pregnant: '' | 'Y' | 'N';  // 가족 중 임신 (본인 또는 배우자)
  marry: '' | 'S' | 'P' | 'M'; // 미혼 / 결혼 예정 / 기혼
  marryDate: string;         // 혼인신고일 YYYYMMDD
  set: boolean;    // '이 조건으로 혜택 보기'를 눌렀는지
};

export const EMPTY_PROFILE: Profile = { birth: '', sido: '', sgg: '', hh: 1, mi: '', inc: '', tags: [], gender: '', head: '', hasKids: '', kids: [], pregnant: '', marry: '', marryDate: '', set: false };

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

/** YYYYMMDD → Date (잘못됐거나 미래 날짜면 null) */
export function parseYmd(v: string): Date | null {
  if (!/^\d{8}$/.test(v)) return null;
  const y = +v.slice(0, 4), m = +v.slice(4, 6), d = +v.slice(6, 8);
  const dt = new Date(y, m - 1, d);
  if (y < 1900 || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d || dt > new Date()) return null;
  return dt;
}
/** 입력 중인 숫자를 1988-05-23 모양으로 */
export function fmtYmd(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  return d.length > 6 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
}
/** 날짜부터 오늘까지 꽉 찬 햇수 (만 나이 계산과 같음) */
export function yearsSince(v: string): number | null {
  const dt = parseYmd(v);
  if (!dt) return null;
  const now = new Date();
  let a = now.getFullYear() - dt.getFullYear();
  if (now.getMonth() < dt.getMonth() || (now.getMonth() === dt.getMonth() && now.getDate() < dt.getDate())) a--;
  return a;
}
/** 생년월일 YYYYMMDD → 만 나이 */
export const manAge = yearsSince;

export function regionLabel(p: Profile): string {
  return [p.sido, p.sgg].filter(Boolean).join(' ');
}

// 해당하는 것 → 정부24 지원조건 코드 (다자녀·임신·자녀 학년은 자녀 정보로 자동 판단)
export const TAGS: { label: string; codes: string[] }[] = [
  { label: '구직 중', codes: ['JA0327'] },
  { label: '농어업인', codes: ['JA0313', 'JA0314', 'JA0315', 'JA0316'] },
  { label: '다문화', codes: ['JA0401'] },
  { label: '대학생', codes: ['JA0320'] },
  { label: '무주택', codes: ['JA0412'] },
  { label: '보훈대상', codes: ['JA0329'] },
  { label: '북한이탈주민', codes: ['JA0402'] },
  { label: '입양', codes: ['JA0303'] },
  { label: '장애인', codes: ['JA0328'] },
  { label: '직장인', codes: ['JA0326'] },
  { label: '질병·질환자', codes: ['JA0330'] },
  { label: '한부모·조손', codes: ['JA0403'] },
  { label: '해당 없음', codes: [] },
];

/** 자녀 생년월일 YYYYMMDD → 만 나이 */
export const kidAge = yearsSince;
export function kidAges(p: Profile): number[] {
  return p.hasKids === 'Y' ? p.kids.map(kidAge).filter((x): x is number => x !== null) : [];
}

/** 내가 고른 것 + 자녀 정보로 자동 판단한 조건 코드 */
export function myCodes(p: Profile): Set<string> {
  const s = new Set<string>();
  TAGS.forEach((t) => { if (p.tags.includes(t.label)) t.codes.forEach((c) => s.add(c)); });
  const ages = kidAges(p);
  if (ages.length >= 2) s.add('JA0411');
  if (p.hh === 1) s.add('JA0404'); // 가구원 1명이면 1인 가구
  if (p.pregnant === 'Y') { s.add('JA0302'); s.add('JA0301'); }
  if (ages.some((a) => a < 1)) s.add('JA0303');
  if (ages.some((a) => a >= 6 && a <= 12)) s.add('JA0317');
  if (ages.some((a) => a >= 12 && a <= 15)) s.add('JA0318');
  if (ages.some((a) => a >= 15 && a <= 18)) s.add('JA0319');
  return s;
}

// ---------- 브라우저 저장 ----------
const KEY = 'af-profile-v1';
function safeGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } }
function safeDel(k: string) { try { localStorage.removeItem(k); } catch { /* */ } }

export function loadProfile(): Profile {
  const raw = safeGet(KEY);
  if (!raw) return { ...EMPTY_PROFILE };
  try {
    const p: Profile = { ...EMPTY_PROFILE, ...JSON.parse(raw) };
    if (p.sido === '인천광역시' && p.sgg === '서구') p.sgg = '서해구'; // 2026.7 이름 변경
    // 예전 버전에서 고른 항목 옮기기
    p.tags = (p.tags || []).filter((t) => TAGS.some((x) => x.label === t));
    // 예전 형식(생년월일 6자리·자녀 연월 4자리)은 비워서 다시 입력받음
    if (!/^\d{8}$/.test(p.birth)) { p.birth = ''; p.set = false; }
    p.kids = Array.isArray(p.kids) ? p.kids.filter((k) => /^\d{8}$/.test(k)) : [];
    if (p.hasKids === 'Y' && !p.kids.length) p.hasKids = '';
    return p;
  } catch { return { ...EMPTY_PROFILE }; }
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
