import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import ShareButton from '@/components/ShareButton';
import LocalBenefits from '@/components/LocalBenefits';
import LocalView from '@/components/LocalView';
import { SGG, SIDO_BY_SHORT } from '@/lib/regions';
import { catCounts, josa, localRows } from '@/lib/server/local';
import { ogImage } from '@/lib/og';

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() { return []; }

const dec = (x: string) => { try { return decodeURIComponent(x); } catch { return x; } };

export async function generateMetadata({ params }: { params: { sido: string } }): Promise<Metadata> {
  const short = dec(params.sido);
  const full = SIDO_BY_SHORT[short];
  if (!full) return { title: '올페어' };
  const n = (await localRows(full).catch(() => [])).length;
  return {
    title: `${short} 복지 혜택·지원금${n ? ` ${n.toLocaleString()}개` : ''} (시·군·구별, 2026) | 올페어`,
    description: `${josa(full, '와과')} 시·군·구에서 주는 복지 혜택${n ? ` ${n.toLocaleString()}개` : ''}를 동네별·분야별로 정리했어요. 출산·육아, 청년, 어르신, 주거 지원금을 확인하세요.`,
    alternates: { canonical: `/local/${encodeURIComponent(short)}` },
    openGraph: { title: `${short} 복지 혜택·지원금`, siteName: '올페어', locale: 'ko_KR', images: [ogImage({ t: `${short} 복지 혜택·지원금`, s: n ? `지역 혜택 ${n.toLocaleString()}개` : '시·군·구별 지원금 모음', k: '동네 복지' })] },
  };
}

export default async function LocalSido({ params }: { params: { sido: string } }) {
  const short = dec(params.sido);
  const full = SIDO_BY_SHORT[short];
  if (!full) notFound();
  const rows = await localRows(full); // DB 오류면 에러 (빈 목록이 저장되지 않게)
  const list = SGG[full];
  // 세종처럼 시·군·구가 없으면 바로 혜택 목록
  if (!list.length) return <LocalView short={short} full={full} own={[]} wide={rows} siblings={[]} />;
  const wide = rows.filter((r) => !r.sgg);
  const per = new Map<string, number>();
  rows.forEach((r) => { if (r.sgg) per.set(r.sgg, (per.get(r.sgg) || 0) + 1); });
  const sggs = list.map((g) => ({ name: g, n: (per.get(g) || 0) + wide.length }));
  const n = (x: number) => x.toLocaleString();
  const cats = catCounts(wide);
  const top = [...sggs].sort((a, b) => b.n - a.n);
  const faq = rows.length ? [
    { q: `${short}에서 받을 수 있는 지원금은 몇 개인가요?`, a: `${josa(full, '이가')} 직접 주는 혜택이 ${n(wide.length)}개, 시·군·구에서 주는 혜택이 ${n(rows.length - wide.length)}개 있어요. 사는 시·군·구를 고르면 받을 수 있는 혜택만 모아 볼 수 있어요.` },
    { q: `${short}에서 혜택이 가장 많은 시·군·구는 어디인가요?`, a: `${top.slice(0, 3).map((g) => `${g.name} ${n(g.n)}개`).join(', ')} 순이에요. (${short} 전체 혜택 포함)` },
  ] : [];
  const ld = faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const strip = ({ sgg: _s, ...x }: (typeof rows)[number]) => x;
  return (
    <main className="doc guide">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <Brand href="/" />
      <nav className="gcrumb"><a href="/local">동네 복지</a> › {short}</nav>
      <div className="gtitle"><h1>{short} 복지 혜택·지원금{rows.length ? <> <em className="lnum">{n(rows.length)}개</em></> : null}</h1><ShareButton title={`${short} 복지 혜택·지원금`} text="시·군·구별 지원금 모음 · 올페어" from="local_sido" /></div>
      <p>{josa(full, '와과')} 시·군·구에서 주는 혜택을 모았어요. <b>사는 시·군·구</b>를 고르면 그 동네에서 받을 수 있는 혜택만 볼 수 있어요.</p>
      {rows.length > 0 && <div className="sstat"><div><small>{short} 전체 혜택</small><b>{n(wide.length)}</b></div><div><small>시·군·구 혜택</small><b>{n(rows.length - wide.length)}</b></div></div>}
      <h2>시·군·구별 혜택 수</h2>
      <div className="ssgg">{sggs.map((g) => <a key={g.name} href={`/local/${encodeURIComponent(short)}/${encodeURIComponent(g.name)}`}>{g.name}<span>{g.n ? `${n(g.n)}개 ›` : '›'}</span></a>)}</div>
      <a className="gcta" href="/?tab=my">내 조건으로 꼭 맞는 혜택만 보기 →</a>
      <LocalBenefits sections={[{ title: `${short} 전체에 주는 혜택`, sub: full, items: wide.map(strip) }]} cats={cats} from="sido" />
      {faq.length > 0 && (
        <section className="gfaq">
          <h2>자주 묻는 질문</h2>
          {faq.map((f, i) => <details key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      )}
      <a className="gbanner bguide" href={`/culture/${encodeURIComponent(short)}`}><span><b>{short} 문화누리카드 사용처</b><small>시·군·구별 가맹점 모음</small></span><span aria-hidden>›</span></a>
      <Footer notes={['혜택 목록은 정부24 공공서비스 정보를 기준으로 매주 갱신돼요.', '시·군·구별 숫자에는 시·도 전체 혜택이 함께 들어 있어요.']} />
    </main>
  );
}
