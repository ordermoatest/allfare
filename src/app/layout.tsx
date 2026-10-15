import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { SITE } from '@/lib/site';

const GA = process.env.NEXT_PUBLIC_GA_ID;
const GSC = process.env.NEXT_PUBLIC_GSC_VERIFY; // 구글 서치콘솔 소유확인 값 (선택)

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: '올페어 - 내 복지 혜택 · 문화누리카드 사용처 찾기',
  description: '나이·지역·소득만 입력하면 받을 수 있는 정부·지자체 혜택을 골라주고, 내 주변 문화누리카드 가맹점을 지도로 보여드려요.',
  manifest: '/manifest.webmanifest',
  ...(GSC ? { verification: { google: GSC } } : {}),
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/apple-touch-icon.png' },
  openGraph: { siteName: '올페어', title: '올페어 All welFare', description: '내 혜택, 내 주변 사용처 한 번에', type: 'website', locale: 'ko_KR', images: [{ url: '/og.png', width: 1200, height: 630 }] },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
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
