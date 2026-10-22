// 내 조건과 혜택 조건 비교
// 정부24 지원조건 코드(JA) + 설명 문구에서 읽은 조건(hint: 자녀 나이·세대주·임신·본인 나이)
import { INC, Profile, TAGS, incomePercent, kidAges, manAge, medianOf, myCodes, yearsSince } from './profile';
import type { Hint } from './hints';

export type Match = 'ok' | 'check' | 'no';
/** fit 꼭 맞음 / maybe 받을 수도 있음(확인 필요) / all 누구나 / no 안 맞음 */
export type Tier = 'fit' | 'maybe' | 'all' | 'no';

const GENDER = ['JA0101', 'JA0102'];
const INCOME = ['JA0201', 'JA0202', 'JA0203', 'JA0204', 'JA0205'];
const LIFE = ['JA0301', 'JA0302', 'JA0303', 'JA0313', 'JA0314', 'JA0315', 'JA0316', 'JA0317', 'JA0318', 'JA0319', 'JA0320', 'JA0326', 'JA0327', 'JA0328', 'JA0329', 'JA0330'];
const LIFE_NONE = 'JA0322';
const HOUSE = ['JA0401', 'JA0402', 'JA0403', 'JA0404', 'JA0411', 'JA0412', 'JA0413', 'JA0414'];
const HOUSE_NONE = 'JA0410';
const INC_LIMIT = [50, 75, 100, 200, Infinity];

export const CODE_LABEL: Record<string, string> = {
  JA0101: '남성', JA0102: '여성',
  JA0201: '중위소득 50% 이하', JA0202: '중위소득 51~75%', JA0203: '중위소득 76~100%', JA0204: '중위소득 101~200%', JA0205: '중위소득 200% 초과',
  JA0301: '예비부모·난임', JA0302: '임산부', JA0303: '출산·입양', JA0313: '농업인', JA0314: '어업인', JA0315: '축산업인', JA0316: '임업인',
  JA0317: '초등학생', JA0318: '중학생', JA0319: '고등학생', JA0320: '대학생·대학원생', JA0326: '근로자·직장인', JA0327: '구직자·실업자',
  JA0328: '장애인', JA0329: '국가보훈대상자', JA0330: '질병·질환자',
  JA0401: '다문화가족', JA0402: '북한이탈주민', JA0403: '한부모·조손가정', JA0404: '1인 가구', JA0411: '다자녀가구', JA0412: '무주택세대', JA0413: '신규 전입', JA0414: '확대가족',
};

export type Cond = { lo: number; hi: number; codes: string[]; hint?: Hint | null };
export type Check = { label: string; status: 'ok' | 'no' | 'unknown'; detail: string; tip?: string; specific?: boolean; short?: string };

/** 자녀 정보로 알 수 있는데 해당이 안 되는 코드인지 (true면 확실히 아님) */
function knownFalse(code: string, p: Profile, saidNone: boolean): boolean {
  const kidCodes = ['JA0411', 'JA0303', 'JA0317', 'JA0318', 'JA0319'];
  if (kidCodes.includes(code)) return p.hasKids === 'N' || (p.hasKids === 'Y' && p.kids.length > 0);
  if (code === 'JA0302' || code === 'JA0301') return p.pregnant === 'N';
  if (code === 'JA0404') return p.hh > 1; // 가구원 수로 1인 가구 여부를 앎
  return saidNone;
}

