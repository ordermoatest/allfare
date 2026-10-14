'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IcHeart, IcPhone, IcRoute, StoreIcon } from './icons';
import { Store, km } from '@/lib/types';
import { deviceId } from '@/lib/profile';
import { track } from '@/lib/client';

type Review = { id: number; nick: string; body: string; hearts: number; at: string; liked: boolean; reported: boolean };

const ymd = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };

export default function StoreSheet({ store: s, onClose, toast }: { store: Store; onClose: () => void; toast: (m: string) => void }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/stores/${s.id}/reviews?device=${encodeURIComponent(deviceId())}`)
      .then((r) => r.json()).then((j) => setReviews(j.items || [])).catch(() => setReviews([]));
  }, [s.id]);
  useEffect(() => { setReviews(null); load(); track('view_store', { id: s.id, name: s.name }); }, [load, s.id, s.name]);

  const post = async (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (v.length < 5) { toast('후기는 5자 이상 써주세요'); return; }
    setSending(true);
    try {
      const r = await fetch(`/api/stores/${s.id}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: v, device: deviceId() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setText(''); toast('후기를 등록했어요'); load(); track('post_review', { id: s.id });
    } catch (er) { toast(er instanceof Error ? er.message : '등록하지 못했어요'); }
    setSending(false);
  };

  const heart = async (rv: Review) => {
    try {
      const r = await fetch(`/api/reviews/${rv.id}/heart`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device: deviceId() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setReviews((list) => (list || []).map((x) => (x.id === rv.id ? { ...x, liked: j.liked, hearts: j.count } : x)).sort((a, b) => b.hearts - a.hearts));
    } catch (er) { toast(er instanceof Error ? er.message : '잠시 후 다시 시도해 주세요'); }
  };

  const report = async (rv: Review) => {
    try {
      const r = await fetch(`/api/reviews/${rv.id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device: deviceId() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (j.hidden) { toast('신고가 3건 쌓여 이 후기는 숨겨졌어요'); setReviews((l) => (l || []).filter((x) => x.id !== rv.id)); }
      else { toast('신고가 접수됐어요. 3건이 쌓이면 자동으로 숨겨져요'); setReviews((l) => (l || []).map((x) => (x.id === rv.id ? { ...x, reported: true } : x))); }
    } catch (er) { toast(er instanceof Error ? er.message : '잠시 후 다시 시도해 주세요'); }
  };

  const route = `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
  const info = s.place_url || `https://map.kakao.com/link/search/${encodeURIComponent(s.name)}`;

  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="box" role="dialog" aria-modal="true" aria-label={s.name}>
        <div className="grab" />
        <div className="row"><span className="tag"><StoreIcon cat={s.category || ''} />{s.category || '기타'}</span><button className="ghost" onClick={onClose}>닫기</button></div>
        <h1 style={{ fontSize: 22 }}>{s.name}</h1>
        <span className="cap">문화누리카드 가맹점 · 여기서 {km(s.distance)}</span>
        <div className="acts">
          {s.phone
            ? <a className="act" href={`tel:${s.phone.replace(/[^0-9]/g, '')}`} onClick={() => track('call_store', { id: s.id })}><IcPhone /><span className="sel">{s.phone}</span></a>
            : <span className="act off"><IcPhone />번호 없음</span>}
          <a className="act main" href={route} target="_blank" rel="noopener noreferrer" onClick={() => track('route_store', { id: s.id })}><IcRoute />길찾기</a>
        </div>
        <section className="panel">
          <div className="kv"><em>주소</em><p className="sel">{s.address}</p></div><hr />
          <div className="kv"><em>영업시간</em>
            <div className="row"><span className="cap">휴무일·영업시간은 카카오맵에서 확인</span><a className="ghost" href={info} target="_blank" rel="noopener noreferrer">카카오맵 ›</a></div>
          </div>
        </section>

        <section className="panel" aria-label="이용 후기">
          <div className="row"><strong style={{ fontSize: 16 }}>이용 후기 <span style={{ color: 'var(--mint)' }}>{reviews?.length ?? ''}</span></strong><span className="cap">하트 많은 순</span></div>
          <form className="rform" onSubmit={post}>
            <label htmlFor="rtext" className="cap">문화누리카드로 이용해 보셨나요?</label>
            <textarea id="rtext" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} rows={2} placeholder="결제 방법, 주차, 분위기 등 도움 되는 후기를 남겨주세요" />
            <div className="row"><span className="cap">{text.length}/200 · 링크·연락처는 쓸 수 없어요</span><button className="rsend" disabled={sending}>후기 등록</button></div>
          </form>
          {reviews === null && <div className="skel" style={{ height: 70 }} />}
          {reviews?.length === 0 && <p className="cap" style={{ textAlign: 'center', margin: '6px 0' }}>첫 후기를 남겨주세요</p>}
          {reviews?.map((r, k) => (
            <article key={r.id} className={`rev ${k === 0 && r.hearts > 0 ? 'best' : ''}`}>
              <div className="row"><span className="cap"><b style={{ color: 'var(--ink)' }}>{r.nick}</b> · {ymd(r.at)}</span>{k === 0 && r.hearts > 0 && <span className="tag">베스트</span>}</div>
              <p>{r.body}</p>
              <div className="row">
                <button className={`rh ${r.liked ? 'on' : ''}`} aria-pressed={r.liked} aria-label="도움돼요 하트" onClick={() => heart(r)}><IcHeart size={16} />{r.hearts}</button>
                <button className="rrep" disabled={r.reported} onClick={() => report(r)}>{r.reported ? '신고됨' : '신고'}</button>
              </div>
            </article>
          ))}
        </section>
        <p className="note">방문 전 문화누리카드 결제 가능 여부를 가게에 확인하세요.</p>
      </div>
    </div>
  );
}
