import type { Metadata } from 'next';
import Brand from '@/components/Brand';
import Footer from '@/components/Footer';
import { NEWS, fmtNewsDate } from '@/lib/news';
import { ogImage } from '@/lib/og';

export const metadata: Metadata = {
  title: '복지 소식 - 이번 주 마감·신청 시작·바뀐 제도 | 올페어',
  description: '매주 월·목요일, 마감이 다가오는 복지 혜택과 새로 신청이 시작된 지원금, 달라지는 제도, 대상별 꼭 챙길 혜택을 쉽게 정리해 드려요.',
  alternates: { canonical: '/news' },
  openGraph: { title: '올페어 복지 소식', description: '매주 월·목요일, 꼭 챙길 복지 혜택을 정리해 드려요', siteName: '올페어', locale: 'ko_KR', images: [ogImage({ t: '이번 주 꼭 챙길 복지 소식', s: '매주 월·목요일 발행', k: '복지 소식', e: '📰' })] },
};

export default function NewsList() {
  return (
    <main className="doc guide">
      <Brand href="/" />
      <h1 style={{ marginTop: 20 }}>📰 복지 소식</h1>
      <p>매주 월요일엔 이번 주 소식을, 목요일엔 대상별로 꼭 챙길 혜택을 정리해 드려요.</p>
      <div className="glist">
        {NEWS.map((n) => (
          <a key={n.slug} className="gitem nlitem" href={`/news/${n.slug}`}>
            <span className="gemoji" aria-hidden>{n.emoji}</span>
            <span><small className="ndate">{fmtNewsDate(n.date)} · {n.kind === 'weekly' ? '이번 주 소식' : '테마 소식'}</small><b>{n.title}</b>{n.sub && <small>{n.sub}</small>}</span>
          </a>
        ))}
      </div>
      <a className="gcta" href="/?tab=my">내 조건으로 받을 수 있는 혜택 찾기 →</a>
      <Footer />
    </main>
  );
}
