import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import RegionStores from '@/components/RegionStores';
import { SGG } from '@/lib/regions';
import { SIDO_BY_SHORT, storesOf } from '@/lib/server/regionStores';

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
    description: `${full} 문화누리카드 사용처를 시·군·구별, 분야별로 정리했어요. 서점·영화관·공연장·체육시설 가맹점을 확인하세요.`,
    alternates: { canonical: `/culture/${encodeURIComponent(short)}` },
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
    return <RegionStores sidoShort={short} sidoFull={full} stores={stores} siblings={[]} />;
  }
  return (
    <main className="doc guide">
      <Brand href="/" />
      <nav className="gcrumb"><a href="/culture">🎫 지역별 문화누리카드 사용처</a> › {short}</nav>
      <h1>{short} 문화누리카드 사용처</h1>
      <p>{full}의 시·군·구를 골라 문화누리카드를 쓸 수 있는 가맹점을 확인해 보세요.</p>
      <div className="rchips">{list.map((g) => <a key={g} className="rchip" href={`/culture/${encodeURIComponent(short)}/${encodeURIComponent(g)}`}>{g}</a>)}</div>
      <a className="gcta" href="/?tab=culture">📍 내 주변 사용처 지도로 보기 →</a>
      <Footer notes={['가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요.']} />
    </main>
  );
}
