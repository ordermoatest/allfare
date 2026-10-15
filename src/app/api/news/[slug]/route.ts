import { NextRequest, NextResponse } from 'next/server';
import { db, validDevice } from '@/lib/server/supabase';
import { newsBySlug } from '@/lib/news';

export const dynamic = 'force-dynamic';

// 복지 소식 조회수·좋아요·공유 수
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!newsBySlug(params.slug)) return NextResponse.json({ error: '없는 글이에요' }, { status: 404 });
  const device = req.nextUrl.searchParams.get('device');
  try {
    const [{ data: s }, liked] = await Promise.all([
      db().from('news_stats').select('views,likes,shares').eq('slug', params.slug).maybeSingle(),
      validDevice(device)
        ? db().from('news_likes').select('slug').eq('slug', params.slug).eq('device_id', device).maybeSingle().then((r) => !!r.data)
        : Promise.resolve(false),
    ]);
    return NextResponse.json({ views: s?.views ?? 0, likes: s?.likes ?? 0, shares: s?.shares ?? 0, liked });
  } catch {
    return NextResponse.json({ views: 0, likes: 0, shares: 0, liked: false, off: true });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!newsBySlug(params.slug)) return NextResponse.json({ error: '없는 글이에요' }, { status: 404 });
  const { action, device } = (await req.json().catch(() => ({}))) as { action?: string; device?: string };
  try {
    if (action === 'view') {
      const { error } = await db().rpc('news_view', { p_slug: params.slug });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === 'share') {
      const { data, error } = await db().rpc('news_share', { p_slug: params.slug });
      if (error) throw error;
      return NextResponse.json({ shares: data ?? 0 });
    }
    if (action === 'like' && validDevice(device)) {
      const { data, error } = await db().rpc('news_like_toggle', { p_slug: params.slug, p_device: device });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return NextResponse.json({ liked: !!row?.liked, likes: row?.cnt ?? 0 });
    }
    return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '저장하지 못했어요' }, { status: 500 });
  }
}
