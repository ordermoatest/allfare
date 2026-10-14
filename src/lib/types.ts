/** 혜택 목록 한 줄 (API /api/benefits 의 짧은 키) */
export type BItem = {
  id: string; n: string; s: string; c: string; o: string | null;
  dk: string | null; de: string | null; v: number; l: number; r: string | null;
  lo: number; hi: number; k: string[];
};

export type Store = {
  id: string; name: string; category: string | null; address: string | null;
  lat: number; lng: number; phone: string | null; place_url: string | null;
  distance: number; review_count: number;
};

export type Place = { lat: number; lng: number; label: string; mode: 'gps' | 'search' | 'home' };

export const km = (d: number) => (d < 1000 ? `${d}m` : `${(d / 1000).toFixed(1)}km`);
