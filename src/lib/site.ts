import type { Metadata } from 'next';
import { brand } from './brand';

export function parseSiteOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      'NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin, without a path, credentials, query or fragment.',
    );
  return url.origin;
}
export const siteOrigin = parseSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
export const siteUrl = (path: string) => (siteOrigin ? new URL(path, siteOrigin).href : undefined);
export const discoveryUrl = (path: string) => siteUrl(path) || path;

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  markdown?: string,
): Metadata {
  const url = siteUrl(path);
  return {
    title: { absolute: `${title} | ${brand.name}` },
    description,
    alternates: url
      ? { canonical: url, ...(markdown ? { types: { 'text/markdown': siteUrl(markdown)! } } : {}) }
      : undefined,
    openGraph: {
      title: `${title} | ${brand.name}`,
      description,
      ...(url
        ? {
            url,
            images: [
              {
                url: siteUrl('/social-preview/og.png')!,
                width: 1200,
                height: 630,
                alt: `${brand.name} — ${brand.descriptor}`,
              },
            ],
          }
        : {}),
      siteName: brand.productName,
      locale: brand.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${brand.name}`,
      description,
      ...(url ? { images: [siteUrl('/social-preview/og.png')!] } : {}),
    },
  };
}

export function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: brand.name,
        description: brand.shortDescription,
        ...(siteOrigin
          ? {
              '@id': `${siteOrigin}/#organization`,
              url: `${siteOrigin}/`,
              logo: siteUrl('/icon.svg'),
            }
          : {}),
      },
      {
        '@type': 'WebSite',
        name: brand.productName,
        alternateName: brand.descriptor,
        inLanguage: brand.language,
        ...(siteOrigin
          ? {
              '@id': `${siteOrigin}/#website`,
              url: `${siteOrigin}/`,
              publisher: { '@id': `${siteOrigin}/#organization` },
            }
          : {}),
      },
      {
        '@type': 'WebApplication',
        name: brand.productName,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web browser',
        inLanguage: brand.language,
        description: brand.description,
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: brand.currency,
          description:
            'Free MVP early access. Paid checkout is not connected. Intended future report range: R99–R299.',
        },
        featureList: [
          'South African address search',
          'Editable monthly ownership budgets',
          'OpenStreetMap neighbourhood maps',
          'Dated municipal and police-precinct evidence',
          'Browser-local saved comparisons',
          'Downloadable PDF reports',
        ],
        ...(siteOrigin
          ? {
              '@id': `${siteOrigin}/#application`,
              url: siteUrl('/check/'),
              publisher: { '@id': `${siteOrigin}/#organization` },
            }
          : {}),
      },
    ],
  };
}
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
