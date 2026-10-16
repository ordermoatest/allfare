import type { Metadata } from 'next';
import Brand from '@/components/Brand';
import MoreBenefits from '@/components/MoreBenefits';
import Footer from '@/components/Footer';
import { SGG } from '@/lib/regions';
import { SIDO_SHORT } from '@/lib/server/regionStores';

export const metadata: Metadata = {
  title: '지역별 문화누리카드 사용처·가맹점 찾기 (2026) | 올페어',
  description: '서울·경기·인천 등 전국 시·군·구별 문화누리카드 사용처와 가맹점을 분야별로 정리했어요. 내 주변 문화누리카드 사용처 찾기는 지도에서, 연말 잔액 사용처와 온라인 가맹점도 확인하세요.',
  alternates: { canonical: '/culture' },
};

export default function CultureIndex() {
  return (
    <main className="doc guide">
      <Brand href="/" />
      <h1 style={{ marginTop: 20 }}>🎫 지역별 문화누리카드 사용처</h1>
      <p>우리 동네를 골라 문화누리카드를 쓸 수 있는 서점·영화관·공연장·체육시설을 확인해 보세요.</p>
      <a className="gcta" href="/?tab=culture">📍 내 주변 사용처 지도로 보기 →</a>
      {Object.entries(SGG).map(([full, list]) => {
        const short = SIDO_SHORT[full];
        return (
          <section key={full} className="rsec">
            <h2><a href={`/culture/${encodeURIComponent(short)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{full}</a></h2>
            <div className="rchips">
              {list.length
                ? list.map((g) => <a key={g} className="rchip" href={`/culture/${encodeURIComponent(short)}/${encodeURIComponent(g)}`}>{g}</a>)
                : <a className="rchip" href={`/culture/${encodeURIComponent(short)}`}>{short} 전체</a>}
            </div>
          </section>
        );
      })}
      <MoreBenefits from="culture_index" />
      <Footer notes={['가맹점 목록은 한국문화예술위원회 공개 자료 기준이에요.']} />
    </main>
  );
}
