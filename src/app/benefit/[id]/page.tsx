import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBenefit } from '@/lib/server/benefit';
import { deadlineLabel } from '@/lib/deadline';
import { Cond, conditionSummary } from '@/lib/match';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';

export const revalidate = 3600;

// 카카오톡 등으로 공유된 링크가 열리는 혜택 소개 페이지
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const b = await getBenefit(params.id).catch(() => null);
  if (!b) return { title: '올페어', robots: { index: false } };
  const clip = (t: string | null, n: number) => (t || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const title = `${b.name} - 대상·지원 내용·신청 방법 | 올페어`;
  const desc = [b.org, clip(b.summary || b.content, 70), b.target ? `대상: ${clip(b.target, 50)}` : ''].filter(Boolean).join(' · ');
  return {
    title, description: desc,
    alternates: { canonical: `/benefit/${encodeURIComponent(b.id)}` },
    robots: b.active ? undefined : { index: false },
    openGraph: { title: b.name, description: desc, type: 'article', locale: 'ko_KR', siteName: '올페어', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  };
}

export default async function BenefitPage({ params }: { params: { id: string } }) {
  const b = await getBenefit(params.id).catch(() => null);
  if (!b) notFound();
  const dl = deadlineLabel(b.deadlineKind, b.deadlineEnd);
  const conds = conditionSummary({ lo: b.lo, hi: b.hi, codes: b.codes, hint: b.hint as Cond['hint'] });
  return (
    <div className="app" style={{ height: 'auto', minHeight: '100dvh' }}>
      <main className="scroll" style={{ paddingBottom: 32 }}>
        <Brand href="/" />
        <section className="panel">
          <div className="row"><span className="tag">{b.category}</span><span className={`due ${dl.hot ? 'hot' : ''}`}>{dl.text}</span></div>
          <h1 style={{ fontSize: 22, lineHeight: 1.35 }}>{b.name}</h1>
          <span className="cap">{[b.org, b.dept].filter(Boolean).join(' · ')}</span>
          {!b.active && <p className="note" style={{ color: 'var(--warn)' }}>정부24 목록에서 내려간 혜택이에요. 신청처에 확인해 주세요.</p>}
          {(b.content || b.summary) && <div className="amount"><span className="cap" style={{ color: 'inherit' }}>지원 내용</span><b>{b.content || b.summary}</b></div>}
          {b.target && <div className="kv"><em>누가 받을 수 있나요</em><p>{b.target}</p></div>}
          {conds.length > 0 && <div className="kv"><em>지원 조건 요약</em><p>{conds.join('\n')}</p></div>}
          {b.criteria && <div className="kv"><em>선정 기준</em><p>{b.criteria}</p></div>}
          {b.how && <div className="kv"><em>어떻게 신청하나요</em><p>{b.how}</p></div>}
          <div className="row"><span className="cap">신청 기한</span><b style={{ textAlign: 'right' }}>{b.deadlineText || dl.text}</b></div>
          {b.phone && <div className="row"><span className="cap">문의</span><span>{b.phone}</span></div>}
        </section>
        <div className="btns">
          <a className="go" href={b.url || 'https://www.gov.kr'} target="_blank" rel="noopener noreferrer">신청하러 가기</a>
        </div>
        <a className="cta" href={`/?b=${encodeURIComponent(b.id)}`} style={{ display: 'grid', placeItems: 'center', textDecoration: 'none', background: 'var(--card)', color: 'var(--mint)' }}>내가 받을 수 있는 혜택 더 찾기</a>
        <Footer notes={['정확한 지원 조건과 선정 여부는 신청처에서 꼭 확인하세요.']} />
      </main>
    </div>
  );
}
