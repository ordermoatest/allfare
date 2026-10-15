import 'server-only';
import { createHash } from 'crypto';
import { db } from './supabase';
import { geocodeAddress, searchPlace } from './kakao';
import { parseDeadline } from '../deadline';
import { scopeOf } from '../regions';
import { isPersonService } from '../match';
import { parseHint } from '../hints';

const ODCLOUD = 'https://api.odcloud.kr/api';
type Row = Record<string, unknown>;

function serviceKey(): string {
  const k = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!k) throw new Error('DATA_GO_KR_SERVICE_KEY 환경변수가 없어요');
  return k;
}

/** odcloud API 한 페이지 */
async function odPage(path: string, page: number, perPage: number): Promise<{ data: Row[]; totalCount: number }> {
  const url = `${ODCLOUD}/${path}?page=${page}&perPage=${perPage}&returnType=JSON&serviceKey=${encodeURIComponent(serviceKey())}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`공공데이터 API 오류 ${res.status} (${path}) ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return { data: (j.data || []) as Row[], totalCount: Number(j.totalCount || 0) };
}

/** odcloud API 전체 페이지 */
async function odAll(path: string, perPage = 1000): Promise<Row[]> {
  const first = await odPage(path, 1, perPage);
  const out = [...first.data];
  const pages = Math.ceil(first.totalCount / perPage);
  for (let p = 2; p <= pages; p++) {
    const r = await odPage(path, p, perPage);
    out.push(...r.data);
    if (!r.data.length) break;
  }
  return out;
}

const s = (v: unknown) => (v === null || v === undefined ? null : String(v).trim() || null);
const n = (v: unknown) => { const x = parseInt(String(v ?? ''), 10); return Number.isFinite(x) ? x : 0; };
const ts = (v: unknown) => { const t = s(v); if (!t) return null; const d = new Date(t.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1-$2-$3T$4:$5:$6+09:00')); return isNaN(+d) ? null : d.toISOString(); };

async function log(kind: string, ok: boolean, message: string, counts: Row) {
  await db().from('sync_log').insert({ kind, ok, message, counts });
}

async function upsertChunks(table: string, rows: Row[], size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db().from(table).upsert(rows.slice(i, i + size), { onConflict: 'id' });
    if (error) throw new Error(`${table} 저장 오류: ${error.message}`);
  }
}

// ---------------------------------------------------------------- 혜택
export async function syncBenefits() {
  const started = new Date().toISOString();
  try {
    const [list, conds] = await Promise.all([odAll('gov24/v3/serviceList'), odAll('gov24/v3/supportConditions')]);
    const condMap = new Map<string, Row>();
    for (const c of conds) condMap.set(String(c['서비스ID']), c);

    const rows: Row[] = [];
    const seen = new Set<string>();
    for (const r of list) {
      const id = s(r['서비스ID']);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const c = condMap.get(id) || null;
      const codes = c ? Object.keys(c).filter((k) => /^JA\d{4}$/.test(k) && String(c[k]).trim().toUpperCase() === 'Y') : [];
      const lo = c ? n(c['JA0110']) : 0;
      let hi = c ? n(c['JA0111']) : 0;
      if (hi >= 100) hi = 0;
      const dl = parseDeadline(s(r['신청기한']));
      const sc = scopeOf(s(r['소관기관유형']), s(r['소관기관명']));
      rows.push({
        id,
        name: s(r['서비스명']) || '(이름 없음)',
        summary: s(r['서비스목적요약']),
        category: s(r['서비스분야']),
        support_type: s(r['지원유형']),
        target: s(r['지원대상']),
        criteria: s(r['선정기준']),
        content: s(r['지원내용']),
        how: s(r['신청방법']),
        deadline_text: s(r['신청기한']),
        deadline_kind: dl.kind,
        deadline_end: dl.end,
        url: s(r['상세조회URL']),
        org: s(r['소관기관명']),
        dept: s(r['부서명']),
        org_type: s(r['소관기관유형']),
        user_type: s(r['사용자구분']),
        receiver: s(r['접수기관']),
        phone: s(r['전화문의']),
        views: n(r['조회수']),
        registered_at: ts(r['등록일시']),
        source_updated: ts(r['수정일시']),
        scope: sc.scope, sido: sc.sido, sgg: sc.sgg,
        cond: c, cond_codes: codes, age_min: lo, age_max: hi,
        hint: parseHint(s(r['서비스명']), s(r['지원대상']), s(r['선정기준'])),
        person_ok: isPersonService(codes, s(r['사용자구분'])),
        active: true,
        synced_at: started,
      });
    }
    if (rows.length < 1000) throw new Error(`받아온 혜택이 ${rows.length}건뿐이라 저장을 멈췄어요 (API 응답 확인 필요)`);
    await upsertChunks('benefits', rows);
    // 이번에 안 온 혜택은 종료된 것으로 처리
    const { error } = await db().from('benefits').update({ active: false }).lt('synced_at', started);
    if (error) throw new Error(error.message);
    const counts = { total: rows.length, withConditions: conds.length, person: rows.filter((r) => r.person_ok).length };
    await log('benefits', true, '완료', counts);
    return { ok: true, ...counts };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log('benefits', false, msg, {}).catch(() => {});
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------- 문화누리 가맹점
const STORE_DATASET = () => process.env.CULTURE_STORE_DATASET || '15045194/v1/uddi:8e9c6ad0-d53c-43e4-91a8-b5ae78e29379';

/** 1단계: 공공데이터 가맹점 목록 가져오기 (좌표 없음) */
export async function importStores() {
  const started = new Date().toISOString();
  try {
    const list = await odAll(STORE_DATASET());
    const map = new Map<string, Row>();
    for (const r of list) {
      const name = s(r['가맹점명']);
      const address = s(r['주소']);
      if (!name || !address) continue;
      const id = createHash('sha1').update(`${name}|${address}`).digest('hex').slice(0, 24);
      map.set(id, { id, name, address, region: s(r['지역']), category: s(r['분류']), active: true, synced_at: started });
    }
    const rows = Array.from(map.values());
    if (rows.length < 100) throw new Error(`받아온 가맹점이 ${rows.length}건뿐이라 저장을 멈췄어요`);
    await upsertChunks('culture_stores', rows);
    await db().from('culture_stores').update({ active: false }).lt('synced_at', started);
    await log('stores_import', true, '완료', { total: rows.length });
    return { ok: true, total: rows.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log('stores_import', false, msg, {}).catch(() => {});
    return { ok: false, error: msg };
  }
}

const norm = (x: string) => x.replace(/\(.*?\)|㈜|주식회사|\s/g, '').toLowerCase();
function sameName(a: string, b: string) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x) || (x.length >= 4 && y.length >= 4 && x.slice(0, 4) === y.slice(0, 4));
}

async function pool<T>(items: T[], size: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) await fn(items[i++]); }));
}

