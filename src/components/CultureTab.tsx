'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import CatBar from './CatBar';
import Footer from './Footer';
import KakaoMap from './KakaoMap';
import Brand from './Brand';
import { IcGps, IcPin, IcSearch, StoreIcon } from './icons';
import { Place, Store, km, paidLine } from '@/lib/types';
import { track } from '@/lib/client';

const RADII = [500, 1000, 3000];
const SORTS = { d: '가까운 순', rv: '후기 많은 순', st: '별점 높은 순', pay: '결제 확인 많은 순', nm: '이름순' } as const;
type SortKey = keyof typeof SORTS;
const FILTERS = [
  { k: 'pay', label: '✓ 결제 확인된 곳만', ok: (s: Store) => (s.paid_yes || 0) > 0 },
  { k: 'rv', label: '💬 후기 있는 곳만', ok: (s: Store) => s.review_count > 0 },
  { k: 'tel', label: '📞 전화번호 있는 곳만', ok: (s: Store) => !!s.phone },
  { k: 'bad', label: '⚠ 결제 안 됨 제보 빼기', ok: (s: Store) => !(s.paid_no || 0) },
] as const;
const DEFAULT: Place = { lat: 37.57103, lng: 126.97646, label: '광화문역', mode: 'home' };
type Cand = { lat: number; lng: number; label: string; sub: string };

