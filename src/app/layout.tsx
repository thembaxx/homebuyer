import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { brand } from '@/lib/brand';
import { siteOrigin, pageMetadata } from '@/lib/site';
import { themeBootstrap } from '@/lib/theme';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import './themes.css';
import './editorial.css';
import './decision-tools.css';

export const metadata: Metadata = {
  ...pageMetadata('South African Property Due Diligence', brand.description, '/', '/index.md'),
  metadataBase: siteOrigin ? new URL(siteOrigin) : undefined,
  title: {
    default: `${brand.productName} | South African Property Due Diligence`,
    template: `%s | ${brand.name}`,
  },
  applicationName: brand.productName,
  category: 'property due diligence',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] },
  robots: {
    index: Boolean(siteOrigin),
    follow: true,
    googleBot: {
      index: Boolean(siteOrigin),
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={brand.language} suppressHydrationWarning>
      <head>
        <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link rel="describedby" type="text/plain" href="/llms.txt" />
      </head>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
