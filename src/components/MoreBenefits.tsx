'use client';
import { useEffect, useState } from 'react';
import { IcGift } from './icons';
import { track } from '@/lib/client';
import { loadProfile } from '@/lib/profile';

/**
 * 다른 혜택 둘러보기 유도 카드 (문화누리·가이드·소식 끝)
 * onGo가 있으면 앱 안에서 탭 이동, 없으면 주소로 이동
 */
export default function MoreBenefits({ from, onGo }: { from: string; onGo?: (hasProfile: boolean) => void }) {
  const [has, setHas] = useState(false);
  useEffect(() => { try { setHas(loadProfile().set); } catch { /* */ } }, []);
  const label = has ? '내 혜택 보기' : '내 조건 넣고 확인하기';
  const click = (e: React.MouseEvent) => {
    track('more_benefits', { from, has: has ? 1 : 0 });
    if (onGo) { e.preventDefault(); onGo(has); }
  };
  return (
    <a className="morebn" href={has ? '/' : '/?tab=my'} onClick={click}>
      <span className="mbic" aria-hidden><IcGift size={20} /></span>
      <span className="mbtx"><b>혹시 놓친 다른 혜택은 없을까요?</b><small>청년·어르신·지역 지원금까지, 내 조건에 맞는 혜택을 1분 만에 확인해 보세요</small><em>{label} ›</em></span>
    </a>
  );
}