/** 2단계: 주소 → 좌표, 카카오 장소 검색으로 전화번호·장소 링크 채우기 (조금씩 나눠서) */
export async function geocodeStores(limit = 200, deadlineMs = 50000) {
  const t0 = Date.now();
  const { data, error } = await db().from('culture_stores')
    .select('id,name,address,region').eq('active', true).eq('geo_status', 'pending').limit(limit);
  if (error) return { ok: false, error: error.message };
  let ok = 0, fail = 0;
  try {
    await pool(data || [], 6, async (st) => {
      if (Date.now() - t0 > deadlineMs) return;
      let pos = await geocodeAddress(st.address);
      let phone: string | null = null, url: string | null = null;
      const near = pos ? await searchPlace(st.name, pos, 300) : await searchPlace(`${st.region || ''} ${st.name}`.trim());
      const hit = near.find((p) => sameName(p.name, st.name));
      if (hit) { phone = hit.phone || null; url = hit.url || null; if (!pos) pos = { lat: hit.lat, lng: hit.lng }; }
      const upd = pos
        ? { lat: pos.lat, lng: pos.lng, phone, place_url: url, geo_status: 'ok', geo_tried_at: new Date().toISOString() }
        : { geo_status: 'fail', geo_tried_at: new Date().toISOString() };
      await db().from('culture_stores').update(upd).eq('id', st.id);
      if (pos) ok++; else fail++;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log('stores_geocode', false, msg, { ok, fail }).catch(() => {});
    return { ok: false, error: msg, done: ok + fail };
  }
  const { count } = await db().from('culture_stores').select('id', { count: 'exact', head: true }).eq('active', true).eq('geo_status', 'pending');
  await log('stores_geocode', true, '배치 완료', { ok, fail, remaining: count ?? null });
  return { ok: true, done: ok + fail, success: ok, fail, remaining: count ?? 0 };
}

export async function storeStats() {
  const q = (st?: string) => {
    let b = db().from('culture_stores').select('id', { count: 'exact', head: true }).eq('active', true);
    if (st) b = b.eq('geo_status', st);
    return b;
  };
  const [all, okR, failR, pend] = await Promise.all([q(), q('ok'), q('fail'), q('pending')]);
  return { total: all.count ?? 0, ok: okR.count ?? 0, fail: failR.count ?? 0, pending: pend.count ?? 0 };
}