/** 조건 하나하나 비교 */
export function explain(b: Cond, p: Profile): Check[] {
  const on = new Set(b.codes || []);
  const h = b.hint || {};
  const out: Check[] = [];
  const age = manAge(p.birth);
  const mine = myCodes(p);
  const saidNone = p.tags.includes('해당 없음');

  // 나이 (조건 코드 → 없으면 설명 문구)
  const [lo, hi, fromText] = b.lo > 0 || b.hi > 0 ? [b.lo, b.hi, false] : h.pa ? [h.pa[0], h.pa[1], true] : [0, 0, false];
  if (lo > 0 || hi > 0) {
    const range = hi ? `만 ${lo}~${hi}세` : `만 ${lo}세 이상`;
    const src = fromText ? ' (설명 기준)' : '';
    if (age === null) out.push({ label: '나이', status: 'unknown', detail: `${range} 대상${src}`, tip: '내 조건에 생년월일을 넣으면 확인할 수 있어요' });
    else if (lo && age < lo) {
      const y = +p.birth.slice(0, 4);
      out.push({ label: '나이', status: 'no', detail: `${range} 대상${src} · 현재 만 ${age}세`, tip: `${y + lo}년 ${+p.birth.slice(4, 6)}월 ${+p.birth.slice(6, 8)}일(만 ${lo}세)부터 신청할 수 있어요` });
    } else if (hi && age > hi) out.push({ label: '나이', status: 'no', detail: `${range} 대상${src} · 현재 만 ${age}세`, tip: '나이 조건은 바꿀 수 없어요. 비슷한 분야의 다른 혜택을 찾아보세요' });
    else {
      // 성인이면 거의 다 되는 나이 조건(만 18·19세 이상, 19~64세 같은 넓은 범위)은 '콕 집은' 조건으로 안 봄
      const broad = (!hi && lo <= 20) || (lo <= 20 && hi >= 64);
      out.push({ label: '나이', status: 'ok', detail: `${range} 대상${src} · 현재 만 ${age}세`, specific: !broad, short: range });
    }
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
    else out.push({ label: '소득', status: 'ok', detail: `${label} 대상 · ${cur}`, specific: true, short: label });
  }

  // 성별
  const g = GENDER.filter((c) => on.has(c));
  if (g.length === 1) {
    const want = g[0] === 'JA0101' ? 'M' : 'F';
    if (!p.gender) out.push({ label: '성별', status: 'unknown', detail: `${CODE_LABEL[g[0]]}만 대상`, tip: '내 조건에서 성별을 고르면 확인할 수 있어요' });
    else if (p.gender !== want) out.push({ label: '성별', status: 'no', detail: `${CODE_LABEL[g[0]]}만 대상` });
    else out.push({ label: '성별', status: 'ok', detail: `${CODE_LABEL[g[0]]}만 대상`, specific: true, short: CODE_LABEL[g[0]] });
  }

  // 생애·직업 / 가구 상황 (그룹 안은 '또는')
  for (const [group, none, name] of [[LIFE, LIFE_NONE, '대상'], [HOUSE, HOUSE_NONE, '가구']] as [string[], string, string][]) {
    const need = group.filter((c) => on.has(c));
    if (!need.length || on.has(none)) continue;
    const text = need.map((c) => CODE_LABEL[c]).join(' 또는 ');
    // 남성이 '가족 중 임신'으로 임산부 코드만 맞는 경우: 임산부 본인 신청일 수 있어 확인 필요
    const male = p.gender === 'M';
    const hit = need.filter((c) => mine.has(c) && !(male && c === 'JA0302'));
    if (!hit.length && male && need.includes('JA0302') && p.pregnant === 'Y') {
      out.push({ label: name, status: 'unknown', detail: `${text} 대상`, tip: '임산부 본인이 신청하는 혜택일 수 있어요. 배우자가 신청할 수 있는지 신청처에서 확인하세요' });
      continue;
    }
    if (hit.length) { out.push({ label: name, status: 'ok', detail: `${text} 대상`, specific: true, short: hit.map((c) => CODE_LABEL[c]).join('·') }); continue; }
    const selectable = TAGS.filter((t) => t.codes.some((c) => need.includes(c))).map((t) => `'${t.label}'`);
    const tip = selectable.length ? `해당되면 내 조건에서 ${selectable.join(', ')}을(를) 선택해 주세요`
      : need.some((c) => ['JA0411', 'JA0303', 'JA0317', 'JA0318', 'JA0319'].includes(c)) ? '내 조건에 자녀 생년월일을 넣으면 확인할 수 있어요'
      : need.includes('JA0302') || need.includes('JA0301') ? "가족 중 임신 중인 사람이 있으면 내 조건에서 '가족 중 임신'을 '예'로 골라주세요" : '해당 여부는 신청처에서 확인하세요';
    const sure = need.every((c) => knownFalse(c, p, saidNone));
    out.push({ label: name, status: sure ? 'no' : 'unknown', detail: `${text} 대상`, tip });
  }

  // 자녀 나이 (설명 문구) — 임신도 같이 적혀 있으면 둘 중 하나면 됨
  if (h.ca && !on.has('JA0411')) {
    const [a, z] = h.ca;
    const range = a === 0 ? `만 ${z}세 이하` : `만 ${a}~${z}세`;
    const ages = kidAges(p);
    const hitAge = ages.find((x) => x >= a && x <= z);
    const pregOk = h.preg && p.pregnant === 'Y';
    if (hitAge !== undefined) out.push({ label: '자녀', status: 'ok', detail: `${range} 자녀 대상 · 만 ${hitAge}세 자녀 해당`, specific: true, short: `만 ${hitAge}세 자녀` });
    else if (pregOk) out.push({ label: '자녀', status: 'ok', detail: `${range} 자녀 또는 임산부 대상 · 가족 중 임신`, specific: true, short: '가족 중 임신' });
    else if (p.hasKids === '') out.push({ label: '자녀', status: 'unknown', detail: `${range} 자녀 대상 (설명 기준)`, tip: '내 조건에 자녀 생년월일을 넣으면 확인할 수 있어요' });
    else out.push({ label: '자녀', status: 'no', detail: `${range} 자녀 대상 (설명 기준)`, tip: p.hasKids === 'N' ? '자녀가 있는 가정이 받는 혜택이에요' : `자녀 나이가 ${range}일 때 받을 수 있어요` });
  } else if (h.preg && !on.has('JA0302')) {
    const who = h.pf ? '임산부·임신 가구 대상 (설명 기준)' : '임산부 대상 (설명 기준)';
    if (p.pregnant === 'Y' && p.gender === 'M' && !h.pf) out.push({ label: '임신', status: 'unknown', detail: who, tip: '임산부 본인이 신청하는 혜택일 수 있어요. 배우자가 신청할 수 있는지 신청처에서 확인하세요' });
    else if (p.pregnant === 'Y') out.push({ label: '임신', status: 'ok', detail: who, specific: true, short: '가족 중 임신' });
    else if (p.pregnant === 'N') out.push({ label: '임신', status: 'no', detail: who });
    else out.push({ label: '임신', status: 'unknown', detail: who, tip: "가족 중 임신 중인 사람이 있으면 내 조건에서 '가족 중 임신'을 '예'로 골라주세요" });
  }

  // 신혼부부 (설명 문구)
  if (h.nw) {
    const want = `혼인 ${h.nw}년 이내${h.pre ? '·결혼 예정' : ''} 신혼부부 대상 (설명 기준)`;
    const yrs = yearsSince(p.marryDate);
    if (!p.marry) out.push({ label: '혼인', status: 'unknown', detail: want, tip: '내 조건에서 혼인 여부를 고르면 확인할 수 있어요' });
    else if (p.marry === 'S') out.push({ label: '혼인', status: 'no', detail: want, tip: h.pre ? '결혼 예정이면 신청할 수 있어요' : '혼인신고 후 신청할 수 있어요' });
    else if (p.marry === 'P') out.push(h.pre
      ? { label: '혼인', status: 'ok', detail: want + ' · 결혼 예정', specific: true, short: '결혼 예정' }
      : { label: '혼인', status: 'unknown', detail: want, tip: '혼인신고 후 신청할 수 있는 혜택일 수 있어요. 예비 신혼부부도 되는지 신청처에서 확인하세요' });
    else if (yrs === null) out.push({ label: '혼인', status: 'unknown', detail: want, tip: '내 조건에 혼인신고일을 넣으면 확인할 수 있어요' });
    else if (yrs < h.nw) out.push({ label: '혼인', status: 'ok', detail: `${want} · 혼인 ${yrs + 1}년차`, specific: true, short: `신혼 ${yrs + 1}년차` });
    else out.push({ label: '혼인', status: 'no', detail: `${want} · 혼인 ${yrs + 1}년차`, tip: `혼인신고일로부터 ${h.nw}년이 지나 신청 기간이 끝났어요` });
  }

  // 세대주 (설명 문구)
  if (h.head) {
    if (p.head === 'Y') out.push({ label: '세대주', status: 'ok', detail: '세대주 대상 (설명 기준)', specific: true, short: '세대주' });
    else if (p.head === 'N') out.push({ label: '세대주', status: 'no', detail: '세대주 대상 (설명 기준) · 현재 세대원', tip: '주민등록상 세대주만 신청할 수 있어요. 세대를 분리해 세대주가 되면 신청할 수 있어요' });
    else out.push({ label: '세대주', status: 'unknown', detail: '세대주 대상 (설명 기준)', tip: '내 조건에서 세대주 여부를 고르면 확인할 수 있어요' });
  }
  return out;
}

