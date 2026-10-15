'use client';
import { useMemo, useState } from 'react';
import Footer from './Footer';
import { IcSearch } from './icons';
import { Profile } from '@/lib/profile';
import { SGG, SIDO_SHORT } from '@/lib/regions';
import { GROUPS, guidesIn } from '@/lib/guides';
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

/** 알아보기: 우리 동네 문화누리카드 사용처 · 계산기 · 복지 가이드 */
export default function ExploreTab({ profile }: { profile: Profile }) {
  const [q, setQ] = useState('');
  const v = q.replace(/\s/g, '');
  const hits = useMemo(() => {
    if (!v) return [];
    return ALL.filter((r) => r.key.includes(v) || r.sgg.replace(/[시군구]$/, '').startsWith(v)).slice(0, 6);
  }, [v]);
  const mine = profile.sido && SGG[profile.sido] ? { label: `${SIDO_SHORT[profile.sido]} ${profile.sgg || '전체'}`, href: href(profile.sido, profile.sgg || undefined) } : null;

  return (
    <>
      <div>
        <h2 className="tabtitle"><span className="mobonly">알아보기</span><span className="pconly">복지 가이드</span></h2>
        <div className="cap">혜택 받기 전에 알아두면 좋은 정보를 모았어요</div>
      </div>

      <section className="cbox" aria-label="우리 동네 문화누리카드 사용처">
        <div className="cbh"><i>📍</i>우리 동네 문화누리카드 사용처</div>
        {mine && (
          <a className="minereg" href={mine.href} onClick={() => track('explore_region', { from: 'mine' })}>
            <span><small>내 조건에 저장된 지역</small>{mine.label} 사용처 보기</span><span aria-hidden>›</span>
          </a>
        )}
        <label className="search" style={{ background: 'var(--chip)', height: 50 }}>
          <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="우리 동네 검색 (예: 종로, 세종)" aria-label="우리 동네 검색" enterKeyHint="search" />
          {q && <button type="button" className="gps" aria-label="검색어 지우기" onClick={() => setQ('')}>✕</button>}
        </label>
        {v && (
          <div className="regres">
            {hits.length ? hits.map((r) => (
              <a key={r.label} href={href(r.sido, r.sgg || undefined)} onClick={() => track('explore_region', { from: 'search', q: v })}>
                {r.label} 문화누리카드 사용처 <span aria-hidden>›</span>
              </a>
            )) : <span className="cap">찾는 지역이 없어요. 시·군·구 이름으로 검색해 보세요</span>}
          </div>
        )}
        <span className="cap">또는 시·도에서 고르기</span>
        <div className="rchips">
          {Object.keys(SGG).map((s) => <a key={s} className="rchip soft" href={href(s)}>{SIDO_SHORT[s]}</a>)}
        </div>
      </section>

      <a className="calccard" href="/guide/median-income" onClick={() => track('explore_calc')}>
        <span className="cic" aria-hidden>🧮</span>
        <span><b>기준중위소득 계산기</b><small>우리 집 소득이 몇 %인지 바로 확인</small></span>
        <span className="cgo" aria-hidden>›</span>
      </a>

      <section className="cbox" aria-label="복지 가이드">
        <div className="cbh"><i>📘</i>복지 가이드</div>
        {GROUPS.map((gr) => (
          <div key={gr.key} className="eggroup">
            <span className="eglabel">{gr.label}</span>
            <div className="glist" style={{ margin: 0 }}>
              {guidesIn(gr.key).map((g) => (
                <a key={g.slug} className="gitem soft" href={`/guide/${g.slug}`} onClick={() => track('explore_guide', { slug: g.slug })}>
                  <span className="gemoji" aria-hidden>{g.emoji}</span><span><b>{g.title}</b>{g.sub && <small>{g.sub}</small>}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
      <Footer />
    </>
  );
}