export default function CultureTab({ visible, onPick, toast, onHome }: {
  visible: boolean; onPick: (s: Store) => void; toast: (m: string) => void; onHome: () => void;
}) {
  const [place, setPlace] = useState<Place>(DEFAULT);
  const [stores, setStores] = useState<Store[] | null>(null);
  const [ready, setReady] = useState(true);
  const [err, setErr] = useState('');
  const [radius, setRadius] = useState(1000);
  const [cat, setCat] = useState('전체');
  const [kwInput, setKwInput] = useState('');
  const [kw, setKw] = useState('');
  const [sort, setSort] = useState<SortKey>('d');
  const [flt, setFlt] = useState<string[]>([]);
  // 기준 위치 바꾸기 창
  const [sheet, setSheet] = useState(false);
  const [locQ, setLocQ] = useState('');
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [finding, setFinding] = useState(false);

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
    if (!v || finding) return;
    setCands(null); setFinding(true);
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(v)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setCands(j.items);
    } catch (er) { setCands([]); toast(er instanceof Error ? er.message : '검색하지 못했어요'); }
    setFinding(false);
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

  const norm = (x: string) => x.replace(/[\s()（）]/g, '').toLowerCase();
  // 반경 + 가게 이름 검색 + 필터 (분야 칩 숫자는 여기 기준)
  const inR = useMemo(() => {
    const k = norm(kw);
    const fs = FILTERS.filter((f) => flt.includes(f.k));
    return (stores || []).filter((s) => s.distance <= radius && (!k || norm(s.name).includes(k)) && fs.every((f) => f.ok(s)));
  }, [stores, radius, kw, flt]);
  const nameHits = useMemo(() => {
    const k = norm(kw);
    return k ? (stores || []).filter((s) => s.distance <= radius && norm(s.name).includes(k)).length : 0;
  }, [stores, radius, kw]);
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    inR.forEach((s) => { const c = s.category || '기타'; m.set(c, (m.get(c) || 0) + 1); });
    return [{ key: '전체', count: inR.length }, ...Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }))];
  }, [inR]);
  const curCat = cats.some((c) => c.key === cat) ? cat : '전체';
  const shown = useMemo(() => {
    const cmp: Record<SortKey, (a: Store, b: Store) => number> = {
      d: (a, b) => a.distance - b.distance,
      rv: (a, b) => b.review_count - a.review_count || a.distance - b.distance,
      st: (a, b) => (b.rating_avg || 0) - (a.rating_avg || 0) || b.review_count - a.review_count || a.distance - b.distance,
      pay: (a, b) => (b.paid_yes || 0) - (a.paid_yes || 0) || a.distance - b.distance,
      nm: (a, b) => norm(a.name).localeCompare(norm(b.name), 'ko'),
    };
    return inR.filter((s) => curCat === '전체' || (s.category || '기타') === curCat).sort(cmp[sort]);
  }, [inR, curCat, sort]);
  const toggleFlt = (k: string) => { setFlt((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k])); track('filter_store', { f: k }); };
  const modeLabel = place.mode === 'gps' ? '현재 위치' : place.mode === 'search' ? '검색한 위치' : '기본 위치';

  return (
    <>
      <div className="head"><Brand onClick={onHome} /></div>
      <h2 className="tabtitle">문화누리 사용처</h2>

      <section className="cbox" aria-label="어디서 찾을까요">
        <div className="cbh"><i>📍</i>어디서 찾을까요?</div>
        <button className="locbar" onClick={() => setSheet(true)} aria-label="기준 위치 바꾸기">
          <span style={{ color: 'var(--mint)' }}><IcPin /></span>
          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><small>{modeLabel}</small><b>{place.label} 근처</b></span>
          <span className="locbar-btn">바꾸기 ▾</span>
        </button>
        <div className="seg" role="group" aria-label="검색 반경">
          {RADII.map((r) => <button key={r} className={radius === r ? 'on' : ''} aria-pressed={radius === r} onClick={() => setRadius(r)}>반경 {km(r)}</button>)}
        </div>
      </section>

      <section className="cbox" aria-label="가게 이름으로 찾기">
        <div className="cbh"><i>🔍</i>가게 이름으로 찾기<small>선택</small></div>
        <form className="search" style={{ paddingRight: 5 }} onSubmit={applyKw}>
          <input value={kwInput} onChange={(e) => { setKwInput(e.target.value); if (!e.target.value) setKw(''); }} enterKeyHint="search" placeholder="예: 교보문고, CGV" aria-label="가게 이름 검색" />
          {kwInput && <button type="button" className="gps" aria-label="검색어 지우기" onClick={clearKw}>✕</button>}
          <button className="sbtn">검색</button>
        </form>
        {kw && <div className="kwinfo">&lsquo;{kw}&rsquo; 이름이 들어간 가게 {nameHits}곳 · 아래 목록과 지도에 표시돼요 <button className="linkbtn" style={{ minHeight: 28 }} onClick={clearKw}>검색 해제</button></div>}
      </section>

      <KakaoMap lat={place.lat} lng={place.lng} radius={radius} stores={shown} visible={visible} onPick={onPick} />

      {err ? <div className="empty">{err}</div> : !stores ? (
        <div className="list" aria-busy="true"><div className="skel" /><div className="skel" /></div>
      ) : !ready ? (
        <div className="notice"><b>가맹점 위치 정보를 준비하고 있어요</b><span>전국 가맹점의 위치를 지도에 표시할 수 있게 정리하는 중이에요. 잠시 후 다시 열어주세요.</span></div>
      ) : (
        <>
          <CatBar title={<>🗂️ 분야별 사용처 <span className="cap light">{shown.length}곳</span></>}
            right={<label className="sortsel"><span className="sr">정렬</span><select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); track('sort_store', { s: e.target.value }); }}>{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select></label>}
            label="사용처 분야" items={cats} current={curCat} onPick={setCat} />
          <div className="fltrow" role="group" aria-label="필터">
            {FILTERS.map((f) => <button key={f.k} className={`fc ${flt.includes(f.k) ? 'on' : ''}`} aria-pressed={flt.includes(f.k)} onClick={() => toggleFlt(f.k)}>{f.label}</button>)}
            {flt.length > 0 && <button className="linkbtn" style={{ minHeight: 32, fontSize: 13 }} onClick={() => setFlt([])}>필터 초기화</button>}
          </div>
          <div className="list">
            {shown.length === 0 && (
              <div className="empty">
                {flt.length ? <>필터 조건에 맞는 가게가 없어요.<br /><button className="linkbtn" onClick={() => setFlt([])}>필터 초기화</button></>
                  : kw ? <>반경 {km(radius)} 안에 &lsquo;{kw}&rsquo; 가게가 없어요.<br />반경을 넓히거나 기준 위치를 바꿔 보세요.</>
                  : <>반경 {km(radius)} 안에 사용처가 없어요.<br />반경을 넓히거나 기준 위치를 바꿔 보세요.</>}
                {radius < 3000 && !flt.length && <><br /><button className="linkbtn" onClick={() => setRadius(3000)}>반경 3km로 넓히기</button></>}
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
                {(s.paid_yes || s.paid_no || s.rating_avg) ? (() => { const pl = paidLine(s.paid_yes, s.paid_no, s.rating_avg); return (
                  <span className="paidsum">{pl.text && <span className="paidok">✓ {pl.text}</span>}{pl.warn && <span className="paidno">⚠ {pl.warn}</span>}</span>
                ); })() : null}
              </button>
            ))}
          </div>
        </>
      )}
      <Footer notes={['가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요.', '방문 전 문화누리카드 결제 가능 여부를 가게에 확인하세요.']} />

      {sheet && (
        <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="box" role="dialog" aria-modal="true" aria-label="기준 위치 바꾸기">
            <div className="grab" />
            <div className="row"><strong style={{ fontSize: 17 }}>기준 위치 바꾸기</strong><button className="ghost" onClick={() => setSheet(false)}>닫기</button></div>
            <form className="search" style={{ paddingRight: 5 }} onSubmit={searchLoc}>
              <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
              <input autoFocus value={locQ} onChange={(e) => setLocQ(e.target.value)} enterKeyHint="search" placeholder="역·동네·주소 (예: 광화문역)" aria-label="역, 동네, 주소 검색" />
              <button className="sbtn" disabled={finding}>{finding ? <i className="spin" /> : '찾기'}</button>
            </form>
            <button className="item" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onClick={locateMe} disabled={locating}>
              <span style={{ color: 'var(--mint)' }}><IcGps /></span><strong>{locating ? <><i className="spin" />위치 확인 중…</> : '현재 위치로'}</strong>
            </button>
            {cands?.length === 0 && !finding && <span className="cap" style={{ textAlign: 'center' }}>검색 결과가 없어요. 역 이름이나 동 이름으로 찾아보세요</span>}
            {cands === null && locQ && !finding && <span className="cap" style={{ textAlign: 'center' }}>찾기를 누르면 후보가 나와요</span>}
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
