import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import MoreBenefits from '@/components/MoreBenefits';
import Footer from '@/components/Footer';
import RegionStores from '@/components/RegionStores';
import { SGG } from '@/lib/regions';
import { SIDO_BY_SHORT, sidoStats, storesOf } from '@/lib/server/regionStores';
import { ogImage } from '@/lib/og';
import { lastSync } from '@/lib/server/asof';
import ShareButton from '@/components/ShareButton';

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() { return []; }

const dec = (x: string) => { try { return decodeURIComponent(x); } catch { return x; } };

export function generateMetadata({ params }: { params: { sido: string } }): Metadata {
  const short = dec(params.sido);
  const full = SIDO_BY_SHORT[short];
  if (!full) return { title: '올페어' };
  return {
    title: `${short} 문화누리카드 사용처·가맹점 (2026) | 올페어`,
    description: `${full} 문화누리카드 사용처를 시·군·구별, 분야별로 정리했어요. 서점·영화관·공연장·체육시설 가맹점과 내 주변 문화누리카드 사용처를 지도로 찾아보세요.`,
    alternates: { canonical: `/culture/${encodeURIComponent(short)}` },
    openGraph: { title: `${short} 문화누리카드 사용처`, siteName: '올페어', locale: 'ko_KR',
      images: [ogImage({ t: `${short} 문화누리카드 사용처`, s: '시·군·구별 가맹점 모음', k: '문화누리카드', e: '🎫' })] },
  };
}

export default async function SidoPage({ params }: { params: { sido: string } }) {
  const short = dec(params.sido);
  const full = SIDO_BY_SHORT[short];
  if (!full) notFound();
  const list = SGG[full];
  // 세종처럼 시·군·구가 없으면 바로 가맹점 목록
  if (!list.length) {
    const stores = await storesOf(full);
    return <RegionStores sidoShort={short} sidoFull={full} stores={stores} siblings={[]} asOf={await lastSync('stores_import')} />;
  }
  const st = await sidoStats(full).catch(() => null);
  const top = st?.cats.slice(0, 6) || [];
  const max = top[0]?.n || 1;
  const n = (x: number) => x.toLocaleString();
  const faq = st && st.total > 0 ? [
    { q: `${short}에서 문화누리카드는 어디서 쓸 수 있나요?`, a: `${full}에는 문화누리카드 가맹점이 ${n(st.total)}곳 있어요. ${top.slice(0, 3).map((c) => `${c.name} ${n(c.n)}곳`).join(', ')} 순으로 많아요. 시·군·구를 고르면 가맹점 목록을, 지도에서는 내 주변 사용처를 볼 수 있어요.` },
    { q: `${short}에서 가맹점이 가장 많은 곳은 어디인가요?`, a: `${st.sggs.slice(0, 3).filter((g) => g.n > 0).map((g) => `${g.name} ${n(g.n)}곳`).join(', ')} 순이에요.` },
    { q: '문화누리카드 남은 잔액은 언제까지 써야 하나요?', a: '2026년 지원금은 12월 31일까지 써야 하고, 남은 금액은 다음 해로 넘어가지 않아요.' },
  ] : [];
  const ld = faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  return (
    <main className="doc guide">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <Brand href="/" />
      <nav className="gcrumb"><a href="/culture">지역별 문화누리카드 사용처</a> › {short}</nav>
      <div className="gtitle"><h1>{short} 문화누리카드 사용처</h1><ShareButton title={`${short} 문화누리카드 사용처`} text="시·군·구별 가맹점 모음 · 올페어" from="sido" /></div>
      {st && st.total > 0 ? (
        <>
          <p>{full}에는 문화누리카드를 쓸 수 있는 가맹점이 <b>{n(st.total)}곳</b> 있어요. {top[0] ? <>{top[0].name} 가맹점이 가장 많고, </> : null}시·군·구를 골라 가까운 사용처를 확인해 보세요. 올해 지원금은 <b>12월 31일</b>까지 써야 해요.</p>
          <div className="sstat"><div><small>전체 가맹점</small><b>{n(st.total)}</b></div><div><small>가장 많은 분야</small><b>{top[0]?.name || '-'}</b></div></div>
          <h2>분야별 가맹점</h2>
          <div className="sdbars">{top.map((c) => <div key={c.name} className="sdbar"><span>{c.name}</span><i style={{ width: `${Math.max(2, Math.round((c.n / max) * 100))}%` }} /><span>{n(c.n)}</span></div>)}</div>
          <h2>시·군·구별 가맹점 수</h2>
          <div className="ssgg">{st.sggs.map((g) => <a key={g.name} href={`/culture/${encodeURIComponent(short)}/${encodeURIComponent(g.name)}`}>{g.name}<span>{n(g.n)}곳 ›</span></a>)}</div>
        </>
      ) : (
        <>
          <p>{full}의 시·군·구를 골라 문화누리카드를 쓸 수 있는 가맹점을 확인해 보세요.</p>
          <div className="rchips">{list.map((g) => <a key={g} className="rchip" href={`/culture/${encodeURIComponent(short)}/${encodeURIComponent(g)}`}>{g}</a>)}</div>
        </>
      )}
      <a className="gcta" href="/?tab=culture">내 주변 사용처 지도로 보기 →</a>
      {faq.length > 0 && (
        <section className="gfaq">
          <h2>자주 묻는 질문</h2>
          {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      )}
      <a className="gbanner bguide" href="/guide/culture-nuri-year-end"><span><b>문화누리카드 남은 잔액, 어디에 쓸까요?</b><small>연말 사용처 · 잔액 조회 · 온라인 가맹점 모음</small></span><span aria-hidden>›</span></a>
      <MoreBenefits from="culture_sido" />
      <Footer notes={['가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요.', '시·군·구별 숫자는 가맹점 주소 기준이라 실제와 조금 다를 수 있어요.']} />
    </main>
  );
}
