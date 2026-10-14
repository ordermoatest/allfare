'use client';
import { useEffect, useRef, useState } from 'react';

type Stats = { benefits: number; stores: { total: number; ok: number; fail: number; pending: number }; logs: { kind: string; started_at: string; ok: boolean; message: string; counts: Record<string, unknown> }[] };
type Rev = { id: number; nick: string; body: string; heart_count: number; report_count: number; hidden: boolean; created_at: string; culture_stores: { name: string } | null };

const KIND: Record<string, string> = { benefits: '혜택 동기화', stores_import: '가맹점 가져오기', stores_geocode: '좌표·전화 채우기' };

export default function Admin() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [revs, setRevs] = useState<Rev[]>([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const stop = useRef(false);

  const call = async (action: string, extra: Record<string, unknown> = {}, p = pw) => {
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': p }, body: JSON.stringify({ action, ...extra }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || '실패');
    return j;
  };
  const refresh = async (p = pw) => {
    const [s, r] = await Promise.all([call('stats', {}, p), call('reviews', {}, p)]);
    setStats(s); setRevs(r.items);
  };

  useEffect(() => { try { const p = sessionStorage.getItem('af-admin'); if (p) { setPw(p); refresh(p).then(() => setAuthed(true)).catch(() => {}); } } catch { /* */ } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async () => {
    try { await refresh(); setAuthed(true); try { sessionStorage.setItem('af-admin', pw); } catch { /* */ } }
    catch (e) { setMsg(e instanceof Error ? e.message : '로그인 실패'); }
  };

  const run = async (label: string, action: string) => {
    setBusy(label); setMsg(`${label} 진행 중… (1~3분 걸릴 수 있어요)`);
    try { const j = await call(action); setMsg(`${label}: ${j.ok === false ? '실패 - ' + j.error : '완료 ' + JSON.stringify(j)}`); }
    catch (e) { setMsg(`${label} 실패: ${e instanceof Error ? e.message : ''}`); }
    setBusy(''); refresh().catch(() => {});
  };

  const geocodeLoop = async () => {
    stop.current = false; setBusy('geo');
    let total = 0;
    while (!stop.current) {
      try {
        const j = await call('geocode');
        if (j.ok === false) { setMsg('중단: ' + j.error); break; }
        total += j.done;
        setMsg(`좌표·전화 채우는 중… 이번 실행 ${total.toLocaleString()}건 처리 · 남은 ${Number(j.remaining).toLocaleString()}건`);
        if (!j.remaining || !j.done) { setMsg(`완료! 이번 실행 ${total.toLocaleString()}건 처리`); break; }
      } catch (e) { setMsg('오류로 멈췄어요: ' + (e instanceof Error ? e.message : '')); break; }
    }
    setBusy(''); refresh().catch(() => {});
  };

  const review = async (action: string, id: number) => { await call(action, { id }); refresh(); };

  if (!authed) return (
    <main className="doc">
      <h1>올페어 관리자</h1>
      <form onSubmit={(e) => { e.preventDefault(); login(); }} style={{ display: 'flex', gap: 8 }}>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="관리자 비밀번호" aria-label="관리자 비밀번호" style={{ flex: 1, height: 48, borderRadius: 14, border: 0, padding: '0 14px', background: 'var(--card)' }} />
        <button className="ghost" style={{ height: 48 }}>들어가기</button>
      </form>
      <p className="err">{msg}</p>
    </main>
  );

  const st = stats?.stores;
  return (
    <main className="doc" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1>올페어 관리자</h1>
      <section className="panel">
        <div className="row"><strong>복지 혜택</strong><span>{stats?.benefits.toLocaleString()}건</span></div>
        <button className="cta" disabled={!!busy} onClick={() => run('혜택 동기화', 'sync-benefits')}>혜택 지금 동기화 (매일 새벽 4시 자동)</button>
      </section>
      <section className="panel">
        <div className="row"><strong>문화누리 가맹점</strong><span>{st?.total.toLocaleString()}곳</span></div>
        <div className="cap">지도 표시 가능 {st?.ok.toLocaleString()} · 위치 못 찾음 {st?.fail.toLocaleString()} · 대기 {st?.pending.toLocaleString()}</div>
        <button className="cta" disabled={!!busy} onClick={() => run('가맹점 가져오기', 'import-stores')}>① 가맹점 목록 가져오기</button>
        {busy === 'geo'
          ? <button className="cta" style={{ background: 'var(--warn)' }} onClick={() => { stop.current = true; }}>멈추기</button>
          : <button className="cta" disabled={!!busy} onClick={geocodeLoop}>② 좌표·전화번호 채우기 (끝날 때까지 자동 반복)</button>}
        <button className="linkbtn" disabled={!!busy} onClick={() => run('실패 다시 시도', 'retry-failed')}>위치 못 찾은 가게 다시 시도하도록 되돌리기</button>
      </section>
      {msg && <p className="note" style={{ fontSize: 14, color: 'var(--ink)' }}>{msg}</p>}
      <section className="panel">
        <strong>최근 동기화 기록</strong>
        {stats?.logs.map((l, i) => (
          <div key={i} className="cap">{new Date(l.started_at).toLocaleString('ko-KR')} · {KIND[l.kind] || l.kind} · {l.ok ? '성공' : '실패'} · {l.message} {l.counts ? JSON.stringify(l.counts) : ''}</div>
        ))}
      </section>
      <section className="panel">
        <strong>후기 관리 (신고 많은 순)</strong>
        {revs.length === 0 && <span className="cap">후기가 없어요</span>}
        {revs.map((r) => (
          <div key={r.id} className="rev" style={{ opacity: r.hidden ? 0.6 : 1 }}>
            <span className="cap">{r.culture_stores?.name} · {r.nick} · 하트 {r.heart_count} · 신고 {r.report_count}{r.hidden ? ' · 숨김' : ''}</span>
            <p>{r.body}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {r.hidden ? <button className="ghost" onClick={() => review('review-show', r.id)}>다시 보이기</button> : <button className="ghost" onClick={() => review('review-hide', r.id)}>숨기기</button>}
              <button className="ghost" style={{ color: 'var(--warn)' }} onClick={() => review('review-delete', r.id)}>삭제</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
