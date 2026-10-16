'use client';
import { useMemo, useState } from 'react';
import Footer from './Footer';
import { IcSearch } from './icons';
import { Profile } from '@/lib/profile';
import { SGG, SIDO_SHORT } from '@/lib/regions';
import { GROUPS, GuideGroup, guidesIn } from '@/lib/guides';
import { NEWS, fmtNewsDate } from '@/lib/news';
import { track } from '@/lib/client';

const href = (sido: string, sgg?: string) => {
  const sh = encodeURIComponent(SIDO_SHORT[sido]);
  return sgg ? `/culture/${sh}/${encodeURIComponent(sgg)}` : `/culture/${sh}`;
};

// 전체 시·군·구 (세종처럼 시·군·구가 없으면 시·도 자체)
const ALL: { sido: string; sgg: string; label: string; key: string }[] = Object.entries(SGG).flatMap(([sido, list]) => {
  const sh = SIDO_SHORT[sido];
  return list.length
    ? list.map((g) => ({ sido, sgg: g, label: `${sh} ${g}`, key: (sh + g).replace(/\s/g, '') }))
    : [{ sido, sgg: '', label: `${sh} 전체`, key: sh }];
});

type Pane = 'guide' | 'news' | 'region';
const PANES: { k: Pane; label: string }[] = [{ k: 'guide', label: '복지 가이드' }, { k: 'news', label: '복지 소식' }, { k: 'region', label: '동네 사용처' }];
const GORDER: GuideGroup[] = ['youth', 'family', 'living', 'senior', 'basics'];

/** 알아보기: 복지 가이드 / 복지 소식 / 동네 사용처 — 한 번에 하나만 */
export default function ExploreTab({ profile }: { profile: Profile }) {
  const [pane, setPane] = useState<Pane>('guide');
  const [grp, setGrp] = useState<GuideGroup | 'all'>('all');
  const [q, setQ] = useState('');
  const v = q.replace(/\s/g, '');
  const hits = useMemo(() => {
    if (!v) return [];
    return ALL.filter((r) => r.key.includes(v) || r.sgg.replace(/[시군구]$/, '').startsWith(v)).slice(0, 6);
  }, [v]);
  const mine = profile.sido && SGG[profile.sido] ? { label: `${SIDO_SHORT[profile.sido]} ${profile.sgg || '전체'}`, href: href(profile.sido, profile.sgg || undefined) } : null;
  const guides = grp === 'all' ? GORDER.flatMap((k) => guidesIn(k)) : guidesIn(grp);
  const glabel = (k: GuideGroup) => (GROUPS.find((x) => x.key === k)?.label || '').replace(/^\S+\s/, '');

  return (
    <>
      <div>
        <h2 className="tabtitle"><span className="mobonly">알아보기</span><span className="pconly">복지 가이드</span></h2>
        <div className="cap">혜택 받기 전에 알아두면 좋은 정보를 모았어요</div>
      </div>

      <div className="eseg" role="tablist" aria-label="알아보기 메뉴">
        {PANES.map((p) => (
          <button key={p.k} role="tab" aria-selected={pane === p.k} className={pane === p.k ? 'on' : ''} onClick={() => { setPane(p.k); track('explore_pane', { p: p.k }); }}>{p.label}</button>
        ))}
      </div>

      {pane === 'guide' && (
        <>
          <div className="echips" role="group" aria-label="가이드 분야">
            <button className={grp === 'all' ? 'on' : ''} onClick={() => setGrp('all')}>전체</button>
            {GORDER.map((k) => <button key={k} className={grp === k ? 'on' : ''} onClick={() => setGrp(k)}>{glabel(k)}</button>)}
          </div>
          <a className="ecalc" href="/guide/median-income" onClick={() => track('explore_calc')}><span aria-hidden>🧮</span>기준중위소득 계산기<em aria-hidden>›</em></a>
          <div className="elist">
            {guides.map((g) => (
              <a key={g.slug} href={`/guide/${g.slug}`} onClick={() => track('explore_guide', { slug: g.slug })}>
                <span><b>{g.title}</b>{g.sub && <small>{g.sub}</small>}</span><em aria-hidden>›</em>
              </a>
            ))}
          </div>
        </>
      )}

      {pane === 'news' && (
        <>
          <div className="elist">
            {NEWS.map((n) => (
              <a key={n.slug} href={`/news/${n.slug}`} onClick={() => track('explore_news', { slug: n.slug })}>
                <span><small className="ndate">{fmtNewsDate(n.date)} · {n.kind === 'weekly' ? '이번 주 소식' : '테마 소식'}</small><b>{n.title}</b>{n.sub && <small>{n.sub}</small>}</span><em aria-hidden>›</em>
              </a>
            ))}
          </div>
          <p className="cap" style={{ textAlign: 'center' }}>매주 월요일 새 소식이 올라와요</p>
        </>
      )}

      {pane === 'region' && (
        <>
          <label className="search" style={{ height: 48 }}>
            <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="우리 동네 검색 (예: 종로, 세종)" aria-label="우리 동네 검색" enterKeyHint="search" />
            {q && <button type="button" className="gps" aria-label="검색어 지우기" onClick={() => setQ('')}>✕</button>}
          </label>
          {v && (
            <div className="elist">
              {hits.length ? hits.map((r) => (
                <a key={r.label} href={href(r.sido, r.sgg || undefined)} onClick={() => track('explore_region', { from: 'search', q: v })}>
                  <span><b>{r.label} 문화누리카드 사용처</b></span><em aria-hidden>›</em>
                </a>
              )) : <span className="eempty">찾는 지역이 없어요. 시·군·구 이름으로 검색해 보세요</span>}
            </div>
          )}
          {mine && (
            <a className="ecalc" href={mine.href} onClick={() => track('explore_region', { from: 'mine' })}><span aria-hidden>📍</span>내 지역: {mine.label} 사용처<em aria-hidden>›</em></a>
          )}
          <p className="elbl">시·도에서 고르기</p>
          <div className="esido">
            {Object.keys(SGG).map((s) => <a key={s} href={href(s)}>{SIDO_SHORT[s]}</a>)}
          </div>
        </>
      )}
      <Footer />
    </>
  );
}
