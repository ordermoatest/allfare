import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 한글 글꼴: 카드에 들어가는 글자만 구글 폰트에서 받아옴 (작고 빠름)
async function font(text: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error('font');
  return (await fetch(src[1])).arrayBuffer();
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const t = (p.get('t') || '내가 받을 수 있는 복지 혜택 찾기').slice(0, 60);
  const s = (p.get('s') || '').slice(0, 50);
  const k = (p.get('k') || '').slice(0, 20);
  const e = (p.get('e') || '').slice(0, 4);
  const brand = '올페어 All welFare';
  const foot = 'allfare.kr · 내 혜택, 내 주변 사용처 한 번에';
  const size = t.length > 30 ? 60 : t.length > 18 ? 70 : 80;
  try {
    const all = `${t}${s}${k}${brand}${foot}AF`;
    const [b, r] = await Promise.all([font(all, 700), font(all, 500)]);
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F2F7F4', padding: '64px 72px', fontFamily: 'Plex' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: '#0F8A68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>AF</div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#16201C' }}>올페어<span style={{ marginLeft: 12, color: '#55635D', fontWeight: 500 }}>All welFare</span></div>
            {k && <div style={{ display: 'flex', marginLeft: 'auto', background: '#E2F3EC', color: '#0B5A44', fontSize: 26, fontWeight: 700, padding: '10px 22px', borderRadius: 999 }}>{k}</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 26 }}>
              <div style={{ display: 'flex', fontSize: size, fontWeight: 700, color: '#16201C', lineHeight: 1.25, letterSpacing: -1 }}>{t}</div>
              {s && <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#0F8A68', color: '#fff', fontSize: 34, fontWeight: 700, padding: '12px 26px', borderRadius: 18 }}>{s}</div>}
            </div>
            {e && <div style={{ display: 'flex', width: 220, height: 220, borderRadius: 56, background: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 130 }}>{e}</div>}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#55635D', fontWeight: 500 }}>{foot}</div>
        </div>
      ),
      {
        width: 1200, height: 630, emoji: 'twemoji',
        fonts: [{ name: 'Plex', data: b, weight: 700, style: 'normal' }, { name: 'Plex', data: r, weight: 500, style: 'normal' }],
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800' },
      },
    );
  } catch {
    // 글꼴을 못 받으면 기본 카드로
    return NextResponse.redirect(new URL('/og.png', req.url), 302);
  }
}
