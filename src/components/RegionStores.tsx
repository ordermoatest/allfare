import Brand from './Brand';
import Footer from './Footer';
import type { RegionStore } from '@/lib/server/regionStores';
import { SITE } from '@/lib/site';

const PER_CAT = 30;

/** 지역별 문화누리카드 사용처 (서버에서 그리는 검색용 페이지) */
export default function RegionStores({ sidoShort, sidoFull, sgg, stores, siblings }: {
  sidoShort: string; sidoFull: string; sgg?: string; stores: RegionStore[]; siblings: { label: string; href: string }[];
}) {
  const place = sgg ? `${sidoShort} ${sgg}` : sidoShort;
  const cats = new Map<string, RegionStore[]>();
  stores.forEach((s) => { const c = s.category || '기타'; cats.set(c, [...(cats.get(c) || []), s]); });
  const catList = Array.from(cats.entries()).sort((a, b) => b[1].length - a[1].length);
  const geo = stores.filter((s) => s.lat && s.lng);
  const center = geo.length ? { lat: geo.reduce((a, s) => a + (s.lat || 0), 0) / geo.length, lng: geo.reduce((a, s) => a + (s.lng || 0), 0) / geo.length } : null;
  const mapHref = center ? `/?tab=culture&lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}&at=${encodeURIComponent(place)}` : '/?tab=culture';
  const crumbs = [
    { name: '올페어', item: `${SITE}/` },
    { name: '문화누리카드 사용처', item: `${SITE}/culture` },
    { name: sidoShort, item: `${SITE}/culture/${encodeURIComponent(sidoShort)}` },
    ...(sgg ? [{ name: sgg, item: `${SITE}/culture/${encodeURIComponent(sidoShort)}/${encodeURIComponent(sgg)}` }] : []),
  ];
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })) };

  return (
    <main className="doc guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Brand href="/" />
      <nav className="gcrumb"><a href="/culture">🎫 지역별 문화누리카드 사용처</a> › <a href={`/culture/${encodeURIComponent(sidoShort)}`}>{sidoShort}</a>{sgg && <> › {sgg}</>}</nav>
      <h1>{place} 문화누리카드 사용처</h1>
      {stores.length ? (
        <p>{sidoFull}{sgg ? ` ${sgg}` : ''}에서 문화누리카드를 쓸 수 있는 가맹점은 <b>{stores.length.toLocaleString()}곳</b>이에요.
          {catList.length > 0 && <> {catList.slice(0, 3).map(([c, l]) => `${c} ${l.length}곳`).join(', ')} 순으로 많아요.</>}</p>
      ) : (
        <p>아직 {place}의 가맹점 정보를 정리하고 있어요. 올페어 지도에서 가까운 사용처를 찾아보세요.</p>
      )}
      <a className="gcta" href={mapHref}>📍 {place} 사용처 지도로 보기 →</a>

      {catList.length > 0 && (
        <div className="rchips">
          {catList.map(([c, l]) => <a key={c} href={`#c-${encodeURIComponent(c)}`} className="rchip">{c} <i>{l.length}</i></a>)}
        </div>
      )}

      {catList.map(([c, l]) => (
        <section key={c} id={`c-${encodeURIComponent(c)}`} className="rsec">
          <h2>{c} <span className="gsmall">{l.length}곳</span></h2>
          <ul className="rlist">
            {l.slice(0, PER_CAT).map((s) => (
              <li key={s.id}>
                <b>{s.name}</b>
                <span>{s.address}</span>
                {s.phone && <a href={`tel:${s.phone.replace(/[^0-9]/g, '')}`}>{s.phone}</a>}
              </li>
            ))}
          </ul>
          {l.length > PER_CAT && <a className="plink" href={mapHref}>{c} {(l.length - PER_CAT).toLocaleString()}곳 더 보기 (지도) →</a>}
        </section>
      ))}

      <h2>문화누리카드, 이것만 알아두세요</h2>
      <ul>
        <li>2026년 문화누리카드는 1인당 연 15만원(13~18세·60~64세는 16만원)이에요.</li>
        <li>기초생활수급자·차상위계층 중 만 6세 이상이면 받을 수 있어요.</li>
        <li>가맹점 목록은 공개 자료 기준이라 실제와 다를 수 있어요. 방문 전에 가게에 결제 가능 여부를 확인해 보세요.</li>
      </ul>
      <a className="plink" href="/guide/culture-nuri-card">문화누리카드 신청 방법 자세히 보기 →</a>

      {siblings.length > 0 && (
        <section className="rsec">
          <h2>{sgg ? `${sidoShort} 다른 지역` : `${sidoShort} 시·군·구별 사용처`}</h2>
          <div className="rchips">{siblings.map((x) => <a key={x.href} href={x.href} className="rchip">{x.label}</a>)}</div>
        </section>
      )}
      <Footer notes={['가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요.', '방문 전 문화누리카드 결제 가능 여부를 가게에 확인하세요.']} />
    </main>
  );
}
