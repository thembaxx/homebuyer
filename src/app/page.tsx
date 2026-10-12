import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing-page';
import { brand } from '@/lib/brand';
import { jsonLd, pageMetadata, structuredData } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'South African Property Due Diligence',
  brand.description,
  '/',
  '/index.md',
);
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData()) }}
      />
      <LandingPage />
    </>
  );
}
