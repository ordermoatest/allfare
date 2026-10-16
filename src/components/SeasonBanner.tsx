'use client';
import { useEffect, useState } from 'react';
import { IcChevron, IcX } from './icons';
import { track } from '@/lib/client';

type B = { id: string; tag: string; text: string; href: string };

/** 날짜(한국 시간)에 따라 자동으로 바뀌는 홈 상단 띠배너. 해당 기간이 아니면 안 보임 */
function pick(): B | null {
  const n = new Date(Date.now() + 9 * 3600000);
  const y = n.getUTCFullYear(), m = n.getUTCMonth() + 1;
  if (m === 10 || m === 11) return { id: `nuri-apply-${y}`, tag: '11/30 마감', text: '문화누리카드 신청하셨나요?', href: '/guide/culture-nuri-card' };
  if (m === 12) return { id: `nuri-end-${y}`, tag: '12/31 소멸', text: '문화누리카드 남은 잔액 쓰는 곳', href: '/guide/culture-nuri-year-end' };
  if (m === 1 || m === 2) return { id: `new-year-${y}`, tag: `${y} 새 혜택`, text: '올해 바뀐 정부 지원금 한눈에', href: '/news' };
  return null;
}

export default function SeasonBanner() {
  const [b, setB] = useState<B | null>(null);
  useEffect(() => {
    const x = pick();
    if (!x) return;
    const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    try { if (localStorage.getItem(`af-sb-${x.id}`) === day) return; } catch { /* */ }
    setB(x);
  }, []);
  if (!b) return null;
  const close = () => {
    try { localStorage.setItem(`af-sb-${b.id}`, new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)); } catch { /* */ }
    track('season_banner_close', { id: b.id });
    setB(null);
  };
  return (
    <div className="sbanner">
      <a href={b.href} onClick={() => track('season_banner', { id: b.id })}>
        <em>{b.tag}</em><span>{b.text}</span><IcChevron size={16} />
      </a>
      <button onClick={close} aria-label="오늘은 그만 보기"><IcX /></button>
    </div>
  );
}
