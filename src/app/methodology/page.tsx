import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { PublicHeader, PublicFooter } from '@/components/public-shell';
import { methodologySections, evidenceLinks } from '@/lib/editorial';
import { brand, publicPages } from '@/lib/brand';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  publicPages[1].title,
  publicPages[1].description,
  '/methodology/',
  '/methodology/index.md',
);
export default function MethodologyPage() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="article-main wrap">
        <header className="article-header">
          <span className="eyebrow">THE DETAILS BEHIND YOUR REALITY CHECK</span>
          <h1>
            Useful evidence.
            <br />
            <span>Honest boundaries.</span>
          </h1>
          <p>How {brand.name} calculates, sources and explains the information in your report.</p>
        </header>
        <div className="article-layout">
          <article className="article-body">
            {methodologySections.map((section, i) => (
              <section key={section.title} id={`section-${i}`}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.points && (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <section id="sources">
              <h2>Follow the sources</h2>
              <p>
                Check the period, definitions and coverage before using a number to make a decision.
              </p>
              <div className="article-sources">
                {evidenceLinks.map((link) => (
                  <a href={link.href} key={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                    <ArrowUpRight size={17} />
                  </a>
                ))}
              </div>
            </section>
          </article>
          <aside className="article-aside">
            <span className="micro-label">ON THIS PAGE</span>
            <nav aria-label="Methodology contents">
              {methodologySections.map((section, i) => (
                <a href={`#section-${i}`} key={section.title}>
                  {section.title}
                </a>
              ))}
              <a href="#sources">Follow the sources</a>
            </nav>
            <div className="article-callout">
              <ShieldCheck size={27} />
              <h3>Evidence before emotion.</h3>
              <p>A clear source matters. So does a clear limit.</p>
              <Link href="/check/">
                Explore an example
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </aside>
        </div>
        <div className="article-end">
          <h2>Make the numbers yours.</h2>
          <Link href="/check/" className="button dark">
            Explore a reality check
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
