import type { Metadata } from 'next';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: '복지 가이드 - 기준중위소득·문화누리카드·신혼부부·청년 기준 | 올페어',
  description: '기준중위소득 계산, 소득인정액, 세대주 확인법, 문화누리카드, 신혼부부·청년 나이 기준까지 복지 혜택을 받기 전에 알아두면 좋은 내용을 쉽게 정리했어요.',
  alternates: { canonical: '/guide' },
};

export default function GuideList() {
  return (
    <main className="doc guide">
      <Brand href="/" />
      <h1 style={{ marginTop: 20 }}>📘 복지 가이드</h1>
      <p>혜택을 찾기 전에 알아두면 좋은 내용을 쉽게 정리했어요.</p>
      <div className="glist">
        {GUIDES.map((g) => (
          <a key={g.slug} className="gitem" href={`/guide/${g.slug}`}>
            <span className="gemoji" aria-hidden>{g.emoji}</span>
            <span><b>{g.title}</b>{g.sub && <small>{g.sub}</small>}</span>
          </a>
        ))}
      </div>
      <a className="gcta" href="/">내 조건으로 받을 수 있는 혜택 찾기 →</a>
      <Footer />
    </main>
  );
}
