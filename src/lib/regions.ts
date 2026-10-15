// 시·도 / 시·군·구 목록과 기관명 → 지역 판별
// 2026.7 행정구역 반영: 인천(제물포구·영종구·서해구·검단구), 전남광주통합특별시

export const SGG: Record<string, string[]> = {
  '서울특별시': '강남구 강동구 강북구 강서구 관악구 광진구 구로구 금천구 노원구 도봉구 동대문구 동작구 마포구 서대문구 서초구 성동구 성북구 송파구 양천구 영등포구 용산구 은평구 종로구 중구 중랑구'.split(' '),
  '부산광역시': '강서구 금정구 기장군 남구 동구 동래구 부산진구 북구 사상구 사하구 서구 수영구 연제구 영도구 중구 해운대구'.split(' '),
  '대구광역시': '군위군 남구 달서구 달성군 동구 북구 서구 수성구 중구'.split(' '),
  '인천광역시': '강화군 검단구 계양구 남동구 미추홀구 부평구 서해구 연수구 영종구 옹진군 제물포구'.split(' '),
  '대전광역시': '대덕구 동구 서구 유성구 중구'.split(' '),
  '울산광역시': '남구 동구 북구 울주군 중구'.split(' '),
  '세종특별자치시': [],
  '경기도': '가평군 고양시 과천시 광명시 광주시 구리시 군포시 김포시 남양주시 동두천시 부천시 성남시 수원시 시흥시 안산시 안성시 안양시 양주시 양평군 여주시 연천군 오산시 용인시 의왕시 의정부시 이천시 파주시 평택시 포천시 하남시 화성시'.split(' '),
  '강원특별자치도': '강릉시 고성군 동해시 삼척시 속초시 양구군 양양군 영월군 원주시 인제군 정선군 철원군 춘천시 태백시 평창군 홍천군 화천군 횡성군'.split(' '),
  '충청북도': '괴산군 단양군 보은군 영동군 옥천군 음성군 제천시 증평군 진천군 청주시 충주시'.split(' '),
  '충청남도': '계룡시 공주시 금산군 논산시 당진시 보령시 부여군 서산시 서천군 아산시 예산군 천안시 청양군 태안군 홍성군'.split(' '),
  '전북특별자치도': '고창군 군산시 김제시 남원시 무주군 부안군 순창군 완주군 익산시 임실군 장수군 전주시 정읍시 진안군'.split(' '),
  '전남광주통합특별시': '광산구 남구 동구 북구 서구 강진군 고흥군 곡성군 광양시 구례군 나주시 담양군 목포시 무안군 보성군 순천시 신안군 여수시 영광군 영암군 완도군 장성군 장흥군 진도군 함평군 해남군 화순군'.split(' '),
  '경상북도': '경산시 경주시 고령군 구미시 김천시 문경시 봉화군 상주시 성주군 안동시 영덕군 영양군 영주시 영천시 예천군 울릉군 울진군 의성군 청도군 청송군 칠곡군 포항시'.split(' '),
  '경상남도': '거제시 거창군 고성군 김해시 남해군 밀양시 사천시 산청군 양산시 의령군 진주시 창녕군 창원시 통영시 하동군 함안군 함양군 합천군'.split(' '),
  '제주특별자치도': '서귀포시 제주시'.split(' '),
};
export const SIDO_LIST = Object.keys(SGG);

// 시·도 별칭 (옛 이름 포함)
const ALIASES: Record<string, string[]> = {
  '서울특별시': ['서울', '서울시'],
  '부산광역시': ['부산', '부산시'],
  '대구광역시': ['대구', '대구시'],
  '인천광역시': ['인천', '인천시'],
  '대전광역시': ['대전', '대전시'],
  '울산광역시': ['울산', '울산시'],
  '세종특별자치시': ['세종', '세종시'],
  '경기도': ['경기'],
  '강원특별자치도': ['강원도', '강원'],
  '충청북도': ['충북'],
  '충청남도': ['충남'],
  '전북특별자치도': ['전라북도', '전북'],
  '전남광주통합특별시': ['전남광주', '광주광역시', '전라남도', '광주', '전남'],
  '경상북도': ['경북'],
  '경상남도': ['경남'],
  '제주특별자치도': ['제주도', '제주'],
};
const ALIAS_BY_LEN: [string, string][] = Object.entries(ALIASES)
  .flatMap(([full, al]) => [[full, full] as [string, string], ...al.map((a) => [a, full] as [string, string])])
  .sort((a, b) => b[0].length - a[0].length);

export function normalizeSido(token?: string | null): string | null {
  if (!token) return null;
  const t = token.trim();
  for (const [alias, full] of ALIAS_BY_LEN) if (t === alias) return full;
  for (const [alias, full] of ALIAS_BY_LEN) if (alias.length >= 2 && t.startsWith(alias)) return full;
  return null;
}

// 시군구 이름 색인 (시도 없이 적힌 기관명 판별용, 여러 시도에 있는 이름은 제외)
const SGG_INDEX: Map<string, [string, string]> = (() => {
  const count = new Map<string, [string, string][]>();
  for (const [sido, list] of Object.entries(SGG)) {
    for (const g of list) {
      const key = g.replace(/[시군구]$/, '');
      if (key.length < 2) continue;
      count.set(key, [...(count.get(key) || []), [sido, g]]);
    }
  }
  const m = new Map<string, [string, string]>();
  count.forEach((v, k) => { if (v.length === 1) m.set(k, v[0]); });
  return m;
})();
const SGG_KEYS = Array.from(SGG_INDEX.keys()).sort((a, b) => b.length - a.length);

/** 기관명 → [시도, 시군구]. 못 찾으면 [null, null] */
export function locateOrg(org?: string | null): [string | null, string | null] {
  if (!org) return [null, null];
  const name = org.trim().replace(/^(\(재\)|\(사\)|재단법인|사단법인)\s*/, '');
  const parts = name.split(/\s+/);
  const sido = normalizeSido(parts[0]);
  if (sido) {
    let sgg: string | null = null;
    // "광주광역시 북구", "전라남도 순천시"처럼 통합 전 이름도 통합특별시의 같은 시군구로 들어간다
    if (parts[1] && /[시군구]$/.test(parts[1])) sgg = parts[1];
    // 인천 옛 중구·동구는 2026.7 제물포구·영종구로 나뉘어 어느 쪽인지 알 수 없음 → 인천 전체에 보여줌
    if (sido === '인천광역시' && (sgg === '중구' || sgg === '동구')) sgg = null;
    // 인천 옛 서구는 서해구로 이름이 바뀜 (일부는 검단구로 분리)
    if (sido === '인천광역시' && sgg === '서구') sgg = '서해구';
    return [sido, sgg];
  }
  const compact = name.replace(/\s/g, '');
  for (const full of SIDO_LIST) if (compact.includes(full)) return [full, null];
  for (const key of SGG_KEYS) if (compact.includes(key)) return SGG_INDEX.get(key)!;
  return [null, null];
}

const NATIONAL_TYPES = ['중앙행정기관', '공공기관'];
export function scopeOf(orgType?: string | null, org?: string | null): { scope: 'national' | 'local' | 'unknown'; sido: string | null; sgg: string | null } {
  if (orgType && NATIONAL_TYPES.some((t) => orgType.includes(t))) return { scope: 'national', sido: null, sgg: null };
  const [sido, sgg] = locateOrg(org);
  if (!sido) return { scope: 'unknown', sido: null, sgg: null };
  return { scope: 'local', sido, sgg };
}
