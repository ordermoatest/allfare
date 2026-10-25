import { benefitUrls, coreUrls, cultureUrls, urlset } from '@/lib/server/sitemaps';

// 빌드 때 만들지 않고 요청 때 만들어 버셀 CDN에 하루 저장 (실패하면 저장 안 됨)
export const dynamic = 'force-dynamic';
const CACHE = 'public, s-maxage=86400, stale-while-revalidate=3600';

export async function GET(_: Request, { params }: { params: { file: string } }) {
  const name = params.file.replace(/\.xml$/, '');
  let urls;
  if (name === 'core') urls = coreUrls();
  else if (name === 'culture') urls = cultureUrls();
  else if (name === 'benefits') {
    try { urls = await benefitUrls(); } catch { return new Response('temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } }); } // 실패한 빈 목록이 하루 저장되지 않게
  } else return new Response('not found', { status: 404 });
  return new Response(urlset(urls), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CACHE } });
}
