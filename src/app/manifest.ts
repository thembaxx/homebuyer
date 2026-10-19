import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

export const dynamic = 'force-static';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: brand.productName,
    short_name: brand.name,
    description: brand.shortDescription,
    lang: brand.language,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f4ee',
    theme_color: '#f5f4ee',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
