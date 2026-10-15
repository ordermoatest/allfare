import type { Metadata } from 'next';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import { GROUPS, guidesIn } from '@/lib/guides';

export const metadata: Metadata = {
  title: '복지 가이드 - 청년월세·부모급여·아동수당·기초연금·근로장려금 2026 | 올페어',
  description: '청년월세 지원, 청년미래적금, 부모급여, 아동수당, 첫만남이용권, K-패스, 에너지바우처, 근로장려금, 기초연금, 문화누리카드와 기준중위소득까지 2026년 복지 혜택을 쉽게 정리했어요.',
  alternates: { canonical: '/guide' },
};

export default function GuideList() {
  return (
    <main className="doc guide">
      <Brand href="/" />
      <h1 style={{ marginTop: 20 }}>📘 복지 가이드</h1>
      <p>혜택을 찾기 전에 알아두면 좋은 내용을 쉽게 정리했어요.</p>
      {GROUPS.map((gr) => (
        <section key={gr.key} className="ggroup">
          <h2>{gr.label}</h2>
          <div className="glist">
            {guidesIn(gr.key).map((g) => (
              <a key={g.slug} className="gitem" href={`/guide/${g.slug}`}>
                <span className="gemoji" aria-hidden>{g.emoji}</span>
                <span><b>{g.title}</b>{g.sub && <small>{g.sub}</small>}</span>
              </a>
            ))}
          </div>
        </section>
      ))}
      <a className="gcta" href="/">내 조건으로 받을 수 있는 혜택 찾기 →</a>
      <Footer />
    </main>
  );
}
