'use client';
import { useMemo, useState } from 'react';
import CatBar from './CatBar';
import Footer from './Footer';
import { IcHeartFill, IcSearch } from './icons';
import { BItem } from '@/lib/types';
import { Profile, manAge, regionLabel } from '@/lib/profile';
import { evaluate, Match } from '@/lib/match';
import { CATEGORY_ORDER } from '@/lib/categories';
import { deadlineLabel } from '@/lib/deadline';
import { track } from '@/lib/client';

const SORTS = { dl: '마감 임박순', new: '최신순', like: '좋아요순', view: '조회순' } as const;
type SortKey = keyof typeof SORTS;
const MT: Record<Match, string> = { ok: '조건 맞음', check: '확인 필요', no: '조건 안 맞음' };
const PAGE = 30;

export default function BenefitsTab({ profile, items, error, region, liked, likeCounts, onOpen, goMy, onRetry }: {
  profile: Profile; items: BItem[] | null; error: string | null; region: string;
  liked: Record<string, true>; likeCounts: Record<string, number>;
  onOpen: (id: string) => void; goMy: () => void; onRetry: () => void;
}) {
  const [cat, setCat] = useState('전체');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('dl');
  const [showNo, setShowNo] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const likesOf = (b: BItem) => likeCounts[b.id] ?? b.l;

  // 판정은 한 번만
  const judged = useMemo(() => (items || []).map((b) => ({ b, m: evaluate({ lo: b.lo, hi: b.hi, codes: b.k }, profile) })), [items, profile]);
  const fit = useMemo(() => judged.filter((x) => x.m !== 'no'), [judged]);

  const query = q.trim().replace(/\s+/g, '');
  const searched = useMemo(() => {
    const base = profile.set && !showNo ? fit : judged;
    if (!query) return base;
    return base.filter(({ b }) => (b.n + b.s + (b.o || '') + b.c).replace(/\s+/g, '').includes(query));
  }, [judged, fit, query, showNo, profile.set]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    searched.forEach(({ b }) => m.set(b.c, (m.get(b.c) || 0) + 1));
    return CATEGORY_ORDER.filter((c) => c === '전체' || m.get(c)).map((c) => ({ key: c, count: c === '전체' ? searched.length : m.get(c)! }));
  }, [searched]);

  const list = useMemo(() => {
    const arr = searched.filter(({ b }) => cat === '전체' || b.c === cat);
    const rank = (m: Match) => (m === 'ok' ? 0 : m === 'check' ? 1 : 2);
    const cmp: Record<SortKey, (a: BItem, b: BItem) => number> = {
      dl: (a, b) => (a.de || '9999') .localeCompare(b.de || '9999') || b.v - a.v,
      new: (a, b) => (b.r || '').localeCompare(a.r || ''),
      like: (a, b) => likesOf(b) - likesOf(a) || b.v - a.v,
      view: (a, b) => b.v - a.v,
    };
    return arr.sort((x, y) => rank(x.m) - rank(y.m) || cmp[sort](x.b, y.b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, cat, sort, likeCounts]);

  const hiddenNo = judged.length - fit.length;
  const age = manAge(profile.birth);

  return (
    <>
      <div className="head"><div className="brand"><div className="logo">AF</div><div><h1>올페어</h1><div className="cap">내 혜택, 내 주변 사용처 한 번에</div></div></div></div>
      <label className="search"><span style={{ color: 'var(--mute)' }}><IcSearch /></span>
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} onBlur={() => query && track('search_benefit', { q: query })} placeholder="월세, 육아, 교통비로 찾아보세요" aria-label="혜택 검색" enterKeyHint="search" />
      </label>

      {!profile.set ? (
        <section className="hero">
          <span className="pill">1분이면 끝나요</span>
          <b>내 조건을 먼저 입력해 주세요</b>
          <span style={{ fontSize: 14, lineHeight: 1.55 }}>생년월일, 사는 곳, 소득을 알려주시면 받을 수 있는 혜택만 골라 드려요.</span>
          <button onClick={goMy}>내 조건 입력하기</button>
        </section>
      ) : (
        <section className="hero">
          <div className="pills">
            {age !== null && <span className="pill">만 {age}세</span>}
            <span className="pill">{regionLabel(profile)}</span>
            {profile.inc && <span className="pill">중위 {profile.inc}</span>}
            {profile.tags.slice(0, 2).map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
          <b>내 조건에 맞는 혜택<br />{items ? `${fit.length.toLocaleString()}개를 찾았어요` : '찾는 중이에요'}</b>
          <button onClick={goMy}>조건 바꾸기</button>
        </section>
      )}

      {error ? (
        <div className="empty">{error}<br /><button className="linkbtn" onClick={onRetry}>다시 불러오기</button></div>
      ) : !items ? (
        <div className="list" aria-busy="true"><div className="skel" /><div className="skel" /><div className="skel" /></div>
      ) : (
        <>
          <CatBar
            title={<>분야별 보기 <span className="cap light">{list.length.toLocaleString()}개</span></>}
            right={<label className="sortsel"><span className="sr">정렬</span><select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select></label>}
            label="혜택 분야" items={counts} current={cat} onPick={(k) => { setCat(k); setLimit(PAGE); track('pick_category', { cat: k }); }}
          />
          {!profile.set && <div className="cap" style={{ padding: '0 4px' }}>조건 입력 전이라 전국 공통 혜택을 보여드려요. 사는 곳을 입력하면 우리 동네 혜택도 나와요.</div>}
          {profile.set && <div className="cap" style={{ padding: '0 4px' }}>{region} 기준 · 조건 맞음 → 확인 필요 순으로 보여드려요</div>}
          <div className="list">
            {list.length === 0 && <div className="empty">찾는 혜택이 없어요. 다른 단어로 검색해 보세요.</div>}
            {list.slice(0, limit).map(({ b, m }) => {
              const d = deadlineLabel(b.dk, b.de);
              const on = !!liked[b.id];
              return (
                <button key={b.id} className="item" onClick={() => onOpen(b.id)}>
                  <div className="row">
                    <span className="tags"><span className="tag">{b.c}</span>{profile.set && <span className={`mt ${m}`}>{MT[m]}</span>}</span>
                    <span className={`due ${d.hot ? 'hot' : ''}`}>{d.text}</span>
                  </div>
                  <strong>{b.n}</strong>
                  {b.s && <span className="sum">{b.s}</span>}
                  <div className="row"><span className="cap">{b.o}</span><span className={`lk ${on ? 'on' : ''}`}><IcHeartFill />{likesOf(b).toLocaleString()}</span></div>
                </button>
              );
            })}
            {list.length > limit && <button className="morebtn" onClick={() => setLimit(limit + PAGE)}>더 보기 ({(list.length - limit).toLocaleString()}개 남음)</button>}
          </div>
          {profile.set && hiddenNo > 0 && (
            <button className="linkbtn" onClick={() => { setShowNo(!showNo); setLimit(PAGE); }}>
              {showNo ? '조건에 안 맞는 혜택 숨기기' : `조건에 안 맞는 혜택 ${hiddenNo.toLocaleString()}개 더 보기`}
            </button>
          )}
        </>
      )}
      <Footer />
    </>
  );
}
