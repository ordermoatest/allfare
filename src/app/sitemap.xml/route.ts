import { SITE } from '@/lib/site';

export const revalidate = 86400;

// 사이트맵 묶음 목록 (구글·네이버에 제출된 주소 그대로 유지)
export function GET() {
  const files = ['core', 'culture', 'benefits'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `<sitemap><loc>${SITE}/sitemaps/${f}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
