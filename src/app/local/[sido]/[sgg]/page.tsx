import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LocalView from '@/components/LocalView';
import { SGG, SIDO_BY_SHORT } from '@/lib/regions';
import { localRows } from '@/lib/server/local';
import { ogImage } from '@/lib/og';

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() { return []; }

const dec = (x: string) => { try { return decodeURIComponent(x); } catch { return x; } };
// 페이지 본문은 DB 오류 시 에러로 두어 빈 목록이 하루 동안 저장되지 않게 함
const pick = async (full: string, sgg: string, safe = false) => (await (safe ? localRows(full).catch(() => []) : localRows(full))).filter((r) => !r.sgg || r.sgg === sgg);

export async function generateMetadata({ params }: { params: { sido: string; sgg: string } }): Promise<Metadata> {
  const short = dec(params.sido), sgg = dec(params.sgg);
  const full = SIDO_BY_SHORT[short];
  if (!full || !SGG[full]?.includes(sgg)) return { title: '올페어' };
  const n = (await pick(full, sgg, true)).length;
  return {
    title: `${short} ${sgg} 복지 혜택·지원금${n ? ` ${n.toLocaleString()}개` : ''} (2026) | 올페어`,
    description: `${full} ${sgg}에 살면 받을 수 있는 지역 복지 혜택${n ? ` ${n.toLocaleString()}개` : ''}를 모았어요. ${sgg} 출산·육아, 청년, 어르신, 주거 지원금과 신청 기한을 한눈에 확인하세요.`,
    alternates: { canonical: `/local/${encodeURIComponent(short)}/${encodeURIComponent(sgg)}` },
    openGraph: { title: `${short} ${sgg} 복지 혜택·지원금`, siteName: '올페어', locale: 'ko_KR', images: [ogImage({ t: `${short} ${sgg} 복지 혜택`, s: n ? `지역 혜택 ${n.toLocaleString()}개` : '우리 동네 지원금 모음', k: '동네 복지' })] },
  };
}

export default async function LocalSgg({ params }: { params: { sido: string; sgg: string } }) {
  const short = dec(params.sido), sgg = dec(params.sgg);
  const full = SIDO_BY_SHORT[short];
  if (!full || !SGG[full]?.includes(sgg)) notFound();
  const rows = await pick(full, sgg);
  const siblings = SGG[full].filter((g) => g !== sgg).map((g) => ({ label: g, href: `/local/${encodeURIComponent(short)}/${encodeURIComponent(g)}` }));
  return <LocalView short={short} full={full} sgg={sgg} own={rows.filter((r) => r.sgg === sgg)} wide={rows.filter((r) => !r.sgg)} siblings={siblings} />;
}
