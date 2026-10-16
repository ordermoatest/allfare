import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import MoreBenefits from '@/components/MoreBenefits';
import Footer from '@/components/Footer';
import NewsStats from '@/components/NewsStats';
import { NEWS, fmtNewsDate, newsBySlug } from '@/lib/news';
import { GUIDES } from '@/lib/guides';
import { ogImage } from '@/lib/og';
import { SITE } from '@/lib/site';

export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

const card = (n: NonNullable<ReturnType<typeof newsBySlug>>) => ogImage({ t: n.title, s: (n.sub || '').split(' · ')[0], k: '복지 소식', e: n.emoji });

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const n = newsBySlug(params.slug);
  if (!n) return { title: '올페어' };
  return {
    title: `${n.seoTitle} | 올페어`,
    description: n.desc,
    keywords: n.kw,
    alternates: { canonical: `/news/${n.slug}` },
    openGraph: { title: n.title, description: n.desc, type: 'article', locale: 'ko_KR', siteName: '올페어', publishedTime: n.date, images: [card(n)] },
    twitter: { card: 'summary_large_image', title: n.title, description: n.desc },
  };
}

export default function NewsPage({ params }: { params: { slug: string } }) {
  const n = newsBySlug(params.slug);
  if (!n) notFound();
  const url = `${SITE}/news/${n.slug}`;
  const idx = NEWS.indexOf(n);
  const prev = NEWS[idx + 1], next = NEWS[idx - 1];
  const picks = GUIDES.filter((g) => ['youth-rent', 'parent-benefit', 'basic-pension', 'k-pass'].includes(g.slug));
  const ld = [
    { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: n.seoTitle, description: n.desc, datePublished: n.date, dateModified: n.date,
      mainEntityOfPage: url, inLanguage: 'ko-KR', image: `${SITE}${card(n).url}`, keywords: n.kw?.join(', '),
      author: { '@type': 'Organization', name: 'AllFare 올페어', url: SITE }, publisher: { '@type': 'Organization', name: 'AllFare 올페어', logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '올페어', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '복지 소식', item: `${SITE}/news` },
      { '@type': 'ListItem', position: 3, name: n.title, item: url },
    ] },
  ];
  return (
    <main className="doc guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Brand href="/" />
      <nav className="gcrumb"><a href="/news">📰 복지 소식</a></nav>
      <article>
        <h1>{n.title}</h1>
        {n.sub && <p className="gsubt">{n.sub}</p>}
        <div className="gmeta"><p className="gsmall">{fmtNewsDate(n.date)} · 올페어</p><NewsStats slug={n.slug} title={n.title} text={n.sub || n.desc} variant="top" /></div>
        {n.body}
      </article>
      <NewsStats slug={n.slug} title={n.title} text={n.sub || n.desc} variant="bottom" />
      <a className="gcta" href="/?tab=my">내 조건으로 받을 수 있는 혜택 찾기 →</a>
      {(prev || next) && (
        <nav className="nnav">
          {prev ? <a href={`/news/${prev.slug}`}><small>이전 소식</small><b>{prev.title}</b></a> : <span />}
          {next ? <a href={`/news/${next.slug}`} className="r"><small>다음 소식</small><b>{next.title}</b></a> : <span />}
        </nav>
      )}
      <section className="gmore">
        <h2>함께 보면 좋은 가이드</h2>
        <div className="glist">
          {picks.map((g) => (
            <a key={g.slug} className="gitem" href={`/guide/${g.slug}`}><span className="gemoji" aria-hidden>{g.emoji}</span><span><b>{g.title}</b>{g.sub && <small>{g.sub}</small>}</span></a>
          ))}
        </div>
      </section>
      <MoreBenefits from="news" />
      <Footer notes={['소식 내용은 발행일 기준이에요. 신청 전 공식 안내를 꼭 확인하세요.']} />
    </main>
  );
}
