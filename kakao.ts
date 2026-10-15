import 'server-only';

const BASE = 'https://dapi.kakao.com/v2/local';

async function kakao<T>(path: string, params: Record<string, string | number>): Promise<T | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error('KAKAO_REST_API_KEY 환경변수가 없어요');
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: { Authorization: `KakaoAK ${key}` }, cache: 'no-store' });
  if (res.status === 429) throw new Error('카카오 API 일일 호출 한도를 넘었어요');
  if (!res.ok) return null;
  return (await res.json()) as T;
}

type Doc = { x: string; y: string; address_name?: string; place_name?: string; road_address_name?: string; phone?: string; place_url?: string; region_1depth_name?: string; region_2depth_name?: string; region_3depth_name?: string };
type Res = { documents: Doc[] };

/** 주소 → 좌표 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const r = await kakao<Res>('/search/address.json', { query: address, size: 1 });
  const d = r?.documents?.[0];
  return d ? { lat: +d.y, lng: +d.x } : null;
}

/** 키워드 장소 검색 (근처 우선) */
export async function searchPlace(query: string, near?: { lat: number; lng: number }, radius = 500) {
  const params: Record<string, string | number> = { query, size: 5 };
  if (near) Object.assign(params, { x: near.lng, y: near.lat, radius, sort: 'distance' });
  const r = await kakao<Res>('/search/keyword.json', params);
  return (r?.documents || []).map((d) => ({
    name: d.place_name || '', lat: +d.y, lng: +d.x, phone: d.phone || '', url: d.place_url || '',
    address: d.road_address_name || d.address_name || '',
  }));
}

/** 동네·역·주소 검색 → 후보 목록 (문화누리 탭 '기준 위치 바꾸기') */
export async function searchLocations(q: string): Promise<{ lat: number; lng: number; label: string; sub: string }[]> {
  const [a, k] = await Promise.all([
    kakao<Res>('/search/address.json', { query: q, size: 3 }),
    kakao<Res>('/search/keyword.json', { query: q, size: 6 }),
  ]);
  const out = [
    ...(a?.documents || []).map((d) => ({ lat: +d.y, lng: +d.x, label: d.address_name || q, sub: '주소' })),
    ...(k?.documents || []).map((d) => ({ lat: +d.y, lng: +d.x, label: d.place_name || q, sub: d.road_address_name || d.address_name || '' })),
  ];
  const seen = new Set<string>();
  return out.filter((x) => { const key = x.label + x.sub; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 7);
}

/** 좌표 → 동네 이름 */
export async function regionName(lat: number, lng: number): Promise<string | null> {
  const r = await kakao<Res>('/geo/coord2regioncode.json', { x: lng, y: lat });
  const d = r?.documents?.find((x: Doc & { region_type?: string }) => (x as { region_type?: string }).region_type === 'H') || r?.documents?.[0];
  if (!d) return null;
  return [d.region_2depth_name, d.region_3depth_name].filter(Boolean).join(' ');
}
