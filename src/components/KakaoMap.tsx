'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { loadKakaoMaps } from '@/lib/client';
import { Store } from '@/lib/types';

const LEVEL: Record<number, number> = { 500: 4, 1000: 5, 3000: 7 };
const GRID = 76; // 이 픽셀 안에 모인 가게는 말풍선 하나로 묶음 (말풍선끼리 안 겹치게)
const LIST_MAX = 10; // 묶음이 이 개수 이하면 눌렀을 때 목록으로 보여줌

// 분야 아이콘 (목록의 분야 태그와 같은 모양)
const SV = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
function catIcon(c: string) {
  if (/도서|서점|책/.test(c)) return SV('<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>');
  if (/영화/.test(c)) return SV('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M10 10l5 2.5-5 2.5z"/>');
  if (/음반|음악|악기/.test(c)) return SV('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>');
  if (/여행|숙박|관광|교통|캠핑/.test(c)) return SV('<path d="M3 20L12 4l9 16z"/><path d="M12 20v-6"/>');
  if (/체육|스포츠|운동|경기/.test(c)) return SV('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16"/>');
  return SV('<path d="M5 20V9l7-5 7 5v11"/><path d="M9 20v-6h6v6"/>');
}
const esc = (t: string) => t.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m] as string));
const short = (t: string, n: number) => (t.length > n ? t.slice(0, n) + '…' : t);

/**
 * 카카오 지도
 * - 기본은 '고정': 지도 위를 쓸어도 페이지가 스크롤됨. 핀·숫자 원 누르기는 됨
 * - '지도 움직이기'를 켜면 끌기·확대 가능
 */
