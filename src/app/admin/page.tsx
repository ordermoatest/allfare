'use client';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

type Log = { kind: string; started_at: string; ok: boolean; message: string; counts: Record<string, unknown> | null };
type Stats = { benefits: number; stores: { total: number; ok: number; fail: number; pending: number }; logs: Log[] };
type Rev = {
  id: number; nick: string; body: string; paid: boolean | null; rating: number | null; heart_count: number; report_count: number;
  hidden: boolean; edited: boolean; created_at: string; culture_stores: { name: string } | null;
};
type Tab = 'reported' | 'recent' | 'hidden' | 'all';
type Counts = { reported: number; hidden: number; fresh: number };

const KIND: Record<string, string> = { benefits: '혜택 동기화', stores_import: '가맹점 가져오기', stores_geocode: '좌표·전화 채우기' };
const TABS: { k: Tab; label: string }[] = [{ k: 'reported', label: '신고 들어옴' }, { k: 'recent', label: '최근 7일' }, { k: 'hidden', label: '숨김' }, { k: 'all', label: '전체' }];
const when = (iso: string) => new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const SEEN = 'af-admin-seen';

export default function Admin() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [logging, setLogging] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const stop = useRef(false);
  // 후기 관리
  const [tab, setTab] = useState<Tab>('reported');
  const [q, setQ] = useState('');
  const [qIn, setQIn] = useState('');
  const [revs, setRevs] = useState<Rev[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rowBusy, setRowBusy] = useState<Record<number, string>>({});
  const [armed, setArmed] = useState<number | null>(null);
  const seenRef = useRef<string>('');

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}, p = pw) => {
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': p }, body: JSON.stringify({ action, ...extra }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || '실패');
    return j;
  }, [pw]);

  const loadStats = useCallback(async (p = pw) => setStats(await call('stats', {}, p)), [call, pw]);
  const loadRevs = useCallback(async (opt: { tab: Tab; q: string; page: number; p?: string }) => {
    const j = await call('reviews', { tab: opt.tab, q: opt.q, page: opt.page, since: seenRef.current || undefined }, opt.p ?? pw);
    setRevs((old) => (opt.page === 0 ? j.items : [...(old || []), ...j.items]));
    setTotal(j.total); setCounts(j.counts); setPage(opt.page);
  }, [call, pw]);

  useEffect(() => {
    try { seenRef.current = localStorage.getItem(SEEN) || ''; } catch { /* */ }
    try {
      const p = sessionStorage.getItem('af-admin');
      if (p) { setPw(p); Promise.all([loadStats(p), loadRevs({ tab: 'reported', q: '', page: 0, p })]).then(() => setAuthed(true)).catch(() => {}); }
    } catch { /* */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 관리자 화면을 떠날 때 '여기까지 봤음' 기록 → 다음 방문 때 새 후기 수 표시
  useEffect(() => {
    if (!authed) return;
    const mark = () => { try { localStorage.setItem(SEEN, new Date().toISOString()); } catch { /* */ } };
    window.addEventListener('pagehide', mark);
    return () => window.removeEventListener('pagehide', mark);
  }, [authed]);

  useEffect(() => { if (armed === null) return; const t = setTimeout(() => setArmed(null), 4000); return () => clearTimeout(t); }, [armed]);

  const login = async (e: FormEvent) => {
    e.preventDefault(); if (logging) return;
    setLogging(true); setMsg(null);
    try {
      await Promise.all([loadStats(), loadRevs({ tab: 'reported', q: '', page: 0 })]);
      setAuthed(true); try { sessionStorage.setItem('af-admin', pw); } catch { /* */ }
    } catch (er) { setMsg({ t: er instanceof Error ? er.message : '로그인 실패', bad: true }); }
    setLogging(false);
  };

  const run = async (key: string, label: string, action: string) => {
    setBusy(key); setMsg({ t: `${label} 진행 중… (1~3분 걸릴 수 있어요)` });
    try {
      const j = await call(action);
      if (j.ok === false) setMsg({ t: `${label} 실패: ${j.error || ''}`, bad: true });
      else setMsg({ t: `${label} 완료 ${j.counts ? JSON.stringify(j.counts) : ''}` });
    } catch (er) { setMsg({ t: `${label} 실패: ${er instanceof Error ? er.message : ''}`, bad: true }); }
    setBusy(''); loadStats().catch(() => {});
  };

  const geocodeLoop = async () => {
    stop.current = false; setBusy('geo');
    let done = 0;
    setMsg({ t: '좌표·전화 채우는 중…' });
    while (!stop.current) {
      try {
        const j = await call('geocode');
        if (j.ok === false) { setMsg({ t: '중단: ' + j.error, bad: true }); break; }
        done += j.done;
        setMsg({ t: `좌표·전화 채우는 중… 이번에 ${done.toLocaleString()}건 · 남은 ${Number(j.remaining).toLocaleString()}건` });
        if (!j.remaining || !j.done) { setMsg({ t: `완료! 이번에 ${done.toLocaleString()}건 처리` }); break; }
      } catch (er) { setMsg({ t: '오류로 멈췄어요: ' + (er instanceof Error ? er.message : ''), bad: true }); break; }
    }
    if (stop.current) setMsg({ t: `멈췄어요. 이번에 ${done.toLocaleString()}건 처리` });
    setBusy(''); loadStats().catch(() => {});
  };

  const switchTab = (t: Tab) => { setTab(t); setRevs(null); loadRevs({ tab: t, q, page: 0 }).catch((er) => setMsg({ t: er.message, bad: true })); };
  const search = (e: FormEvent) => { e.preventDefault(); const v = qIn.trim(); setQ(v); setRevs(null); loadRevs({ tab, q: v, page: 0 }).catch((er) => setMsg({ t: er.message, bad: true })); };
  const more = async () => { setLoadingMore(true); try { await loadRevs({ tab, q, page: page + 1 }); } catch { /* */ } setLoadingMore(false); };

  const act = async (r: Rev, action: string, label: string) => {
    if (action === 'review-delete' && armed !== r.id) { setArmed(r.id); return; }
    setArmed(null);
    setRowBusy((b) => ({ ...b, [r.id]: label }));
    try {
      const j = await call(action, { id: r.id });
      if (j.ok === false) throw new Error(j.error || '처리하지 못했어요');
      // 현재 탭에서 빠져야 하는 줄은 빼고, 아니면 상태만 바꿈
      const drop = action === 'review-delete' || (tab === 'reported' && action === 'review-clear') || (tab === 'hidden' && (action === 'review-show' || action === 'review-clear'));
      setRevs((l) => (l || []).flatMap((x) => {
        if (x.id !== r.id) return [x];
        if (drop) return [];
        if (action === 'review-hide') return [{ ...x, hidden: true }];
        if (action === 'review-show') return [{ ...x, hidden: false }];
        if (action === 'review-clear') return [{ ...x, hidden: false, report_count: 0 }];
        return [x];
      }));
      if (drop) setTotal((n) => Math.max(0, n - 1));
      setCounts((c) => c && ({
        ...c,
        reported: action === 'review-clear' || (action === 'review-delete' && r.report_count > 0) ? Math.max(0, c.reported - 1) : c.reported,
        hidden: action === 'review-hide' && !r.hidden ? c.hidden + 1 : (action === 'review-show' || action === 'review-clear' || action === 'review-delete') && r.hidden ? Math.max(0, c.hidden - 1) : c.hidden,
      }));
    } catch (er) { setMsg({ t: er instanceof Error ? er.message : '처리하지 못했어요', bad: true }); }
    setRowBusy((b) => { const n = { ...b }; delete n[r.id]; return n; });
  };

  if (!authed) return (
    <main className="doc">
      <h1>올페어 관리자</h1>
      <form onSubmit={login} style={{ display: 'flex', gap: 8 }}>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="관리자 비밀번호" aria-label="관리자 비밀번호" style={{ flex: 1, height: 48, borderRadius: 14, border: 0, padding: '0 14px', background: 'var(--card)' }} />
        <button className="ghost" style={{ height: 48 }} disabled={logging}>{logging ? <><i className="spin" />확인 중…</> : '들어가기'}</button>
      </form>
      {msg && <p className="err">{msg.t}</p>}
    </main>
  );

  const st = stats?.stores;
  const last = stats?.logs[0];
  const failed = stats?.logs.some((l) => !l.ok);
  const B = ({ k, title, sub, onClick }: { k: string; title: string; sub: string; onClick: () => void }) => (
    <button className={`abtn ${busy === k ? 'on' : ''}`} disabled={!!busy && busy !== k} onClick={onClick}>
      <strong>{busy === k ? <><i className="spin" />{k === 'geo' ? '멈추기' : '진행 중…'}</> : title}</strong>
      <span>{sub}</span>
    </button>
  );

  return (
    <main className="doc admin">
      <div className="row"><h1 style={{ margin: 0 }}>올페어 관리자</h1><button className="ghost" disabled={!!busy} onClick={() => loadStats().catch(() => {})}>새로고침</button></div>
      <p className="astats">
        혜택 <b>{stats?.benefits.toLocaleString()}</b>건 · 가맹점 <b>{st?.total.toLocaleString()}</b>곳 (지도 {st?.ok.toLocaleString()} · 실패 {st?.fail.toLocaleString()} · 대기 {st?.pending.toLocaleString()})
      </p>

      <div className="abtns">
        <B k="ben" title="혜택 동기화" sub="매일 04:00 자동" onClick={() => run('ben', '혜택 동기화', 'sync-benefits')} />
        <B k="imp" title="가맹점 가져오기" sub="매주 월요일 자동" onClick={() => run('imp', '가맹점 가져오기', 'import-stores')} />
        <B k="geo" title="좌표·전화 채우기" sub={`대기 ${st?.pending.toLocaleString() ?? '-'}건`} onClick={() => (busy === 'geo' ? (stop.current = true) : geocodeLoop())} />
      </div>
      {!!st?.fail && <button className="linkbtn" style={{ alignSelf: 'flex-start' }} disabled={!!busy} onClick={() => run('retry', '실패 다시 시도', 'retry-failed')}>위치 못 찾은 {st.fail.toLocaleString()}곳 다시 시도하도록 되돌리기</button>}
      {msg && <p className={`amsg ${msg.bad ? 'bad' : ''}`} role="status">{msg.t}</p>}

      <section className="panel">
        <button className="logbtn" aria-expanded={logOpen} onClick={() => setLogOpen(!logOpen)}>
          <span>동기화 기록 {failed && <i className="reddot" aria-label="실패 있음" />}</span>
          <span className="cap">{last ? `${when(last.started_at)} ${KIND[last.kind] || last.kind} ${last.ok ? '성공' : '실패'}` : '기록 없음'} {logOpen ? '▲' : '▼'}</span>
        </button>
        {logOpen && stats?.logs.map((l, i) => (
          <div key={i} className={`logrow ${l.ok ? '' : 'bad'}`}>
            <b>{when(l.started_at)} · {KIND[l.kind] || l.kind} · {l.ok ? '성공' : '실패'}</b>
            <span>{l.message} {l.counts ? JSON.stringify(l.counts) : ''}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <strong>후기 관리</strong>
        <div className="atabs" role="tablist">
          {TABS.map((t) => {
            const n = t.k === 'reported' ? counts?.reported : t.k === 'hidden' ? counts?.hidden : t.k === 'recent' ? counts?.fresh : 0;
            return (
              <button key={t.k} role="tab" aria-selected={tab === t.k} className={tab === t.k ? 'on' : ''} onClick={() => switchTab(t.k)}>
                {t.label}{!!n && <em className={t.k === 'recent' ? 'new' : ''}>{t.k === 'recent' ? `새 ${n}` : n}</em>}
              </button>
            );
          })}
        </div>
        <form className="search" style={{ paddingRight: 5 }} onSubmit={search}>
          <input value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder="가게 이름이나 후기 내용" aria-label="후기 검색" />
          <button className="sbtn">검색</button>
        </form>
        {tab === 'reported' && <span className="cap">신고 3건이면 자동으로 숨겨져요. 괜찮은 후기는 [문제없음]을 누르면 신고 기록이 지워지고 다시 보여요.</span>}
        {revs === null && <div className="skel" style={{ height: 80 }} />}
        {revs?.length === 0 && <span className="cap" style={{ textAlign: 'center', padding: 12 }}>{tab === 'reported' ? '처리할 신고가 없어요 👍' : '후기가 없어요'}</span>}
        {revs?.map((r) => {
          const rb = rowBusy[r.id];
          return (
            <div key={r.id} className={`rev arev ${r.hidden ? 'dim' : ''}`}>
              <div className="row">
                <span className="cap"><b style={{ color: 'var(--ink)' }}>{r.culture_stores?.name || '(가게 없음)'}</b> · {r.nick} · {when(r.created_at)}{r.edited ? ' (수정됨)' : ''}</span>
              </div>
              <div className="rmeta">
                {r.report_count > 0 && <span className="pbadge no">신고 {r.report_count}</span>}
                {r.hidden && <span className="pbadge">숨김</span>}
                {r.paid !== null && <span className={`pbadge ${r.paid ? 'yes' : 'no'}`}>{r.paid ? '결제됨' : '결제 안 됨'}</span>}
                {r.rating && <span className="cap">★{r.rating}</span>}
                <span className="cap">하트 {r.heart_count}</span>
              </div>
              <p>{r.body}</p>
              {rb ? <span className="cap"><i className="spin" />{rb}</span> : (
                <div className="mineacts">
                  {(r.report_count > 0 || r.hidden) && <button className="ghost" onClick={() => act(r, 'review-clear', '처리 중…')}>문제없음</button>}
                  {r.hidden ? <button className="ghost" onClick={() => act(r, 'review-show', '보이는 중…')}>다시 보이기</button>
                    : <button className="ghost" onClick={() => act(r, 'review-hide', '숨기는 중…')}>숨기기</button>}
                  <button className={`ghost danger`} onClick={() => act(r, 'review-delete', '삭제 중…')}>{armed === r.id ? '한 번 더 누르면 삭제' : '삭제'}</button>
                </div>
              )}
            </div>
          );
        })}
        {revs && revs.length < total && (
          <button className="morebtn" onClick={more} disabled={loadingMore}>{loadingMore ? <><i className="spin" />불러오는 중…</> : `더 보기 (${revs.length}/${total})`}</button>
        )}
      </section>
    </main>
  );
}
