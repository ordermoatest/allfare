import type { Metadata } from 'next';

// 2026-11 구글 사이트 평가 회복용: 찍어낸 페이지(혜택 상세, 시·군·구 지역 페이지)를 구글에만 숨김.
// 네이버·Bing에는 그대로 보여요. 구글이 회복되면 false로 바꿔서 복원하세요.
export const GOOGLE_LEAN = true;

/** 구글에만 noindex (다른 검색엔진은 기본 robots 그대로) */
export function leanRobots(base?: Metadata['robots']): Metadata['robots'] {
  if (!GOOGLE_LEAN) return base;
  const b = (base && typeof base === 'object' ? base : {}) as Record<string, unknown>;
  return { ...b, googleBot: { index: false, follow: true } };
}
