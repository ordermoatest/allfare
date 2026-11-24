// 정부24 원문 정리: 줄 앞 글머리 기호(○, ㅇ, □, - 등)를 지우고, 항목이 여러 개면 "• "로 통일
const BULLET = /^(?:[○ㅇ□■◦●▪▶►◎◇◆※]|-|·|\*)\s*/;
export function govText(t?: string | null): string {
  if (!t) return '';
  // 한 줄 안에 이어 붙은 항목(" ○ 대상 ... ○ 내용")은 줄을 나눔
  const s = t.replace(/\r/g, '').replace(/\s+(?=[○□■◦●▪]\s?\S)/g, '\n').replace(/\s+(?=ㅇ\s?[가-힣(])/g, '\n');
  const lines = s.split('\n').map((x) => x.trim()).filter(Boolean);
  const bulleted = lines.filter((x) => BULLET.test(x) && !x.startsWith('※')).length;
  return lines.map((x) => {
    if (x.startsWith('※')) return x; // 참고 문구는 그대로
    if (!BULLET.test(x)) return x;
    const body = x.replace(BULLET, '');
    return bulleted > 1 ? `• ${body}` : body;
  }).join('\n');
}

/** 검색 설명 문구 길이 맞추기: 짧으면 뒷문장을 붙이고, 길면 155자에서 자름 */
export function fitDesc(base: string, tail: string, min = 110, max = 155): string {
  let d = base.replace(/\s+/g, ' ').trim();
  if (d.length < min) d = d ? `${d.replace(/[.\s]+$/, '')}. ${tail}` : tail;
  return d.length > max ? `${d.slice(0, max - 1).trim()}…` : d;
}
