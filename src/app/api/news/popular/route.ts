import { NextResponse } from 'next/server';
import { db } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

// 최근 30일 조회수 순 복지 소식
export async function GET() {
  try {
    const { data, error } = await db().rpc('news_popular', { p_days: 30 });
    if (error) throw error;
    return NextResponse.json({ items: (data || []).slice(0, 10) }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
