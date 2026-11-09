import type { Metadata } from 'next';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import LocalSearch from '@/components/LocalSearch';
import MoreBenefits from '@/components/MoreBenefits';
import { SGG, SIDO_SHORT } from '@/lib/regions';
import { ogImage } from '@/lib/og';

export const metadata: Metadata = {
  title: '우리 동네 복지 혜택·지원금 찾기 (시·군·구별, 2026) | 올페어',
  description: '시·군·구청과 시·도에서 주는 복지 혜택과 지원금을 동네별로 모았어요. 출산·육아, 청년, 어르신, 주거 지원까지 우리 동네 혜택을 한눈에 확인하세요.',
  alternates: { canonical: '/local' },
  openGraph: { title: '우리 동네 복지 혜택·지원금', siteName: '올페어', locale: 'ko_KR', images: [ogImage({ t: '우리 동네 복지 혜택·지원금', s: '시·군·구별 지원금 모음', k: '동네 복지' })] },
};

const sh = (full: string) => encodeURIComponent(SIDO_SHORT[full]);

export default function LocalIndex() {
  const n = Object.values(SGG).reduce((s, l) => s + (l.length || 1), 0);
  return (
    <main className="doc guide">
      <Brand href="/" />
      <nav className="gcrumb"><a href="/">올페어</a> › 동네 복지</nav>
      <h1>우리 동네 복지 혜택·지원금 찾기</h1>
      <p>시·군·구청과 시·도에서 주는 지원금을 동네별로 모았어요. 전국 <b>{n}개</b> 시·군·구의 혜택을 볼 수 있어요.</p>
      <LocalSearch />
      {Object.entries(SGG).map(([full, list]) => (
        <section key={full} className="rsec">
          <h2><a href={`/local/${sh(full)}`} className="lsido">{SIDO_SHORT[full]} <small>{full} 전체 ›</small></a></h2>
          {list.length > 0 && <div className="rchips">{list.map((g) => <a key={g} className="rchip" href={`/local/${sh(full)}/${encodeURIComponent(g)}`}>{g}</a>)}</div>}
        </section>
      ))}
      <MoreBenefits from="local_index" />
      <Footer notes={['혜택 목록은 정부24 공공서비스 정보를 기준으로 매주 갱신돼요.']} />
    </main>
  );
}
