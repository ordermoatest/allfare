import 'server-only';
import { db } from './supabase';
import { SGG } from '../regions';

// 지역 페이지 주소용 짧은 시·도 이름
export const SIDO_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천', '대전광역시': '대전', '울산광역시': '울산',
  '세종특별자치시': '세종', '경기도': '경기', '강원특별자치도': '강원', '충청북도': '충북', '충청남도': '충남', '전북특별자치도': '전북',
  '전남광주통합특별시': '전남광주', '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주',
};
export const SIDO_BY_SHORT: Record<string, string> = Object.fromEntries(Object.entries(SIDO_SHORT).map(([f, s]) => [s, f]));

// 가맹점 원본 주소(2021년)에 적힌 시·도 표기
const ADDR_SIDO: Record<string, string[]> = {
  '서울특별시': ['서울'], '부산광역시': ['부산'], '대구광역시': ['대구'], '인천광역시': ['인천'], '대전광역시': ['대전'], '울산광역시': ['울산'],
  '세종특별자치시': ['세종'], '경기도': ['경기'], '강원특별자치도': ['강원'], '충청북도': ['충청북도', '충북'], '충청남도': ['충청남도', '충남'],
  '전북특별자치도': ['전라북도', '전북'], '전남광주통합특별시': ['광주', '전라남도', '전남'], '경상북도': ['경상북도', '경북'],
  '경상남도': ['경상남도', '경남'], '제주특별자치도': ['제주'],
};
// 2026년 새로 생긴 구 → 옛 주소의 구 이름 (원본 주소가 옛 이름이라서)
const OLD_SGG: Record<string, Record<string, string[]>> = {
  '인천광역시': { '서해구': ['서구'], '검단구': ['서구'], '제물포구': ['중구', '동구'], '영종구': ['중구'] },
};
// 광주광역시 자치구는 전남 군과 이름이 겹치지 않게 광주로만 찾기
const GWANGJU_GU = ['광산구', '남구', '동구', '북구', '서구'];

export type RegionStore = { id: string; name: string; category: string | null; address: string | null; phone: string | null; lat: number | null; lng: number | null; reviews?: number };

export function validRegion(sido: string, sgg?: string) {
  if (!SGG[sido]) return false;
  if (sgg === undefined) return true;
  return SGG[sido].includes(sgg);
}

/** 시·군·구의 문화누리카드 가맹점 (없으면 시·도 전체 = 세종) */
export async function storesOf(sido: string, sgg?: string): Promise<RegionStore[]> {
  let prefixes = ADDR_SIDO[sido] || [];
  if (sido === '전남광주통합특별시' && sgg) prefixes = GWANGJU_GU.includes(sgg) ? ['광주'] : ['전라남도', '전남'];
  const names = sgg ? (OLD_SGG[sido]?.[sgg] || [sgg]) : [];
  const out: RegionStore[] = [];
  for (let from = 0; from < 8000; from += 1000) {
    // (시·도로 시작) 그리고 (시·군·구 이름이 들어감) — 조합을 하나의 or 로
    const conds = names.length
      ? prefixes.flatMap((p) => names.map((n) => `and(address.ilike."${p}%",address.ilike."% ${n} %")`))
      : prefixes.map((p) => `address.ilike."${p}%"`);
    const { data, error } = await db().from('culture_stores').select('id,name,category,address,phone,lat,lng')
      .eq('active', true).or(conds.join(',')).order('name').range(from, from + 999);
    if (error) throw new Error(error.message); // 오류면 빈 페이지가 하루 동안 저장되지 않게
    if (!data?.length) break;
    out.push(...(data as RegionStore[]));
    if (data.length < 1000) break;
  }
  // 후기 수 붙이기 (숨김 제외)
  const cnt = new Map<string, number>();
  for (let i = 0; i < out.length; i += 300) {
    const ids = out.slice(i, i + 300).map((x) => x.id);
    const { data } = await db().from('store_reviews').select('store_id').eq('hidden', false).in('store_id', ids);
    (data || []).forEach((r) => cnt.set(r.store_id, (cnt.get(r.store_id) || 0) + 1));
  }
  out.forEach((x) => { x.reviews = cnt.get(x.id) || 0; });
  // 정렬: 후기 많은 곳 → 전화번호 있는 곳 → 이름 가나다 ((재)·(주)·주식회사 빼고)
  const key = (n: string) => n.replace(/\(.*?\)|㈜|주식회사|재단법인|사단법인|\s/g, '');
  return out.sort((a, b) => (b.reviews || 0) - (a.reviews || 0) || Number(!!b.phone) - Number(!!a.phone) || key(a.name).localeCompare(key(b.name), 'ko'));
}
