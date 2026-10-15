'use client';
import { useMemo, useState } from 'react';
import CatBar from './CatBar';
import Footer from './Footer';
import Brand from './Brand';
import { IcHeartFill, IcSearch } from './icons';
import { BItem } from '@/lib/types';
import { Profile, kidAges, manAge, regionLabel } from '@/lib/profile';
import { Cond, Tier, firstReason, fitReason, tierOf } from '@/lib/match';
import { CATEGORY_ORDER } from '@/lib/categories';
import { deadlineLabel } from '@/lib/deadline';
import { track } from '@/lib/client';

const SORTS = { dl: '마감 임박순', new: '최신순', like: '좋아요순', view: '조회순' } as const;
type SortKey = keyof typeof SORTS;
const PAGE = 20;

const SECTIONS: { tier: Tier; title: string; desc: string; badge: [string, string] }[] = [
  { tier: 'fit', title: '나에게 꼭 맞는 혜택', desc: '내 나이·소득·자녀·상황을 콕 집은 혜택이에요', badge: ['ok', '꼭 맞음'] },
  { tier: 'maybe', title: '받을 수도 있는 혜택', desc: '정보가 부족해 신청처 확인이 필요한 혜택이에요', badge: ['check', '확인 필요'] },
  { tier: 'all', title: '누구나 받는 혜택', desc: '나이·소득 조건이 거의 없는 혜택이에요', badge: ['all', '누구나'] },
  { tier: 'no', title: '조건이 안 맞는 혜택', desc: '어떤 조건이 다른지 카드와 상세에서 볼 수 있어요', badge: ['no', '안 맞음'] },
];

/** 기관 배지: 지역 기관은 시·도 이름을 떼서 짧게 */
function orgShort(o: string | null): string {
  if (!o) return '';
  const parts = o.split(/\s+/);
  const t = parts.length > 1 && /(특별시|광역시|특별자치시|특별자치도|도|통합특별시)$/.test(parts[0]) ? parts.slice(1).join(' ') : o;
  return t.length > 12 ? t.slice(0, 11) + '…' : t;
}

const condOf = (b: BItem): Cond => ({ lo: b.lo, hi: b.hi, codes: b.k, hint: b.h });

