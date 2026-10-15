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

/** 휴대폰 기본 공유창 → 안 되면 링크 복사 (카카오 앱 설정을 거치지 않아 링크가 그대로 전달됨) */
export async function shareLink(title: string, text: string, url: string): Promise<'native' | 'copied' | 'fail' | 'cancel'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ title, text, url }); return 'native'; }
    catch (e) { if (e instanceof Error && e.name === 'AbortError') return 'cancel'; }
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { /* 아래로 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok ? 'copied' : 'fail';
  } catch { return 'fail'; }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
