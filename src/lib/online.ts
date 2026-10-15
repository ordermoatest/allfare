// 문화누리카드 온라인 사용처 (자주 쓰는 곳). 정확한 목록은 문화누리카드 누리집 기준
export type OnlineShop = { name: string; cat: string; url: string; tip?: string };
export const ONLINE_SHOPS: OnlineShop[] = [
  { name: '교보문고', cat: '도서', url: 'https://www.kyobobook.co.kr' },
  { name: '예스24', cat: '도서', url: 'https://www.yes24.com' },
  { name: '알라딘', cat: '도서', url: 'https://www.aladin.co.kr' },
  { name: '영풍문고', cat: '도서', url: 'https://www.ypbooks.co.kr' },
  { name: 'CGV', cat: '영화', url: 'https://www.cgv.co.kr' },
  { name: '롯데시네마', cat: '영화', url: 'https://www.lottecinema.co.kr' },
  { name: '메가박스', cat: '영화', url: 'https://www.megabox.co.kr' },
  { name: '코레일 (KTX·무궁화)', cat: '교통', url: 'https://www.letskorail.com' },
  { name: 'SRT', cat: '교통', url: 'https://etk.srail.kr' },
  { name: '고속버스 (코버스)', cat: '교통', url: 'https://www.kobus.co.kr' },
  { name: '야놀자', cat: '숙박·여행', url: 'https://www.yanolja.com', tip: '문화누리 전용관에서 예약' },
  { name: '여기어때', cat: '숙박·여행', url: 'https://www.goodchoice.kr', tip: '문화누리 전용관에서 예약' },
  { name: '멜론', cat: '음원', url: 'https://www.melon.com' },
  { name: '지니뮤직', cat: '음원', url: 'https://www.genie.co.kr' },
];
export const MNURI = 'https://www.mnuri.kr';
