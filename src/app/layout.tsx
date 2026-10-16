import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { SITE } from '@/lib/site';
import GlobalUi from '@/components/GlobalUi';

const GA = process.env.NEXT_PUBLIC_GA_ID;
const GSC = process.env.NEXT_PUBLIC_GSC_VERIFY; // 구글 서치콘솔 소유확인 값 (선택)
const NAVER = process.env.NEXT_PUBLIC_NAVER_VERIFY; // 네이버 서치어드바이저 소유확인 값 (선택)

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: '올페어 - 나에게 맞는 복지 혜택 찾기 · 내 주변 문화누리카드 사용처 찾기',
  description: '생년월일·사는 곳·소득만 넣으면 받을 수 있는 정부·지자체 복지 혜택 1만여 개 중 나에게 맞는 것을 골라드려요. 내 주변 문화누리카드 사용처도 지도로 찾고, 기준중위소득 계산기도 써보세요.',
  keywords: ['복지 혜택 조회', '정부 지원금 찾기', '문화누리카드 사용처', '문화누리카드 가맹점', '기준중위소득 계산기', '청년 지원금', '신혼부부 혜택'],
  manifest: '/manifest.webmanifest',
  verification: { ...(GSC ? { google: GSC } : {}), ...(NAVER ? { other: { 'naver-site-verification': NAVER } } : {}) },
  alternates: { types: { 'application/rss+xml': [{ url: '/rss.xml', title: '올페어 복지 가이드' }] } },
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/apple-touch-icon.png' },
  openGraph: { siteName: '올페어', title: '올페어 All welFare', description: '내 혜택, 내 주변 사용처 한 번에', type: 'website', locale: 'ko_KR', images: [{ url: '/og.png', width: 1200, height: 630 }] },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F2F7F4' }, { media: '(prefers-color-scheme: dark)', color: '#0F1613' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <GlobalUi />
        {GA && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
