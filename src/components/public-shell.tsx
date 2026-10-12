import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { Logo } from './logo';
import { ThemePicker } from './theme-picker';
import { brand } from '@/lib/brand';

export function PublicHeader() {
  return (
    <header className="public-header wrap">
      <Logo />
      <nav aria-label="Public navigation">
        <Link href="/methodology/">Data & methodology</Link>
        <Link href="/guides/home-ownership-costs/">Ownership costs</Link>
      </nav>
      <Link className="button outline" href="/check/" aria-label="Explore a report">
        <span>Explore a report</span>
        <ArrowUpRight size={18} />
      </Link>
      <ThemePicker />
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="public-footer wrap">
      <span>
        {brand.productName} · {brand.tagline}
      </span>
      <nav aria-label="Documentation navigation">
        <Link href="/">Home</Link>
        <Link href="/methodology/">Methodology</Link>
        <Link href="/guides/home-ownership-costs/">Ownership costs</Link>
        <a href="/llms.txt">AI guide</a>
      </nav>
    </footer>
  );
}
