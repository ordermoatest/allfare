'use client';
import { useEffect, useRef } from 'react';

// 애드센스 광고 자리. AD_SLOT이 비어 있으면 아무것도 안 그려요 (자리만 잡아둔 상태).
export const AD_CLIENT = 'ca-pub-5364478364167025';
export const AD_SLOT = '9364066617'; // 애드센스 → 광고 → 광고 단위 기준 → '올페어 본문'의 data-ad-slot 숫자

declare global { interface Window { adsbygoogle?: unknown[] } }

// size: banner = 가로 띠(높이 100px), mid = 중간(높이 250px), auto = 애드센스 자동
const SIZES = { banner: 100, mid: 250 } as const;

export default function AdSlot({ where, size = 'auto' }: { where: string; size?: 'banner' | 'mid' | 'auto' }) {
  const done = useRef(false);
  useEffect(() => {
    if (!AD_SLOT || done.current) return;
    done.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* 광고 차단 등 */ }
  }, []);
  if (!AD_SLOT) return null;
  return (
    <div className={`adwrap ${size}`} data-where={where}>
      <span className="adlabel">광고</span>
      {size === 'auto'
        ? <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={AD_CLIENT} data-ad-slot={AD_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
        // 크기를 CSS로 고정하면 애드센스가 그 안에 맞는 광고만 보여줘요 (format 속성은 빼야 함)
        : <ins className="adsbygoogle" style={{ display: 'inline-block', width: '100%', height: SIZES[size] }} data-ad-client={AD_CLIENT} data-ad-slot={AD_SLOT} />}
    </div>
  );
}
