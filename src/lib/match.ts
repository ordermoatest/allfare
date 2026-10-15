// 정부24 지원조건(JA 코드)으로 내 조건 판정
// ok = 코드화된 조건을 모두 만족 / check = 정보 부족·조건 정보 없음 / no = 확실히 안 맞음
import { INC, Profile, TAGS, incomePercent, manAge, medianOf } from './profile';

export type Match = 'ok' | 'check' | 'no';

const GENDER = ['JA0101', 'JA0102'];
const INCOME = ['JA0201', 'JA0202', 'JA0203', 'JA0204', 'JA0205'];
const LIFE = ['JA0301', 'JA0302', 'JA0303', 'JA0313', 'JA0314', 'JA0315', 'JA0316', 'JA0317', 'JA0318', 'JA0319', 'JA0320', 'JA0326', 'JA0327', 'JA0328', 'JA0329', 'JA0330'];
const LIFE_NONE = 'JA0322';
const HOUSE = ['JA0401', 'JA0402', 'JA0403', 'JA0404', 'JA0411', 'JA0412', 'JA0413', 'JA0414'];
const HOUSE_NONE = 'JA0410';

export const CODE_LABEL: Record<string, string> = {
  JA0101: '남성', JA0102: '여성',
  JA0201: '중위소득 50% 이하', JA0202: '중위소득 51~75%', JA0203: '중위소득 76~100%', JA0204: '중위소득 101~200%', JA0205: '중위소득 200% 초과',
  JA0301: '예비부모·난임', JA0302: '임산부', JA0303: '출산·입양', JA0313: '농업인', JA0314: '어업인', JA0315: '축산업인', JA0316: '임업인',
  JA0317: '초등학생', JA0318: '중학생', JA0319: '고등학생', JA0320: '대학생·대학원생', JA0326: '근로자·직장인', JA0327: '구직자·실업자',
  JA0328: '장애인', JA0329: '국가보훈대상자', JA0330: '질병·질환자',
  JA0401: '다문화가족', JA0402: '북한이탈주민', JA0403: '한부모·조손가정', JA0404: '1인 가구', JA0411: '다자녀가구', JA0412: '무주택세대', JA0413: '신규 전입', JA0414: '확대가족',
};

type Cond = { lo: number; hi: number; codes: string[] };

export function evaluate(b: Cond, p: Profile): Match {
  if (!p.set) return 'check';
  const on = new Set(b.codes || []);
  let missing = false;

  // 성별: 한쪽만 켜져 있으면 성별 제한 → 성별은 받지 않으므로 '확인 필요'
  const g = GENDER.filter((c) => on.has(c));
  if (g.length === 1) missing = true;

  // 나이
  if (b.lo > 0 || b.hi > 0) {
    const age = manAge(p.birth);
    if (age === null) missing = true;
    else if ((b.lo && age < b.lo) || (b.hi && age > b.hi)) return 'no';
  }

  // 소득
  const inc = INCOME.filter((c) => on.has(c));
  if (inc.length > 0 && inc.length < INCOME.length) {
    let idx = INC.indexOf(p.inc as (typeof INC)[number]);
    const pct = incomePercent(p);
    if (pct !== null) idx = pct <= 50 ? 0 : pct <= 75 ? 1 : pct <= 100 ? 2 : pct <= 200 ? 3 : 4;
    if (idx < 0 || idx > 4) missing = true;
    else if (!on.has(INCOME[idx])) return 'no';
  }

  // 생애·직업 / 가구 상황 (그룹 안은 '또는')
  // 사람들이 해당 항목을 다 고르지 않는 경우가 많아서, 안 골랐다고 바로 '안 맞음'으로 숨기지 않고
  // '해당 없음'을 직접 고른 경우에만 '안 맞음'으로 본다
  const myCodes = new Set(TAGS.filter((t) => t.code && p.tags.includes(t.label)).map((t) => t.code!));
  const saidNone = p.tags.includes('해당 없음');
  for (const [group, none] of [[LIFE, LIFE_NONE], [HOUSE, HOUSE_NONE]] as [string[], string][]) {
    const need = group.filter((c) => on.has(c));
    if (!need.length || on.has(none)) continue;
    if (need.some((c) => myCodes.has(c))) continue;
    if (saidNone) return 'no';
    missing = true;
  }

  if (missing) return 'check';
  if (on.size === 0 && b.lo === 0 && b.hi === 0) return 'check'; // 조건 정보 자체가 없음
  return 'ok';
}

