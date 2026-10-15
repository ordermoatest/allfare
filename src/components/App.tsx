'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import BenefitsTab from './BenefitsTab';
import CultureTab from './CultureTab';
import MyTab, { FS } from './MyTab';
import ExploreTab from './ExploreTab';
import BenefitSheet from './BenefitSheet';
import StoreSheet from './StoreSheet';
import { IcBook, IcGift, IcPin, IcSliders } from './icons';
import Brand from './Brand';
import A2hs from './A2hs';
import PcSide, { PcTop } from './PcSide';
import { IcBack, IcShare } from './icons';
import { useBackClose } from '@/lib/useBackClose';
import { shareLink, track } from '@/lib/client';
import { BItem, Store } from '@/lib/types';
import { EMPTY_PROFILE, Profile, clearProfile, loadNum, loadProfile, loadSet, saveNum, saveProfile, saveSet } from '@/lib/profile';

type Tab = 'home' | 'culture' | 'explore' | 'my';

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [opened, setOpened] = useState<Record<Tab, boolean>>({ home: true, culture: false, explore: false, my: false });
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [fs, setFsState] = useState(0);
  const [liked, setLiked] = useState<Record<string, true>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [benefit, setBenefit] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  // 탭마다 스크롤 위치 기억 (페이지 전체 스크롤)
  const scrollPos = useRef<Record<Tab, number>>({ home: 0, culture: 0, explore: 0, my: 0 });
  const [mini, setMini] = useState(false);
  const [sharePrompt, setSharePrompt] = useState(false);
  // 탭 이동 기록 (폰 뒤로가기 = 이전 탭)
  const tabRef = useRef<Tab>('home');
  tabRef.current = tab;
  const depthRef = useRef(0);
  const [depth, setDepth] = useState(0);
  const [fabDim, setFabDim] = useState(false);

  const [list, setList] = useState<{ key: string; items: BItem[] | null; error: string | null; region: string; asOf?: string | null }>({ key: '', items: null, error: null, region: '' });

  useEffect(() => {
    setProfile(loadProfile());
    setFsState(Math.min(FS.length - 1, Math.max(0, loadNum('af-fs', 0))));
    setLiked(loadSet('af-liked'));
    const qs = new URLSearchParams(location.search);
    const b = qs.get('b');
    if (b) setBenefit(b);
    const t = qs.get('tab'); // 가이드 글에서 탭 바로 열기 (?tab=my / ?tab=culture)
    let first: Tab = 'home';
    if (t === 'my' || t === 'culture' || t === 'explore') { first = t; setTab(t); setOpened((o) => ({ ...o, [t]: true })); }
    // 탭 이동 기록 시작점 (새로고침이면 기존 기록 이어가기)
    const hs = history.state || {};
    if (hs.afTab) { first = hs.afTab; setTab(first); setOpened((o) => ({ ...o, [first]: true })); depthRef.current = hs.afD || 0; setDepth(depthRef.current); }
    else history.replaceState({ ...hs, afTab: first, afD: 0 }, '');
    setReady(true);
  }, []);

  // 스크롤하면 위 로고 줄이기
  useEffect(() => {
    const on = () => setMini(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  // 로고 줄 높이는 CSS에 고정값으로 정해둠 (작아진 상태는 html.hmini)
  useEffect(() => { document.documentElement.classList.toggle('hmini', mini); }, [mini]);
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
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setList({ key, items: j.items, error: null, region: j.region, asOf: j.asOf }); })
      .catch((e) => setList({ key, items: null, error: e.message || '혜택을 불러오지 못했어요', region: '' }));
  }, []);
  useEffect(() => { if (ready && list.key !== regionKey) loadList(regionKey); }, [ready, regionKey, list.key, loadList]);

  const switchTab = (t: Tab) => {
    scrollPos.current[tabRef.current] = window.scrollY;
    setTab(t);
    setOpened((o) => ({ ...o, [t]: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, scrollPos.current[t] || 0)));
  };
  const go = (t: Tab) => {
    if (t === tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    switchTab(t);
    depthRef.current += 1; setDepth(depthRef.current);
    history.pushState({ ...(history.state || {}), afTab: t, afD: depthRef.current, afSheet: false }, '');
  };
  // 폰 뒤로가기·앞으로가기
  useEffect(() => {
    const on = (e: PopStateEvent) => {
      const s = e.state || {};
      if (typeof s.afD === 'number') { depthRef.current = s.afD; setDepth(s.afD); }
      if (s.afTab && s.afTab !== tabRef.current) switchTab(s.afTab);
    };
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // 상세 창은 뒤로가기로 닫기
  useBackClose(!!benefit, () => setBenefit(null));
  useBackClose(!!store, () => setStore(null));
  // 스크롤 중엔 뒤로가기 버튼 더 옅게
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = () => { setFabDim(true); clearTimeout(t); t = setTimeout(() => setFabDim(false), 500); };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); clearTimeout(t); };
  }, []);
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
      <PcTop active={tab === 'explore' ? 'guide' : tab} go={go} onShare={() => shareSite('pc_top')} hasProfile={profile.set} />
      <header className={`apphead ${mini ? 'mini' : ''}`}>
        <Brand onClick={toTop} mini={mini} />
        <button className="headshare" onClick={() => shareSite('header')} aria-label="올페어 공유하기"><IcShare size={18} /><span>공유</span></button>
      </header>
      <div className="tabwrap" style={fs ? ({ zoom: FS[fs] / 100 } as React.CSSProperties) : undefined}>
      <main className="scroll" hidden={tab !== 'home'}>
        <BenefitsTab profile={profile} items={list.items} error={list.error} region={list.region} asOf={list.asOf} liked={liked} likeCounts={likeCounts}
          onOpen={setBenefit} goMy={() => go('my')} onRetry={() => loadList(regionKey)}
          sharePrompt={sharePrompt} onSharePrompt={() => shareSite('prompt')} onClosePrompt={closePrompt} />
      </main>
      {opened.culture && (
        <main className="scroll" hidden={tab !== 'culture'}>
          <CultureTab visible={tab === 'culture'} onPick={setStore} toast={toast} onHome={() => go('home')} />
        </main>
      )}
      {opened.explore && (
        <main className="scroll" hidden={tab !== 'explore'}>
          <ExploreTab profile={profile} />
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
        <button className={tab === 'explore' ? 'on' : ''} aria-current={tab === 'explore' ? 'page' : undefined} onClick={() => go('explore')}><span className="ic"><IcBook size={24} /></span>알아보기</button>
        <button className={tab === 'my' ? 'on' : ''} aria-current={tab === 'my' ? 'page' : undefined} onClick={() => go('my')}><span className="ic"><IcSliders size={24} /></span>내 조건</button>
      </nav>

      {depth > 0 && !benefit && !store && (
        <button className={`backfab ${fabDim ? 'dim' : ''}`} onClick={() => history.back()} aria-label="이전 화면으로"><IcBack /></button>
      )}
      {benefit && <BenefitSheet id={benefit} profile={profile} liked={!!liked[benefit]} onLiked={onLiked} onClose={() => setBenefit(null)} toast={toast} />}
      {store && <StoreSheet store={store} onClose={() => setStore(null)} toast={toast} />}
      <PcSide onShare={() => shareSite('pc')} onMy={() => go('my')} />
      <A2hs blocked={!!benefit || !!store || sharePrompt} />
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
