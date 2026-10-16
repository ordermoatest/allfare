'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import CatBar from './CatBar';
import Footer from './Footer';
import KakaoMap from './KakaoMap';
import { IcGps, IcPin, IcSearch, StoreIcon } from './icons';
import { Place, Store, fmtAsOf, km, paidLine } from '@/lib/types';
import { track } from '@/lib/client';
import { MNURI, ONLINE_SHOPS } from '@/lib/online';
import { ITEMS } from '@/lib/items';
import { useBackClose } from '@/lib/useBackClose';

const ONLINE = '🌐 온라인';

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
  // 지역 페이지에서 '지도로 보기'로 들어오면 그 지역을 기준 위치로
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const lat = Number(q.get('lat')), lng = Number(q.get('lng'));
    if (lat > 32 && lat < 39.5 && lng > 124 && lng < 132) setPlace({ lat, lng, label: (q.get('at') || '선택한 지역').slice(0, 20), mode: 'search' });
  }, []);
  const [stores, setStores] = useState<Store[] | null>(null);
  const [ready, setReady] = useState(true);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [radius, setRadius] = useState(1000);
  const [cat, setCat] = useState('전체');
  const [kwInput, setKwInput] = useState('');
  const [kw, setKw] = useState('');
  const [sort, setSort] = useState<SortKey>('d');
  const [flt, setFlt] = useState<string[]>([]);
  const [online, setOnline] = useState(false);
  // 기준 위치 바꾸기 창
  const [sheet, setSheet] = useState(false);
  const [locQ, setLocQ] = useState('');
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [finding, setFinding] = useState(false);
  // 지도 숫자 원을 눌렀을 때 보여줄 가게 묶음
  const [group, setGroup] = useState<Store[] | null>(null);
  // 목록에서 고른 가게 (지도에 빨갛게)
  const [focus, setFocus] = useState<string | null>(null);
  // 목록을 내리면 지도를 조금 작게
  const [mini, setMini] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const on = () => setMini(window.scrollY > 120);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [visible]);
  const pickFromList = (s: Store) => { setFocus(s.id); onPick(s); track('store_from_list'); };
  useBackClose(sheet, () => setSheet(false));

  // 기준 위치가 바뀌면 3km 안 가맹점을 한 번에 받아두고 반경·분야·검색어는 화면에서 거름
  useEffect(() => {
    setStores(null); setErr('');
    fetch(`/api/stores?lat=${place.lat.toFixed(5)}&lng=${place.lng.toFixed(5)}&r=3000`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setStores(j.items); setReady(j.ready !== false); setAsOf(j.asOf || null);
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
  // 목록 조건이 바뀌면 묶음 목록 닫기
  useEffect(() => { setGroup(null); setFocus(null); }, [shown, online]);
  const toggleFlt = (k: string) => { setFlt((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k])); track('filter_store', { f: k }); };
  const modeLabel = place.mode === 'gps' ? '현재 위치' : place.mode === 'search' ? '검색한 위치' : '기본 위치';

  return (
    <>
      <h2 className="tabtitle">문화누리 사용처</h2>

      <div className={`cstick ${mini ? 'mini' : ''}`}>
      <KakaoMap lat={place.lat} lng={place.lng} radius={radius} stores={online ? [] : shown} visible={visible} onPick={onPick} focusId={focus}
        onCluster={(l) => { setGroup(l); track('map_cluster', { n: l.length }); }}>
        <button className="maploc" onClick={() => setSheet(true)} aria-label="기준 위치 바꾸기">
          <span style={{ color: 'var(--mint)' }}><IcPin /></span>
          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><small>{modeLabel}</small><b>{place.label} 근처</b></span>
          <span className="locbar-btn">바꾸기 ▾</span>
        </button>
        <button className="maprad1" aria-label={`검색 반경 ${km(radius)}, 눌러서 바꾸기`} onClick={() => setRadius(RADII[(RADII.indexOf(radius) + 1) % RADII.length])}>
          반경 <b>{km(radius)}</b> <span aria-hidden>↻</span>
        </button>
      </KakaoMap>

      <form className="search" style={{ paddingRight: 5 }} onSubmit={applyKw}>
        <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
        <input value={kwInput} onChange={(e) => { setKwInput(e.target.value); if (!e.target.value) setKw(''); }} enterKeyHint="search" placeholder="가게 이름 검색 (예: 교보문고)" aria-label="가게 이름 검색" />
        {kwInput && <button type="button" className="gps" aria-label="검색어 지우기" onClick={clearKw}>✕</button>}
        <button className="sbtn">검색</button>
      </form>
      </div>
      {group && (
        <section className="clist" aria-label={`이 근처 가맹점 ${group.length}곳`}>
          <div className="clhead"><b>📍 이 근처 {group.length}곳</b><button className="ghost" onClick={() => setGroup(null)}>✕ 닫기</button></div>
          {group.map((s) => (
            <button key={s.id} className="clrow" onClick={() => onPick(s)}>
              <span className="tag"><StoreIcon cat={s.category || ''} />{s.category || '기타'}</span>
              <span className="clname"><b>{s.name}</b><small>{s.address}</small></span>
              <span className="d">{km(s.distance)} ›</span>
            </button>
          ))}
        </section>
      )}
      {kw && <div className="kwinfo">&lsquo;{kw}&rsquo; 이름이 들어간 가게 {nameHits}곳 · 아래 목록과 지도에 표시돼요 <button className="linkbtn" style={{ minHeight: 28 }} onClick={clearKw}>검색 해제</button></div>}

      {err ? <div className="empty">{err}</div> : !stores ? (
        <div className="list" aria-busy="true"><div className="skel" /><div className="skel" /></div>
      ) : !ready ? (
        <div className="notice"><b>가맹점 위치 정보를 준비하고 있어요</b><span>전국 가맹점의 위치를 지도에 표시할 수 있게 정리하는 중이에요. 잠시 후 다시 열어주세요.</span></div>
      ) : (
        <>
          <CatBar title={<>🗂️ 분야별 사용처 <span className="cap light">{online ? `온라인 ${ONLINE_SHOPS.length}곳` : `${shown.length}곳`}{!online && fmtAsOf(asOf) ? ` · ${fmtAsOf(asOf)} 기준` : ''}</span></>}
            right={online ? undefined : <label className="sortsel"><span className="sr">정렬</span><select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); track('sort_store', { s: e.target.value }); }}>{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select></label>}
            label="사용처 분야" items={[cats[0], { key: ONLINE, count: ONLINE_SHOPS.length }, ...cats.slice(1)]} current={online ? ONLINE : curCat}
            onPick={(k) => { if (k === ONLINE) { setOnline(true); track('online_shops'); } else { setOnline(false); setCat(k); } }} />
          {online ? (
            <div className="list">
              <div className="notice" style={{ gap: 4 }}><b>🌐 온라인에서도 쓸 수 있어요</b><span>인터넷 서점·영화 예매·기차표·숙박 예약 등에서 결제할 수 있어요. 처음 결제할 때 카드 등록(농협카드 일반결제)이 필요할 수 있어요.</span></div>
              {ONLINE_SHOPS.map((o) => (
                <a key={o.name} className="item" href={o.url} target="_blank" rel="noopener noreferrer" onClick={() => track('online_shop', { name: o.name })} style={{ textDecoration: 'none' }}>
                  <div className="row"><span className="tag">{o.cat}</span><span className="d" style={{ fontSize: 13 }}>바로가기 ›</span></div>
                  <strong>{o.name}</strong>
                  {o.tip && <span className="cap">{o.tip}</span>}
                </a>
              ))}
              <a className="linkbtn" href={MNURI} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center' }}>전체 온라인 가맹점은 문화누리카드 누리집에서 확인 ›</a>
            </div>
          ) : (<>
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
              <button key={s.id} className={`item ${focus === s.id ? 'focus' : ''}`} onClick={() => pickFromList(s)}>
                <div className="row">
                  <span className="tags"><span className="tag"><StoreIcon cat={s.category || ''} />{s.category || '기타'}</span>{s.review_count > 0 && <span className="mt check">후기 {s.review_count}</span>}</span>
                  <span className="d">{km(s.distance)}</span>
                </div>
                <strong>{s.name}</strong>
                <span className="cap">{s.address}</span>
                {(s.paid_yes || s.paid_no || s.rating_avg) ? (() => { const pl = paidLine(s.paid_yes, s.paid_no, s.rating_avg); return (
                  <span className="paidsum">{pl.text && <span className="paidok">✓ {pl.text}</span>}{pl.warn && <span className="paidno">⚠ {s.no_items?.length ? `${s.no_items.map((k) => (ITEMS[k] || k).replace(/^\S+\s/, '')).join('·')} 결제 안 됨` : pl.warn}</span>}</span>
                ); })() : null}
              </button>
            ))}
          </div>
          </>)}
        </>
      )}
      <a className="gbanner" href="/guide/culture-nuri-card"><span aria-hidden>🎫</span><span><b>문화누리카드, 누가 얼마나 받을까요?</b><small>2026년 지원 금액 · 신청 기간 · 자동 재충전</small></span><span aria-hidden>›</span></a>
      <Footer notes={['가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요.', '방문 전 문화누리카드 결제 가능 여부를 가게에 확인하세요.']} />

      {sheet && (
        <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="box" role="dialog" aria-modal="true" aria-label="기준 위치 바꾸기">
            <div className="sheethead"><div className="grab" />
            <div className="row"><strong style={{ fontSize: 17 }}>기준 위치 바꾸기</strong><button className="ghost" onClick={() => setSheet(false)}>닫기</button></div></div>
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
