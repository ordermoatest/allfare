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

const SECTIONS: { tier: Tier; title: string; name: string; desc: string; badge: [string, string] }[] = [
  { tier: 'fit', title: '나에게 꼭 맞는 혜택', name: '꼭 맞음', desc: '내 조건을 콕 집은 혜택', badge: ['ok', '꼭 맞음'] },
  { tier: 'maybe', title: '받을 수도 있는 혜택', name: '확인 필요', desc: '신청처에 확인이 필요해요', badge: ['check', '확인 필요'] },
  { tier: 'all', title: '누구나 받는 혜택', name: '누구나', desc: '조건이 거의 없어요', badge: ['all', '누구나'] },
  { tier: 'no', title: '조건이 안 맞는 혜택', name: '안 맞음', desc: '왜 안 맞는지 보여드려요', badge: ['no', '안 맞음'] },
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
  const [picked, setPicked] = useState<Tier | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const likesOf = (b: BItem) => likeCounts[b.id] ?? b.l;

  // 판정은 목록·내 조건이 바뀔 때만
  const judged = useMemo(() => (items || []).map((b) => ({ b, t: tierOf(condOf(b), profile) })), [items, profile]);

  const query = q.trim().replace(/\s+/g, '');
  const visible = useMemo(() => {
    if (!query) return judged;
    return judged.filter(({ b }) => (b.n + b.s + (b.o || '') + b.c).replace(/\s+/g, '').includes(query));
  }, [judged, query]);

  // 분야를 고른 상태의 4칸 숫자
  const inCat = useMemo(() => visible.filter(({ b }) => cat === '전체' || b.c === cat), [visible, cat]);
  const total = useMemo(() => {
    const c: Record<Tier, number> = { fit: 0, maybe: 0, all: 0, no: 0 };
    inCat.forEach((x) => c[x.t]++);
    return c;
  }, [inCat]);
  // 고른 칸이 없으면: 꼭 맞음 → 확인 필요 → 누구나 → 안 맞음 중 처음으로 혜택이 있는 칸
  const pick: Tier = !profile.set ? 'maybe' : picked ?? (['fit', 'maybe', 'all', 'no'] as Tier[]).find((t) => total[t] > 0) ?? 'fit';
  const inTier = useMemo(() => visible.filter((x) => x.t === pick), [visible, pick]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    inTier.forEach(({ b }) => m.set(b.c, (m.get(b.c) || 0) + 1));
    return CATEGORY_ORDER.filter((c) => c === '전체' || c === cat || m.get(c)).map((c) => ({ key: c, count: c === '전체' ? inTier.length : m.get(c) || 0 }));
  }, [inTier, cat]);

  const sorted = useMemo(() => {
    const cmp: Record<SortKey, (a: BItem, b: BItem) => number> = {
      dl: (a, b) => (a.de || '9999').localeCompare(b.de || '9999') || b.v - a.v,
      new: (a, b) => (b.r || '').localeCompare(a.r || ''),
      like: (a, b) => likesOf(b) - likesOf(a) || b.v - a.v,
      view: (a, b) => b.v - a.v,
    };
    return inTier.filter(({ b }) => cat === '전체' || b.c === cat).sort((x, y) => cmp[sort](x.b, y.b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTier, cat, sort, likeCounts]);

  const all = useMemo(() => {
    const c: Record<Tier, number> = { fit: 0, maybe: 0, all: 0, no: 0 };
    judged.forEach((x) => c[x.t]++);
    return c;
  }, [judged]);

  const age = manAge(profile.birth);
  const kids = kidAges(profile);
  const nothing = profile.set && all.fit + all.maybe + all.all === 0;
  const choose = (t: Tier) => { setPicked(t); setLimit(PAGE); track('pick_tier', { tier: t }); };

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

  const sec = SECTIONS.find((x) => x.tier === pick)!;
  const list = (
    <div className="list">
      {sorted.length === 0 && <div className="empty" style={{ padding: '14px 8px' }}>{query || cat !== '전체' ? '이 조건으로 찾은 혜택이 없어요' : '해당하는 혜택이 없어요'}</div>}
      {sorted.slice(0, limit).map(({ b }) => card(b, pick))}
      {sorted.length > limit && <button className="morebtn" onClick={() => setLimit((l) => l + PAGE)}>더 보기 ({(sorted.length - limit).toLocaleString()}개 남음)</button>}
    </div>
  );

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
            {profile.marry === 'M' && <span className="pill">기혼</span>}
            {profile.marry === 'P' && <span className="pill">결혼 예정</span>}
            {profile.tags.filter((t) => t !== '해당 없음').slice(0, 2).map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
          <b>{!items ? <>내 조건에 맞는 혜택을<br />찾는 중이에요</> : items.length === 0 ? <>혜택 정보를<br />준비하고 있어요</> : nothing ? <>지금 조건에 맞는 혜택이<br />없어요</> : <>나에게 꼭 맞는 혜택<br />{all.fit.toLocaleString()}개를 찾았어요</>}</b>
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
          {nothing && (
            <div className="notice">
              <b>입력한 조건에 맞는 혜택이 없어요</b>
              <span>아래 &lsquo;안 맞음&rsquo; 칸을 누르면 혜택마다 어떤 조건이 다른지, 어떻게 되면 받을 수 있는지 볼 수 있어요.</span>
              <button className="linkbtn" onClick={goMy}>내 조건 다시 확인하기</button>
            </div>
          )}
          {profile.set ? (
            <>
              <div className="tgrid" role="tablist" aria-label="혜택 분류">
                {SECTIONS.map((x) => (
                  <button key={x.tier} role="tab" aria-selected={pick === x.tier} className={`tcell ${x.tier} ${pick === x.tier ? 'on' : ''}`} onClick={() => choose(x.tier)}>
                    <em>{x.name}</em><b>{total[x.tier].toLocaleString()}</b><small>{x.desc}</small>
                  </button>
                ))}
              </div>
              <CatBar
                title={<>분야별 보기 <span className="cap light">{profile.set ? region + ' 기준' : ''}</span></>}
                right={<label className="sortsel"><span className="sr">정렬</span><select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select></label>}
                label="혜택 분야" items={counts} current={cat} onPick={(k) => { setCat(k); setLimit(PAGE); track('pick_category', { cat: k }); }}
              />
              <div className="thead"><strong>{sec.title} {sorted.length.toLocaleString()}개</strong>{cat !== '전체' && <span className="cap">{cat}</span>}</div>
            </>
          ) : (
            <>
              <CatBar
                title={<>분야별 보기 <span className="cap light">{profile.set ? region + ' 기준' : ''}</span></>}
                right={<label className="sortsel"><span className="sr">정렬</span><select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select></label>}
                label="혜택 분야" items={counts} current={cat} onPick={(k) => { setCat(k); setLimit(PAGE); track('pick_category', { cat: k }); }}
              />
            <div className="cap" style={{ padding: '0 4px' }}>조건 입력 전이라 전국 공통 혜택을 보여드려요. 사는 곳을 입력하면 우리 동네 혜택도 나와요.</div>
            </>
          )}
          {list}
        </>
      )}
      <Footer notes={['꼭 맞음·확인 필요 표시는 공개된 조건만 비교한 참고 정보예요.', '정확한 지원 조건과 선정 여부는 신청처에서 꼭 확인하세요.']} />
    </>
  );
}
