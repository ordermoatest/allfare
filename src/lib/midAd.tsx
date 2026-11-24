import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import AdSlot from '@/components/AdSlot';

/** 글 본문 중간(두 번째 소제목 앞, 없으면 절반쯤)에 광고 자리를 끼워 넣어요 */
export function withMidAd(body: ReactNode, where: string): ReactNode {
  if (!isValidElement(body)) return body;
  const kids = Children.toArray((body as ReactElement<{ children?: ReactNode }>).props.children);
  if (kids.length < 6) return body; // 짧은 글엔 중간 광고 안 넣음
  const h2 = kids.map((k, i) => (isValidElement(k) && k.type === 'h2' ? i : -1)).filter((i) => i > 0);
  const at = h2.length >= 2 ? h2[1] : Math.floor(kids.length / 2);
  return <>{kids.slice(0, at)}<AdSlot where={`${where}_mid`} size="banner" />{kids.slice(at)}</>;
}
