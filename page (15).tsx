import type { Metadata } from 'next';
import App from '@/components/App';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

const ld = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: '올페어', alternateName: ['AllFare', 'All welFare'], url: `${SITE}/`, inLanguage: 'ko-KR' },
  { '@context': 'https://schema.org', '@type': 'Organization', name: 'AllFare 올페어', url: `${SITE}/`, logo: `${SITE}/icon-512.png` },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <App />
    </>
  );
}
