import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import { GUIDES, guideBySlug } from '@/lib/guides';
import { SITE } from '@/lib/site';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guideBySlug(params.slug);
  if (!g) return { title: '올페어' };
  return {
    title: `${g.seoTitle} | 올페어`,
    description: g.desc,
    alternates: { canonical: `/guide/${g.slug}` },
    openGraph: { title: g.seoTitle, description: g.desc, type: 'article', locale: 'ko_KR', siteName: '올페어', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug);
  if (!g) notFound();
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  const [y, m, d] = g.updated.split('-').map(Number);
  const url = `${SITE}/guide/${g.slug}`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.seoTitle, description: g.desc, datePublished: g.updated, dateModified: g.updated,
      mainEntityOfPage: url, inLanguage: 'ko-KR', image: `${SITE}/og.png`,
      author: { '@type': 'Organization', name: 'AllFare 올페어', url: SITE }, publisher: { '@type': 'Organization', name: 'AllFare 올페어', logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '올페어', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '복지 가이드', item: `${SITE}/guide` },
      { '@type': 'ListItem', position: 3, name: g.title, item: url },
    ] },
  ];
  return (
    <main className="doc guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
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
