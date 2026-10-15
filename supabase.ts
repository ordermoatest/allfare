import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** 서버 전용 Supabase 클라이언트 (service_role). 브라우저로 절대 보내지 않습니다. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 없어요');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function isAdmin(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && req.headers.get('x-admin-password') === pw;
}

export function isCron(req: Request): boolean {
  const s = process.env.CRON_SECRET;
  return !!s && req.headers.get('authorization') === `Bearer ${s}`;
}

/** 기기 ID 형식 검사 (무작위 문자열만 허용) */
export function validDevice(d: unknown): d is string {
  return typeof d === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(d);
}
