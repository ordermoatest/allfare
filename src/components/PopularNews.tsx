'use client';
import { useEffect, useState } from 'react';
import { NEWS, fmtNewsDate } from '@/lib/news';
import { track } from '@/lib/client';

type Item = (typeof NEWS)[number];

/** 인기 복지 소식 3개 (최근 30일 조회수 순, 부족하면 최신순으로 채움) */
export default function PopularNews({ variant, from }: { variant: 'card' | 'side'; from: string }) {
  const [list, setList] = useState<Item[]>(NEWS.slice(0, 3));
  useEffect(() => {
    fetch('/api/news/popular').then((r) => r.json()).then((j: { items?: { slug: string }[] }) => {
      const top = (j.items || []).map((x) => NEWS.find((n) => n.slug === x.slug)).filter(Boolean) as Item[];
      const rest = NEWS.filter((n) => !top.includes(n));
      setList([...top, ...rest].slice(0, 3));
    }).catch(() => {});
  }, []);
  if (!list.length) return null;

  if (variant === 'side') {
    return (
      <div className="pcguides">
        {list.map((n) => (
          <a key={n.slug} href={`/news/${n.slug}`} onClick={() => track('popular_news', { slug: n.slug, from })}><b>{n.title}</b><small>{n.sub || fmtNewsDate(n.date)}</small></a>
        ))}
      </div>
    );
  }
  return (
    <section className="pnews" aria-label="인기 복지 소식">
      <div className="pnh"><b>📰 인기 복지 소식</b><a href="/news">전체 보기 ›</a></div>
      {list.map((n, i) => (
        <a key={n.slug} className="pnrow" href={`/news/${n.slug}`} onClick={() => track('popular_news', { slug: n.slug, from })}>
          <span className="pnno">{i + 1}</span>
          <span className="pnt"><b>{n.title}</b><small>{n.sub || fmtNewsDate(n.date)}</small></span>
          <span aria-hidden>›</span>
        </a>
      ))}
    </section>
  );
}
