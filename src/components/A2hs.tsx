'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/client';

type Mode = '' | 'ios' | 'install' | 'safari';

/**
 * 폰에서만, 첫 방문부터: "홈 화면에 추가하면 앱처럼 쓸 수 있어요" (한 번만)
 * - 30초가 지나거나 화면을 어느 정도 내리면 띄움
 * - 아이폰 사파리: 공유 버튼 → 홈 화면에 추가 방법 안내
 * - 아이폰 크롬·네이버 등: 사파리에서 열어달라고 안내
 * - 안드로이드: 브라우저 설치 창 띄우기
 * - 카카오톡 등 앱 안 브라우저, PC, 이미 설치한 경우엔 안 띄움
 * - 테스트: 주소 뒤에 ?a2hs=1 을 붙이면 바로 뜸
 */
export default function A2hs({ blocked }: { blocked: boolean }) {
  const [mode, setMode] = useState<Mode>('');
  const [show, setShow] = useState(false);
  const evt = useRef<any>(null);

  useEffect(() => {
    const test = new URLSearchParams(location.search).get('a2hs') === '1';
    let asked = false;
    try { asked = !!localStorage.getItem('af-a2hs'); } catch { /* */ }
    const ua = navigator.userAgent;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const inApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps/i.test(ua);
    const isIOS = /iPhone|iPod/i.test(ua) || (/iPad/i.test(ua)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = isIOS || /Android/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Whale|NAVER|DaumApps|GSA\//i.test(ua);
    if (!test && (asked || standalone || inApp || !isMobile)) return;

    const initial: Mode = isIOS ? (isSafari ? 'ios' : 'safari') : '';
    if (initial) setMode(initial);
    const onBip = (e: Event) => { e.preventDefault(); evt.current = e; setMode('install'); };
    window.addEventListener('beforeinstallprompt', onBip);

    if (test) { if (!initial) setMode((m) => m || 'ios'); setShow(true); return () => window.removeEventListener('beforeinstallprompt', onBip); }

    // 30초 뒤 또는 화면을 600px 이상 내렸을 때
    let done = false;
    const fire = () => { if (done) return; done = true; setShow(true); cleanup(); };
    const onScroll = () => { if (window.scrollY > 600) fire(); };
    const t = setTimeout(fire, 30000);
    window.addEventListener('scroll', onScroll, { passive: true });
    const cleanup = () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
    return () => { cleanup(); window.removeEventListener('beforeinstallprompt', onBip); };
  }, []);

  const close = (how: string) => {
    setShow(false);
    try { localStorage.setItem('af-a2hs', how); } catch { /* */ }
    track('a2hs', { how, mode });
  };
  const install = async () => {
    const e = evt.current;
    if (!e) return close('none');
    e.prompt();
    const r = await e.userChoice.catch(() => null);
    close(r?.outcome === 'accepted' ? 'installed' : 'dismissed');
  };

  if (!show || blocked || !mode) return null;
  return (
    <div className="a2hs" role="dialog" aria-label="홈 화면에 추가 안내">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={44} height={44} />
      <div className="a2txt">
        <b>홈 화면에 추가해 보세요</b>
        {mode === 'ios' && <span>사파리 <IosShare /> 공유 버튼에서 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 고르면 앱처럼 바로 열려요</span>}
        {mode === 'safari' && <span><b>사파리</b>에서 열면 홈 화면에 추가해서 앱처럼 쓸 수 있어요</span>}
        {mode === 'install' && <span>다음부터 앱처럼 한 번에 열 수 있어요</span>}
      </div>
      <div className="a2btns">
        {mode === 'install' && <button className="a2go" onClick={install}>추가하기</button>}
        <button className="a2x" onClick={() => close(mode === 'install' ? 'later' : 'ok')}>{mode === 'install' ? '다음에' : '확인'}</button>
      </div>
    </div>
  );
}

const IosShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="공유" style={{ verticalAlign: '-2px' }}>
    <path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
