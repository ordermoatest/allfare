'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IcBack } from './icons';

/**
 * 모든 페이지 공통
 * - 다른 페이지로 넘어가는 링크를 누르면 눌림 표시 + 위쪽 로딩바
 * - 메인(/) 밖의 페이지(지역·가이드 등)에서는 우측 하단 뒤로가기 버튼
 */
export default function GlobalUi() {
  const path = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const noop = () => {};
    document.addEventListener('touchstart', noop, { passive: true }); // 아이폰에서 :active 눌림 효과 켜기
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null;
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) return; // 같은 페이지·#이동
      a.classList.add('tapped');
      setLoading(true);
    };
    const reset = () => { setLoading(false); document.querySelectorAll('a.tapped').forEach((x) => x.classList.remove('tapped')); };
    document.addEventListener('click', onClick);
    window.addEventListener('pageshow', reset); // 뒤로가기로 돌아왔을 때 로딩바 남지 않게
    return () => { document.removeEventListener('touchstart', noop); document.removeEventListener('click', onClick); window.removeEventListener('pageshow', reset); };
  }, []);
  useEffect(() => { setLoading(false); }, [path]);

  const sub = path !== '/' && !path.startsWith('/admin');
  const back = () => {
    let fromHere = false;
    try { fromHere = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* */ }
    if (fromHere && history.length > 1) history.back();
    else location.href = '/';
  };

  return (
    <>
      {loading && <div className="navbar" aria-hidden />}
      {sub && <button className="backfab sub" onClick={back} aria-label="뒤로가기"><IcBack /></button>}
    </>
  );
}
