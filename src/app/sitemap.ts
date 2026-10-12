import type { MetadataRoute } from 'next';
import { publicPages } from '@/lib/brand';
import { siteOrigin } from '@/lib/site';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteOrigin) return [];
  return publicPages.map((page) => ({ url: new URL(page.path, siteOrigin).href }));
}
