// 후기 품목 (가게 분야에 따라 먼저 보여줄 품목이 달라요)
export const ITEMS: Record<string, string> = {
  book: '📚 도서', stationery: '✏️ 문구', music: '💿 음반', movie: '🎟 영화 관람권', snack: '🍿 매점·식음료',
  ticket: '🎟 티켓·입장권', goods: '🛍 굿즈·기념품', sport: '🏃 이용권·강습', gear: '👟 체육용품',
  travel: '🏨 숙박·여행 상품', etc: '🎁 기타',
};
export const ITEM_KEYS = Object.keys(ITEMS);

export function itemsFor(category: string | null | undefined): string[] {
  const c = category || '';
  if (/도서|서점|책/.test(c)) return ['book', 'stationery', 'music', 'etc'];
  if (/영화|영상/.test(c)) return ['movie', 'snack', 'etc'];
  if (/음반|음악|악기/.test(c)) return ['music', 'book', 'goods', 'etc'];
  if (/공연|전시|미술|박물|문화체험|공예/.test(c)) return ['ticket', 'goods', 'etc'];
  if (/체육|스포츠|운동|경기/.test(c)) return ['sport', 'gear', 'ticket', 'etc'];
  if (/숙박|여행|관광|캠핑|교통|테마/.test(c)) return ['travel', 'ticket', 'snack', 'etc'];
  return ['book', 'stationery', 'music', 'ticket', 'sport', 'travel', 'snack', 'etc'];
}
