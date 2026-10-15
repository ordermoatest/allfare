'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IcBack } from './icons';
import PcSide, { PcActive, PcTop } from './PcSide';
import { shareLink, track } from '@/lib/client';
import { loadProfile } from '@/lib/profile';

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
  const [hasProfile, setHasProfile] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { try { setHasProfile(loadProfile().set); } catch { /* */ } }, []);
  const active: PcActive = path.startsWith('/culture') ? 'region' : path.startsWith('/guide') ? 'guide' : path.startsWith('/news') ? 'news' : path.startsWith('/benefit') ? 'home' : '';
  const sharePage = async () => {
    const r = await shareLink(document.title.replace(/\s*\|\s*올페어$/, ''), '올페어에서 확인해 보세요', location.origin + location.pathname);
    track('share_page', { from: 'pc_top', via: r });
    if (r === 'copied') { setMsg('링크를 복사했어요. 원하는 곳에 붙여넣어 보내세요'); setTimeout(() => setMsg(''), 2600); }
  };
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
      {sub && <PcTop active={active} onShare={sharePage} hasProfile={hasProfile} />}
      {sub && <PcSide onShare={sharePage} onMy={() => { location.href = '/?tab=my'; }} />}
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
