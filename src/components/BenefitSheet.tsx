'use client';
import { useEffect, useState } from 'react';
import { IcHeart, IcOut, IcShare } from './icons';
import { Profile, deviceId } from '@/lib/profile';
import { conditionSummary, evaluate, explain, Match } from '@/lib/match';
import { deadlineLabel } from '@/lib/deadline';
import { shareLink, track } from '@/lib/client';

type Detail = {
  id: string; name: string; summary: string | null; category: string; supportType: string | null;
  target: string | null; criteria: string | null; content: string | null; how: string | null;
  deadlineText: string | null; deadlineKind: string | null; deadlineEnd: string | null;
  url: string | null; org: string | null; dept: string | null; receiver: string | null; phone: string | null;
  views: number; likes: number; lo: number; hi: number; codes: string[];
};

const MT: Record<Match, [string, string]> = {
  ok: ['조건 맞음', '입력한 나이·소득·상황 기준에 맞아요'],
  check: ['확인 필요', '세부 조건은 신청처에서 확인하세요'],
  no: ['조건 안 맞음', '입력한 조건과 맞지 않아요'],
};

export default function BenefitSheet({ id, profile, liked, onLiked, onClose, toast }: {
  id: string; profile: Profile; liked: boolean;
  onLiked: (id: string, liked: boolean, count: number) => void; onClose: () => void; toast: (m: string) => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState('');
  const [likes, setLikes] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setD(null); setErr('');
    fetch(`/api/benefits/${encodeURIComponent(id)}`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setD(j); setLikes(j.likes);
      track('view_benefit', { id, name: j.name });
    }).catch((e) => setErr(e.message || '불러오지 못했어요'));
  }, [id]);

  const like = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, device: deviceId() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setLikes(j.count); onLiked(id, j.liked, j.count);
      if (j.liked) track('like_benefit', { id });
    } catch (e) { toast(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요'); }
    setBusy(false);
  };

  const share = async () => {
    if (!d) return;
    const url = `${location.origin}/benefit/${encodeURIComponent(d.id)}`;
    const r = await shareLink(d.name, d.summary || '올페어에서 확인해 보세요', url);
    track('share_benefit', { id: d.id, via: r });
    if (r === 'copied') toast('링크를 복사했어요');
    if (r === 'fail') toast('공유하지 못했어요');
  };

  const m = d ? evaluate({ lo: d.lo, hi: d.hi, codes: d.codes }, profile) : 'check';
  const conds = d ? conditionSummary({ lo: d.lo, hi: d.hi, codes: d.codes }) : [];
  const checks = d && profile.set ? explain({ lo: d.lo, hi: d.hi, codes: d.codes }, profile) : [];
  const dl = d ? deadlineLabel(d.deadlineKind, d.deadlineEnd) : null;
  const applyUrl = d?.url || 'https://www.gov.kr';

  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="box" role="dialog" aria-modal="true" aria-label={d?.name || '혜택 상세'}>
        <div className="grab" />
        <div className="row"><span className="tag">{d?.category || '혜택'}</span><button className="ghost" onClick={onClose}>닫기</button></div>
        {err && <div className="empty">{err}</div>}
        {!d && !err && <div className="skel" style={{ height: 240 }} />}
        {d && (
          <>
            <h1 style={{ fontSize: 22, lineHeight: 1.35 }}>{d.name}</h1>
            <span className="cap">{[d.org, d.dept].filter(Boolean).join(' · ')}</span>
            {profile.set && <div className="row" style={{ justifyContent: 'flex-start', gap: 8 }}><span className={`mt ${m}`}>{MT[m][0]}</span><span className="cap">{MT[m][1]}</span></div>}
            {(d.content || d.supportType) && (
              <div className="amount"><span className="cap" style={{ color: 'inherit' }}>지원 내용{d.supportType ? ` · ${d.supportType}` : ''}</span><b>{d.content || d.summary}</b></div>
            )}
            {checks.length > 0 && (
              <section className="panel" aria-label="내 조건과 비교" style={{ gap: 12 }}>
                <strong style={{ fontSize: 15 }}>내 조건과 비교</strong>
                {checks.map((c, i) => (
                  <div key={i} className="chk">
                    <span className={`chk-ic ${c.status}`} aria-hidden>{c.status === 'ok' ? '✓' : c.status === 'no' ? '✕' : '?'}</span>
                    <div><b>{c.label}</b> <span>{c.detail}</span>{c.tip && <p className={c.status}>{c.tip}</p>}</div>
                  </div>
                ))}
                <span className="cap">공공데이터에 적힌 조건만 비교했어요. 재산·거주기간 등은 아래 선정 기준을 확인하세요.</span>
              </section>
            )}
            <section className="panel">
              {d.target && <div className="kv"><em>누가 받을 수 있나요</em><p>{d.target}</p></div>}
              {!profile.set && conds.length > 0 && <><hr /><div className="kv"><em>지원 조건 요약</em><p>{conds.join('\n')}</p></div></>}
              {d.criteria && <><hr /><div className="kv"><em>선정 기준</em><p>{d.criteria}</p></div></>}
              {d.how && <><hr /><div className="kv"><em>어떻게 신청하나요</em><p>{d.how}</p></div></>}
              <hr />
              <div className="row"><span className="cap">신청 기한</span><b style={{ textAlign: 'right', color: dl?.hot ? 'var(--warn)' : undefined }}>{d.deadlineText || dl?.text}</b></div>
              {d.receiver && <div className="row"><span className="cap">접수 기관</span><span style={{ textAlign: 'right' }}>{d.receiver}</span></div>}
              {d.phone && <div className="row"><span className="cap">문의</span><span className="sel" style={{ textAlign: 'right' }}>{d.phone}</span></div>}
            </section>
            <p className="note">정보는 공공데이터 기준이며, 정확한 자격은 신청처에서 확인하세요.</p>
            <div className="btns">
              <button className={`likebtn ${liked ? 'on' : ''}`} aria-pressed={liked} aria-label="좋아요" onClick={like}><IcHeart size={22} /><span>{likes.toLocaleString()}</span></button>
              <button className="iconbtn" aria-label="공유하기" onClick={share}><IcShare /></button>
              <a className="go" href={applyUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('click_apply', { id: d.id })}>신청하러 가기 <IcOut /></a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