export default function BenefitsTab({ profile, items, error, region, liked, likeCounts, onOpen, goMy, onRetry }: {
  profile: Profile; items: BItem[] | null; error: string | null; region: string;
  liked: Record<string, true>; likeCounts: Record<string, number>;
  onOpen: (id: string) => void; goMy: () => void; onRetry: () => void;
}) {
  const [cat, setCat] = useState('전체');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('dl');
  const [showNo, setShowNo] = useState(false);
  const [open, setOpen] = useState<Record<Tier, boolean>>({ fit: true, maybe: false, all: false, no: true });
  const [limits, setLimits] = useState<Record<Tier, number>>({ fit: PAGE, maybe: PAGE, all: PAGE, no: PAGE });

  const likesOf = (b: BItem) => likeCounts[b.id] ?? b.l;

  // 판정은 목록·내 조건이 바뀔 때만
  const judged = useMemo(() => (items || []).map((b) => ({ b, t: tierOf(condOf(b), profile) })), [items, profile]);

  const query = q.trim().replace(/\s+/g, '');
  const visible = useMemo(() => {
    let base = judged;
    if (profile.set && !showNo) base = base.filter((x) => x.t !== 'no');
    if (query) base = base.filter(({ b }) => (b.n + b.s + (b.o || '') + b.c).replace(/\s+/g, '').includes(query));
    return base;
  }, [judged, query, showNo, profile.set]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    visible.forEach(({ b }) => m.set(b.c, (m.get(b.c) || 0) + 1));
    return CATEGORY_ORDER.filter((c) => c === '전체' || m.get(c)).map((c) => ({ key: c, count: c === '전체' ? visible.length : m.get(c)! }));
  }, [visible]);

  const sorted = useMemo(() => {
    const cmp: Record<SortKey, (a: BItem, b: BItem) => number> = {
      dl: (a, b) => (a.de || '9999').localeCompare(b.de || '9999') || b.v - a.v,
      new: (a, b) => (b.r || '').localeCompare(a.r || ''),
      like: (a, b) => likesOf(b) - likesOf(a) || b.v - a.v,
      view: (a, b) => b.v - a.v,
    };
    return visible.filter(({ b }) => cat === '전체' || b.c === cat).sort((x, y) => cmp[sort](x.b, y.b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cat, sort, likeCounts]);

  const byTier = useMemo(() => {
    const g: Record<Tier, typeof sorted> = { fit: [], maybe: [], all: [], no: [] };
    sorted.forEach((x) => g[x.t].push(x));
    return g;
  }, [sorted]);

  const total = useMemo(() => {
    const c: Record<Tier, number> = { fit: 0, maybe: 0, all: 0, no: 0 };
    judged.forEach((x) => c[x.t]++);
    return c;
  }, [judged]);

  const age = manAge(profile.birth);
  const kids = kidAges(profile);
  const nothing = profile.set && total.fit + total.maybe + total.all === 0;

  const card = (b: BItem, t: Tier) => {
    const d = deadlineLabel(b.dk, b.de);
    const on = !!liked[b.id];
    const sec = SECTIONS.find((s) => s.tier === t)!;
    const why = !profile.set ? '' : t === 'fit' ? fitReason(condOf(b), profile) : t === 'no' ? firstReason(condOf(b), profile) : '';
    return (
      <button key={b.id} className="item" onClick={() => onOpen(b.id)}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <span className="tags">
            <span className="tag">{b.c}</span>
            {b.o && <span className={`org ${b.lc ? 'local' : ''}`}>{b.lc ? '📍 ' : ''}{orgShort(b.o)}</span>}
            {profile.set && <span className={`mt ${sec.badge[0]}`}>{sec.badge[1]}</span>}
          </span>
          <span className={`due ${d.hot ? 'hot' : ''}`}>{d.text}</span>
        </div>
        <strong>{b.n}</strong>
        {b.s && <span className="sum">{b.s}</span>}
        {why && <span className={t === 'no' ? 'why' : 'fitwhy'}>{t === 'fit' ? `✓ ${why}` : why}</span>}
        <div className="row" style={{ justifyContent: 'flex-end' }}><span className={`lk ${on ? 'on' : ''}`}><IcHeartFill />{likesOf(b).toLocaleString()}</span></div>
      </button>
    );
  };

  const listOf = (t: Tier) => {
    const arr = byTier[t];
    const lim = limits[t];
    return (
      <div className="list">
        {arr.length === 0 && <div className="empty" style={{ padding: '14px 8px' }}>{query || cat !== '전체' ? '이 조건으로 찾은 혜택이 없어요' : '해당하는 혜택이 없어요'}</div>}
        {arr.slice(0, lim).map(({ b }) => card(b, t))}
        {arr.length > lim && <button className="morebtn" onClick={() => setLimits((l) => ({ ...l, [t]: l[t] + PAGE }))}>더 보기 ({(arr.length - lim).toLocaleString()}개 남음)</button>}
      </div>
    );
  };

  return (
    <>
      <div className="head"><Brand onClick={() => document.querySelector('main.scroll:not([hidden])')?.scrollTo({ top: 0, behavior: 'smooth' })} /></div>
      <label className="search"><span style={{ color: 'var(--mute)' }}><IcSearch /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => query && track('search_benefit', { q: query })} placeholder="월세, 육아, 교통비로 찾아보세요" aria-label="혜택 검색" enterKeyHint="search" />
      </label>

      {!profile.set ? (
        <section className="hero">
          <span className="pill">1분이면 끝나요</span>
          <b>내 조건을 먼저 입력해 주세요</b>
          <span style={{ fontSize: 14, lineHeight: 1.55 }}>생년월일, 사는 곳, 소득, 자녀를 알려주시면 받을 수 있는 혜택만 골라 드려요.</span>
          <button onClick={goMy}>내 조건 입력하기</button>
        </section>
      ) : (
        <section className="hero">
          <div className="pills">
            {age !== null && <span className="pill">만 {age}세</span>}
            <span className="pill">{regionLabel(profile)}</span>
            {profile.inc && <span className="pill">중위 {profile.inc}</span>}
            {kids.length > 0 && <span className="pill">자녀 {kids.length}명</span>}
            {profile.head === 'Y' && <span className="pill">세대주</span>}
            {profile.tags.filter((t) => t !== '해당 없음').slice(0, 2).map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
          <b>{!items ? <>내 조건에 맞는 혜택을<br />찾는 중이에요</> : items.length === 0 ? <>혜택 정보를<br />준비하고 있어요</> : nothing ? <>지금 조건에 맞는 혜택이<br />없어요</> : <>나에게 꼭 맞는 혜택<br />{total.fit.toLocaleString()}개를 찾았어요</>}</b>
          {items && items.length > 0 && !nothing && <span style={{ fontSize: 13 }}>받을 수도 있는 혜택 {total.maybe.toLocaleString()}개 · 누구나 받는 혜택 {total.all.toLocaleString()}개</span>}
          <button onClick={goMy}>조건 바꾸기</button>
        </section>
      )}

      {error ? (
        <div className="empty">{error}<br /><button className="linkbtn" onClick={onRetry}>다시 불러오기</button></div>
      ) : !items ? (
        <div className="list" aria-busy="true"><div className="skel" /><div className="skel" /><div className="skel" /></div>
      ) : items.length === 0 ? (
        <div className="notice"><b>혜택 정보를 준비하고 있어요</b><span>정부24 혜택 목록을 받아오는 중이에요. 잠시 후 다시 열어주세요.</span><button className="linkbtn" onClick={onRetry}>다시 불러오기</button></div>
      ) : (
        <>
          {profile.set && (
            <label className="switchrow">
              <span><b>조건이 안 맞는 혜택도 보기</b><small>{total.no.toLocaleString()}개 · 왜 안 맞는지 이유가 함께 나와요</small></span>
              <input type="checkbox" role="switch" checked={showNo} onChange={(e) => setShowNo(e.target.checked)} />
            </label>
          )}
          {nothing && !showNo ? (
            <div className="notice">
              <b>입력한 조건에 맞는 혜택이 없어요</b>
              <span>위의 &lsquo;조건이 안 맞는 혜택도 보기&rsquo;를 켜면 혜택마다 어떤 조건이 다른지, 어떻게 되면 받을 수 있는지 볼 수 있어요.</span>
              <button className="linkbtn" onClick={goMy}>내 조건 다시 확인하기</button>
            </div>
          ) : (
            <>
              <CatBar
                title={<>분야별 보기 <span className="cap light">{sorted.length.toLocaleString()}개</span></>}
                right={<label className="sortsel"><span className="sr">정렬</span><select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select></label>}
                label="혜택 분야" items={counts} current={cat} onPick={(k) => { setCat(k); track('pick_category', { cat: k }); }}
              />
              <div className="cap" style={{ padding: '0 4px' }}>{profile.set ? `${region} 기준` : '조건 입력 전이라 전국 공통 혜택을 보여드려요. 사는 곳을 입력하면 우리 동네 혜택도 나와요.'}</div>
              {!profile.set ? listOf('maybe') : SECTIONS.filter((s) => s.tier !== 'no' || showNo).map((s) => (
                <section key={s.tier} className="tier">
                  <button className="tierhead" aria-expanded={open[s.tier]} onClick={() => setOpen((o) => ({ ...o, [s.tier]: !o[s.tier] }))}>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <b>{s.title} <span className={`tcount ${s.badge[0]}`}>{byTier[s.tier].length.toLocaleString()}</span></b>
                      <small>{s.desc}</small>
                    </span>
                    <span className="chev" aria-hidden>{open[s.tier] ? '▴' : '▾'}</span>
                  </button>
                  {open[s.tier] && listOf(s.tier)}
                </section>
              ))}
            </>
          )}
        </>
      )}
      <Footer />
    </>
  );
}
