// 정부24 지원조건(JA 코드)으로 내 조건 판정
// ok = 코드화된 조건을 모두 만족 / check = 정보 부족·조건 정보 없음 / no = 확실히 안 맞음
import { INC, Profile, TAGS, incomePercent, manAge } from './profile';

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
