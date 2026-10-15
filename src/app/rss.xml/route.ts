import { GUIDES } from '@/lib/guides';
import { NEWS } from '@/lib/news';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 네이버 서치어드바이저 제출용 RSS (복지 가이드 글)
export function GET() {
  const news = NEWS.map((n) => `
    <item>
      <title>${esc(n.seoTitle)}</title>
      <link>${SITE}/news/${n.slug}</link>
      <guid>${SITE}/news/${n.slug}</guid>
      <description>${esc(n.desc)}</description>
      <pubDate>${new Date(n.date + 'T08:00:00+09:00').toUTCString()}</pubDate>
    </item>`).join('');
  const items = news + GUIDES.map((g) => `
    <item>
      <title>${esc(g.seoTitle)}</title>
      <link>${SITE}/guide/${g.slug}</link>
      <guid>${SITE}/guide/${g.slug}</guid>
      <description>${esc(g.desc)}</description>
      <pubDate>${new Date(g.updated).toUTCString()}</pubDate>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>올페어 복지 소식·가이드</title>
    <link>${SITE}/guide</link>
    <description>기준중위소득, 문화누리카드, 신혼부부·청년 기준 등 복지 혜택을 받기 전에 알아두면 좋은 내용</description>
    <language>ko</language>${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
