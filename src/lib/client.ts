// 브라우저 전용 도우미: GA 이벤트, 카카오 SDK 로더, 공유

type Gtag = (...args: unknown[]) => void;
export function track(name: string, params: Record<string, unknown> = {}) {
  try { (window as unknown as { gtag?: Gtag }).gtag?.('event', name, params); } catch { /* GA 없음 */ }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id; s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('스크립트를 불러오지 못했어요'));
    document.head.appendChild(s);
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let mapsPromise: Promise<any> | null = null;
/** 카카오 지도 SDK */
export function loadKakaoMaps(): Promise<any> {
  if (mapsPromise) return mapsPromise;
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) return Promise.reject(new Error('카카오 JavaScript 키가 없어요'));
  mapsPromise = loadScript(`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`, 'kakao-maps')
    .then(() => new Promise((resolve) => (window as any).kakao.maps.load(() => resolve((window as any).kakao))))
    .catch((e) => { mapsPromise = null; throw e; });
  return mapsPromise;
}

/** 카카오톡 공유 → 안 되면 기기 공유 → 링크 복사 */
export async function shareLink(title: string, text: string, url: string): Promise<'kakao' | 'native' | 'copied' | 'fail'> {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  try {
    if (key) {
      await loadScript('https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js', 'kakao-sdk');
      const K = (window as any).Kakao;
      if (K && !K.isInitialized()) K.init(key);
      if (K?.Share) {
        K.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: title.slice(0, 80),
            description: text.slice(0, 100),
            imageUrl: `${location.origin}/og.png`,
            imageWidth: 1200, imageHeight: 630,
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{ title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } }],
        });
        return 'kakao';
      }
    }
  } catch { /* 다음 방법으로 */ }
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'native'; }
  } catch { /* 취소 등 */ }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { return 'fail'; }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