export type Check = { label: string; status: 'ok' | 'no' | 'unknown'; detail: string; tip?: string };

const INC_LIMIT = [50, 75, 100, 200, Infinity];

/** 내 조건과 하나씩 비교: 왜 안 맞는지, 어떻게 되면 받을 수 있는지 */
export function explain(b: Cond, p: Profile): Check[] {
  const on = new Set(b.codes || []);
  const out: Check[] = [];

  // 나이
  if (b.lo > 0 || b.hi > 0) {
    const range = b.hi ? `만 ${b.lo}~${b.hi}세` : `만 ${b.lo}세 이상`;
    const age = manAge(p.birth);
    if (age === null) out.push({ label: '나이', status: 'unknown', detail: `${range} 대상`, tip: '내 조건에 주민등록번호 앞 6자리를 넣으면 확인할 수 있어요' });
    else if (b.lo && age < b.lo) {
      const yy = +p.birth.slice(0, 2), y = (yy > new Date().getFullYear() % 100 ? 1900 : 2000) + yy;
      out.push({ label: '나이', status: 'no', detail: `${range} 대상 · 현재 만 ${age}세`, tip: `${y + b.lo}년 ${+p.birth.slice(2, 4)}월 ${+p.birth.slice(4, 6)}일(만 ${b.lo}세)부터 신청할 수 있어요` });
    } else if (b.hi && age > b.hi) out.push({ label: '나이', status: 'no', detail: `${range} 대상 · 현재 만 ${age}세`, tip: '나이 조건은 바꿀 수 없어요. 비슷한 분야의 다른 혜택을 찾아보세요' });
    else out.push({ label: '나이', status: 'ok', detail: `${range} 대상 · 현재 만 ${age}세` });
  }

  // 소득
  const inc = INCOME.filter((c) => on.has(c));
  if (inc.length > 0 && inc.length < INCOME.length) {
    const allowed = INCOME.map((c, i) => (on.has(c) ? i : -1)).filter((i) => i >= 0);
    const maxPct = INC_LIMIT[Math.max(...allowed)];
    const minIdx = Math.min(...allowed);
    const label = maxPct === Infinity ? `중위소득 ${[0, 50, 75, 100, 200][minIdx]}% 초과` : minIdx === 0 ? `중위소득 ${maxPct}% 이하` : inc.map((c) => CODE_LABEL[c].replace('중위소득 ', '')).join(', ');
    const pct = incomePercent(p);
    let idx = INC.indexOf(p.inc as (typeof INC)[number]);
    if (pct !== null) idx = pct <= 50 ? 0 : pct <= 75 ? 1 : pct <= 100 ? 2 : pct <= 200 ? 3 : 4;
    const cur = pct !== null ? `현재 약 ${pct}%` : idx >= 0 && idx < 5 ? `현재 ${INC[idx]}` : '';
    const limitWon = maxPct !== Infinity ? Math.floor((medianOf(p.hh) * maxPct) / 100 / 10000) : null;
    if (idx < 0 || idx > 4) out.push({ label: '소득', status: 'unknown', detail: `${label} 대상`, tip: limitWon ? `${p.hh}인 가구는 월 소득 약 ${limitWon.toLocaleString()}만원 이하면 해당돼요` : '내 조건에 가구 소득을 넣으면 확인할 수 있어요' });
    else if (!on.has(INCOME[idx])) out.push({ label: '소득', status: 'no', detail: `${label} 대상 · ${cur}`, tip: limitWon ? `${p.hh}인 가구 기준 월 소득이 약 ${limitWon.toLocaleString()}만원 이하면 받을 수 있어요. 실제 심사는 재산을 포함한 '소득인정액'으로 해요` : undefined });
    else out.push({ label: '소득', status: 'ok', detail: `${label} 대상 · ${cur}` });
  }

  // 성별
  const g = GENDER.filter((c) => on.has(c));
  if (g.length === 1) out.push({ label: '성별', status: 'unknown', detail: `${CODE_LABEL[g[0]]}만 대상`, tip: '성별 조건은 신청처에서 확인하세요' });

  // 상황
  const myCodes = new Set(TAGS.filter((t) => t.code && p.tags.includes(t.label)).map((t) => t.code!));
  const saidNone = p.tags.includes('해당 없음');
  for (const [group, none, name] of [[LIFE, LIFE_NONE, '대상'], [HOUSE, HOUSE_NONE, '가구']] as [string[], string, string][]) {
    const need = group.filter((c) => on.has(c));
    if (!need.length || on.has(none)) continue;
    const text = need.map((c) => CODE_LABEL[c]).join(' 또는 ');
    const selectable = TAGS.filter((t) => t.code && need.includes(t.code)).map((t) => `'${t.label}'`);
    const tip = selectable.length ? `해당되면 내 조건에서 ${selectable.join(', ')}을(를) 선택해 주세요` : '해당 여부는 신청처에서 확인하세요';
    if (need.some((c) => myCodes.has(c))) out.push({ label: name, status: 'ok', detail: `${text} 대상` });
    else out.push({ label: name, status: saidNone ? 'no' : 'unknown', detail: `${text} 대상`, tip });
  }
  return out;
}

