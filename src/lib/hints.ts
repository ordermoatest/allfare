// 혜택 설명 문구(서비스명·지원대상·선정기준)에서 조건 코드에 없는 조건을 읽어냄
// ca: 자녀 나이 범위, pa: 본인 나이 범위(조건 코드에 나이가 없을 때만), preg: 임신, head: 세대주
export type Hint = { ca?: [number, number]; pa?: [number, number]; preg?: 1; head?: 1 };

const NOT_KID = /아동복지|아동학대|아동보호|아동센터|지역아동|아동양육시설|청소년\S*시설|자녀\s*없는/g;
const KID = /자녀|아동|영유아|영아|유아|초등학생|중학생|고등학생|아이|출생아|신생아|미취학|어린이/;

const KEYWORDS: [RegExp, [number, number]][] = [
  [/신생아|출생아|출생\s*신고/, [0, 1]],
  [/영아/, [0, 2]],
  [/영유아|미취학/, [0, 6]],
  [/(^|[^영])유아/, [3, 6]],
  [/초등학생|초등학교/, [6, 12]],
  [/중학생|중학교/, [12, 15]],
  [/고등학생|고등학교/, [15, 18]],
  [/어린이/, [0, 12]],
  [/(^|[^청])아동/, [0, 17]],
];

export function parseHint(...parts: (string | null | undefined)[]): Hint | null {
  const raw = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ');
  const t = raw.replace(NOT_KID, ' ');
  const h: Hint = {};

  // 세대주만 대상 ("세대주 또는 세대원", "가구원"이 같이 있으면 제외)
  if (/세대주/.test(t) && !/세대원|가구원/.test(t)) h.head = 1;

  // 임신
  if (/임산부|임신부|임신\s*중|임신한|출산\s*예정/.test(t)) h.preg = 1;

  // 자녀 나이: 숫자로 적힌 범위가 있으면 그걸 우선
  let ca: [number, number] | null = null;
  const kidNum = [
    /(?:자녀|아동|아이|영유아|어린이)[^.,()]{0,12}?만\s*(\d{1,2})\s*세\s*(미만|이하)/,
    /만\s*(\d{1,2})\s*세\s*(미만|이하)(?:의)?\s*(?:자녀|아동|아이|영유아|어린이)/,
  ];
  for (const re of kidNum) {
    const m = t.match(re);
    if (m) { const n = +m[1]; ca = [0, m[2] === '미만' ? n - 1 : n]; break; }
  }
  if (!ca) {
    const m = t.match(/만?\s*(\d{1,2})\s*세?\s*[~∼\-]\s*만?\s*(\d{1,2})\s*세\s*(?:의)?\s*(?:자녀|아동|아이|영유아|어린이)/);
    if (m && +m[2] <= 18) ca = [+m[1], +m[2]];
  }
  if (!ca && KID.test(t)) {
    let lo = 99, hi = -1;
    for (const [re, [a, b]] of KEYWORDS) if (re.test(t)) { lo = Math.min(lo, a); hi = Math.max(hi, b); }
    if (hi >= 0) ca = [lo, hi];
  }
  if (ca && ca[1] >= 0 && ca[1] <= 18) h.ca = ca;

  // 본인 나이 (자녀 관련 문구가 아닐 때만)
  if (!KID.test(t)) {
    const r = t.match(/만\s*(\d{2})\s*세?\s*[~∼\-]\s*만?\s*(\d{2})\s*세/);
    const o = t.match(/만\s*(\d{2})\s*세\s*이상/);
    if (r && +r[1] >= 15 && +r[2] > +r[1]) h.pa = [+r[1], +r[2]];
    else if (o && +o[1] >= 19 && +o[1] <= 90) h.pa = [+o[1], 0];
  }

  return Object.keys(h).length ? h : null;
}
