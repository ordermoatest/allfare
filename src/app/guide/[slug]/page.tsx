import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import { GUIDES, guideBySlug } from '@/lib/guides';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guideBySlug(params.slug);
  if (!g) return { title: '올페어' };
  return {
    title: `${g.title} | 올페어 복지 가이드`,
    description: g.desc,
    alternates: { canonical: `/guide/${g.slug}` },
    openGraph: { title: g.title, description: g.desc, type: 'article', locale: 'ko_KR', siteName: '올페어', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug);
  if (!g) notFound();
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  const [y, m, d] = g.updated.split('-').map(Number);
  return (
    <main className="doc guide">
      <Brand href="/" />
      <nav className="gcrumb"><a href="/guide">📘 복지 가이드</a></nav>
      <article>
        <h1><span aria-hidden>{g.emoji} </span>{g.title}</h1>
        {g.sub && <p className="gsubt">{g.sub}</p>}
        <p className="gsmall">{y}년 {m}월 {d}일 기준 · 올페어</p>
        {g.body}
      </article>
      <a className="gcta" href={g.cta.href}>{g.cta.label} →</a>
      <section className="gmore">
        <h2>다른 가이드도 읽어보세요</h2>
        <div className="glist">
          {others.map((x) => (
            <a key={x.slug} className="gitem" href={`/guide/${x.slug}`}>
              <span className="gemoji" aria-hidden>{x.emoji}</span><span><b>{x.title}</b></span>
            </a>
          ))}
        </div>
      </section>
      <Footer notes={['가이드 내용은 작성 시점 기준이에요. 신청 전 공식 안내를 꼭 확인하세요.']} />
    </main>
  );
}
