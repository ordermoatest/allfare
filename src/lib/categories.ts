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

export function shortCategory(raw?: string | null): string {
  if (!raw) return '기타';
  const key = raw.replace(/\s/g, '');
  return MAP.get(key) || MAP.get(raw) || raw;
}

export const CATEGORY_ORDER = ['전체', ...CATEGORY_LABELS.map(([, s]) => s), '기타'];
