// 공유 미리보기 카드(1200×630) 주소 만들기 → /og 경로가 그림을 그려요
export function ogImage(o: { t: string; s?: string; k?: string; e?: string }) {
  const q = new URLSearchParams();
  q.set('t', o.t.slice(0, 60));
  if (o.s) q.set('s', o.s.slice(0, 50));
  if (o.k) q.set('k', o.k.slice(0, 20));
  if (o.e) q.set('e', o.e.slice(0, 4));
  return { url: `/og?${q.toString()}`, width: 1200, height: 630, alt: o.t };
}