export default function KakaoMap({ lat, lng, radius, stores, visible, onPick, onCluster, focusId, children }: {
  lat: number; lng: number; radius: number; stores: Store[]; visible: boolean; onPick: (s: Store) => void;
  /** 목록에서 고른 가게: 지도에서 빨갛게 강조하고 그 위치로 이동 */
  focusId?: string | null;
  /** 숫자 원을 눌렀을 때 그 안의 가게 목록 (10곳 이하이거나 더 확대할 수 없을 때) */
  onCluster?: (list: Store[]) => void; children?: ReactNode;
}) {
  const el = useRef<HTMLDivElement>(null);
  const st = useRef<{ kakao?: any; map?: any; circle?: any; me?: any; overlays: any[] }>({ overlays: [] });
  const [msg, setMsg] = useState('지도를 불러오는 중이에요');
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [hint, setHint] = useState(false);
  const hintT = useRef<ReturnType<typeof setTimeout>>();
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const clRef = useRef(onCluster);
  clRef.current = onCluster;
  const storesRef = useRef(stores);
  storesRef.current = stores;
  const focusRef = useRef(focusId);
  focusRef.current = focusId;

  // 지도 만들기
  useEffect(() => {
    if (!visible || st.current.map) return;
    let alive = true;
    loadKakaoMaps().then((kakao) => {
      if (!alive || !el.current) return;
      const center = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(el.current, { center, level: LEVEL[radius] || 5, draggable: false, scrollwheel: false, disableDoubleClickZoom: true });
      map.setZoomable(false);
      const dot = document.createElement('div');
      dot.style.cssText = 'width:18px;height:18px;border-radius:50%;background:var(--me);border:3px solid #fff;box-shadow:0 0 0 2px rgba(45,108,223,.25)';
      st.current = { kakao, map, overlays: [],
        circle: new kakao.maps.Circle({ map, center, radius, strokeWeight: 2, strokeColor: '#0F8A68', strokeOpacity: 0.5, fillColor: '#0F8A68', fillOpacity: 0.08 }),
        me: new kakao.maps.CustomOverlay({ map, position: center, content: dot, yAnchor: 0.5, xAnchor: 0.5, zIndex: 3 }),
      };
      kakao.maps.event.addListener(map, 'idle', () => drawPins());
      setMsg(''); setReady(true);
    }).catch(() => setMsg('지도를 불러오지 못했어요. 잠시 후 다시 열어주세요.'));
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

  // 움직이기 켜고 끄기
  useEffect(() => {
    const { map } = st.current;
    if (!map) return;
    map.setDraggable(live); map.setZoomable(live);
  }, [live, ready]);

  // 말풍선 그리기: 화면 위 가까운 가게끼리 묶음 말풍선 하나로
  function drawPins() {
    const { kakao, map } = st.current;
    if (!map) return;
    st.current.overlays.forEach((o) => o.setMap(null));
    const proj = map.getProjection();
    const fid = focusRef.current;
    const groups = new Map<string, { list: Store[]; x: number; y: number }>();
    let focused: Store | null = null;
    for (const s of storesRef.current.slice(0, 400)) {
      if (fid && s.id === fid) { focused = s; continue; }
      const pt = proj.containerPointFromCoords(new kakao.maps.LatLng(s.lat, s.lng));
      const key = `${Math.floor(pt.x / GRID)}:${Math.floor(pt.y / GRID)}`;
      const g = groups.get(key);
      if (g) { g.list.push(s); g.x += pt.x; g.y += pt.y; } else groups.set(key, { list: [s], x: pt.x, y: pt.y });
    }
    const out: any[] = [];
    const tag = (cls: string, icon: string, text: string, label: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mk tg ${cls}`;
      btn.innerHTML = `<i>${icon}</i><span>${esc(text)}</span>`;
      btn.setAttribute('aria-label', label);
      btn.onclick = onClick;
      return btn;
    };
    groups.forEach((g) => {
      if (g.list.length === 1) {
        const s = g.list[0];
        const c = s.category || '기타';
        const btn = tag('', catIcon(c), short(c, 5), s.name, () => pickRef.current(s));
        out.push(new kakao.maps.CustomOverlay({ map, position: new kakao.maps.LatLng(s.lat, s.lng), content: btn, yAnchor: 1, zIndex: 2 }));
      } else {
        const n = g.list.length;
        const pos = proj.coordsFromContainerPoint(new kakao.maps.Point(g.x / n, g.y / n));
        // 묶음에서 가장 많은 분야 아이콘
        const cnt = new Map<string, number>();
        g.list.forEach((s) => cnt.set(s.category || '기타', (cnt.get(s.category || '기타') || 0) + 1));
        const top = Array.from(cnt.entries()).sort((a, b) => b[1] - a[1])[0][0];
        const asList = !!clRef.current && (n <= LIST_MAX || map.getLevel() <= 2);
        const btn = tag('grp', catIcon(top), `${n}곳`, asList ? `가맹점 ${n}곳, 눌러서 목록 보기` : `가맹점 ${n}곳, 눌러서 확대`, () => {
          if (asList) clRef.current?.(g.list.slice().sort((a, b) => a.distance - b.distance));
          else map.setLevel(Math.max(1, map.getLevel() - 2), { anchor: pos, animate: true });
        });
        out.push(new kakao.maps.CustomOverlay({ map, position: pos, content: btn, yAnchor: 1, zIndex: 2 }));
      }
    });
    if (focused) {
      const s = focused;
      const btn = tag('on', catIcon(s.category || ''), short(s.name, 10), s.name, () => pickRef.current(s));
      out.push(new kakao.maps.CustomOverlay({ map, position: new kakao.maps.LatLng(s.lat, s.lng), content: btn, yAnchor: 1, zIndex: 4 }));
    }
    st.current.overlays = out;
  }
  // 목록에서 가게를 고르면 그 위치로 이동
  useEffect(() => {
    const { kakao, map } = st.current;
    if (!map) return;
    if (focusId) {
      const s = storesRef.current.find((x) => x.id === focusId);
      if (s) map.panTo(new kakao.maps.LatLng(s.lat, s.lng));
    }
    drawPins();
  }, [focusId, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  // 지도 칸 크기가 바뀌면(스크롤 때 작아짐) 다시 맞춤
  useEffect(() => {
    if (!el.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (st.current.map) st.current.map.relayout(); });
    ro.observe(el.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { drawPins(); }, [stores, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // 고정 상태: 위에 투명 판을 덮어 세로 스크롤은 페이지로, 톡 누르기는 아래 핀으로 전달
  const showHint = () => { setHint(true); clearTimeout(hintT.current); hintT.current = setTimeout(() => setHint(false), 1400); };
  const passTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const pad = e.currentTarget;
    pad.style.pointerEvents = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    pad.style.pointerEvents = '';
    const mk = under?.closest?.('.mk') as HTMLElement | null;
    if (mk) mk.click(); else showHint();
  };

  // PC: 고정 상태에서도 핀·숫자 위에 마우스를 올리면 손가락 모양
  const hoverPin = (e: React.MouseEvent<HTMLDivElement>) => {
    const pad = e.currentTarget;
    pad.style.pointerEvents = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    pad.style.pointerEvents = '';
    pad.style.cursor = under?.closest?.('.mk') ? 'pointer' : 'default';
  };

  return (
    <div className={`map ${live ? 'live' : ''}`} role="region" aria-label="내 주변 가맹점 지도">
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      {!live && ready && <div className="lockpad" onClick={passTap} onMouseMove={hoverPin} onTouchStart={(e) => { if (e.touches.length > 1) showHint(); }} />}
      {msg && <div className="msg">{msg}</div>}
      {hint && !live && <div className="maphint"><span>지도를 옮기려면 &lsquo;지도 움직이기&rsquo;를 눌러주세요</span></div>}
      {children}
      {ready && (
        <button className={`movebtn ${live ? 'on' : ''}`} onClick={() => setLive(!live)} aria-pressed={live}>
          {live ? '✓ 완료' : '🖐 지도 움직이기'}
        </button>
      )}
    </div>
  );
}
