import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  const sitemap = siteUrl('/sitemap.xml');
  return { rules: { userAgent: '*', allow: '/' }, ...(sitemap ? { sitemap } : {}) };
}
