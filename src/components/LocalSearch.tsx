'use client';
import { useMemo, useState } from 'react';
import { IcSearch } from './icons';
import { SGG, SIDO_SHORT } from '@/lib/regions';

const ALL = Object.entries(SGG).flatMap(([sido, list]) => {
  const sh = SIDO_SHORT[sido];
  return list.length
    ? list.map((g) => ({ label: `${sh} ${g}`, key: (sh + g).replace(/\s/g, ''), g, href: `/local/${encodeURIComponent(sh)}/${encodeURIComponent(g)}` }))
    : [{ label: `${sh}`, key: sh, g: sh, href: `/local/${encodeURIComponent(sh)}` }];
});

/** 동네 검색 → 동네 복지 페이지 */
export default function LocalSearch() {
  const [q, setQ] = useState('');
  const v = q.replace(/\s/g, '');
  const hits = useMemo(() => (v ? ALL.filter((r) => r.key.includes(v) || r.g.replace(/[시군구]$/, '').startsWith(v)).slice(0, 8) : []), [v]);
  return (
    <>
      <label className="search" style={{ height: 48, margin: '12px 0 4px' }}>
        <span style={{ color: 'var(--mute)' }}><IcSearch /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="우리 동네 검색 (예: 강남구, 수원)" aria-label="우리 동네 검색" enterKeyHint="search" />
      </label>
      {v && (
        <div className="ssgg">
          {hits.length ? hits.map((r) => <a key={r.href} href={r.href}>{r.label}<span>›</span></a>) : <p className="cap">찾는 지역이 없어요. 시·군·구 이름으로 검색해 보세요</p>}
        </div>
      )}
    </>
  );
}
