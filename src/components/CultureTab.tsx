'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import CatBar from './CatBar';
import Footer from './Footer';
import KakaoMap from './KakaoMap';
import { IcGps, IcPin, IcSearch, StoreIcon } from './icons';
import { Place, Store, km } from '@/lib/types';
import { track } from '@/lib/client';

const RADII = [500, 1000, 3000];
const DEFAULT: Place = { lat: 37.57103, lng: 126.97646, label: '광화문역', mode: 'home' };
type Cand = { lat: number; lng: number; label: string; sub: string };

export default function CultureTab({ visible, onPick, toast }: {
  visible: boolean; onPick: (s: Store) => void; toast: (m: string) => void;
}) {
  const [place, setPlace] = useState<Place>(DEFAULT);
  const [stores, setStores] = useState<Store[] | null>(null);
  const [ready, setReady] = useState(true);
  const [err, setErr] = useState('');
  const [radius, setRadius] = useState(1000);
  const [cat, setCat] = useState('전체');
  const [kwInput, setKwInput] = useState('');
  const [kw, setKw] = useState('');
  // 기준 위치 바꾸기 창
  const [sheet, setSheet] = useState(false);
  const [locQ, setLocQ] = useState('');
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [locating, setLocating] = useState(false);

  // 기준 위치가 바뀌면 3km 안 가맹점을 한 번에 받아두고 반경·분야·검색어는 화면에서 거름
  useEffect(() => {
    setStores(null); setErr('');
    fetch(`/api/stores?lat=${place.lat.toFixed(5)}&lng=${place.lng.toFixed(5)}&r=3000`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setStores(j.items); setReady(j.ready !== false);
    }).catch((e) => setErr(e.message || '가맹점을 불러오지 못했어요'));
  }, [place]);

  const searchLoc = async (e?: FormEvent) => {
    e?.preventDefault();
    const v = locQ.trim();
    if (!v) return;
    setCands(null);
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(v)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setCands(j.items);
    } catch (er) { setCands([]); toast(er instanceof Error ? er.message : '검색하지 못했어요'); }
  };

  const pickPlace = (c: Cand) => {
    setPlace({ lat: c.lat, lng: c.lng, label: c.label, mode: 'search' });
    setSheet(false); setCands(null); setLocQ('');
    track('search_place', { q: c.label });
  };

  const locateMe = () => {
    if (!('geolocation' in navigator)) { toast('이 브라우저는 위치 확인을 지원하지 않아요'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setPlace({ lat, lng, label: '현재 위치', mode: 'gps' });
      setLocating(false); setSheet(false); track('use_gps');
      try { const r = await fetch(`/api/geo?lat=${lat}&lng=${lng}`); const j = await r.json(); if (r.ok) setPlace({ lat, lng, label: j.label, mode: 'gps' }); } catch { /* 이름 없이 */ }
    }, () => { setLocating(false); toast('위치 권한을 허용하면 현재 위치로 찾을 수 있어요'); }, { timeout: 8000, maximumAge: 300000 });
  };

  const applyKw = (e?: FormEvent) => { e?.preventDefault(); const v = kwInput.trim(); setKw(v); if (v) track('search_store', { q: v }); };
  const clearKw = () => { setKwInput(''); setKw(''); };

  const norm = (x: string) => x.replace(/\s/g, '').toLowerCase();
  const inR = useMemo(() => {
    const k = norm(kw);
    return (stores || []).filter((s) => s.distance <= radius && (!k || norm(`${s.name}${s.category || ''}`).includes(k)));
  }, [stores, radius, kw]);
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    inR.forEach((s) => { const c = s.category || '기타'; m.set(c, (m.get(c) || 0) + 1); });
    return [{ key: '전체', count: inR.length }, ...Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }))];
  }, [inR]);
  const curCat = cats.some((c) => c.key === cat) ? cat : '전체';
  const shown = useMemo(() => inR.filter((s) => curCat === '전체' || (s.category || '기타') === curCat), [inR, curCat]);
  const modeLabel = place.mode === 'gps' ? '현재 위치' : place.mode === 'search' ? '검색한 위치' : '기본 위치';

  return (
    <>
      <h1>문화누리 사용처</h1>

      <button className="locbar" onClick={() => setSheet(true)} aria-label="기준 위치 바꾸기">
        <span style={{ color: 'var(--mint)' }}><IcPin /></span>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><small>{modeLabel}</small><b>{place.label} 근처</b></span>
        <span className="locbar-btn">바꾸기 ▾</span>
      </button>

      <form className="search" style={{ paddingRight: 5 }} onSubmit={applyKw}>
        <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
        <input value={kwInput} onChange={(e) => { setKwInput(e.target.value); if (!e.target.value) setKw(''); }} enterKeyHint="search" placeholder="가게·분야 검색 (예: 영화, 교보문고)" aria-label="가게 이름이나 분야 검색" />
        {kwInput && <button type="button" className="gps" aria-label="검색어 지우기" onClick={clearKw}>✕</button>}
        <button className="sbtn">검색</button>
      </form>

      <KakaoMap lat={place.lat} lng={place.lng} radius={radius} stores={shown} visible={visible} onPick={onPick} />
      <div className="seg" role="group" aria-label="검색 반경">
        {RADII.map((r) => <button key={r} className={radius === r ? 'on' : ''} aria-pressed={radius === r} onClick={() => setRadius(r)}>반경 {km(r)}</button>)}
      </div>

      {err ? <div className="empty">{err}</div> : !stores ? (
        <div className="list" aria-busy="true"><div className="skel" /><div className="skel" /></div>
      ) : !ready ? (
        <div className="notice"><b>가맹점 위치 정보를 준비하고 있어요</b><span>전국 가맹점의 위치를 지도에 표시할 수 있게 정리하는 중이에요. 잠시 후 다시 열어주세요.</span></div>
      ) : (
        <>
          <CatBar title={<>분야별 사용처 <span className="cap light">{shown.length}곳</span></>} right={<span className="cap">가까운 순</span>}
            label="사용처 분야" items={cats} current={curCat} onPick={setCat} />
          {kw && <div className="kwinfo">&lsquo;{kw}&rsquo; 검색 결과 {inR.length}곳 · 이름이나 분야에 들어간 가게만 보여요 <button className="linkbtn" style={{ minHeight: 28 }} onClick={clearKw}>검색 해제</button></div>}
          <div className="list">
            {shown.length === 0 && (
              <div className="empty">
                {kw ? <>반경 {km(radius)} 안에 &lsquo;{kw}&rsquo; 가게가 없어요.<br />반경을 넓히거나 기준 위치를 바꿔 보세요.</>
                  : <>반경 {km(radius)} 안에 사용처가 없어요.<br />반경을 넓히거나 기준 위치를 바꿔 보세요.</>}
                {radius < 3000 && <><br /><button className="linkbtn" onClick={() => setRadius(3000)}>반경 3km로 넓히기</button></>}
              </div>
            )}
            {shown.map((s) => (
              <button key={s.id} className="item" onClick={() => onPick(s)}>
                <div className="row">
                  <span className="tags"><span className="tag"><StoreIcon cat={s.category || ''} />{s.category || '기타'}</span>{s.review_count > 0 && <span className="mt check">후기 {s.review_count}</span>}</span>
                  <span className="d">{km(s.distance)}</span>
                </div>
                <strong>{s.name}</strong>
                <span className="cap">{s.address}</span>
              </button>
            ))}
          </div>
          <p className="note">가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요. 방문 전 문화누리카드 결제 가능 여부를 가게에 확인하세요.</p>
        </>
      )}
      <Footer />

      {sheet && (
        <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="box" role="dialog" aria-modal="true" aria-label="기준 위치 바꾸기">
            <div className="grab" />
            <div className="row"><strong style={{ fontSize: 17 }}>기준 위치 바꾸기</strong><button className="ghost" onClick={() => setSheet(false)}>닫기</button></div>
            <form className="search" style={{ paddingRight: 5 }} onSubmit={searchLoc}>
              <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
              <input autoFocus value={locQ} onChange={(e) => setLocQ(e.target.value)} enterKeyHint="search" placeholder="역·동네·주소 (예: 광화문역)" aria-label="역, 동네, 주소 검색" />
              <button className="sbtn">찾기</button>
            </form>
            <button className="item" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onClick={locateMe} disabled={locating}>
              <span style={{ color: 'var(--mint)' }}><IcGps /></span><strong>{locating ? '위치 확인 중…' : '현재 위치로'}</strong>
            </button>
            {cands === null && locQ && <span className="cap" style={{ textAlign: 'center' }}>찾기를 누르면 후보가 나와요</span>}
            {cands && cands.length > 0 && <span className="cap">검색 결과</span>}
            {cands?.map((c, i) => (
              <button key={i} className="item" style={{ gap: 2 }} onClick={() => pickPlace(c)}>
                <strong style={{ fontSize: 15 }}>{c.label}</strong><span className="cap">{c.sub}</span>
              </button>
            ))}
            {!cands && !locQ && <button className="linkbtn" onClick={() => { setPlace(DEFAULT); setSheet(false); }}>기본 위치(광화문역)로 돌아가기</button>}
          </div>
        </div>
      )}
    </>
  );
}
