// 선 아이콘 (currentColor)
type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const IcSearch = ({ size = 20 }: P) => <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IcGift = ({ size = 20 }: P) => <svg {...base(size)}><rect x="3" y="8" width="18" height="13" rx="3" /><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z" /></svg>;
export const IcPin = ({ size = 20 }: P) => <svg {...base(size)}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const IcSliders = ({ size = 20 }: P) => <svg {...base(size)}><path d="M4 6h16M4 12h10M4 18h6" /><circle cx="18" cy="16" r="3" /></svg>;
export const IcBook = ({ size = 20 }: P) => <svg {...base(size)}><path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" /></svg>;
export const IcChevron = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={2.4}><path d="M9 6l6 6-6 6" /></svg>;
export const IcGps = ({ size = 20 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" /></svg>;
export const IcHeart = ({ size = 20 }: P) => <svg {...base(size)} strokeWidth={1.9}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
export const IcHeartFill = ({ size = 14 }: P) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
export const IcShare = ({ size = 22 }: P) => <svg {...base(size)} strokeWidth={1.8}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>;
export const IcPhone = ({ size = 18 }: P) => <svg {...base(size)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>;
export const IcRoute = ({ size = 18 }: P) => <svg {...base(size)}><path d="M3 11l18-8-8 18-2-8z" /></svg>;
export const IcOut = ({ size = 18 }: P) => <svg {...base(size)}><path d="M7 17L17 7M9 7h8v8" /></svg>;
export const IcCalc = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={1.9}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2" /></svg>;
export const IcMap = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={1.9}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>;
export const IcBack = ({ size = 24 }: P) => <svg {...base(size)} strokeWidth={2.3}><path d="M9 14l-4-4 4-4" /><path d="M5 10h9a5 5 0 0 1 0 10h-2" /></svg>;

// 가맹점 분류 아이콘 (원본 분류명에 들어간 단어로 고름)
export function StoreIcon({ cat, size = 13 }: { cat: string; size?: number }) {
  const c = cat || '';
  const p = base(size);
  if (/도서|서점|책/.test(c)) return <svg {...p}><path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" /></svg>;
  if (/영화/.test(c)) return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M10 10l5 2.5-5 2.5z" /></svg>;
  if (/음반|음악|악기/.test(c)) return <svg {...p}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>;
  if (/여행|숙박|관광|교통|캠핑/.test(c)) return <svg {...p}><path d="M3 20L12 4l9 16z" /><path d="M12 20v-6" /></svg>;
  if (/체육|스포츠|운동|경기/.test(c)) return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c3 3 3 13 0 16" /></svg>;
  return <svg {...p}><path d="M5 20V9l7-5 7 5v11" /><path d="M9 20v-6h6v6" /></svg>;
}
