/** 대표 주소 (Vercel 환경변수 NEXT_PUBLIC_SITE_URL, 예: https://allfare.kr) */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allfare.kr').replace(/\/$/, '');
