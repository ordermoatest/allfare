import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RegionStores from '@/components/RegionStores';
import { SGG } from '@/lib/regions';
import { SIDO_BY_SHORT, storesOf } from '@/lib/server/regionStores';
import { ogImage } from '@/lib/og';
import { lastSync } from '@/lib/server/asof';

export const revalidate = 86400; // 하루 한 번 새로 만듦
export const dynamicParams = true;
export function generateStaticParams() { return []; }

const dec = (x: string) => { try { return decodeURIComponent(x); } catch { return x; } };

export async function generateMetadata({ params }: { params: { sido: string; sgg: string } }): Promise<Metadata> {
  const short = dec(params.sido), sgg = dec(params.sgg);
  const full = SIDO_BY_SHORT[short];
  if (!full || !SGG[full]?.includes(sgg)) return { title: '올페어' };
  const n = (await storesOf(full, sgg).catch(() => [])).length;
  return {
    title: `${sgg} 문화누리카드 사용처·가맹점${n ? ` ${n.toLocaleString()}곳` : ''} (${short}, 2026) | 올페어`,
    description: `${full} ${sgg}에서 문화누리카드를 쓸 수 있는 가맹점${n ? ` ${n.toLocaleString()}곳` : ''}을 서점·영화관·공연·체육 등 분야별로 정리했어요. 지도에서 가까운 사용처와 결제 후기도 확인하세요.`,
    alternates: { canonical: `/culture/${encodeURIComponent(short)}/${encodeURIComponent(sgg)}` },
    openGraph: { title: `${short} ${sgg} 문화누리카드 사용처`, siteName: '올페어', locale: 'ko_KR',
      images: [ogImage({ t: `${short} ${sgg} 문화누리카드 사용처`, s: n ? `가맹점 ${n.toLocaleString()}곳` : '분야별 가맹점 모음', k: '문화누리카드', e: '🎫' })] },
  };
}

export default async function SggPage({ params }: { params: { sido: string; sgg: string } }) {
  const short = dec(params.sido), sgg = dec(params.sgg);
  const full = SIDO_BY_SHORT[short];
  if (!full || !SGG[full]?.includes(sgg)) notFound();
  const stores = await storesOf(full, sgg);
  const siblings = SGG[full].filter((g) => g !== sgg).map((g) => ({ label: g, href: `/culture/${encodeURIComponent(short)}/${encodeURIComponent(g)}` }));
  return <RegionStores sidoShort={short} sidoFull={full} sgg={sgg} stores={stores} siblings={siblings} asOf={await lastSync('stores_import')} />;
}
