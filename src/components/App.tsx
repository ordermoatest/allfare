'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import BenefitsTab from './BenefitsTab';
import CultureTab from './CultureTab';
import MyTab, { FS } from './MyTab';
import BenefitSheet from './BenefitSheet';
import StoreSheet from './StoreSheet';
import { IcGift, IcPin, IcSliders } from './icons';
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
  const scrolls = useRef<Record<Tab, HTMLElement | null>>({ home: null, culture: null, my: null });

  const [list, setList] = useState<{ key: string; items: BItem[] | null; error: string | null; region: string }>({ key: '', items: null, error: null, region: '' });

  useEffect(() => {
    setProfile(loadProfile());
    setFsState(Math.min(FS.length - 1, Math.max(0, loadNum('af-fs', 0))));
    setLiked(loadSet('af-liked'));
    const b = new URLSearchParams(location.search).get('b');
    if (b) setBenefit(b);
    setReady(true);
  }, []);

  useEffect(() => { document.documentElement.style.setProperty('--zoom', String(FS[fs] / 100)); }, [fs]);

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
    setTab(t);
    setOpened((o) => ({ ...o, [t]: true }));
    requestAnimationFrame(() => scrolls.current[t]?.scrollTo({ top: 0 }));
  };

  const onLiked = (id: string, on: boolean, count: number) => {
    setLikeCounts((c) => ({ ...c, [id]: count }));
    setLiked((l) => { const n = { ...l }; if (on) n[id] = true; else delete n[id]; saveSet('af-liked', n); return n; });
  };

  const setFs = (n: number) => { setFsState(n); saveNum('af-fs', n); };

  const scrollRef = (t: Tab) => (el: HTMLElement | null) => { scrolls.current[t] = el; };

  return (
    <div className="app">
      <main className="scroll" ref={scrollRef('home')} hidden={tab !== 'home'}>
        <BenefitsTab profile={profile} items={list.items} error={list.error} region={list.region} liked={liked} likeCounts={likeCounts}
          onOpen={setBenefit} goMy={() => go('my')} onRetry={() => loadList(regionKey)} />
      </main>
      {opened.culture && (
        <main className="scroll" ref={scrollRef('culture')} hidden={tab !== 'culture'}>
          <CultureTab visible={tab === 'culture'} profile={profile} onPick={setStore} toast={toast} />
        </main>
      )}
      {opened.my && (
        <main className="scroll" ref={scrollRef('my')} hidden={tab !== 'my'}>
          <MyTab profile={profile} fs={fs} setFs={setFs}
            onSave={(p) => { setProfile(p); saveProfile(p); toast('저장했어요. 내 조건에 맞는 혜택을 보여드려요'); go('home'); }}
            onReset={() => { clearProfile(); setProfile({ ...EMPTY_PROFILE }); toast('저장된 내 정보를 지웠어요'); }} />
        </main>
      )}

      <nav className="tabs" aria-label="메인 메뉴">
        <button className={tab === 'home' ? 'on' : ''} aria-current={tab === 'home' ? 'page' : undefined} onClick={() => go('home')}><span className="ic"><IcGift /></span>혜택</button>
        <button className={tab === 'culture' ? 'on' : ''} aria-current={tab === 'culture' ? 'page' : undefined} onClick={() => go('culture')}><span className="ic"><IcPin /></span>문화누리</button>
        <button className={tab === 'my' ? 'on' : ''} aria-current={tab === 'my' ? 'page' : undefined} onClick={() => go('my')}><span className="ic"><IcSliders /></span>내 조건</button>
      </nav>

      {benefit && <BenefitSheet id={benefit} profile={profile} liked={!!liked[benefit]} onLiked={onLiked} onClose={() => setBenefit(null)} toast={toast} />}
      {store && <StoreSheet store={store} onClose={() => setStore(null)} toast={toast} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
