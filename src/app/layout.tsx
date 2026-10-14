import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Allfare - 올페어',
  description: '정부 지원금 및 지역화폐 3초 조회 서비스',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
