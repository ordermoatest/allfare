import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBenefit, similarBenefits } from '@/lib/server/benefit';
import { govText } from '@/lib/text';
import { SITE } from '@/lib/site';
import { deadlineLabel } from '@/lib/deadline';
import { Cond, conditionSummary } from '@/lib/match';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import { ogImage } from '@/lib/og';

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
    openGraph: { title: b.name, description: desc, type: 'article', locale: 'ko_KR', siteName: '올페어',
      images: [ogImage({ t: b.name, s: deadlineLabel(b.deadlineKind, b.deadlineEnd).text, k: b.category || '복지 혜택', e: '🎁' })] },
    twitter: { card: 'summary_large_image', title: b.name, description: desc },
  };
}

/** 받침 있으면 '은', 없으면 '는' */
const eunNeun = (w: string) => { const c = w.trim().slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 ? ((c - 0xac00) % 28 ? '은' : '는') : '은(는)'; };

/** 혜택 이름·분야로 관련 가이드 고르기 */
function guideFor(name: string, codes: string[]): { slug: string; title: string } | null {
  const R: [RegExp, string, string][] = [
    [/문화누리/, 'culture-nuri-card', '문화누리카드, 누가 얼마나 받을 수 있나요?'],
    [/월세/, 'youth-rent', '청년월세 지원, 누가 얼마나 받을 수 있나요?'],
    [/아동수당/, 'child-allowance', '아동수당, 몇 살까지 얼마 받나요?'],
    [/부모급여/, 'parent-benefit', '부모급여, 0세·1세 얼마씩 받나요?'],
    [/첫만남/, 'first-meeting-voucher', '첫만남이용권, 어디에 쓸 수 있나요?'],
    [/기초연금/, 'basic-pension', '기초연금, 우리 부모님도 받을 수 있을까요?'],
    [/근로장려|자녀장려/, 'work-incentive', '근로장려금·자녀장려금, 나도 받을 수 있나요?'],
    [/에너지\s*바우처/, 'energy-voucher', '에너지바우처, 우리 집도 받을 수 있나요?'],
    [/K-?패스|대중교통/, 'k-pass', 'K-패스 환급, 모두의 카드로 더 받을 수 있나요?'],
    [/국민취업/, 'employment-support', '국민취업지원제도, 구직촉진수당 얼마 받나요?'],
    [/도약계좌|미래적금/, 'youth-future-savings', '청년미래적금, 얼마나 모을 수 있나요?'],
    [/신혼/, 'newlywed', '신혼부부 혜택, 혼인 몇 년까지 받을 수 있나요?'],
  ];
  const hit = R.find(([re]) => re.test(name));
  if (hit) return { slug: hit[1], title: hit[2] };
  if (codes.some((c) => /^JA020[1-5]$/.test(c))) return { slug: 'median-income', title: '기준중위소득, 우리 집은 몇 %일까요?' };
  return null;
}