/** 목록 카드용: 안 맞는 첫 번째 이유 */
export function firstReason(b: Cond, p: Profile): string | null {
  const x = explain(b, p).find((c) => c.status === 'no');
  return x ? `${x.label}: ${x.detail}` : null;
}

/** 상세 화면용 조건 요약 */
export function conditionSummary(b: Cond): string[] {
  const on = new Set(b.codes || []);
  const out: string[] = [];
  if (b.lo > 0 || b.hi > 0) out.push(b.hi ? `만 ${b.lo}~${b.hi}세` : `만 ${b.lo}세 이상`);
  const g = GENDER.filter((c) => on.has(c));
  if (g.length === 1) out.push(CODE_LABEL[g[0]] + '만');
  const inc = INCOME.filter((c) => on.has(c));
  if (inc.length > 0 && inc.length < INCOME.length) out.push(inc.map((c) => CODE_LABEL[c]).join(', '));
  for (const [group, none] of [[LIFE, LIFE_NONE], [HOUSE, HOUSE_NONE]] as [string[], string][]) {
    const need = group.filter((c) => on.has(c));
    if (need.length && !on.has(none)) out.push(need.map((c) => CODE_LABEL[c]).join(' 또는 '));
  }
  return out;
}

/** 동기화 때: 개인·가구가 받을 수 없는(법인·소상공인 전용) 혜택인지 */
export function isPersonService(codes: string[], userType?: string | null): boolean {
  const on = new Set(codes);
  const person = [...GENDER, ...INCOME, ...LIFE, LIFE_NONE, ...HOUSE, HOUSE_NONE].some((c) => on.has(c));
  const bizOrOrg = Array.from(on).some((c) => /^JA(11\d{2}|2\d{3})$/.test(c));
  if (bizOrOrg && !person) return false;
  if (userType && !/개인|가구/.test(userType) && /(법인|시설|단체|소상공인)/.test(userType)) return false;
  return true;
}
