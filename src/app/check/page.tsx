import { ReportWorkspace } from '@/components/report-workspace';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Your Property Reality Check',
  description: `Build a private, browser-local ${brand.name} report with ownership costs, local context and saved comparisons.`,
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
};

export default function CheckPage() {
  return <ReportWorkspace />;
}
