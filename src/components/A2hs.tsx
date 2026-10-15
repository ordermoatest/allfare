'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/client';

/**
 * 두 번째 방문부터 한 번만: "홈 화면에 추가하면 앱처럼 쓸 수 있어요"
 * - 안드로이드 크롬 등: 브라우저 설치 창 띄우기
 * - 아이폰 사파리: 공유 버튼 → 홈 화면에 추가 방법 안내
 * - 카카오톡 등 앱 안 브라우저, PC, 이미 설치한 경우엔 안 띄움
 */
export default function A2hs({ blocked }: { blocked: boolean }) {
  const [mode, setMode] = useState<'' | 'ios' | 'install'>('');
  const [show, setShow] = useState(false);
  const evt = useRef<any>(null);

  useEffect(() => {
    let asked = false, visits = 0;
    try {
      asked = !!localStorage.getItem('af-a2hs');
      visits = Number(localStorage.getItem('af-visits') || 0);
      if (!sessionStorage.getItem('af-visit')) { visits += 1; localStorage.setItem('af-visits', String(visits)); sessionStorage.setItem('af-visit', '1'); }
    } catch { return; }
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const ua = navigator.userAgent;
    const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(ua);
    if (asked || standalone || inApp || visits < 2) return;

    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Whale/i.test(ua);
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && isSafari) { setMode('ios'); t = setTimeout(() => setShow(true), 4000); }
    const onBip = (e: Event) => { e.preventDefault(); evt.current = e; setMode('install'); clearTimeout(t); t = setTimeout(() => setShow(true), 4000); };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); clearTimeout(t); };
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
      <img src="/icon-192.png" alt="" width={44} height={44} />
      <div className="a2txt">
        <b>홈 화면에 추가해 보세요</b>
        {mode === 'ios'
          ? <span>사파리 <IosShare /> 공유 버튼에서 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 고르면 앱처럼 바로 열려요</span>
          : <span>다음부터 앱처럼 한 번에 열 수 있어요</span>}
      </div>
      <div className="a2btns">
        {mode === 'install' && <button className="a2go" onClick={install}>추가하기</button>}
        <button className="a2x" onClick={() => close(mode === 'ios' ? 'ok' : 'later')}>{mode === 'ios' ? '확인' : '다음에'}</button>
      </div>
    </div>
  );
}

const IosShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="공유" style={{ verticalAlign: '-2px' }}>
    <path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
