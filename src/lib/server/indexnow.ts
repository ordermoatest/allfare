import 'server-only';
import { coreUrls } from './sitemaps';

// IndexNow: 새로 올리거나 고친 페이지를 Bing·네이버 등에 자동으로 알려요.
// 키 파일은 public/8e3f26d084b274c1c46afe60bd26f05a.txt (내용 = 키). 키를 바꾸면 그 파일 이름도 같이 바꿔야 해요.
export const INDEXNOW_KEY = '8e3f26d084b274c1c46afe60bd26f05a';
const HOST = 'www.allfare.kr';

/** 최근 days일 안에 바뀐 페이지(가이드·소식·홈 등)를 알림 */
export async function pingIndexNow(days = 2): Promise<{ sent: number; status?: number; error?: string }> {
  const since = Date.now() - days * 86400000;
  const urls = coreUrls()
    .filter((u) => u.lastmod && new Date(u.lastmod).getTime() >= since)
    .map((u) => u.loc)
    .slice(0, 500);
  if (!urls.length) return { sent: 0 };
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`, urlList: urls }),
    });
    return { sent: urls.length, status: r.status };
  } catch (e) {
    return { sent: 0, error: (e as Error).message };
  }
}
