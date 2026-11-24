'use client';
import { useEffect, useRef } from 'react';

// 애드센스 광고 자리. AD_SLOT이 비어 있으면 아무것도 안 그려요 (자리만 잡아둔 상태).
export const AD_CLIENT = 'ca-pub-5364478364167025';
export const AD_SLOT = ''; // 애드센스 → 광고 → 광고 단위 기준 → '올페어 본문'의 data-ad-slot 숫자

declare global { interface Window { adsbygoogle?: unknown[] } }

export default function AdSlot({ where }: { where: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (!AD_SLOT || done.current) return;
    done.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* 광고 차단 등 */ }
  }, []);
  if (!AD_SLOT) return null;
  return (
    <div className="adwrap" data-where={where}>
      <span className="adlabel">광고</span>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={AD_CLIENT} data-ad-slot={AD_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