/** 4단 분류 */
export function tierOf(b: Cond, p: Profile): Tier {
  if (!p.set) return 'maybe';
  const cs = explain(b, p);
  if (cs.some((c) => c.status === 'no')) return 'no';
  if (cs.some((c) => c.status === 'unknown')) return 'maybe';
  if (cs.some((c) => c.specific)) return 'fit';
  const noInfo = (b.codes || []).length === 0 && !b.lo && !b.hi && !b.hint;
  return noInfo ? 'maybe' : 'all';
}

export function evaluate(b: Cond, p: Profile): Match {
  const t = tierOf(b, p);
  return t === 'no' ? 'no' : t === 'maybe' ? 'check' : 'ok';
}

/** 목록 카드용: 안 맞는 첫 이유 */
export function firstReason(b: Cond, p: Profile): string | null {
  const x = explain(b, p).find((c) => c.status === 'no');
  return x ? `${x.label}: ${x.detail}` : null;
}

/** 목록 카드용: 꼭 맞는 이유 */
export function fitReason(b: Cond, p: Profile): string {
  return explain(b, p).filter((c) => c.status === 'ok' && c.specific).map((c) => c.short || c.label).join(' · ');
}

/** 상세 화면용 조건 요약 (내 조건 입력 전) */
export function conditionSummary(b: Cond): string[] {
  const on = new Set(b.codes || []);
  const out: string[] = [];
  if (b.lo > 0 || b.hi > 0) out.push(b.hi ? `만 ${b.lo}~${b.hi}세` : `만 ${b.lo}세 이상`);
  const g = GENDER.filter((c) => on.has(c));
  if (g.length === 1) out.push(CODE_LABEL[g[0]] + '만');
  const inc = INCOME.filter((c) => on.has(c));
  if (inc.length > 0 && inc.length < INCOME.length) {
    // 연속된 구간(50% 이하~200% 이하)은 "중위소득 200% 이하"처럼 한 번에
    const idx = INCOME.map((c, i) => (on.has(c) ? i : -1)).filter((i) => i >= 0);
    const contiguous = idx[idx.length - 1] - idx[0] === idx.length - 1;
    if (contiguous && idx[0] === 0) out.push(`중위소득 ${INC_LIMIT[idx[idx.length - 1]]}% 이하`);
    else if (contiguous && idx[idx.length - 1] === INCOME.length - 1) out.push(`중위소득 ${INC_LIMIT[idx[0] - 1]}% 초과`);
    else out.push(inc.map((c) => CODE_LABEL[c]).join(', '));
  }
  for (const [group, none] of [[LIFE, LIFE_NONE], [HOUSE, HOUSE_NONE]] as [string[], string][]) {
    const need = group.filter((c) => on.has(c));
    if (need.length && !on.has(none)) out.push(need.map((c) => CODE_LABEL[c]).join(' 또는 '));
  }
  const h = b.hint;
  if (h?.ca) out.push(`${h.ca[0] === 0 ? `만 ${h.ca[1]}세 이하` : `만 ${h.ca[0]}~${h.ca[1]}세`} 자녀 (설명 기준)`);
  if (h?.head) out.push('세대주 (설명 기준)');
  if (h?.nw) out.push(`혼인 ${h.nw}년 이내 신혼부부${h.pre ? '·결혼 예정' : ''} (설명 기준)`);
  if (h?.preg && !h?.ca) out.push(h.pf ? '임산부·임신 가구 (설명 기준)' : '임산부 (설명 기준)');
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
