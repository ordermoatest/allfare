'use client';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { IcHeart, IcPhone, IcRoute, StoreIcon } from './icons';
import { Store, km, paidLine } from '@/lib/types';
import { deviceId } from '@/lib/profile';
import { track } from '@/lib/client';

type Review = {
  id: number; nick: string; body: string; hearts: number; at: string; edited: boolean;
  paid: boolean | null; rating: number | null; liked: boolean; reported: boolean; mine: boolean; hidden?: boolean;
};
type Summary = { yes: number; no: number; avg: number | null; ratingCount: number };

const ymd = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const Stars = ({ n }: { n: number }) => <span className="stars" aria-label={`별점 ${n}점`}>{'★'.repeat(n)}<i>{'★'.repeat(5 - n)}</i></span>;
const json = (b: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

export default function StoreSheet({ store: s, onClose, toast }: { store: Store; onClose: () => void; toast: (m: string) => void }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [mine, setMine] = useState<Review | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [all, setAll] = useState(false);
  // 작성/수정 폼
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [paid, setPaid] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [delArm, setDelArm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const lock = useRef(false);

  const load = useCallback(() => {
    return fetch(`/api/stores/${s.id}/reviews?device=${encodeURIComponent(deviceId())}`)
      .then((r) => r.json())
      .then((j) => { setReviews(j.items || []); setMine(j.mine || null); setSum(j.summary || null); })
      .catch(() => setReviews([]));
  }, [s.id]);
  useEffect(() => { setReviews(null); setAll(false); load(); track('view_store', { id: s.id, name: s.name }); }, [load, s.id, s.name]);
  useEffect(() => { if (!delArm) return; const t = setTimeout(() => setDelArm(false), 4000); return () => clearTimeout(t); }, [delArm]);

  const startEdit = () => { if (!mine) return; setText(mine.body); setPaid(mine.paid); setRating(mine.rating); setEditing(true); };
  const resetForm = () => { setText(''); setPaid(null); setRating(null); setEditing(false); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (lock.current) return; // 연타 방지
    const v = text.trim();
    if (paid === null) { toast("결제가 됐는지 먼저 골라주세요"); return; }
    if (v.length < 5) { toast('후기는 5자 이상 써주세요'); return; }
    lock.current = true; setSending(true);
    try {
      const body = { body: v, device: deviceId(), paid, rating };
      const r = editing && mine
        ? await fetch(`/api/reviews/${mine.id}`, { ...json(body), method: 'PATCH' })
        : await fetch(`/api/stores/${s.id}/reviews`, json(body));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      toast(editing ? '후기를 고쳤어요' : '후기를 등록했어요');
      track(editing ? 'edit_review' : 'post_review', { id: s.id });
      resetForm(); await load();
    } catch (er) { toast(er instanceof Error ? er.message : '등록하지 못했어요'); }
    setSending(false);
    setTimeout(() => { lock.current = false; }, 1500);
  };

  const remove = async () => {
    if (!mine) return;
    if (!delArm) { setDelArm(true); return; }
    setDeleting(true);
    try {
      const r = await fetch(`/api/reviews/${mine.id}?device=${encodeURIComponent(deviceId())}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      toast('후기를 지웠어요'); setDelArm(false); resetForm(); await load();
    } catch (er) { toast(er instanceof Error ? er.message : '지우지 못했어요'); }
    setDeleting(false);
  };

  // 하트: 먼저 화면에 반영 → 실패하면 되돌림
  const heart = async (rv: Review) => {
    if (busy[rv.id]) return;
    setBusy((b) => ({ ...b, [rv.id]: true }));
    const flip = (x: Review) => (x.id === rv.id ? { ...x, liked: !rv.liked, hearts: rv.hearts + (rv.liked ? -1 : 1) } : x);
    setReviews((l) => (l || []).map(flip));
    try {
      const r = await fetch(`/api/reviews/${rv.id}/heart`, json({ device: deviceId() }));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setReviews((l) => (l || []).map((x) => (x.id === rv.id ? { ...x, liked: j.liked, hearts: j.count } : x)));
    } catch (er) {
      setReviews((l) => (l || []).map((x) => (x.id === rv.id ? rv : x)));
      toast(er instanceof Error ? er.message : '잠시 후 다시 시도해 주세요');
    }
    setBusy((b) => ({ ...b, [rv.id]: false }));
  };

  const report = async (rv: Review) => {
    if (busy[-rv.id]) return;
    setBusy((b) => ({ ...b, [-rv.id]: true }));
    try {
      const r = await fetch(`/api/reviews/${rv.id}/report`, json({ device: deviceId() }));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (j.hidden) { toast('신고가 3건 쌓여 이 후기는 숨겨졌어요'); setReviews((l) => (l || []).filter((x) => x.id !== rv.id)); }
      else { toast('신고가 접수됐어요. 3건이 쌓이면 자동으로 숨겨져요'); setReviews((l) => (l || []).map((x) => (x.id === rv.id ? { ...x, reported: true } : x))); }
    } catch (er) { toast(er instanceof Error ? er.message : '잠시 후 다시 시도해 주세요'); }
    setBusy((b) => ({ ...b, [-rv.id]: false }));
  };

  const route = `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
  const info = s.place_url || `https://map.kakao.com/link/search/${encodeURIComponent(s.name)}`;
  const others = (reviews || []).filter((r) => !r.mine);
  const shown = all ? others : others.slice(0, 3);
  const total = reviews?.length || 0;
  const pl = paidLine(sum?.yes, sum?.no, sum?.avg);
  const showForm = !mine || editing;

  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="box" role="dialog" aria-modal="true" aria-label={s.name}>
        <div className="grab" />
        <div className="row"><span className="tag"><StoreIcon cat={s.category || ''} />{s.category || '기타'}</span><button className="ghost" onClick={onClose}>닫기</button></div>
        <h1 style={{ fontSize: 22 }}>{s.name}</h1>
        <span className="cap">문화누리카드 가맹점 · 여기서 {km(s.distance)}</span>
        {(pl.text || pl.warn) && (
          <div className="paidsum">
            {pl.text && <span className="paidok">✓ {pl.text}</span>}
            {pl.warn && <span className="paidno">⚠ {pl.warn}</span>}
          </div>
        )}
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
          <div className="row"><strong style={{ fontSize: 16 }}>이용 후기 <span style={{ color: 'var(--mint)' }}>{reviews ? total : ''}</span></strong><span className="cap">하트 많은 순</span></div>

          {mine && !editing && (
            <article className="rev minerev">
              <div className="row">
                <span className="cap"><b style={{ color: 'var(--mint)' }}>내 후기</b> · {ymd(mine.at)}{mine.edited && ' (수정됨)'}</span>
                <span className="mineacts">
                  <button className="ghost" onClick={startEdit}>수정</button>
                  <button className={`ghost ${delArm ? 'danger' : ''}`} onClick={remove} disabled={deleting}>
                    {deleting ? <><i className="spin" />삭제 중…</> : delArm ? '한 번 더 누르면 삭제' : '삭제'}
                  </button>
                </span>
              </div>
              <div className="rmeta">
                {mine.paid !== null && <span className={`pbadge ${mine.paid ? 'yes' : 'no'}`}>{mine.paid ? '결제 됐어요' : '결제 안 됐어요'}</span>}
                {mine.rating && <Stars n={mine.rating} />}
              </div>
              <p>{mine.body}</p>
              {mine.hidden && <p className="cap" style={{ color: 'var(--warn)' }}>신고가 쌓여 다른 사람에게는 숨겨진 후기예요</p>}
            </article>
          )}

          {showForm && (
            <form className="rform" onSubmit={submit}>
              <span className="cap">{editing ? '내 후기 고치기' : '문화누리카드로 결제해 보셨나요?'} <b style={{ color: 'var(--warn)' }}>*</b></span>
              <div className="paybtns" role="radiogroup" aria-label="결제 여부">
                <button type="button" role="radio" aria-checked={paid === true} className={paid === true ? 'on yes' : ''} onClick={() => setPaid(true)}>✓ 결제 됐어요</button>
                <button type="button" role="radio" aria-checked={paid === false} className={paid === false ? 'on no' : ''} onClick={() => setPaid(false)}>✕ 안 됐어요</button>
              </div>
              <div className="starpick" role="radiogroup" aria-label="별점 (선택)">
                <span className="cap">별점 (선택)</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n}점`} className={rating && n <= rating ? 'on' : ''} onClick={() => setRating(rating === n ? null : n)}>★</button>
                ))}
              </div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200} rows={2} aria-label="후기 내용" placeholder="결제 방법, 주차, 분위기 등 도움 되는 후기를 남겨주세요" />
              <div className="row">
                <span className="cap">{text.length}/200 · 링크·연락처는 쓸 수 없어요</span>
                <span className="mineacts">
                  {editing && <button type="button" className="ghost" onClick={resetForm} disabled={sending}>취소</button>}
                  <button className="rsend" disabled={sending}>{sending ? <><i className="spin" />{editing ? '저장 중…' : '등록 중…'}</> : editing ? '저장' : '후기 등록'}</button>
                </span>
              </div>
            </form>
          )}

          {reviews === null && <div className="skel" style={{ height: 70 }} />}
          {reviews && others.length === 0 && !mine && <p className="cap" style={{ textAlign: 'center', margin: '6px 0' }}>첫 후기를 남겨주세요</p>}
          {shown.map((r, k) => (
            <article key={r.id} className={`rev ${k === 0 && r.hearts > 0 ? 'best' : ''}`}>
              <div className="row"><span className="cap"><b style={{ color: 'var(--ink)' }}>{r.nick}</b> · {ymd(r.at)}{r.edited && ' (수정됨)'}</span>{k === 0 && r.hearts > 0 && <span className="tag">베스트</span>}</div>
              {(r.paid !== null || r.rating) && (
                <div className="rmeta">
                  {r.paid !== null && <span className={`pbadge ${r.paid ? 'yes' : 'no'}`}>{r.paid ? '결제 됐어요' : '결제 안 됐어요'}</span>}
                  {r.rating && <Stars n={r.rating} />}
                </div>
              )}
              <p>{r.body}</p>
              <div className="row">
                <button className={`rh ${r.liked ? 'on' : ''}`} aria-pressed={r.liked} aria-label="도움돼요 하트" onClick={() => heart(r)}><IcHeart size={16} />{r.hearts}</button>
                <button className="rrep" disabled={r.reported || busy[-r.id]} onClick={() => report(r)}>{busy[-r.id] ? '신고 중…' : r.reported ? '신고됨' : '신고'}</button>
              </div>
            </article>
          ))}
          {!all && others.length > 3 && <button className="morebtn" onClick={() => setAll(true)}>후기 {others.length}개 모두 보기</button>}
        </section>
        <p className="note">방문 전 문화누리카드 결제 가능 여부를 가게에 확인하세요.</p>
      </div>
    </div>
  );
}
