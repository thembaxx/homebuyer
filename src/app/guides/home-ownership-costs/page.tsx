import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Wallet } from '@phosphor-icons/react/dist/ssr';
import { PublicHeader, PublicFooter } from '@/components/public-shell';
import { ownershipSections } from '@/lib/editorial';
import { brand, publicPages } from '@/lib/brand';
import { pageMetadata, siteUrl, jsonLd } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  publicPages[2].title,
  publicPages[2].description,
  '/guides/home-ownership-costs/',
  '/guides/home-ownership-costs/index.md',
);
export default function OwnershipCostsPage() {
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publicPages[2].title,
    description: publicPages[2].description,
    inLanguage: brand.language,
    author: { '@type': 'Organization', name: brand.name },
    ...(siteUrl('/guides/home-ownership-costs/')
      ? {
          url: siteUrl('/guides/home-ownership-costs/'),
          mainEntityOfPage: siteUrl('/guides/home-ownership-costs/'),
        }
      : {}),
  };
  return (
    <div className="public-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="article-main wrap">
        <header className="article-header">
          <span className="eyebrow">A SOUTH AFRICAN HOMEBUYER’S GUIDE</span>
          <h1>
            The price tag
            <br />
            <span>is just the start.</span>
          </h1>
          <p>
            The monthly cost of owning a home in South Africa, and the questions to ask before the
            keys.
          </p>
        </header>
        <div className="article-cover">
          <img
            src="/images/interior.jpg"
            alt="A warm, light-filled living room with timber furniture and plants"
          />
          <span>Plan for the life you will live in it.</span>
        </div>
        <div className="article-layout">
          <article className="article-body">
            {ownershipSections.map((section, i) => (
              <section key={section.title} id={`section-${i}`}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <section>
              <h2>Useful next steps</h2>
              <ul>
                <li>
                  <Link href="/check/?tab=budget">
                    Build an ownership budget from your own assumptions.
                  </Link>
                </li>
                <li>
                  <Link href="/methodology/">Read the data sources, formula and limits.</Link>
                </li>
                <li>
                  <a
                    href="https://www.sars.gov.za/types-of-tax/transfer-duty/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Check SARS for current transfer-duty information.
                  </a>
                </li>
              </ul>
              <p>
                This guide explains the budgeting workflow. It is not a lender quote, property
                valuation or calculation of your tax and legal fees.
              </p>
            </section>
          </article>
          <aside className="article-aside">
            <span className="micro-label">THE EVERYDAY COSTS</span>
            <nav aria-label="Ownership guide contents">
              {ownershipSections.map((section, i) => (
                <a href={`#section-${i}`} key={section.title}>
                  {section.title}
                </a>
              ))}
            </nav>
            <div className="article-callout">
              <Wallet size={28} />
              <h3>One monthly picture.</h3>
              <p>Bond, bills, maintenance and the daily journey. With your own inputs.</p>
              <Link href="/check/?tab=budget">
                Make a budget
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </aside>
        </div>
        <div className="article-end">
          <h2>A little more perspective.</h2>
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
