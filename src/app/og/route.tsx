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
  const brand = '올페어';
  const foot = 'allfare.kr';
  // 네이버는 1200×630 그림의 가운데 정사각형만 잘라 썸네일로 써요 → 글자를 가운데 620px 안에 크게
  const n = t.replace(/\s/g, '').length;
  const size = n <= 10 ? 104 : n <= 16 ? 92 : n <= 24 ? 76 : n <= 34 ? 66 : 56;
  // 노란 띠는 짧을 때만 (길면 정사각형에서 넘쳐요)
  const pill = s && s.replace(/\s/g, '').length <= 16 ? s : '';
  try {
    const all = `${t}${s}${k}${brand}${foot}AF`;
    const [b, r] = await Promise.all([font(all, 700), font(all, 500)]);
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', background: '#0B6B51', padding: '44px 0', fontFamily: 'Plex' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(255,255,255,.88)', fontSize: 30, fontWeight: 700 }}>
            <div style={{ display: 'flex', width: 44, height: 44, borderRadius: 12, background: '#fff', color: '#0B6B51', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>AF</div>
            {brand}{k && <span style={{ marginLeft: 10, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>· {k}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: 580 }}>
            <div style={{ display: 'flex', textAlign: 'center', justifyContent: 'center', fontSize: size, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: -2, wordBreak: 'keep-all' }}>{t}</div>
            {pill && <div style={{ display: 'flex', background: '#FFE14D', color: '#1E2A10', fontSize: size >= 80 ? 40 : 36, fontWeight: 700, padding: '12px 28px', borderRadius: 16, textAlign: 'center' }}>{pill}</div>}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{foot}</div>
        </div>
      ),
      {
        width: 1200, height: 630,
        fonts: [{ name: 'Plex', data: b, weight: 700, style: 'normal' }, { name: 'Plex', data: r, weight: 500, style: 'normal' }],
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800' },
      },
    );
  } catch {
    // 글꼴을 못 받으면 기본 카드로
    return NextResponse.redirect(new URL('/og.png', req.url), 302);
  }
}
