'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import BenefitsTab from './BenefitsTab';
import CultureTab from './CultureTab';
import MyTab, { FS } from './MyTab';
import BenefitSheet from './BenefitSheet';
import StoreSheet from './StoreSheet';
import { IcGift, IcPin, IcSliders } from './icons';
import Brand from './Brand';
import { IcShare } from './icons';
import { shareLink, track } from '@/lib/client';
import { BItem, Store } from '@/lib/types';
import { EMPTY_PROFILE, Profile, clearProfile, loadNum, loadProfile, loadSet, saveNum, saveProfile, saveSet } from '@/lib/profile';

type Tab = 'home' | 'culture' | 'my';

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [opened, setOpened] = useState<Record<Tab, boolean>>({ home: true, culture: false, my: false });
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [fs, setFsState] = useState(0);
  const [liked, setLiked] = useState<Record<string, true>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [benefit, setBenefit] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  // 탭마다 스크롤 위치 기억 (페이지 전체 스크롤)
  const scrollPos = useRef<Record<Tab, number>>({ home: 0, culture: 0, my: 0 });
  const [mini, setMini] = useState(false);
  const [sharePrompt, setSharePrompt] = useState(false);
  const headRef = useRef<HTMLElement>(null);

  const [list, setList] = useState<{ key: string; items: BItem[] | null; error: string | null; region: string }>({ key: '', items: null, error: null, region: '' });

  useEffect(() => {
    setProfile(loadProfile());
    setFsState(Math.min(FS.length - 1, Math.max(0, loadNum('af-fs', 0))));
    setLiked(loadSet('af-liked'));
    const qs = new URLSearchParams(location.search);
    const b = qs.get('b');
    if (b) setBenefit(b);
    const t = qs.get('tab'); // 가이드 글에서 탭 바로 열기 (?tab=my / ?tab=culture)
    if (t === 'my' || t === 'culture') { setTab(t); setOpened((o) => ({ ...o, [t]: true })); }
    setReady(true);
  }, []);

  // 스크롤하면 위 로고 줄이기
  useEffect(() => {
    const on = () => setMini(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  // 고정 머리글 높이 → 분야 칩 줄이 그 아래에 붙도록
  useEffect(() => {
    const el = headRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const set = () => document.documentElement.style.setProperty('--hdr', `${Math.round(el.getBoundingClientRect().height)}px`);
    const ro = new ResizeObserver(set);
    ro.observe(el, { box: 'border-box' });
    el.addEventListener('transitionend', set); // 로고가 작아지는 애니메이션이 끝난 뒤 다시 맞춤
    set();
    return () => { ro.disconnect(); el.removeEventListener('transitionend', set); };
  }, []);
  // 두 손가락 확대 막기 (아이폰). 지도 움직이기 중일 때는 지도에서 허용
  useEffect(() => {
    const stop = (e: Event) => { const t = e.target as Element | null; if (!t?.closest?.('.map.live')) e.preventDefault(); };
    document.addEventListener('gesturestart', stop);
    return () => document.removeEventListener('gesturestart', stop);
  }, []);
  // 팝업이 열려 있으면 뒤 화면 스크롤 막기
  useEffect(() => { document.body.style.overflow = benefit || store ? 'hidden' : ''; }, [benefit, store]);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  }, []);

  // 혜택 목록: 사는 곳이 바뀔 때만 다시 받음
  const regionKey = profile.set ? `${profile.sido}|${profile.sgg}` : '|';
  const loadList = useCallback((key: string) => {
    const [sido, sgg] = key.split('|');
    setList({ key, items: null, error: null, region: '' });
    fetch(`/api/benefits?sido=${encodeURIComponent(sido)}&sgg=${encodeURIComponent(sgg)}`)
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setList({ key, items: j.items, error: null, region: j.region }); })
      .catch((e) => setList({ key, items: null, error: e.message || '혜택을 불러오지 못했어요', region: '' }));
  }, []);
  useEffect(() => { if (ready && list.key !== regionKey) loadList(regionKey); }, [ready, regionKey, list.key, loadList]);

  const go = (t: Tab) => {
    if (t === tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    scrollPos.current[tab] = window.scrollY;
    setTab(t);
    setOpened((o) => ({ ...o, [t]: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, scrollPos.current[t] || 0)));
  };
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // 사이트 공유
  const shareSite = async (from: string) => {
    const r = await shareLink('올페어 - 내가 받을 수 있는 복지 혜택 찾기', '내가 받을 수 있는 복지 혜택, 1분이면 찾아요', `${location.origin}/`);
    track('share_site', { from, via: r });
    if (r === 'copied') toast('링크를 복사했어요. 원하는 곳에 붙여넣어 보내세요');
    if (r === 'fail') toast('공유하지 못했어요');
    if (from === 'prompt' && r !== 'cancel') closePrompt();
  };
  const closePrompt = () => { setSharePrompt(false); try { localStorage.setItem('af-share-asked', '1'); } catch { /* */ } };

  const onLiked = (id: string, on: boolean, count: number) => {
    setLikeCounts((c) => ({ ...c, [id]: count }));
    setLiked((l) => { const n = { ...l }; if (on) n[id] = true; else delete n[id]; saveSet('af-liked', n); return n; });
  };

  const setFs = (n: number) => { setFsState(n); saveNum('af-fs', n); };


  return (
    <div className="app">
      <header ref={headRef} className={`apphead ${mini ? 'mini' : ''}`}>
        <Brand onClick={toTop} mini={mini} />
        <button className="headshare" onClick={() => shareSite('header')} aria-label="올페어 공유하기"><IcShare size={18} /><span>공유</span></button>
      </header>
      <div className="tabwrap" style={fs ? ({ zoom: FS[fs] / 100 } as React.CSSProperties) : undefined}>
      <main className="scroll" hidden={tab !== 'home'}>
        <BenefitsTab profile={profile} items={list.items} error={list.error} region={list.region} liked={liked} likeCounts={likeCounts}
          onOpen={setBenefit} goMy={() => go('my')} onRetry={() => loadList(regionKey)}
          sharePrompt={sharePrompt} onSharePrompt={() => shareSite('prompt')} onClosePrompt={closePrompt} />
      </main>
      {opened.culture && (
        <main className="scroll" hidden={tab !== 'culture'}>
          <CultureTab visible={tab === 'culture'} onPick={setStore} toast={toast} onHome={() => go('home')} />
        </main>
      )}
      {opened.my && (
        <main className="scroll" hidden={tab !== 'my'}>
          <MyTab profile={profile} fs={fs} setFs={setFs} onHome={() => go('home')}
            onSave={(p) => {
              setProfile(p); saveProfile(p); toast('저장했어요. 내 조건에 맞는 혜택을 보여드려요'); go('home');
              try { if (!localStorage.getItem('af-share-asked')) setSharePrompt(true); } catch { /* */ }
            }}
            onReset={() => { clearProfile(); setProfile({ ...EMPTY_PROFILE }); toast('저장된 내 정보를 지웠어요'); }} />
        </main>
      )}

      </div>

      <nav className="tabs" aria-label="메인 메뉴">
        <button className={tab === 'home' ? 'on' : ''} aria-current={tab === 'home' ? 'page' : undefined} onClick={() => go('home')}><span className="ic"><IcGift size={24} /></span>내 혜택</button>
        <button className={tab === 'culture' ? 'on' : ''} aria-current={tab === 'culture' ? 'page' : undefined} onClick={() => go('culture')}><span className="ic"><IcPin size={24} /></span>문화누리 지도</button>
        <button className={tab === 'my' ? 'on' : ''} aria-current={tab === 'my' ? 'page' : undefined} onClick={() => go('my')}><span className="ic"><IcSliders size={24} /></span>내 조건</button>
      </nav>

      {benefit && <BenefitSheet id={benefit} profile={profile} liked={!!liked[benefit]} onLiked={onLiked} onClose={() => setBenefit(null)} toast={toast} />}
      {store && <StoreSheet store={store} onClose={() => setStore(null)} toast={toast} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
