import type { Metadata } from 'next';
import App from '@/components/App';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

const ld = [
  {
    '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#website`,
    name: '올페어', alternateName: ['Allfare', 'AllFare', '올페어 복지', 'allfare.kr'], url: `${SITE}/`, inLanguage: 'ko-KR',
    description: '나에게 맞는 정부·지자체 복지 혜택을 1분 만에 찾고, 내 주변 문화누리카드 사용처를 지도로 찾는 무료 조회 서비스',
    publisher: { '@id': `${SITE}/#org` },
  },
  {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE}/#org`,
    name: '올페어', alternateName: ['AllFare 올페어', 'Allfare', 'All welFare'], url: `${SITE}/`,
    logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png`, width: 512, height: 512 },
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <App />
    </>
  );
}
