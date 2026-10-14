'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { loadKakaoMaps } from '@/lib/client';
import { Store } from '@/lib/types';

const LEVEL: Record<number, number> = { 500: 4, 1000: 5, 3000: 7 };

export default function KakaoMap({ lat, lng, radius, stores, visible, onPick }: {
  lat: number; lng: number; radius: number; stores: Store[]; visible: boolean; onPick: (s: Store) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const st = useRef<{ kakao?: any; map?: any; circle?: any; me?: any; markers: any[] }>({ markers: [] });
  const [msg, setMsg] = useState('지도를 불러오는 중이에요');
  const [ready, setReady] = useState(false);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  // 지도 만들기
  useEffect(() => {
    if (!visible || st.current.map) return;
    let alive = true;
    loadKakaoMaps().then((kakao) => {
      if (!alive || !el.current) return;
      const center = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(el.current, { center, level: LEVEL[radius] || 5 });
      const dot = document.createElement('div');
      dot.style.cssText = 'width:18px;height:18px;border-radius:50%;background:var(--me);border:3px solid #fff;box-shadow:0 0 0 2px rgba(45,108,223,.25)';
      st.current = { kakao, map, markers: [],
        circle: new kakao.maps.Circle({ map, center, radius, strokeWeight: 2, strokeColor: '#0F8A68', strokeOpacity: 0.5, fillColor: '#0F8A68', fillOpacity: 0.08 }),
        me: new kakao.maps.CustomOverlay({ map, position: center, content: dot, yAnchor: 0.5, xAnchor: 0.5, zIndex: 3 }),
      };
      setMsg(''); setReady(true);
    }).catch(() => setMsg('지도를 불러오지 못했어요. 카카오 앱 키와 등록된 도메인을 확인해 주세요.'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // 탭이 다시 보일 때 크기 다시 계산
  useEffect(() => { if (visible && st.current.map) { st.current.map.relayout(); st.current.map.setCenter(new st.current.kakao.maps.LatLng(lat, lng)); } }, [visible, lat, lng]);

  // 중심·반경
  useEffect(() => {
    const { kakao, map, circle, me } = st.current;
    if (!map) return;
    const c = new kakao.maps.LatLng(lat, lng);
    map.setLevel(LEVEL[radius] || 5);
    map.setCenter(c);
    circle.setPosition(c); circle.setRadius(radius);
    me.setPosition(c);
  }, [lat, lng, radius, ready]);

  // 가맹점 표시
  useEffect(() => {
    const { kakao, map } = st.current;
    if (!map) return;
    st.current.markers.forEach((m) => m.setMap(null));
    st.current.markers = stores.slice(0, 200).map((s) => {
      const m = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(s.lat, s.lng), title: s.name, clickable: true });
      kakao.maps.event.addListener(m, 'click', () => pickRef.current(s));
      return m;
    });
  }, [stores, ready]);

  return (
    <div className="map" role="region" aria-label="내 주변 가맹점 지도">
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}
