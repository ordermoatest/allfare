// 정부24 '서비스분야' → 화면에 보여줄 짧은 이름 (순서 = 배지 순서)
export const CATEGORY_LABELS: [string, string][] = [
  ['생활안정', '생활'],
  ['주거·자립', '주거'],
  ['보육·교육', '육아·교육'],
  ['임신·출산', '임신·출산'],
  ['보건·의료', '의료'],
  ['보호·돌봄', '돌봄'],
  ['고용·창업', '일자리'],
  ['문화·환경', '문화·환경'],
  ['농림축산어업', '농림어업'],
  ['행정·안전', '행정·안전'],
];
const MAP = new Map(CATEGORY_LABELS);

export function shortCategory(raw?: string | null, name?: string | null, summary?: string | null): string {
  if (!raw) return '기타';
  const key = raw.replace(/\s/g, '');
  const c = MAP.get(key) || MAP.get(raw) || raw;
  // 정부24 분야가 잘못 붙은 경우 보정: 노후·노인 대상인데 '보육·교육'으로 온 혜택은 '생활'로
  if (c === '육아·교육' && name) {
    const txt = `${name} ${summary || ''}`;
    if (/노후|노인|어르신|은퇴|중장년|고령/.test(name) && !/아동|청소년|학생|자녀|보육|유아|영아|어린이|학교/.test(txt)) return '생활';
  }
  return c;
}

/** 전국(중앙기관) 혜택이지만 실제로는 특정 지역 주민만 받는 혜택인지 (예: 발전소 주변지역 장학금) */
export function looksRegional(name?: string | null, summary?: string | null): boolean {
  const txt = `${name || ''} ${summary || ''}`.replace(/\s+/g, '');
  return /주변지역|인근지역|인접지역|관내(거주|주민|학생)|지역주민|발전소주변|댐주변|공항주변|원전주변/.test(txt);
}

export const CATEGORY_ORDER = ['전체', ...CATEGORY_LABELS.map(([, s]) => s), '기타'];
