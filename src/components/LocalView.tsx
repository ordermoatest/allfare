import Brand from './Brand';
import Footer from './Footer';
import ShareButton from './ShareButton';
import LocalBenefits from './LocalBenefits';
import { catCounts, LocalItem } from '@/lib/server/local';
import { daysLeft } from '@/lib/deadline';

const strip = ({ sgg: _s, ...x }: LocalItem) => x; // 화면에 안 쓰는 값은 빼고 넘김

/** 시·군·구(또는 세종처럼 시·군·구가 없는 시·도) 복지 혜택 페이지 */
export default function LocalView({ short, full, sgg, own, wide, siblings }: {
  short: string; full: string; sgg?: string; own: LocalItem[]; wide: LocalItem[]; siblings: { label: string; href: string }[];
}) {
  const place = sgg ? `${short} ${sgg}` : short;
  const name = sgg || short;
  const all = [...own, ...wide];
  const total = all.length;
  const cats = catCounts(all);
  const soon = all.filter((b) => b.dk === 'dated' && b.de && (daysLeft(b.de) ?? 99) <= 30).length;
  const n = (x: number) => x.toLocaleString();
  const ownLabel = sgg ? `${sgg}청` : `${short}`;
  const wideLabel = `${short} 전체`;
  const sections = sgg
    ? [{ title: `${sgg}에서만 받는 혜택`, sub: ownLabel, items: own.map(strip) }, { title: `${short}에 살면 받는 혜택`, sub: full, items: wide.map(strip) }]
    : [{ title: `${short}에서 받는 혜택`, sub: full, items: all.map(strip) }];
  const topNames = (cat: string) => all.filter((b) => b.cat === cat).slice(0, 2).map((b) => b.name).join(', ');
  const faq = total ? [
    { q: `${name}에서 받을 수 있는 지원금은 몇 개인가요?`, a: sgg ? `${sgg}에서 주는 혜택 ${n(own.length)}개, ${short}에서 주는 혜택 ${n(wide.length)}개로 모두 ${n(total)}개예요. 여기에 전국 공통 혜택도 함께 받을 수 있어요.` : `${full}에서 주는 혜택이 ${n(total)}개 있어요. 여기에 전국 공통 혜택도 함께 받을 수 있어요.` },
    ...cats.slice(0, 2).map((c) => ({ q: `${name} ${c.name} 지원은 어떤 게 있나요?`, a: `${c.name} 분야 혜택이 ${n(c.n)}개 있어요. ${topNames(c.name)} 등이 많이 찾는 혜택이에요.` })),
    { q: `${name} 혜택 중 나에게 맞는 것만 볼 수 있나요?`, a: '올페어에서 나이·사는 곳·소득 같은 조건을 넣으면 전국 혜택과 동네 혜택 중 꼭 맞는 것만 골라서 보여드려요.' },
  ] : [];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '동네 복지', item: 'https://www.allfare.kr/local' },
      { '@type': 'ListItem', position: 2, name: short, item: `https://www.allfare.kr/local/${encodeURIComponent(short)}` },
      ...(sgg ? [{ '@type': 'ListItem', position: 3, name: sgg, item: `https://www.allfare.kr/local/${encodeURIComponent(short)}/${encodeURIComponent(sgg)}` }] : []),
    ] },
    ...(faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
  ];
  const cultureHref = sgg ? `/culture/${encodeURIComponent(short)}/${encodeURIComponent(sgg)}` : `/culture/${encodeURIComponent(short)}`;
  return (
    <main className="doc guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Brand href="/" />
      <nav className="gcrumb"><a href="/local">동네 복지</a> › {sgg ? <><a href={`/local/${encodeURIComponent(short)}`}>{short}</a> › {sgg}</> : short}</nav>
      <div className="gtitle"><h1>{place} 복지 혜택·지원금{total ? <> <em className="lnum">{n(total)}개</em></> : null}</h1><ShareButton title={`${place} 복지 혜택·지원금`} text="우리 동네 복지 혜택 모음 · 올페어" from="local" /></div>
      {total ? (
        <p>{sgg
          ? <>{sgg}에 살면 <b>{sgg}에서 주는 혜택 {n(own.length)}개</b>와 <b>{short}에서 주는 혜택 {n(wide.length)}개</b>를 받을 수 있어요.</>
          : <>{full}에 살면 <b>{short}에서 주는 혜택 {n(total)}개</b>를 받을 수 있어요.</>}
          {' '}여기에 전국 공통 혜택도 더해져요.{cats[0] ? <> {cats[0].name} 지원이 가장 많아요.</> : null}</p>
      ) : <p>{place}에서 지금 신청할 수 있는 지역 혜택을 찾지 못했어요. 전국 공통 혜택은 내 조건을 넣으면 확인할 수 있어요.</p>}
      {total > 0 && (
        <div className="sstat s3">
          {sgg ? <><div><small>{ownLabel}</small><b>{n(own.length)}</b></div><div><small>{wideLabel}</small><b>{n(wide.length)}</b></div></>
            : <><div><small>{wideLabel}</small><b>{n(total)}</b></div><div><small>가장 많은 분야</small><b className="sm">{cats[0]?.name}</b></div></>}
          <div><small>30일 안에 마감</small><b>{n(soon)}</b></div>
        </div>
      )}
      <a className="gcta" href="/?tab=my">내 조건으로 꼭 맞는 혜택만 보기 →</a>
      <LocalBenefits sections={sections} cats={cats} from={sgg ? 'sgg' : 'sido'} />
      {faq.length > 0 && (
        <section className="gfaq">
          <h2>자주 묻는 질문</h2>
          {faq.map((f, i) => <details key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      )}
      {siblings.length > 0 && (
        <section className="rsec">
          <h2>{short} 다른 동네 복지 혜택</h2>
          <div className="rchips">{siblings.map((x) => <a key={x.href} href={x.href} className="rchip">{x.label}</a>)}</div>
        </section>
      )}
      <a className="gbanner bguide" href={cultureHref}><span><b>{place} 문화누리카드 사용처</b><small>가맹점 목록 · 분야별 모음</small></span><span aria-hidden>›</span></a>
      <Footer notes={['혜택 목록은 정부24 공공서비스 정보를 기준으로 매주 갱신돼요.', '담당 기관 이름으로 지역을 나눠서 실제 지원 지역과 조금 다를 수 있어요. 신청 전 꼭 확인하세요.']} />
    </main>
  );
}
