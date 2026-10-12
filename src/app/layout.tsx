import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: "HomeBuyer — Your home's reality check",
  description:
    'See beyond the listing. South African property due diligence, ongoing ownership costs, local evidence and saved comparisons. Reports from R99–R299.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: {
    title: 'Fall for the home. Know the reality.',
    description: 'Evidence before emotion. Property intelligence for South African homebuyers.',
    images: process.env.NEXT_PUBLIC_SITE_URL ? ['/images/hero-house.jpg'] : [],
    locale: 'en_ZA',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
