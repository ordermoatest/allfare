import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBenefit } from '@/lib/server/benefit';
import { deadlineLabel } from '@/lib/deadline';
import { conditionSummary } from '@/lib/match';
import Brand from '@/components/Brand';

export const revalidate = 3600;

// 카카오톡 등으로 공유된 링크가 열리는 혜택 소개 페이지
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const b = await getBenefit(params.id).catch(() => null);
  if (!b) return { title: '올페어' };
  const desc = (b.summary || b.content || '').slice(0, 120);
  return { title: `${b.name} - 올페어`, description: desc, openGraph: { title: b.name, description: desc, images: [{ url: '/og.png', width: 1200, height: 630 }] } };
}

export default async function BenefitPage({ params }: { params: { id: string } }) {
  const b = await getBenefit(params.id).catch(() => null);
  if (!b) notFound();
  const dl = deadlineLabel(b.deadlineKind, b.deadlineEnd);
  const conds = conditionSummary({ lo: b.lo, hi: b.hi, codes: b.codes });
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
        <p className="note">올페어는 정부 기관이 아니며, 공공데이터포털 자료를 바탕으로 안내합니다. 정확한 내용은 신청처에서 확인하세요.</p>
      </main>
    </div>
  );
}