export default async function BenefitPage({ params }: { params: { id: string } }) {
  const b = await getBenefit(params.id).catch(() => null);
  if (!b) notFound();
  const dl = deadlineLabel(b.deadlineKind, b.deadlineEnd);
  const conds = conditionSummary({ lo: b.lo, hi: b.hi, codes: b.codes, hint: b.hint as Cond['hint'] });
  const similar = await similarBenefits(b).catch(() => []);
  const guide = guideFor(b.name, b.codes);
  const content = govText(b.content || b.summary);
  const target = govText(b.target);
  const how = govText(b.how);
  const deadlineText = (b.deadlineText || '').trim();
  // 이런 분이 받을 수 있어요 (데이터로 정리된 조건만)
  const checks = [
    ...(b.scope === 'local' && b.sido ? [`${b.sido}${b.sgg ? ` ${b.sgg}` : ''}에 사는 분`] : []),
    ...conds.map((c) => c.replace(/\s*\(설명 기준\)/, '')),
    b.deadlineKind === 'always' ? '신청 기한 없이 언제든 신청할 수 있어요' : b.deadlineKind === 'no_application' ? '따로 신청하지 않아도 받을 수 있어요'
      : b.deadlineKind === 'dated' && b.deadlineEnd ? `${b.deadlineEnd.replace(/-/g, '.')}까지 신청할 수 있어요` : '',
  ].filter(Boolean);
  const plainCond = conds.length ? conds.map((c) => c.replace(/\s*\(설명 기준\)/, '')).join(', ') : '';
  const faq = [
    { q: `${b.name} 신청 기간은 언제인가요?`, a: b.deadlineKind === 'always' ? '상시 신청이에요. 필요할 때 언제든 신청할 수 있어요.' : b.deadlineKind === 'no_application' ? '따로 신청하지 않아도 지원돼요. 자세한 내용은 담당 기관에 확인하세요.' : deadlineText ? `신청 기한은 '${deadlineText}'이에요.` : '신청 기한은 담당 기관에 확인하세요.' },
    { q: `${b.name}${eunNeun(b.name)} 어디서 신청하나요?`, a: [how.replace(/\n/g, ' ').replace(/•\s*/g, ''), b.receiver ? `접수 기관: ${b.receiver}` : '', b.phone ? `문의: ${b.phone}` : ''].filter(Boolean).join(' · ') || '담당 기관에 문의하세요.' },
    { q: `${b.name}${eunNeun(b.name)} 누가 받을 수 있나요?`, a: (plainCond ? `${plainCond} 조건이 있어요. ` : '') + (target ? target.replace(/\n/g, ' ').replace(/•\s*/g, '').slice(0, 160) : '') || '지원 대상은 담당 기관에 확인하세요.' },
  ];
  const url = `${SITE}/benefit/${encodeURIComponent(b.id)}`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '올페어', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: b.category || '복지 혜택', item: `${SITE}/` },
      { '@type': 'ListItem', position: 3, name: b.name, item: url },
    ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="app" style={{ height: 'auto', minHeight: '100dvh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <main className="scroll" style={{ paddingBottom: 32 }}>
        <Brand href="/" />
        <nav className="bcrumb"><a href="/">올페어</a> › 혜택 › {b.category} › <span>{b.name}</span></nav>
        <section className="panel">
          <div className="row"><span className="tag">{b.category}</span><span className={`due ${dl.hot ? 'hot' : ''}`}>{dl.text}</span></div>
          <h1 style={{ fontSize: 22, lineHeight: 1.35 }}>{b.name}</h1>
          <span className="cap">{[b.org, b.dept].filter(Boolean).join(' · ')}</span>
          {!b.active && <p className="note" style={{ color: 'var(--warn)' }}>정부24 목록에서 내려간 혜택이에요. 신청처에 확인해 주세요.</p>}
          {content && <div className="amount"><span className="cap" style={{ color: 'inherit' }}>지원 내용</span><b>{content}</b></div>}
        </section>
        {checks.length > 0 && (
          <section className="panel">
            <h2 className="bh2">이런 분이 받을 수 있어요</h2>
            <ul className="bchk">{checks.map((c) => <li key={c}>{c}</li>)}</ul>
            <a className="bmy" href={`/?b=${encodeURIComponent(b.id)}`}>내 조건으로 받을 수 있는지 확인하기 →</a>
          </section>
        )}
        <section className="panel">
          {target && <div className="kv"><em>누가 받을 수 있나요</em><p>{target}</p></div>}
          {b.criteria && <div className="kv"><em>선정 기준</em><p>{govText(b.criteria)}</p></div>}
          {how && <div className="kv"><em>어떻게 신청하나요</em><p>{how}</p></div>}
          <div className="row"><span className="cap">신청 기한</span><b style={{ textAlign: 'right' }}>{deadlineText || dl.text}</b></div>
          {b.phone && <div className="row"><span className="cap">문의</span><span>{b.phone}</span></div>}
        </section>
        <div className="btns">
          <a className="go" href={b.url || 'https://www.gov.kr'} target="_blank" rel="noopener noreferrer">신청하러 가기</a>
        </div>
        <section className="panel bfaq">
          <h2 className="bh2">자주 묻는 질문</h2>
          {faq.map((f, i) => <details key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
        {similar.length > 0 && (
          <section className="panel blist">
            <h2 className="bh2">비슷한 혜택</h2>
            {similar.map((x) => <a key={x.id} href={`/benefit/${encodeURIComponent(x.id)}`}><span><b>{x.name}</b><small>{[x.org, x.category].filter(Boolean).join(' · ')}</small></span><em aria-hidden>›</em></a>)}
          </section>
        )}
        {guide && <a className="gbanner bguide" href={`/guide/${guide.slug}`}><span><b>{guide.title}</b><small>올페어 복지 가이드</small></span><span aria-hidden>›</span></a>}
        <a className="cta" href={`/?b=${encodeURIComponent(b.id)}`} style={{ display: 'grid', placeItems: 'center', textDecoration: 'none', background: 'var(--card)', color: 'var(--mint)' }}>내가 받을 수 있는 혜택 더 찾기</a>
        <Footer notes={['정확한 지원 조건과 선정 여부는 신청처에서 꼭 확인하세요.']} />
      </main>
    </div>
  );
}
