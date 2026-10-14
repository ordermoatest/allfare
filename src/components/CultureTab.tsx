'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import CatBar from './CatBar';
import Footer from './Footer';
import KakaoMap from './KakaoMap';
import { IcGps, IcSearch, StoreIcon } from './icons';
import { Place, Store, km } from '@/lib/types';
import { Profile, regionLabel } from '@/lib/profile';
import { track } from '@/lib/client';

const RADII = [500, 1000, 3000];
const DEFAULT: Place = { lat: 37.5665, lng: 126.978, label: '서울 시청', mode: 'home' };

export default function CultureTab({ visible, profile, onPick, toast }: {
  visible: boolean; profile: Profile; onPick: (s: Store) => void; toast: (m: string) => void;
}) {
  const [place, setPlace] = useState<Place | null>(null);
  const [stores, setStores] = useState<Store[] | null>(null);
  const [err, setErr] = useState('');
  const [radius, setRadius] = useState(1000);
  const [cat, setCat] = useState('전체');
  const [q, setQ] = useState('');
  const [locating, setLocating] = useState(false);

  const fallback = async () => {
    if (profile.sido) {
      try {
        const r = await fetch(`/api/geo?q=${encodeURIComponent(regionLabel(profile))}`);
        const j = await r.json();
        if (r.ok) { setPlace({ lat: j.lat, lng: j.lng, label: regionLabel(profile), mode: 'home' }); return; }
      } catch { /* 기본 위치로 */ }
    }
    setPlace(DEFAULT);
  };

  const locateMe = (manual: boolean) => {
    if (!('geolocation' in navigator)) { if (manual) toast('이 브라우저는 위치 확인을 지원하지 않아요'); else fallback(); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setPlace({ lat, lng, label: '현재 위치', mode: 'gps' });
      setQ(''); setLocating(false);
      track('use_gps');
      try { const r = await fetch(`/api/geo?lat=${lat}&lng=${lng}`); const j = await r.json(); if (r.ok) setPlace({ lat, lng, label: j.label, mode: 'gps' }); } catch { /* 이름 없이 */ }
    }, () => {
      setLocating(false);
      if (manual) toast('위치 권한을 허용하면 내 주변을 보여드려요. 동네 이름으로 검색할 수도 있어요');
      if (!place) fallback();
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  };

  // 처음 탭을 열 때 현재 위치부터
  useEffect(() => { if (visible && !place && !locating) locateMe(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [visible]);

  // 위치가 바뀌면 3km 안 가맹점을 한 번에 받아두고 반경은 화면에서 거름
  useEffect(() => {
    if (!place) return;
    setStores(null); setErr('');
    fetch(`/api/stores?lat=${place.lat.toFixed(5)}&lng=${place.lng.toFixed(5)}&r=3000`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setStores(j.items);
    }).catch((e) => setErr(e.message || '가맹점을 불러오지 못했어요'));
  }, [place]);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(v)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPlace({ lat: j.lat, lng: j.lng, label: j.label, mode: 'search' });
      track('search_place', { q: v });
    } catch (er) { toast(er instanceof Error ? er.message : '검색하지 못했어요'); }
  };

  const inR = useMemo(() => (stores || []).filter((s) => s.distance <= radius), [stores, radius]);
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    inR.forEach((s) => { const c = s.category || '기타'; m.set(c, (m.get(c) || 0) + 1); });
    return [{ key: '전체', count: inR.length }, ...Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }))];
  }, [inR]);
  const curCat = cats.some((c) => c.key === cat) ? cat : '전체';
  const shown = useMemo(() => inR.filter((s) => curCat === '전체' || (s.category || '기타') === curCat), [inR, curCat]);

  return (
    <>
      <div><h1>문화누리 사용처</h1><div className="cap">{place ? `${place.mode === 'gps' ? '현재 위치' : place.mode === 'search' ? '검색한 지역' : '기준 지역'} · ${place.label} 근처` : '위치를 확인하는 중이에요'}</div></div>
      <form className="search" style={{ paddingRight: 5 }} onSubmit={search}>
        <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" placeholder="동네·역·주소 (예: 백석동)" aria-label="지역 검색" />
        <button type="button" className={`gps ${place?.mode === 'gps' ? 'on' : ''}`} aria-label="현재 위치로 찾기" onClick={() => locateMe(true)} disabled={locating}><IcGps /></button>
      </form>
      {place && <KakaoMap lat={place.lat} lng={place.lng} radius={radius} stores={shown} visible={visible} onPick={onPick} />}
      <div className="seg" role="group" aria-label="검색 반경">
        {RADII.map((r) => <button key={r} className={radius === r ? 'on' : ''} aria-pressed={radius === r} onClick={() => setRadius(r)}>반경 {km(r)}</button>)}
      </div>

      {err ? <div className="empty">{err}</div> : !stores ? (
        <div className="list" aria-busy="true"><div className="skel" /><div className="skel" /></div>
      ) : (
        <>
          <CatBar title={<>분야별 사용처 <span className="cap light">{shown.length}곳</span></>} right={<span className="cap">가까운 순</span>}
            label="사용처 분야" items={cats} current={curCat} onPick={setCat} />
          <div className="list">
            {shown.length === 0 && <div className="empty">반경 안에 사용처가 없어요.<br />반경을 넓히거나 다른 동네로 검색해 보세요.</div>}
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
    </>
  );
}
