'use client';
import { useState } from 'react';
import { daysLeft } from '@/lib/deadline';
import { track } from '@/lib/client';

export type LItem = { id: string; name: string; summary: string | null; cat: string; org: string | null; dk: string | null; de: string | null };
export type LSection = { title: string; sub?: string; items: LItem[] };

const SHOW = 8;
function due(b: LItem): { text: string; hot: boolean } {
  if (b.dk === 'dated' && b.de) {
    const n = daysLeft(b.de)!;
    if (n <= 0) return { text: '오늘 마감', hot: true };
    return { text: `마감 D-${n}`, hot: n <= 30 };
  }
  if (b.dk === 'always') return { text: '상시 신청', hot: false };
  if (b.dk === 'no_application') return { text: '신청 불필요', hot: false };
  return { text: '기한 확인', hot: false };
}

/** 동네 복지 목록: 분야 칩으로 거르고, 섹션마다 8개 먼저 (나머지도 페이지에는 들어 있음) */
export default function LocalBenefits({ sections, cats, from }: { sections: LSection[]; cats: { name: string; n: number }[]; from: string }) {
  const [cat, setCat] = useState('전체');
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const total = sections.reduce((s, x) => s + x.items.length, 0);
  return (
    <>
      {cats.length > 1 && (
        <div className="lchips" role="group" aria-label="분야">
          <button className={cat === '전체' ? 'on' : ''} onClick={() => setCat('전체')}>전체<em>{total}</em></button>
          {cats.map((c) => <button key={c.name} className={cat === c.name ? 'on' : ''} onClick={() => { setCat(c.name); track('local_cat', { c: c.name, from }); }}>{c.name}<em>{c.n}</em></button>)}
        </div>
      )}
      {sections.map((s, i) => {
        const list = cat === '전체' ? s.items : s.items.filter((x) => x.cat === cat);
        if (!s.items.length) return null;
        const more = !open[i] && list.length > SHOW;
        return (
          <section key={s.title} className="lsec">
            <h2>{s.title}{s.sub && <small>{s.sub} · {list.length}개</small>}</h2>
            {list.length ? (
              <div className="llist">
                {list.map((b, k) => {
                  const d = due(b);
                  return (
                    <a key={b.id} href={`/benefit/${encodeURIComponent(b.id)}`} className={more && k >= SHOW ? 'lhide' : ''}>
                      <span className="ltop"><span>{b.cat}</span><span className={d.hot ? 'hot' : ''}>{d.text}</span></span>
                      <b>{b.name}</b>
                      {b.summary && <small>{b.summary}</small>}
                    </a>
                  );
                })}
                {more && <button className="lmore" onClick={() => { setOpen({ ...open, [i]: true }); track('local_more', { from }); }}>{list.length - SHOW}개 더 보기</button>}
              </div>
            ) : <p className="cap">이 분야 혜택은 없어요</p>}
          </section>
        );
      })}
    </>
  );
}
